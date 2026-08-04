import { ref, watch } from 'vue'
import { useFlowStore } from '@/stores/flowStore'
import { useConnectivityStore } from '@/stores/connectivityStore'
import { NETWORK_CONFIG } from '@/lib/networkConfig'
import { supabase } from '@/lib/supabase'
import { getDistanceKm } from '@/utils/geo'
import { getWeatherPenalty } from '@/utils/risk'

export function useAutopilot({ userLocation, nearestEvacCenter, deps }) {
  // deps is a plain object the view mutates after creating the other composables:
  //   deps.renderEvacRouteLine      → async function
  //   deps.getNearbyIncidentSummary → async function returning { count, criticalLike }
  //   deps.nearestEvacRouteInfo     → ref (read via deps.nearestEvacRouteInfo.value)
  const flow = useFlowStore()
  const connectivity = useConnectivityStore()
  const safetyScore = ref(100)
  const stuckAlert = ref(false)
  const lastAutopilotReason = ref('')
  let autopilotIntervalId = null
  let lastAutopilotRunAt = 0
  let lastMovementSnapshot = null
  let lastStuckSignalAt = 0

  function startAutopilot() {
    if (autopilotIntervalId) clearInterval(autopilotIntervalId)
    const ms = connectivity.isSlowConnection ? NETWORK_CONFIG.autopilotInterval.slow : NETWORK_CONFIG.autopilotInterval.fast
    autopilotIntervalId = setInterval(() => runAutopilotCycle(false), ms)
  }

  function stopAutopilot() {
    if (autopilotIntervalId) clearInterval(autopilotIntervalId)
  }

  async function runAutopilotCycle(forceReroute) {
    if (!userLocation.value || !nearestEvacCenter.value) return

    const now = Date.now()
    if (!forceReroute && now - lastAutopilotRunAt < 8000) return
    lastAutopilotRunAt = now

    const weatherPenalty = getWeatherPenalty(flow.mappedRiskLevel)
    const reportSummary = await deps.getNearbyIncidentSummary()
    const incidentPenalty = Math.min(42, (reportSummary.count * 4) + (reportSummary.criticalLike * 8))
    const routePenalty = deps.nearestEvacRouteInfo.value ? 0 : 10

    safetyScore.value = Math.max(0, 100 - weatherPenalty - incidentPenalty - routePenalty)

    if (reportSummary.criticalLike >= 2) {
      lastAutopilotReason.value = 'reports'
    } else if (flow.mappedRiskLevel === 'high') {
      lastAutopilotReason.value = 'weather'
    } else {
      lastAutopilotReason.value = ''
    }

    if (forceReroute || lastAutopilotReason.value) {
      await deps.renderEvacRouteLine()
    }

    updateMovementSnapshot()
  }

  function updateMovementSnapshot() {
    if (!userLocation.value) return

    if (!lastMovementSnapshot) {
      lastMovementSnapshot = {
        latitude: userLocation.value.latitude,
        longitude: userLocation.value.longitude,
        timestamp: Date.now()
      }
      return
    }

    const movedKm = getDistanceKm(
      lastMovementSnapshot.latitude,
      lastMovementSnapshot.longitude,
      userLocation.value.latitude,
      userLocation.value.longitude
    )

    const elapsedMs = Date.now() - lastMovementSnapshot.timestamp
    const highRisk = flow.mappedRiskLevel === 'high'

    if (highRisk && elapsedMs >= 120000 && movedKm < 0.03) {
      stuckAlert.value = true
      sendStuckSignal()
    } else if (movedKm >= 0.03) {
      stuckAlert.value = false
      lastMovementSnapshot = {
        latitude: userLocation.value.latitude,
        longitude: userLocation.value.longitude,
        timestamp: Date.now()
      }
    }
  }

  async function sendStuckSignal() {
    if (!userLocation.value) return

    const now = Date.now()
    if (now - lastStuckSignalAt < 10 * 60 * 1000) return

    lastStuckSignalAt = now
    const userHash = localStorage.getItem('agap_user_hash') || `usr_${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem('agap_user_hash', userHash)

    try {
      await supabase.from('sos_reports').insert([{
        latitude: userLocation.value.latitude,
        longitude: userLocation.value.longitude,
        barangay: userLocation.value.barangay || 'Unknown',
        user_hash: userHash,
        mode: 'autopilot_stuck'
      }])
    } catch (err) {
      console.warn('Autopilot stuck signal failed:', err)
    }
  }

  // IMPORTANT: register this watch ONCE at top level of the composable (not inside startAutopilot), matching the original onMounted behavior (line 353):
  watch(() => connectivity.isSlowConnection, () => { startAutopilot() })

  return { safetyScore, stuckAlert, lastAutopilotReason, startAutopilot, stopAutopilot, runAutopilotCycle }
}