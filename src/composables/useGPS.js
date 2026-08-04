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
let permissionListenerReady = false
// In-flight guards: concurrent calls to initGPS/refreshLocation share one
// acquisition instead of spawning overlapping geolocation watches.
let initGPSPromise = null
let refreshPromise = null

// GPS accuracy tuning (meters). Fixes better than MAX_ACCEPTABLE_ACCURACY are
// trusted as-is; coarser fixes are still accepted — flagged lowAccuracy — as
// long as they stay within MAX_USABLE_ACCURACY, because a 300m fix beats "no
// location" in an emergency. Anything worse is discarded as not a real fix.
const MAX_ACCEPTABLE_ACCURACY = 150
const MAX_USABLE_ACCURACY = 500
// Cached fixes older than this are treated as stale and never used as the live location.
const MAX_CACHE_AGE_MS = 10 * 60 * 1000 // 10 minutes

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
  // Final validation gate: save only a well-formed mobile number (or clear it
  // for empty input). Callers (Settings/Onboarding) already gate the UI on
  // looksValid — this keeps the store honest against programmatic calls.
  const validNumber = looksValid(normalized) ? normalized : null
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

  function buildFallbackLocation() {
    const fallbackLat = 14.3123
    const fallbackLng = 121.1114
    return {
      latitude: fallbackLat,
      longitude: fallbackLng,
      accuracy: Infinity, // not a real fix — lets downstream code distinguish it from a live reading
      // No fabricated barangay: the app must never claim the user is in a specific
      // barangay without a real GPS fix. Downstream UI degrades to a neutral
      // "current location / GPS required" state when this is null.
      barangay: null,
      timestamp: Date.now(),
      isFallback: true
    }
  }

  async function clearGPSCache() {
    const fallback = buildFallbackLocation()
    try {
      const db = await getDB()
      await db.delete(STORE_NAME, 'last_known')
      cachedLocation.value = fallback
    } catch (err) {
      console.warn('Failed to clear GPS cache:', err)
      cachedLocation.value = fallback
    }
    // Full privacy reset: drop the persisted preference too, so the next
    // initGPS re-prompts cleanly instead of silently reusing stale state.
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('agap_location_pref')
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
      // Reject stale fixes and fallback placeholders so an old or fake position
      // never silently acts as the live location.
      if (val && !val.isFallback && typeof val.timestamp === 'number' && Date.now() - val.timestamp <= MAX_CACHE_AGE_MS) {
        cachedLocation.value = val
        return val
      }
      return null
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
        resolve({ unsupported: true })
        return
      }

      let bestPos = null
      let watchId = null

      const finish = (res) => {
        if (watchId !== null) {
          try {
            navigator.geolocation.clearWatch(watchId)
          } catch (err) {
            // already cleared — ignore
          }
        }
        resolve(res)
      }

      const timer = setTimeout(() => {
        // Never return "nothing" while a usable reading exists: accept the best
        // fix even if coarse, flagging it so callers degrade gracefully instead
        // of silently dropping into fallback.
        finish(
          bestPos && bestPos.coords.accuracy <= MAX_USABLE_ACCURACY
            ? { pos: bestPos, lowAccuracy: bestPos.coords.accuracy > MAX_ACCEPTABLE_ACCURACY }
            : null
        )
      }, timeoutMs)

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          // Keep the position with the highest precision (lowest accuracy radius)
          if (!bestPos || pos.coords.accuracy < bestPos.coords.accuracy) {
            bestPos = pos
          }
          // If accuracy is highly precise (<= 20 meters), resolve immediately!
          if (pos.coords.accuracy <= 20) {
            clearTimeout(timer)
            finish({ pos, lowAccuracy: false })
          }
        },
        (err) => {
          console.warn('GPS sample error:', err)
          // PERMISSION_DENIED is fatal — surface it to the caller.
          // POSITION_UNAVAILABLE / TIMEOUT are transient: keep sampling, a later
          // callback can still succeed before the deadline.
          if (err.code === 1 || err.code === err.PERMISSION_DENIED) {
            clearTimeout(timer)
            finish({ denied: true })
          }
        },
        {
          enableHighAccuracy: true,
          // Small maximumAge so a recent OS-level fix is reused instead of
          // forcing a cold GPS-chip read (and a slow first fix) on every call.
          maximumAge: 4000,
          timeout: timeoutMs
        }
      )
    })
  }

  function buildLocationFromPosition(pos, lowAccuracy = false) {
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      lowAccuracy, // coarse but usable fix — UI should surface "approximate"
      barangay: findNearestBarangay(pos.coords.latitude, pos.coords.longitude),
      timestamp: Date.now()
    }
  }

  async function getPermissionState() {
    if (typeof navigator === 'undefined' || !navigator.permissions) return 'unknown'
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' })
      return status.state // 'granted' | 'denied' | 'prompt'
    } catch (err) {
      return 'unknown'
    }
  }

  function registerPermissionListener() {
    if (permissionListenerReady || typeof navigator === 'undefined' || !navigator.permissions) return
    permissionListenerReady = true
    // React to mid-session permission changes (e.g. the user grants access via
    // the browser UI): auto-resume acquisition/tracking instead of waiting for
    // the next explicit call.
    navigator.permissions.query({ name: 'geolocation' }).then((status) => {
      status.onchange = () => {
        if (status.state === 'granted') {
          startLiveTracking()
          refreshLocation(false)
        } else if (status.state === 'denied') {
          stopLiveTracking()
        }
      }
    }).catch(() => {})
  }

  async function initGPS(force = false) {
    // Deduplicate concurrent calls: overlapping attempts would spawn multiple
    // geolocation watches, waste battery, and race on cachedLocation writes.
    if (initGPSPromise) return initGPSPromise
    initGPSPromise = runInitGPS(force)
    try {
      return await initGPSPromise
    } finally {
      initGPSPromise = null
    }
  }

  async function runInitGPS(force = false) {
    registerServiceWorkerGPSRefresh()
    registerPermissionListener()
    await initSOSDeviceHash()
    const existing = await loadFromCache()

    // Reconcile the persisted preference against the browser's real permission
    // state: a stale 'skipped' flag (localStorage survives across sessions)
    // must not override an actual permission grant.
    const permState = await getPermissionState()
    const userPref = typeof localStorage !== 'undefined' ? localStorage.getItem('agap_location_pref') : null
    if (!force && userPref === 'skipped' && permState !== 'granted') {
      isLocating.value = false
      // Session-only placeholder — never persisted as a real last-known location
      cachedLocation.value = buildFallbackLocation()
      return { success: false, skipped: true }
    }

    isLocating.value = true

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      isLocating.value = false
      if (!cachedLocation.value) {
        cachedLocation.value = buildFallbackLocation() // session-only, never persisted as last known
      }
      return { success: false, unsupported: true }
    }

    // Two-stage acquisition: fire a fast coarse fix first (Wi-Fi/cell positioning,
    // usually 1-3s) so the UI has a real position quickly; the high-accuracy pass
    // below refines it in the background.
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (coarsePos) => {
          // Only adopt the coarse fix if nothing better is already in hand
          if (!cachedLocation.value || cachedLocation.value.isFallback) {
            cachedLocation.value = buildLocationFromPosition(coarsePos, true) // provisional, not persisted
          }
        },
        () => {
          // Coarse fix unavailable — the high-accuracy pass below is the fallback
        },
        { enableHighAccuracy: false, maximumAge: 30000, timeout: 3000 }
      )
    }

    // Cold starts are slow: give the chip extra time on first acquisition
    // (routine refreshes keep the shorter default in refreshLocation).
    const pos = await acquirePosition(20000)

    if (pos && pos.denied) {
      isLocating.value = false
      return { success: false, denied: true }
    }

    if (pos && pos.pos) {
      const loc = buildLocationFromPosition(pos.pos, pos.lowAccuracy)
      await saveToCache(loc)
      // A successful fetch clears any stale 'skipped' preference
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('agap_location_pref', 'granted')
      }
      isLocating.value = false
      if (!existing) {
        showToast(t('gps.locationSaved'))
      }
      return { success: true, location: loc, lowAccuracy: pos.lowAccuracy }
    }

    // No usable high-accuracy fix: if a provisional coarse fix (or a recent
    // real cached one) is available, report it instead of dropping to fallback.
    const candidate = cachedLocation.value
    if (candidate && !candidate.isFallback) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('agap_location_pref', 'granted')
      }
      isLocating.value = false
      return { success: true, location: candidate, lowAccuracy: !!candidate.lowAccuracy }
    }

    console.warn('GPS initial position error, using fallback')
    isLocating.value = false
    if (!cachedLocation.value) {
      cachedLocation.value = buildFallbackLocation() // session-only, never persisted as last known
    }
    return { success: false, fallback: true }
  }

  async function refreshLocation(manual = false) {
    // Deduplicate concurrent calls (background loop, permission listener,
    // manual taps) so only one acquisition runs at a time.
    if (refreshPromise) return refreshPromise
    refreshPromise = runRefreshLocation(manual)
    try {
      return await refreshPromise
    } finally {
      refreshPromise = null
    }
  }

  async function runRefreshLocation(manual = false) {
    const permState = await getPermissionState()
    const userPref = typeof localStorage !== 'undefined' ? localStorage.getItem('agap_location_pref') : null
    // Honor a skip only while permission is genuinely not granted; a stale
    // 'skipped' flag must not block refreshes after the user allowed access.
    if (!manual && userPref === 'skipped' && permState !== 'granted') {
      return cachedLocation.value
    }

    isLocating.value = true

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      isLocating.value = false
      if (manual) showToast(t('gps.gpsLockFailed'))
      return cachedLocation.value
    }

    // Routine refreshes run on a 60s background loop anyway — keep each attempt
    // short and let the next cycle retry; manual refreshes get more time.
    const pos = await acquirePosition(manual ? 12000 : 8000)

    if (pos && pos.pos) {
      const loc = buildLocationFromPosition(pos.pos, pos.lowAccuracy)
      await saveToCache(loc)
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('agap_location_pref', 'granted')
      }
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
    // Reconcile the persisted 'skipped' pref against real permission state,
    // same as initGPS/refreshLocation: a stale flag must not block tracking.
    getPermissionState().then((permState) => {
      // Re-check the guard after the async gap — another call may have started
      if (locationWatchId !== null) return
      const userPref = typeof localStorage !== 'undefined' ? localStorage.getItem('agap_location_pref') : null
      if (userPref === 'skipped' && permState !== 'granted') {
        return
      }
      registerLiveTrackingWatch()
    })
  }

  function registerLiveTrackingWatch() {
    if (locationWatchId !== null) return
    locationWatchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const currentPref = typeof localStorage !== 'undefined' ? localStorage.getItem('agap_location_pref') : null
        if (currentPref === 'skipped') {
          if (locationWatchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.clearWatch(locationWatchId)
            locationWatchId = null
          }
          return
        }
        // Discard only hopelessly coarse readings; usable-but-approximate fixes
        // are kept (flagged lowAccuracy) so the last-known location never goes dark.
        if (pos.coords.accuracy > MAX_USABLE_ACCURACY) return
        const isCoarse = pos.coords.accuracy > MAX_ACCEPTABLE_ACCURACY
        // Don't let a coarse reading clobber a recent, clearly better fix
        const prev = cachedLocation.value
        if (
          isCoarse &&
          prev &&
          !prev.isFallback &&
          !prev.lowAccuracy &&
          typeof prev.timestamp === 'number' &&
          Date.now() - prev.timestamp < 2 * 60 * 1000
        ) {
          return
        }
        const loc = buildLocationFromPosition(pos, isCoarse)
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

