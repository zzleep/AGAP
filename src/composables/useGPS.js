import { ref } from 'vue'
import { openDB } from 'idb'

const DB_NAME = 'agap_gps_db'
const STORE_NAME = 'locations'

const cachedLocation = ref(null)
const isLocating = ref(false)
const toastMessage = ref('')
let refreshInterval = null
let serviceWorkerListenerReady = false

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

export function useGPS() {
  function registerServiceWorkerGPSRefresh() {
    if (serviceWorkerListenerReady || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    serviceWorkerListenerReady = true
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'AGAP_GPS_REFRESH') {
        refreshLocation(false)
      }
    })
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.periodicSync) {
        registration.periodicSync.register('agap-gps-refresh', {
          minInterval: 60 * 1000
        }).catch(() => {})
      }
    }).catch(() => {})
  }

  async function saveToCache(loc) {
    try {
      const db = await getDB()
      await db.put(STORE_NAME, loc, 'last_known')
      cachedLocation.value = loc
    } catch (err) {
      console.warn('IndexedDB GPS save failed:', err)
      cachedLocation.value = loc
    }
  }

  async function loadFromCache() {
    try {
      const db = await getDB()
      const val = await db.get(STORE_NAME, 'last_known')
      if (val) {
        cachedLocation.value = val
      }
      return val
    } catch (err) {
      console.warn('IndexedDB GPS load failed:', err)
      return null
    }
  }

  function showToast(msg) {
    toastMessage.value = msg
    setTimeout(() => {
      if (toastMessage.value === msg) {
        toastMessage.value = ''
      }
    }, 3000)
  }

  async function initGPS() {
    registerServiceWorkerGPSRefresh()
    const existing = await loadFromCache()
    isLocating.value = true

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      isLocating.value = false
      if (!cachedLocation.value) {
        const fallback = {
          latitude: 14.3123,
          longitude: 121.1114,
          accuracy: 0,
          barangay: 'Tagapo',
          timestamp: Date.now(),
          isFallback: true
        }
        await saveToCache(fallback)
      }
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          barangay: 'Tagapo',
          timestamp: Date.now()
        }
        await saveToCache(loc)
        isLocating.value = false
        if (!existing) {
          showToast('Location Saved')
        }
      },
      async (err) => {
        console.warn('GPS initial position error, using fallback:', err.message)
        isLocating.value = false
        if (!cachedLocation.value) {
          const fallback = {
            latitude: 14.3123,
            longitude: 121.1114,
            accuracy: 0,
            barangay: 'Tagapo',
            timestamp: Date.now(),
            isFallback: true
          }
          await saveToCache(fallback)
        }
      },
      { timeout: 5000, enableHighAccuracy: true }
    )
  }

  async function refreshLocation(manual = false) {
    isLocating.value = true
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        isLocating.value = false
        if (manual) showToast('GPS Lock Failed - Using Cached Location')
        resolve(cachedLocation.value)
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const loc = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            barangay: 'Tagapo',
            timestamp: Date.now()
          }
          await saveToCache(loc)
          isLocating.value = false
          if (manual) showToast('Location Refreshed')
          resolve(loc)
        },
        (err) => {
          console.warn('GPS refresh error:', err.message)
          isLocating.value = false
          if (manual) showToast('GPS Lock Failed - Using Cached Location')
          resolve(cachedLocation.value)
        },
        { timeout: 5000, enableHighAccuracy: true }
      )
    })
  }

  function startBackgroundRefresh() {
    if (refreshInterval) clearInterval(refreshInterval)
    refreshInterval = setInterval(() => {
      refreshLocation(false)
    }, 60000)
  }

  return {
    cachedLocation,
    isLocating,
    toastMessage,
    initGPS,
    refreshLocation,
    startBackgroundRefresh
  }
}
