import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase'
import { useSOSStore } from '@/stores/sosStore'
import { useConnectivityStore } from '@/stores/connectivityStore'
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
      await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY
        }
      })
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
    const payload = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      user_hash: hash,
      barangay: coords.barangay || findNearestBarangay(coords.latitude, coords.longitude),
      mode: connectivity.mode === 'online' ? 'online' : 'degraded_signal'
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
      const queued = navigator.sendBeacon(beaconUrl, blob)
      if (queued) {
        sosStore.deliveryState = 'sent'
      } else {
        sosStore.deliveryState = 'queued'
      }
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
