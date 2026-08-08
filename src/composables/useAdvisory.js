import { ref } from 'vue'
import { NETWORK_CONFIG } from '@/lib/networkConfig'
import { parseAdvisoryFeed, deriveAdvisoryFromRainfall } from '@/lib/advisoryFeed'
import { useWeatherStore } from '@/stores/weatherStore'

const PANAHON_URL = 'https://cdn.panahon.gov.ph/api/v1/cap-alerts'
const CACHE_KEY = 'agap_advisory_cache'
// Bump when the cached shape changes (added/removed fields, list vs single):
// stale entries from an older schema are treated as cache misses instead of
// being shown with missing fields (e.g. a missing localSeverity falling back
// to the Luzon-wide severity, or unformatted message text).
const CACHE_SCHEMA_VERSION = 7
const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes TTL
// Rainfall is only meaningful for derivation while fresh — before the first
// successful weather fetch, rainfallRate is a placeholder (12.5) that would
// fabricate a false warning if used for a derived advisory.
const WEATHER_FRESH_MS = 15 * 60 * 1000

export function useAdvisory() {
  // All relevant advisories for the area, sorted by severity (top first).
  // An empty array is a legitimate state — "no active advisory".
  const advisories = ref([])
  const loading = ref(false)
  const error = ref(null)

  const readLocalCache = () => {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed.timestamp !== 'number') return null
      if (parsed.schema !== CACHE_SCHEMA_VERSION) return null
      if (Date.now() - parsed.timestamp >= CACHE_TTL_MS) return null
      const { data } = parsed
      if (!data || !Array.isArray(data.list)) return null
      return data.list
    } catch (e) {
      console.warn('Advisory local cache read error:', e)
      return null
    }
  }

  const saveLocalCache = (entries) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        schema: CACHE_SCHEMA_VERSION,
        timestamp: Date.now(),
        data: { list: entries || [] }
      }))
    } catch (e) {
      console.warn('Advisory local cache save error:', e)
    }
  }

  const deriveFallbackList = () => {
    const weatherStore = useWeatherStore()
    // No real rainfall yet (cold cache / failed weather fetch): deriving from
    // the placeholder rate would invent a warning, so show no advisory instead.
    if (!weatherStore.lastFetched || Date.now() - weatherStore.lastFetched > WEATHER_FRESH_MS) return []
    const rate = Number(weatherStore.rainfallRate)
    const derived = deriveAdvisoryFromRainfall(Number.isFinite(rate) ? rate : 0)
    return derived ? [derived] : []
  }

  const getAdvisoryData = async () => {
    loading.value = true
    error.value = null

    // 1. Local storage cache first (a valid hit short-circuits, including an empty list)
    const cached = readLocalCache()
    if (cached) {
      advisories.value = cached
      loading.value = false
      return cached
    }

    // 2. Live fetch from the PAGASA PANaHON CAP feed
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), NETWORK_CONFIG.pagasaFetchTimeout)
      try {
        const res = await fetch(PANAHON_URL, { signal: controller.signal })
        if (res.ok) {
          const entries = parseAdvisoryFeed(await res.json())
          saveLocalCache(entries)
          advisories.value = entries
          loading.value = false
          return entries
        }
        console.warn('PANaHON CAP feed response not OK:', res.status)
      } catch (err) {
        if (err.name === 'AbortError') {
          console.warn('PANaHON CAP feed fetch timed out')
        } else {
          console.warn('PANaHON CAP feed fetch failed:', err.message)
        }
      } finally {
        clearTimeout(timeout)
      }
    }

    // 3. Derived fallback from live rainfall (offline or fetch failed) — never cached
    const fallback = deriveFallbackList()
    advisories.value = fallback
    loading.value = false
    return fallback
  }

  return {
    advisories,
    loading,
    error,
    getAdvisoryData
  }
}
