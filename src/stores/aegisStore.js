import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAdvisoryStore } from '@/stores/advisoryStore'
import { useSOSStore } from '@/stores/sosStore'
import { useFlowStore } from '@/stores/flowStore'
import { useConnectivityStore } from '@/stores/connectivityStore'
import { useAuthStore } from '@/stores/authStore'
import { useReportStore } from '@/stores/reportStore'

const FIFTEEN_MINUTES = 15 * 60 * 1000
const AUTO_TRIGGER_DEBOUNCE_MS = 5000
// related_sos_ids is UUID[] in Postgres — drop non-UUID ids (e.g. simulated
// scenario ids like "sim_flood_001") so the insert cannot fail on cast errors.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const useAegisStore = defineStore('aegis', () => {
  // Captured once at store creation — reused across auto-trigger watchers,
  // computeds, and runner functions to avoid repeated instantiations.
  const sosStore = useSOSStore()
  const reportStore = useReportStore()
  const connectivityStore = useConnectivityStore()
  const flowStore = useFlowStore()

  const pendingSuggestions = ref([])
  const history = ref([])
  const initialized = ref(false)
  const loadingHistory = ref(false)
  const generating = ref(false)
  const lastError = ref(null)
  const lastGenerated = ref(null)
  const channel = ref(null)
  const autoWatchStop = ref(null)
  const reportAutoWatchStop = ref(null)
  // Plain object keyed by barangay — throttle bookkeeping for auto-trigger only
  const lastAutoTriggerAt = {}

  const pendingCount = computed(() => pendingSuggestions.value.length)

  const subscribeRealtime = () => {
    if (channel.value) return
    channel.value = supabase
      .channel('public:aegis_suggestions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aegis_suggestions' }, () => {
        fetchPending()
        fetchHistory()
      })
      .subscribe()
  }

  const fetchPending = async () => {
    try {
      const { data, error } = await supabase
        .from('aegis_suggestions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      if (!error && data) {
        pendingSuggestions.value = data
      }
    } catch (err) {
      console.warn('Failed to fetch pending Aegis suggestions:', err)
    }
  }

  const fetchHistory = async () => {
    loadingHistory.value = true
    try {
      const { data, error } = await supabase
        .from('aegis_suggestions')
        .select('*')
        .eq('status', 'reviewed')
        .order('created_at', { ascending: false })
        .limit(50)
      if (!error && data) {
        history.value = data
      }
    } catch (err) {
      console.warn('Failed to fetch Aegis history:', err)
    } finally {
      loadingHistory.value = false
    }
  }

  // Client-side fallback advisory — mirrors the previous AegisPanel fallback so
  // an unreachable Edge Function still produces a persisted pending row.
  const buildFallbackAdvisory = ({ sos_ids, cluster_barangay, cluster_count, flood_zone_severity, weather_alert, scenario_type, community_report }) => {
    const barangay = cluster_barangay || 'Unknown'
    return {
      recommended_action: `Deploy nearest available rescue team to Barangay ${barangay}`,
      target_barangay: barangay,
      reasoning: 'Step 1: Edge Function unavailable — defaulting to standard dispatch.\nStep 2: SOS cluster density suggests immediate response.\nStep 3: Manual operator assessment required.\nStep 4: Pre-position resources based on local knowledge.',
      confidence: 'low',
      fallback: true,
      scenario_type,
      raw_inputs: {
        sos_cluster: { ids: sos_ids || [], barangay, count: cluster_count || 0 },
        flood_zone: { severity: flood_zone_severity || 'none' },
        weather: { alert: weather_alert || 'No active alert' },
        scenario_type,
        ...(community_report ? { community_report } : {})
      }
    }
  }

  // Generate (and persist) a suggestion. Suggests are ALWAYS written first as a
  // 'pending' row — an operator outcome is a separate setOutcome() update later.
  const generateSuggestion = async ({
    sos_ids = [],
    cluster_barangay = null,
    cluster_count = null,
    flood_zone_severity = null,
    weather_alert = null,
    scenario_type = 'flood',
    community_report = null
  } = {}) => {
    generating.value = true
    lastError.value = null
    try {
      let advisory = null
      try {
        const body = {
          sos_ids,
          cluster_barangay,
          cluster_count,
          flood_zone_severity,
          weather_alert,
          scenario_type
        }
        if (community_report) body.community_report = community_report
        const { data, error } = await supabase.functions.invoke('aegis-advisor', { body })
        if (error) {
          console.warn('Aegis Edge Function error:', error)
          advisory = buildFallbackAdvisory({ sos_ids, cluster_barangay, cluster_count, flood_zone_severity, weather_alert, scenario_type, community_report })
        } else {
          advisory = data
        }
      } catch (err) {
        console.error('Aegis invocation error:', err)
        advisory = buildFallbackAdvisory({ sos_ids, cluster_barangay, cluster_count, flood_zone_severity, weather_alert, scenario_type, community_report })
      }

      const insertRow = {
        related_sos_ids: (sos_ids || []).filter(id => typeof id === 'string' && UUID_PATTERN.test(id)),
        recommended_action: advisory.recommended_action,
        target_barangay: advisory.target_barangay,
        reasoning: advisory.reasoning,
        raw_inputs: advisory.raw_inputs ?? {
          sos_ids, cluster_barangay, cluster_count, scenario_type,
          ...(community_report ? { community_report } : {})
        },
        confidence: advisory.confidence,
        fallback: !!advisory.fallback,
        scenario_type: advisory.scenario_type ?? scenario_type,
        status: 'pending'
      }

      let inserted = null
      try {
        const { data, error } = await supabase
          .from('aegis_suggestions')
          .insert([insertRow])
          .select()
          .single()
        if (error) throw error
        inserted = data
      } catch (insertErr) {
        // Some deployments reject SELECT-after-INSERT — retry with a plain insert
        console.warn('Aegis insert with select failed, retrying plain insert:', insertErr)
        const { error: plainError } = await supabase
          .from('aegis_suggestions')
          .insert([insertRow])
        if (plainError) throw plainError
        inserted = {
          ...insertRow,
          id: 'aegis_' + Date.now(),
          created_at: new Date().toISOString()
        }
      }

      lastGenerated.value = inserted
      await fetchPending()
      return inserted
    } catch (err) {
      // Only an INSERT failure reaches here — invoke failures fall back to a
      // client-side advisory instead of surfacing an error.
      console.error('Aegis suggestion generation failed:', err)
      lastError.value = err.message || 'Unable to generate and persist Aegis suggestion.'
      return null
    } finally {
      generating.value = false
    }
  }

  // Operator outcome: flips the pending row to 'reviewed' and records the decision.
  const setOutcome = async (id, { outcome, modifiedAction = null } = {}) => {
    const update = {
      outcome,
      status: 'reviewed',
      resolved_at: new Date().toISOString()
    }
    if (typeof modifiedAction === 'string' && modifiedAction.trim() !== '') {
      update.recommended_action = modifiedAction.trim()
    }
    const authStore = useAuthStore()
    const operatorId = authStore.profile?.id || authStore.user?.id || null
    if (operatorId) update.operator_id = operatorId

    const { error } = await supabase
      .from('aegis_suggestions')
      .update(update)
      .eq('id', id)
    if (error) throw error

    await Promise.all([fetchPending(), fetchHistory()])
    return { success: true }
  }

  const suggestionsForSos = (sosId) => {
    return pendingSuggestions.value.filter(s => (s.related_sos_ids || []).includes(sosId))
  }

  const runAutoTrigger = async () => {
    const clusters = sosStore.activeClusters
    const now = Date.now()

    for (const cluster of clusters) {
      const { barangay } = cluster
      if (!barangay || barangay === 'Unknown') continue
      const key = barangay

      // Throttle: never auto-trigger the same barangay more than once per 15 min
      const last = lastAutoTriggerAt[key]
      if (last && now - last < FIFTEEN_MINUTES) continue

      // Never auto-generate on slow connections (edge function calls are heavy)
      if (connectivityStore.isSlowConnection) continue

      // Skip if an unresolved pending suggestion already exists for this barangay
      const hasRecentPending = pendingSuggestions.value.some(s =>
        s.target_barangay === barangay &&
        s.created_at && (now - Date.parse(s.created_at)) < FIFTEEN_MINUTES
      )
      if (hasRecentPending) {
        // Remember the check so we don't re-query on every cluster tick
        lastAutoTriggerAt[key] = now
        continue
      }

      if (generating.value) continue
      lastAutoTriggerAt[key] = now

      const sosIds = (cluster.reports || []).map(r => r.id).filter(Boolean)
      await generateSuggestion({
        sos_ids: sosIds,
        cluster_barangay: barangay,
        cluster_count: cluster.count,
        flood_zone_severity: flowStore.zoneSeverity ?? null,
        weather_alert: useAdvisoryStore().advisorySummary ?? 'No active alert',
        scenario_type: 'flood'
      })
    }
  }

  const startAutoTrigger = () => {
    if (autoWatchStop.value) return
    let debounceTimer = null
    autoWatchStop.value = watch(
      () => sosStore.activeClusters,
      () => {
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          debounceTimer = null
          runAutoTrigger()
        }, AUTO_TRIGGER_DEBOUNCE_MS)
      }
    )
  }

  // High/critical + open + verified AI-triaged community reports that warrant an
  // Aegis advisory. Computed (not a raw array watch) so in-place report updates
  // from Realtime and status/priority edits still re-fire the trigger.
  const reportAutoTriggerCandidates = computed(() => {
    return reportStore.reports.filter(r =>
      r.status === 'open' &&
      (r.ai_priority === 'high' || r.ai_priority === 'critical') &&
      reportStore.normalizePlausibility(r.ai_plausibility) === 'verified'
    )
  })

  const runReportAutoTrigger = async () => {
    const now = Date.now()

    for (const report of reportAutoTriggerCandidates.value) {
      const key = `report:${report.id}`

      // Throttle: never auto-trigger the same report more than once per 15 min
      const last = lastAutoTriggerAt[key]
      if (last && now - last < FIFTEEN_MINUTES) continue

      // Never auto-generate on slow connections (edge function calls are heavy)
      if (connectivityStore.isSlowConnection) continue

      // Skip if a pending suggestion already exists for this report
      const hasPending = pendingSuggestions.value.some(s => (s.related_sos_ids || []).includes(report.id))
      if (hasPending) {
        // Remember the check so we don't re-query on every reports tick
        lastAutoTriggerAt[key] = now
        continue
      }

      if (generating.value) continue
      lastAutoTriggerAt[key] = now

      await generateSuggestion({
        sos_ids: [report.id],
        cluster_barangay: report.barangay ?? null,
        cluster_count: null,
        weather_alert: useAdvisoryStore().advisorySummary ?? 'No active alert',
        scenario_type: 'report',
        community_report: {
          id: report.id,
          description: report.raw_description ?? null,
          category: report.ai_category ?? null,
          priority: report.ai_priority ?? null,
          plausibility: report.ai_plausibility ?? null,
          reasoning: report.ai_reasoning ?? null
        }
      })
    }
  }

  const startReportAutoTrigger = () => {
    if (reportAutoWatchStop.value) return
    let debounceTimer = null
    reportAutoWatchStop.value = watch(
      reportAutoTriggerCandidates,
      () => {
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          debounceTimer = null
          runReportAutoTrigger()
        }, AUTO_TRIGGER_DEBOUNCE_MS)
      }
    )
  }

  const init = async () => {
    if (initialized.value) return
    initialized.value = true
    subscribeRealtime()
    await Promise.all([fetchPending(), fetchHistory()])
    startAutoTrigger()
    startReportAutoTrigger()
  }

  const dispose = () => {
    if (channel.value) {
      supabase.removeChannel(channel.value)
      channel.value = null
    }
    if (autoWatchStop.value) {
      autoWatchStop.value()
      autoWatchStop.value = null
    }
    if (reportAutoWatchStop.value) {
      reportAutoWatchStop.value()
      reportAutoWatchStop.value = null
    }
    initialized.value = false
  }

  return {
    pendingSuggestions,
    history,
    initialized,
    loadingHistory,
    generating,
    lastError,
    lastGenerated,
    channel,
    autoWatchStop,
    reportAutoWatchStop,
    lastAutoTriggerAt,
    pendingCount,
    init,
    dispose,
    fetchPending,
    fetchHistory,
    generateSuggestion,
    setOutcome,
    suggestionsForSos,
    startAutoTrigger
  }
})
