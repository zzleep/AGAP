import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { findNearestBarangay } from '@/data/barangay_coords'

export const useSOSStore = defineStore('sos', () => {
  const deliveryState = ref('idle') // 'idle' | 'sending' | 'queued' | 'sent' | 'error'
  const currentSOS = ref(null)
  const userHash = ref('')
  const cachedBarangay = ref(null)
  const activeReports = ref([])
  const isLoading = ref(false)
  const sosChannel = ref(null)
  const clusterClock = ref(Date.now())

  // Clusters expire with time even when no Realtime event arrives.
  // Keep this store-level clock alive for the lifetime of the app so Aegis
  // does not remain surfaced after the 30-minute window has elapsed.
  if (typeof window !== 'undefined') {
    if (window._agapClockInterval) clearInterval(window._agapClockInterval)
    window._agapClockInterval = window.setInterval(() => {
      clusterClock.value = Date.now()
    }, 30 * 1000)
  }

  const isPending = computed(() => deliveryState.value === 'sending')
  const hasActiveSOS = computed(() => currentSOS.value !== null)

  // Sorted Queue: Priority pending -> assigned_area match -> oldest created_at first
  const sortedQueue = computed(() => {
    const authStore = useAuthStore()
    const area = authStore.assignedArea

    return [...activeReports.value].filter(Boolean).sort((a, b) => {
      // 1. Pending status prioritized over non-pending
      if (a.status === 'pending' && b.status !== 'pending') return -1
      if (a.status !== 'pending' && b.status === 'pending') return 1

      // 2. Assigned area match priority
      if (area && area !== 'all') {
        const aMatch = a.barangay === area ? 1 : 0
        const bMatch = b.barangay === area ? 1 : 0
        if (aMatch !== bMatch) return bMatch - aMatch
      }

      // 3. Most recent first (descending order)
      const aTime = a.created_at ? Date.parse(a.created_at) : Date.now()
      const bTime = b.created_at ? Date.parse(b.created_at) : Date.now()
      return bTime - aTime
    })
  })

  // 30-minute barangay clustering (3+ reports in same barangay within 30 minutes)
  const activeClusters = computed(() => {
    const thirtyMinsAgo = clusterClock.value - 30 * 60 * 1000
    const groups = {}

    activeReports.value.forEach(report => {
      if (report.status === 'resolved') return
      const reportTime = Date.parse(report.created_at || '')
      if (Number.isFinite(reportTime) && reportTime >= thirtyMinsAgo) {
        const bgy = report.barangay || 'Unknown'
        if (!groups[bgy]) groups[bgy] = []
        groups[bgy].push(report)
      }
    })

    return Object.entries(groups)
      .filter(([_, reports]) => reports.length >= 3)
      .map(([barangay, reports]) => ({
        barangay,
        count: reports.length,
        reports
      }))
  })

  function subscribeToRealtimeSOS() {
    if (sosChannel.value) return

    sosChannel.value = supabase
      .channel('public:sos_reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_reports' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const exists = activeReports.value.some(r => r.id === payload.new.id)
          if (!exists) {
            activeReports.value.unshift(payload.new)
          }
        } else if (payload.eventType === 'UPDATE') {
          const index = activeReports.value.findIndex(r => r.id === payload.new.id)
          if (index !== -1) {
            activeReports.value[index] = payload.new
            activeReports.value = [...activeReports.value] // trigger reactivity
          } else {
            activeReports.value.unshift(payload.new)
          }
        } else if (payload.eventType === 'DELETE') {
          activeReports.value = activeReports.value.filter(r => r.id !== payload.old.id)
        }
      })
      .subscribe()
  }

  function unsubscribeRealtimeSOS() {
    if (sosChannel.value) {
      supabase.removeChannel(sosChannel.value)
      sosChannel.value = null
    }
  }

  function initUserHash() {
    let hash = localStorage.getItem('agap_user_hash')
    if (!hash) {
      hash = 'usr_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now()
      localStorage.setItem('agap_user_hash', hash)
    }
    userHash.value = hash
    return hash
  }

  async function fetchActiveReports() {
    isLoading.value = true
    try {
      const { data, error } = await supabase
        .from('sos_reports')
        .select('*')
        .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(200)
      if (!error && data) {
        activeReports.value = data
      }
    } catch (err) {
      console.warn('Fetch active reports fallback:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function submitSOS(payload) {
    deliveryState.value = 'sending'
    try {
      const hash = userHash.value || initUserHash()
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
      const sosPayload = {
        latitude: payload.latitude,
        longitude: payload.longitude,
        user_hash: hash,
        barangay: payload.barangay || findNearestBarangay(payload.latitude, payload.longitude),
        mode: isOnline ? (payload.mode || 'online') : 'degraded_signal'
      }

      const body = JSON.stringify(sosPayload)
      const url = `${SUPABASE_URL}/rest/v1/sos_reports`

      const localSOSRecord = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'sos_' + Date.now(),
        ...sosPayload,
        status: 'pending',
        created_at: new Date().toISOString()
      }
      currentSOS.value = localSOSRecord
      activeReports.value.unshift(localSOSRecord)

      if (typeof window !== 'undefined' && !('SyncManager' in window) && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const beaconUrl = `${url}?apikey=${SUPABASE_ANON_KEY}`
        const blob = new Blob([body], { type: 'application/json' })
        const queued = navigator.sendBeacon(beaconUrl, blob)
        deliveryState.value = queued ? 'sent' : 'queued'
        return localSOSRecord
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body
      })

      if (response.ok) {
        deliveryState.value = 'sent'
      } else {
        deliveryState.value = 'queued'
      }

      return localSOSRecord
    } catch (err) {
      deliveryState.value = 'queued'
      console.warn('SOS submit queued locally:', err)
      return currentSOS.value
    }
  }

  async function claimReport(reportId, operatorId = 'Op-01') {
    try {
      const nowIso = new Date().toISOString()
      const { data, error } = await supabase
        .from('sos_reports')
        .update({
          status: 'responding',
          assigned_operator_id: operatorId,
          claimed_at: nowIso
        })
        .eq('id', reportId)
        .eq('status', 'pending')
        .select()

      if (error) {
        console.warn('Atomic claim DB error:', error)
        return { success: false, reason: 'db_error', error }
      }

      if (data && data.length > 0) {
        const report = activeReports.value.find(r => r.id === reportId)
        if (report) {
          report.status = 'responding'
          report.assigned_operator_id = operatorId
          report.claimed_at = data[0].claimed_at || nowIso
        }
        return { success: true }
      }

      // Lock conflict: 0 modified rows (another operator claimed it first)
      return { success: false, reason: 'already_claimed' }
    } catch (err) {
      console.warn('Atomic claim query exception:', err)
      return { success: false, reason: 'error', error: err }
    }
  }

  async function resolveReport(reportId) {
    try {
      const { data, error } = await supabase
        .from('sos_reports')
        .update({ status: 'resolved' })
        .eq('id', reportId)
        .select()

      if (error) {
        console.warn('Resolve report DB error:', error)
        return { success: false, reason: 'db_error', error }
      }

      if (data && data.length > 0) {
        const report = activeReports.value.find(r => r.id === reportId)
        if (report) {
          report.status = 'resolved'
        }
        return { success: true }
      }
    } catch (err) {
      console.warn('Resolve report error:', err)
      return { success: false, reason: 'error', error: err }
    }

    return { success: false, reason: 'not_found' }
  }

  async function checkStaleClaims() {
    const tenMinsAgoMs = Date.now() - 10 * 60 * 1000
    const staleReports = activeReports.value.filter(r =>
      r.status === 'responding' && r.claimed_at && new Date(r.claimed_at).getTime() < tenMinsAgoMs
    )

    for (const report of staleReports) {
      try {
        const { error } = await supabase
          .from('sos_reports')
          .update({
            status: 'pending',
            assigned_operator_id: null,
            claimed_at: null
          })
          .eq('id', report.id)
          .eq('status', 'responding')

        if (error) {
          console.warn('Stale claim revert DB error:', error)
          continue
        }
      } catch (err) {
        console.warn('Stale claim revert error:', err)
        continue
      }
      report.status = 'pending'
      report.assigned_operator_id = null
      report.claimed_at = null
    }
  }

  return {
    deliveryState,
    currentSOS,
    userHash,
    cachedBarangay,
    activeReports,
    isLoading,
    isPending,
    hasActiveSOS,
    sortedQueue,
    activeClusters,
    subscribeToRealtimeSOS,
    unsubscribeRealtimeSOS,
    initUserHash,
    fetchActiveReports,
    submitSOS,
    claimReport,
    resolveReport,
    checkStaleClaims
  }
})
