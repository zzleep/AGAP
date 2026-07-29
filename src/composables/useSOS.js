import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase'
import { useSOSStore } from '@/stores/sosStore'
import { useConnectivityStore } from '@/stores/connectivityStore'
import { getCallbackNumber, getSOSDeviceHash } from './useGPS.js'
import { findNearestBarangay } from '@/data/barangay_coords'

export function useSOS() {
  const sosStore = useSOSStore()
  const connectivity = useConnectivityStore()

  /**
   * Pre-warms TCP/TLS connection to Supabase PostgREST endpoint
   * on initial app load to eliminate handshake latency during emergency SOS.
   */
  async function warmConnection() {
    if (connectivity.isPrewarmed) return
    try {
      // Pre-warm connection using configured client to avoid 401 console error
      await supabase.from('sos_reports').select('id').limit(1)
      connectivity.isPrewarmed = true
    } catch (err) {
      console.warn('TLS connection pre-warm ping failed:', err)
    }
  }

  /**
   * Dispatches emergency SOS payload to Supabase rest/v1/sos_reports via direct raw fetch
   * or iOS sendBeacon fallback.
   */
  async function dispatchSOS(coords) {
    sosStore.deliveryState = 'sending'
    const hash = sosStore.userHash || sosStore.initUserHash()

    // Concurrently fetch callback_number and sos_device_hash from IndexedDB/memory with non-blocking fallbacks
    const [retrievedCallbackNumber, retrievedDeviceHash] = await Promise.all([
      coords.callback_number !== undefined
        ? Promise.resolve(coords.callback_number)
        : getCallbackNumber().catch((err) => {
            console.warn('IndexedDB getCallbackNumber error in dispatchSOS:', err)
            return null
          }),
      coords.sos_device_hash !== undefined
        ? Promise.resolve(coords.sos_device_hash)
        : getSOSDeviceHash().catch((err) => {
            console.warn('IndexedDB getSOSDeviceHash error in dispatchSOS:', err)
            return null
          })
    ])

    const fallbackDeviceHash = crypto.randomUUID ? crypto.randomUUID() : 'dev_' + Date.now()
    const finalDeviceHash = retrievedDeviceHash || fallbackDeviceHash

    const payload = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      user_hash: hash,
      barangay: coords.barangay || findNearestBarangay(coords.latitude, coords.longitude),
      mode: connectivity.mode === 'online' ? 'online' : 'degraded_signal',
      callback_number: retrievedCallbackNumber ?? null,
      sos_device_hash: finalDeviceHash
    }
    const body = JSON.stringify(payload)
    const url = `${SUPABASE_URL}/rest/v1/sos_reports`

    const record = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'sos_' + Date.now(),
      ...payload,
      status: 'pending',
      created_at: new Date().toISOString()
    }
    sosStore.currentSOS = record
    sosStore.activeReports.unshift(record)

    // iOS Safari Fallback: sendBeacon (since Safari lacks BackgroundSync API support)
    if (typeof window !== 'undefined' && !('SyncManager' in window) && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const beaconUrl = `${url}?apikey=${SUPABASE_ANON_KEY}`
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon(beaconUrl, blob)
      // sendBeacon only confirms that the browser accepted the request, not that
      // CDRRMO received it. Keep the resident-facing state conservative.
      sosStore.deliveryState = 'queued'
      return record
    }

    // Direct REST fetch with Workbox BackgroundSync handling
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body
      })
      if (res.ok) {
        sosStore.deliveryState = 'sent'
      } else {
        console.warn(`SOS POST failed: ${res.status} ${res.statusText}`)
        sosStore.deliveryState = 'queued'
      }
    } catch (err) {
      sosStore.deliveryState = 'queued'
      console.warn('SOS POST request queued for offline sync:', err)
    }

    return record
  }

  return {
    warmConnection,
    dispatchSOS
  }
}
