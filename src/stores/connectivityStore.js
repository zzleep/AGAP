import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useConnectivityStore = defineStore('connectivity', () => {
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const effectiveType = ref(getEffectiveType())
  const rtt = ref(getRTT())
  const measuredRtt = ref(0)
  const lastOnlineAt = ref(isOnline.value ? Date.now() : null)
  const lastOfflineAt = ref(!isOnline.value ? Date.now() : null)
  const isPrewarmed = ref(false)

  function getEffectiveType() {
    if (typeof navigator !== 'undefined' && navigator.connection && navigator.connection.effectiveType) {
      return navigator.connection.effectiveType
    }
    return 'unknown'
  }

  function getRTT() {
    if (typeof navigator !== 'undefined' && navigator.connection && navigator.connection.rtt) {
      return navigator.connection.rtt
    }
    return 0
  }

  const effectiveRtt = computed(() => Math.max(rtt.value, measuredRtt.value))

  const isSlowConnection = computed(() => {
    if (!isOnline.value) return false // offline is handled separately
    // Sensitive trigger for behaviour adaptation (skip Realtime, throttle autopilot,
    // use OSM tiles). Activates before the UI banner switches to 'degraded_signal',
    // so the app proactively reduces network usage without alarming the user.
    // This is why we include 3g and RTT > 500ms here but not in mode.
    if (effectiveType.value === 'slow-2g' || effectiveType.value === '2g') return true
    if (effectiveType.value === '3g') return true
    if (effectiveRtt.value > 500) return true
    return false
  })

  const mode = computed(() => {
    if (!isOnline.value) return 'offline'
    // Stricter threshold for the user-facing banner — only flag connections
    // that are genuinely painful (2G or RTT > 1000ms). 3g and moderate
    // latency (500–1000ms) silently trigger isSlowConnection instead.
    if (effectiveType.value === '2g' || effectiveType.value === 'slow-2g' || effectiveRtt.value > 1000) {
      return 'degraded_signal'
    }
    return 'online'
  })

  const bannerConfig = computed(() => {
    switch (mode.value) {
      case 'online':
        return {
          labelKey: 'connectivity.online',
          messageKey: 'connectivity.onlineMsg',
          label: 'Online',
          bgClass: 'bg-emerald-600 text-white',
          icon: 'wifi',
          message: 'Connected to AGAP Disaster Response Network'
        }
      case 'degraded_signal':
        return {
          labelKey: 'connectivity.degraded',
          messageKey: 'connectivity.degradedMsg',
          label: 'Weak Signal',
          bgClass: 'bg-amber-600 text-white',
          icon: 'wifi-off',
          message: 'Your emergency details are saved safely. Any SOS request will automatically send as soon as signal improves.'
        }
      case 'offline':
      default:
        return {
          labelKey: 'connectivity.offline',
          messageKey: 'connectivity.offlineMsg',
          label: 'Offline Mode',
          bgClass: 'bg-rose-700 text-white',
          icon: 'signal-slash',
          message: 'No internet connection — Operating on local cache. SOS queued until connection returns.'
        }
    }
  })

  function handleOnline() {
    isOnline.value = true
    lastOnlineAt.value = Date.now()
    updateNetworkInfo()
  }

  function handleOffline() {
    isOnline.value = false
    lastOfflineAt.value = Date.now()
    updateNetworkInfo()
  }

  function updateNetworkInfo() {
    effectiveType.value = getEffectiveType()
    rtt.value = getRTT()
  }

  function initListeners() {
    if (typeof window === 'undefined') return
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    if (navigator.connection) {
      navigator.connection.addEventListener('change', updateNetworkInfo)
    }
  }

  function destroyListeners() {
    if (typeof window === 'undefined') return
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    if (navigator.connection) {
      navigator.connection.removeEventListener('change', updateNetworkInfo)
    }
  }

  async function prewarmConnection(supabaseUrl, anonKey) {
    if (isPrewarmed.value || !isOnline.value) return
    try {
      await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: { apikey: anonKey }
      })
      isPrewarmed.value = true
    } catch (err) {
      console.warn('TLS pre-warm ping failed:', err)
    }
  }

  return {
    isOnline,
    effectiveType,
    rtt,
    measuredRtt,
    lastOnlineAt,
    lastOfflineAt,
    isPrewarmed,
    mode,
    isSlowConnection,
    bannerConfig,
    initListeners,
    destroyListeners,
    updateNetworkInfo,
    prewarmConnection
  }
})
