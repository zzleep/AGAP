import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { openDB } from 'idb'
import { findNearestBarangay } from '@/data/barangay_coords'

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
  const { t } = useI18n()

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

  function acquirePosition(highTimeoutMs, lowTimeoutMs) {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        resolve(null)
        return
      }

      // Phase 1: High accuracy GPS (slower but more precise)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (pos.coords.accuracy <= 100) {
            resolve(pos)
          } else {
            // Accuracy > 100m — try low-accuracy fallback which may be faster/better indoors
            navigator.geolocation.getCurrentPosition(
              (pos2) => resolve(pos2),
              () => resolve(pos),
              { timeout: lowTimeoutMs, enableHighAccuracy: false }
            )
          }
        },
        () => {
          // Phase 1 timed out or failed — try Phase 2: low accuracy (WiFi/cell, faster)
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos),
            () => resolve(null),
            { timeout: lowTimeoutMs, enableHighAccuracy: false }
          )
        },
        { timeout: highTimeoutMs, enableHighAccuracy: true }
      )
    })
  }

  async function initGPS() {
    registerServiceWorkerGPSRefresh()
    const existing = await loadFromCache()
    isLocating.value = true

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      isLocating.value = false
      if (!cachedLocation.value) {
        const fallbackLat = 14.3123
        const fallbackLng = 121.1114
        const fallback = {
          latitude: fallbackLat,
          longitude: fallbackLng,
          accuracy: 0,
          barangay: findNearestBarangay(fallbackLat, fallbackLng),
          timestamp: Date.now(),
          isFallback: true
        }
        await saveToCache(fallback)
      }
      return
    }

    const pos = await acquirePosition(20000, 10000)

    if (pos) {
      const loc = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        barangay: findNearestBarangay(pos.coords.latitude, pos.coords.longitude),
        timestamp: Date.now()
      }
      await saveToCache(loc)
      isLocating.value = false
      if (!existing) {
        showToast(t('gps.locationSaved'))
      }
    } else {
      console.warn('GPS initial position error, using fallback')
      isLocating.value = false
      if (!cachedLocation.value) {
        const fallbackLat = 14.3123
        const fallbackLng = 121.1114
        const fallback = {
          latitude: fallbackLat,
          longitude: fallbackLng,
          accuracy: 0,
          barangay: findNearestBarangay(fallbackLat, fallbackLng),
          timestamp: Date.now(),
          isFallback: true
        }
        await saveToCache(fallback)
      }
    }
  }

  async function refreshLocation(manual = false) {
    isLocating.value = true

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      isLocating.value = false
      if (manual) showToast(t('gps.gpsLockFailed'))
      return cachedLocation.value
    }

    const pos = await acquirePosition(20000, 10000)

    if (pos) {
      const loc = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        barangay: findNearestBarangay(pos.coords.latitude, pos.coords.longitude),
        timestamp: Date.now()
      }
      await saveToCache(loc)
      isLocating.value = false
      if (manual) showToast(t('gps.locationRefreshed'))
      return loc
    }

    console.warn('GPS refresh error: no position acquired')
    isLocating.value = false
    if (manual) showToast(t('gps.gpsLockFailed'))
    return cachedLocation.value
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
