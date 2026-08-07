import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { getCallbackNumber, getSOSDeviceHash } from '../composables/useGPS.js'
import { findNearestBarangay, sameBarangay } from '@/data/barangay_coords'
import { fetchWithRetry } from '@/utils/fetchWithRetry'
import { getOrCreateAgapUserHash } from '@/utils/userHash'
import { useConnectivityStore } from '@/stores/connectivityStore'

const ACTIVE_SOS_PERSIST_KEY = 'agap_active_sos'

// ── AUTO-FLAG RULES ──
// Conservative client-side spam/prank detection (admin side). Each check runs
// over the in-memory activeReports and flags a device hash at most once:
//   R1 repeat-burst    — >= 3 reports from the same device hash created within
//                        the last 30 minutes  -> 'auto:repeat_burst'
//   R2 static-position — >= 2 reports from the same device hash whose latitude
//                        AND longitude are EXACTLY identical (String() compare
//                        on the raw values; PostgREST returns DECIMAL as string)
//                        within the last 60 minutes -> 'auto:static_position'
// R1 is evaluated first; one rule wins per device per check. Devices already in
// flaggedDeviceHashes and reports without a device hash are never re-flagged.
// The check skips slow connections to match the Aegis auto-trigger pattern.
const AUTO_FLAG_REPEAT_BURST = { key: 'auto:repeat_burst', label: 'repeat burst', minReports: 3, windowMs: 30 * 60 * 1000 }
const AUTO_FLAG_STATIC_POSITION = { key: 'auto:static_position', label: 'static position', minReports: 2, windowMs: 60 * 60 * 1000 }
const AUTO_FLAG_REALTIME_DEBOUNCE_MS = 3000
// Module-level debounce timer so realtime INSERT/UPDATE bursts collapse into a
// single check (persists across store re-creation / keep-alive).
let autoFlagDebounceTimer = null

