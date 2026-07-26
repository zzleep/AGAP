import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useConnectivityStore = defineStore('connectivity', () => {
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const effectiveType = ref(getEffectiveType())
  const rtt = ref(getRTT())
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

  const mode = computed(() => {
    if (!isOnline.value) return 'offline'
    if (effectiveType.value === '2g' || effectiveType.value === 'slow-2g' || rtt.value > 1000) {
      return 'degraded_signal'
    }
    return 'online'
  })

  const bannerConfig = computed(() => {
    switch (mode.value) {
      case 'online':
        return {
          label: 'Online',
          bgClass: 'bg-emerald-600 text-white',
          icon: 'wifi',
          message: 'Connected to AGAP Disaster Response Network'
        }
      case 'degraded_signal':
        return {
          label: 'Weak / Degraded Signal',
          bgClass: 'bg-amber-600 text-white',
          icon: 'wifi-off',
          message: 'Signal congested — SOS requests will queue automatically via BackgroundSync / sendBeacon'
        }
      case 'offline':
      default:
        return {
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
    lastOnlineAt,
    lastOfflineAt,
    isPrewarmed,
    mode,
    bannerConfig,
    initListeners,
    destroyListeners,
    updateNetworkInfo,
    prewarmConnection
  }
})
