import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { openDB } from 'idb'
import { findNearestBarangay } from '@/data/barangay_coords'
import { normalizeCallbackNumber, looksValid } from '@/utils/callbackNumber'

const DB_NAME = 'agap_gps_db'
const STORE_NAME = 'locations'
const PROFILE_STORE_NAME = 'user_profile'

const cachedLocation = ref(null)
const isLocating = ref(false)
const toastMessage = ref('')
let refreshInterval = null
let serviceWorkerListenerReady = false
let locationWatchId = null

let dbPromise = null
let cachedDeviceHash = null
let deviceHashPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
        if (!db.objectStoreNames.contains(PROFILE_STORE_NAME)) {
          db.createObjectStore(PROFILE_STORE_NAME)
        }
      }
    }).catch((err) => {
      dbPromise = null
      throw err
    })
  }
  return dbPromise
}

export async function getCallbackNumber() {
  try {
    const db = await getDB()
    const val = await db.get(PROFILE_STORE_NAME, 'callback_number')
    return val ?? null
  } catch (err) {
    console.warn('IndexedDB getCallbackNumber failed:', err)
    return null
  }
}

export async function setCallbackNumber(raw) {
  const normalized = normalizeCallbackNumber(raw)
  const validNumber = normalized || (raw ? String(raw).trim() : null)
  try {
    const db = await getDB()
    if (!validNumber) {
      await db.delete(PROFILE_STORE_NAME, 'callback_number')
    } else {
      await db.put(PROFILE_STORE_NAME, validNumber, 'callback_number')
    }
  } catch (err) {
    console.warn('IndexedDB setCallbackNumber failed:', err)
  }
  return validNumber
}

export async function initSOSDeviceHash() {
  if (cachedDeviceHash) {
    return cachedDeviceHash
  }
  if (deviceHashPromise) {
    return deviceHashPromise
  }

  deviceHashPromise = (async () => {
    try {
      const db = await getDB()
      const existing = await db.get(PROFILE_STORE_NAME, 'sos_device_hash')
      if (existing) {
        cachedDeviceHash = existing
        return existing
      }
      if (!cachedDeviceHash) {
        cachedDeviceHash = crypto.randomUUID()
      }
      await db.put(PROFILE_STORE_NAME, cachedDeviceHash, 'sos_device_hash')
      return cachedDeviceHash
    } catch (err) {
      console.warn('IndexedDB initSOSDeviceHash failed:', err)
      if (!cachedDeviceHash) {
        cachedDeviceHash = crypto.randomUUID()
      }
      return cachedDeviceHash
    } finally {
      deviceHashPromise = null
    }
  })()

  return deviceHashPromise
}

export async function getSOSDeviceHash() {
  return await initSOSDeviceHash()
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

  async function clearGPSCache() {
    try {
      const db = await getDB()
      await db.delete(STORE_NAME, 'last_known')
      cachedLocation.value = null
    } catch (err) {
      console.warn('Failed to clear GPS cache:', err)
      cachedLocation.value = null
    }
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

  function acquirePosition(timeoutMs = 12000) {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        resolve(null)
        return
      }

      let bestPos = null
      let watchId = null

      const timer = setTimeout(() => {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId)
        }
        resolve(bestPos)
      }, timeoutMs)

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          // Keep position with highest precision (lowest accuracy radius value)
          if (!bestPos || pos.coords.accuracy < bestPos.coords.accuracy) {
            bestPos = pos
          }
          // If accuracy is highly precise (<= 20 meters), resolve immediately!
          if (pos.coords.accuracy <= 20) {
            clearTimeout(timer)
            navigator.geolocation.clearWatch(watchId)
            resolve(pos)
          }
        },
        (err) => {
          console.warn('GPS sample error:', err)
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: timeoutMs
        }
      )
    })
  }

  function buildLocationFromPosition(pos) {
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      barangay: findNearestBarangay(pos.coords.latitude, pos.coords.longitude),
      timestamp: Date.now()
    }
  }

  async function initGPS() {
    registerServiceWorkerGPSRefresh()
    await initSOSDeviceHash()
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

    const pos = await acquirePosition(12000)

    if (pos) {
      const loc = buildLocationFromPosition(pos)
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

    const pos = await acquirePosition(12000)

    if (pos) {
      const loc = buildLocationFromPosition(pos)
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

  function startLiveTracking() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    if (locationWatchId !== null) return

    locationWatchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const loc = buildLocationFromPosition(pos)
        await saveToCache(loc)
      },
      (err) => {
        console.warn('Live GPS tracking failed:', err)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000
      }
    )
  }

  function stopLiveTracking() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    if (locationWatchId === null) return

    navigator.geolocation.clearWatch(locationWatchId)
    locationWatchId = null
  }

  return {
    cachedLocation,
    isLocating,
    toastMessage,
    initGPS,
    refreshLocation,
    clearGPSCache,
    startBackgroundRefresh,
    startLiveTracking,
    stopLiveTracking,
    getCallbackNumber,
    setCallbackNumber,
    getSOSDeviceHash,
    initSOSDeviceHash
  }
}