export const useSOSStore = defineStore('sos', () => {
  const deliveryState = ref('idle') // 'idle' | 'sending' | 'queued' | 'sent' | 'error'
  const currentSOS = ref(null)
  const userHash = ref('')
  const cachedBarangay = ref(null)
  const activeReports = ref([])
  const flaggedDeviceHashes = ref(new Set())
  const lastAutoFlags = ref([]) // { hash, rule, label }[] from the most recent auto-flag run
  const isLoading = ref(false)
  const sosChannel = ref(null)
  const clusterClock = ref(Date.now())
  const mySosStatus = ref(null) // Citizen self-service read-back of their own latest report

  // PostgREST returns DECIMAL columns as strings — normalize to numbers when present
  function normalizeReportRow(row) {
    if (!row) return null
    const lat = Number(row.latitude)
    const lng = Number(row.longitude)
    return {
      ...row,
      latitude: Number.isFinite(lat) ? lat : row.latitude,
      longitude: Number.isFinite(lng) ? lng : row.longitude
    }
  }

  // Clusters expire with time even when no Realtime event arrives.
  // Keep this store-level clock alive for the lifetime of the app so Aegis
  // does not remain surfaced after the 30-minute window has elapsed.
  if (typeof window !== 'undefined') {
    if (window._agapClockInterval) clearInterval(window._agapClockInterval)
    window._agapClockInterval = window.setInterval(() => {
      clusterClock.value = Date.now()
    }, 30 * 1000)
  }

  // Restore the in-flight SOS from a previous session (page reload / PWA restart)
  // so the victim can still view their request status and update it.
  // Only 'queued' is restored: 'sent' is a transient confirmation (the status
  // ladder is the persistent truth), and 'sending' must never be restored or the
  // button would be stuck busy with no fetch in flight.
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(ACTIVE_SOS_PERSIST_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.record?.id && parsed?.record?.latitude !== undefined) {
          currentSOS.value = parsed.record
          if (parsed.deliveryState === 'queued') {
            deliveryState.value = 'queued'
          }
        }
      }
    } catch (err) {
      console.warn('Restore active SOS failed:', err)
    }
  }

  function persistActiveSOS() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
    try {
      if (!currentSOS.value) {
        localStorage.removeItem(ACTIVE_SOS_PERSIST_KEY)
        return
      }
      localStorage.setItem(ACTIVE_SOS_PERSIST_KEY, JSON.stringify({
        record: currentSOS.value,
        deliveryState: deliveryState.value
      }))
    } catch (err) {
      console.warn('Persist active SOS failed:', err)
    }
  }

  // Keep the persisted snapshot in sync with every state change (including
  // delivery transitions and location updates from updateMySOS).
  watch([currentSOS, deliveryState], () => persistActiveSOS())

  const isPending = computed(() => deliveryState.value === 'sending')
  const hasActiveSOS = computed(() => currentSOS.value !== null)

  // Sorted Queue: Priority pending -> assigned_area match -> oldest created_at first
  // Filtered to exclude active flagged device hashes (R6), while ALWAYS preserving null/absent hashes (R7)
  const sortedQueue = computed(() => {
    const authStore = useAuthStore()
    const area = authStore.assignedArea

    return [...activeReports.value]
      .filter(Boolean)
      .filter(r => !r.sos_device_hash || !flaggedDeviceHashes.value.has(r.sos_device_hash))
      .sort((a, b) => {
        // 1. Pending status prioritized over non-pending
        if (a.status === 'pending' && b.status !== 'pending') return -1
        if (a.status !== 'pending' && b.status === 'pending') return 1

        // 2. Assigned area match priority
        if (authStore.hasAssignedArea) {
          const aMatch = sameBarangay(a.barangay, area) ? 1 : 0
          const bMatch = sameBarangay(b.barangay, area) ? 1 : 0
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
    // Skip Realtime on slow connections (2G/3G) — rely on periodic fetchActiveReports instead
    const connectivity = useConnectivityStore()
    if (connectivity.isSlowConnection) return

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
        // Debounced auto-flag check after INSERT/UPDATE payloads land
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          scheduleAutoFlagCheck()
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

  // Tear down Realtime when the network slows, re-establish when it recovers
  watch(() => useConnectivityStore().isSlowConnection, (isSlow) => {
    if (isSlow && sosChannel.value) {
      unsubscribeRealtimeSOS()
    } else if (!isSlow && !sosChannel.value) {
      subscribeToRealtimeSOS()
    }
  })

  function initUserHash() {
    const hash = getOrCreateAgapUserHash()
    userHash.value = hash
    return hash
  }

  async function fetchFlaggedDevices() {
    try {
      const data = await fetchWithRetry(() =>
        supabase
          .from('flagged_devices')
          .select('device_hash')
          .eq('active', true)
          .then(res => {
            if (res.error) throw res.error
            return res.data
          })
      )
      if (data) {
        flaggedDeviceHashes.value = new Set(data.map(d => d.device_hash).filter(Boolean))
      }
    } catch (err) {
      console.warn('Fetch flagged devices error:', err)
    }
  }

  async function fetchActiveReports() {
    isLoading.value = true
    try {
      await fetchFlaggedDevices()
      const data = await fetchWithRetry(() =>
        supabase
          .from('sos_reports')
          .select('*')
          .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(200)
          .then(res => {
            if (res.error) throw res.error
            return res.data
          })
      )
      activeReports.value = data
      // Auto-flag check on fresh data (fire-and-forget; never throws)
      runAutoFlagCheck()
    } catch (err) {
      console.warn('Fetch active reports fallback:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function flagDevice(param) {
    const device_hash = typeof param === 'object' && param !== null ? param.device_hash : param
    const flagged_by = typeof param === 'object' && param !== null ? param.flagged_by : arguments[1]
    const reason = typeof param === 'object' && param !== null ? param.reason : arguments[2]

    if (!device_hash) return { success: false, reason: 'missing_device_hash' }

    try {
      const nowIso = new Date().toISOString()
      const { data, error } = await supabase
        .from('flagged_devices')
        .upsert({
          device_hash,
          flagged_at: nowIso,
          flagged_by: flagged_by || 'operator',
          reason: reason || null,
          active: true
        })

      if (error) {
        console.warn('Flag device DB error:', error)
        return { success: false, error }
      }

      flaggedDeviceHashes.value.add(device_hash)
      return { success: true, data }
    } catch (err) {
      console.warn('Flag device exception:', err)
      return { success: false, error: err }
    }
  }

  async function unflagDevice(device_hash) {
    if (!device_hash) return { success: false, reason: 'missing_device_hash' }

    try {
      const { data, error } = await supabase
        .from('flagged_devices')
        .update({ active: false })
        .eq('device_hash', device_hash)

      if (error) {
        console.warn('Unflag device DB error:', error)
        return { success: false, error }
      }

      flaggedDeviceHashes.value.delete(device_hash)
      return { success: true, data }
    } catch (err) {
      console.warn('Unflag device exception:', err)
      return { success: false, error: err }
    }
  }

  // ── Auto-flag check ──
  // Evaluates R1 (repeat-burst) first, then R2 (static-position) per device
  // hash; the first matching rule wins. Never re-flags hashes already in
  // flaggedDeviceHashes, never flags reports without a device hash, and skips
  // slow connections. Returns the list of newly auto-flagged { hash, rule,
  // label } entries so callers can surface a toast.
  async function runAutoFlagCheck() {
    const flaggedThisRun = []
    try {
      const connectivity = useConnectivityStore()
      if (connectivity.isSlowConnection) return flaggedThisRun

      const now = Date.now()
      const byHash = {}
      for (const report of activeReports.value) {
        if (!report || !report.sos_device_hash) continue
        if (flaggedDeviceHashes.value.has(report.sos_device_hash)) continue
        if (!byHash[report.sos_device_hash]) byHash[report.sos_device_hash] = []
        byHash[report.sos_device_hash].push(report)
      }

      for (const [hash, reports] of Object.entries(byHash)) {
        const inWindow = (r, windowMs) => {
          const createdMs = Date.parse(r.created_at || '')
          if (!Number.isFinite(createdMs)) return false
          const ago = now - createdMs
          return ago >= 0 && ago <= windowMs
        }

        let rule = null

        // R1: repeat burst — 3+ reports within the last 30 minutes
        const burstReports = reports.filter(r => inWindow(r, AUTO_FLAG_REPEAT_BURST.windowMs))
        if (burstReports.length >= AUTO_FLAG_REPEAT_BURST.minReports) {
          rule = AUTO_FLAG_REPEAT_BURST
        } else {
          // R2: static position — 2+ reports with exactly identical lat/lng
          // within the last 60 minutes (String() compare on raw values)
          const staticReports = reports.filter(r => inWindow(r, AUTO_FLAG_STATIC_POSITION.windowMs))
          const byCoords = new Map()
          for (const r of staticReports) {
            if (r.latitude === null || r.latitude === undefined || r.latitude === ''
              || r.longitude === null || r.longitude === undefined || r.longitude === '') {
              continue
            }
            const key = `${String(r.latitude)}|${String(r.longitude)}`
            const list = byCoords.get(key) || []
            list.push(r)
            byCoords.set(key, list)
          }
          for (const [, list] of byCoords) {
            if (list.length >= AUTO_FLAG_STATIC_POSITION.minReports) {
              rule = AUTO_FLAG_STATIC_POSITION
              break
            }
          }
        }

        if (!rule) continue

        const result = await flagDevice({
          device_hash: hash,
          flagged_by: 'auto',
          reason: rule.key,
          active: true
        })

        if (result.success) {
          flaggedThisRun.push({ hash, rule: rule.key, label: rule.label })
        } else {
          console.warn('Auto-flag failed for device', hash, result)
        }
      }
    } catch (err) {
      console.warn('Auto-flag check error:', err)
    }

    if (flaggedThisRun.length > 0) {
      lastAutoFlags.value = flaggedThisRun.map(f => ({ hash: f.hash, rule: f.rule, label: f.label }))
    }
    return flaggedThisRun
  }

  // Debounced realtime trigger — a burst of INSERT/UPDATE events collapses to
  // one check (3s). The timer id lives at module scope so it survives store
  // re-creation and is shared across store instances.
  function scheduleAutoFlagCheck() {
    if (autoFlagDebounceTimer) clearTimeout(autoFlagDebounceTimer)
    autoFlagDebounceTimer = setTimeout(() => {
      autoFlagDebounceTimer = null
      runAutoFlagCheck()
    }, AUTO_FLAG_REALTIME_DEBOUNCE_MS)
  }

  async function fetchFlaggedReports() {
    await fetchFlaggedDevices()
    const hashes = Array.from(flaggedDeviceHashes.value).filter(Boolean)
    if (hashes.length === 0) return []

    try {
      // Fetch the current flag rows in parallel with the reports so each report
      // can carry its flagged_by / reason metadata (drives the Auto-flagged
      // chip in FlaggedSOSView). sos_reports rows alone have no flag info.
      const [reportsRes, devicesRes] = await Promise.all([
        supabase
          .from('sos_reports')
          .select('*')
          .in('sos_device_hash', hashes)
          .order('created_at', { ascending: false }),
        supabase
          .from('flagged_devices')
          .select('device_hash, flagged_by, reason, active')
          .in('device_hash', hashes)
          .order('flagged_at', { ascending: false })
      ])

      if (reportsRes.error) throw reportsRes.error

      let metaByHash = null
      if (!devicesRes.error && devicesRes.data) {
        metaByHash = {}
        for (const fd of devicesRes.data) {
          // Prefer the newest active flag row per hash
          if (fd.active && !metaByHash[fd.device_hash]) {
            metaByHash[fd.device_hash] = { flagged_by: fd.flagged_by || null, reason: fd.reason || null }
          }
        }
      }

      if (!reportsRes.data) return []
      return metaByHash
        ? reportsRes.data.map(r => ({ ...r, _flag_meta: metaByHash[r.sos_device_hash] || null }))
        : reportsRes.data
    } catch (err) {
      console.warn('Fetch flagged reports exception:', err)
      return []
    }
  }

  // Citizen self-service status read via the security-definer RPC
  // get_my_sos_status (anon RLS blocks direct SELECT on sos_reports).
  async function fetchMySOSStatus() {
    const connectivity = useConnectivityStore()
    if (!connectivity.isOnline) return mySosStatus.value
    const hash = userHash.value || initUserHash()
    try {
      const data = await fetchWithRetry(() =>
        supabase
          .rpc('get_my_sos_status', { p_user_hash: hash })
          .then(res => {
            if (res.error) throw res.error
            return res.data
          })
      )
      // PostgREST returns an ARRAY of rows for RETURNS TABLE functions — take [0]
      mySosStatus.value = normalizeReportRow(data && data.length > 0 ? data[0] : null)
      return mySosStatus.value
    } catch (err) {
      console.warn('Fetch my SOS status error:', err)
      return null
    }
  }

  // Victim self-service informational update via update_my_sos RPC:
  // still-here ping ({}), moved location ({latitude, longitude}), or note.
  // PROTOCOL: victims cannot change request status — only operators dispose
  // of requests (claim/resolve); this RPC has no status parameter by design.
  async function updateMySOS({ latitude, longitude, note } = {}) {
    const connectivity = useConnectivityStore()
    if (!connectivity.isOnline) return { success: false, reason: 'offline' }
    const hash = userHash.value || initUserHash()
    try {
      const data = await fetchWithRetry(() =>
        supabase
          .rpc('update_my_sos', {
            p_user_hash: hash,
            p_latitude: latitude ?? null,
            p_longitude: longitude ?? null,
            p_note: note ?? null
          })
          .then(res => {
            if (res.error) throw res.error
            return res.data
          })
      )
      if (data && data.length > 0) {
        mySosStatus.value = normalizeReportRow(data[0])
        // Keep the local record's coordinates in sync so it reflects the latest position
        if (currentSOS.value) {
          if (Number.isFinite(mySosStatus.value.latitude)) currentSOS.value.latitude = mySosStatus.value.latitude
          if (Number.isFinite(mySosStatus.value.longitude)) currentSOS.value.longitude = mySosStatus.value.longitude
        }
      }
      return { success: true, data: data && data.length > 0 ? mySosStatus.value : null }
    } catch (err) {
      console.warn('Update my SOS error:', err)
      return { success: false, reason: 'error', error: err }
    }
  }

  // Victim positive rescue confirmation via confirm_my_rescue RPC.
  // PROTOCOL: the victim may only move the request FORWARD to 'resolved'
  // (positive confirmation). Cancellation and other dispositions belong
  // exclusively to operators.
  async function confirmMyRescue() {
    const connectivity = useConnectivityStore()
    if (!connectivity.isOnline) return { success: false, reason: 'offline' }
    const hash = userHash.value || initUserHash()
    try {
      const data = await fetchWithRetry(() =>
        supabase
          .rpc('confirm_my_rescue', { p_user_hash: hash })
          .then(res => {
            if (res.error) throw res.error
            return res.data
          })
      )
      if (data && data.length > 0) {
        mySosStatus.value = normalizeReportRow(data[0])
        // Sync the fallback display source so the ladder completes immediately
        if (currentSOS.value) {
          currentSOS.value.status = data[0].status
        }
      }
      return { success: true, data: data && data.length > 0 ? mySosStatus.value : null }
    } catch (err) {
      console.warn('Confirm rescue error:', err)
      return { success: false, reason: 'error', error: err }
    }
  }

  // Victim closes their completed request locally. The DB record stays resolved
  // (operators keep the audit trail); only the local active state is cleared so
  // the citizen can return to the idle SOS screen and start a new request if needed.
  // The [currentSOS, deliveryState] watch fires persistActiveSOS(), which removes
  // the localStorage key when currentSOS is null.
  function dismissSOS() {
    currentSOS.value = null
    mySosStatus.value = null
    deliveryState.value = 'idle'
  }

  async function submitSOS(payload) {
    deliveryState.value = 'sending'
    try {
      const hash = userHash.value || initUserHash()
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

      const [retrievedCallbackNumber, retrievedDeviceHash] = await Promise.all([
        payload.callback_number !== undefined
          ? Promise.resolve(payload.callback_number)
          : getCallbackNumber().catch((err) => {
              console.warn('IndexedDB getCallbackNumber error in submitSOS:', err)
              return null
            }),
        payload.sos_device_hash !== undefined
          ? Promise.resolve(payload.sos_device_hash)
          : getSOSDeviceHash().catch((err) => {
              console.warn('IndexedDB getSOSDeviceHash error in submitSOS:', err)
              return null
            })
      ])

      const fallbackDeviceHash = crypto.randomUUID ? crypto.randomUUID() : 'dev_' + Date.now()
      const finalDeviceHash = retrievedDeviceHash || fallbackDeviceHash

      const sosPayload = {
        latitude: payload.latitude,
        longitude: payload.longitude,
        user_hash: hash,
        barangay: payload.barangay || findNearestBarangay(payload.latitude, payload.longitude),
        mode: isOnline ? (payload.mode || 'online') : 'degraded_signal',
        callback_number: retrievedCallbackNumber ?? null,
        sos_device_hash: finalDeviceHash
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
      // A new request invalidates the previous self-service readback
      mySosStatus.value = null
      persistActiveSOS()

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
    flaggedDeviceHashes,
    lastAutoFlags,
    isLoading,
    isPending,
    hasActiveSOS,
    sortedQueue,
    activeClusters,
    subscribeToRealtimeSOS,
    unsubscribeRealtimeSOS,
    initUserHash,
    fetchFlaggedDevices,
    fetchActiveReports,
    submitSOS,
    claimReport,
    resolveReport,
    checkStaleClaims,
    flagDevice,
    unflagDevice,
    runAutoFlagCheck,
    fetchFlaggedReports,
    mySosStatus,
    fetchMySOSStatus,
    updateMySOS,
    confirmMyRescue,
    dismissSOS,
    persistActiveSOS
  }
})
