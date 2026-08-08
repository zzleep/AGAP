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
const CACHE_SCHEMA_VERSION = 9
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
  // Diagnostic breadcrumbs for the ?diag=1 panel: which path the data came
  // from and, on a failed live fetch, exactly why (timeout/HTTP/network).
  const diag = ref({ source: null, error: null, detail: null, entryCount: 0, at: 0 })

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

  // One live-fetch attempt with a timeout; null on failure (timeout, network
  // error, or non-OK status). Kept separate so the fallback path can retry.
  const fetchLive = async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), NETWORK_CONFIG.pagasaFetchTimeout)
    try {
      const res = await fetch(PANAHON_URL, { signal: controller.signal })
      if (!res.ok) {
        console.warn('PANaHON CAP feed response not OK:', res.status)
        diag.value = { ...diag.value, error: `http ${res.status}`, detail: `feed returned status ${res.status}`, at: Date.now() }
        return null
      }
      diag.value = { ...diag.value, error: null, detail: null, at: Date.now() }
      return parseAdvisoryFeed(await res.json())
    } catch (err) {
      const detail = err.name === 'AbortError' ? `timed out after ${NETWORK_CONFIG.pagasaFetchTimeout}ms` : err.message
      if (err.name === 'AbortError') {
        console.warn('PANaHON CAP feed fetch timed out')
      } else {
        console.warn('PANaHON CAP feed fetch failed:', err.message)
      }
      diag.value = { ...diag.value, error: err.name === 'AbortError' ? 'timeout' : 'network', detail, at: Date.now() }
      return null
    } finally {
      clearTimeout(timeout)
    }
  }

  // Resolves to { entries, source }: entries is the advisory list (possibly
  // empty — a legitimate "no active advisory"), source tells callers whether
  // the result reflects the OFFICIAL state ('cache' hit or 'live' feed) or a
  // degraded 'derived' fallback. Callers gate freshness bookkeeping on it.
  const getAdvisoryData = async () => {
    loading.value = true
    error.value = null

    // 1. Local storage cache first (a valid hit short-circuits, including an empty list)
    const cached = readLocalCache()
    if (cached) {
      advisories.value = cached
      loading.value = false
      diag.value = { source: 'cache', error: null, detail: null, entryCount: cached.length, at: Date.now() }
      return { entries: cached, source: 'cache' }
    }

    // 2. Live fetch from the PAGASA PANaHON CAP feed
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      let entries = await fetchLive()
      // Mobile networks are flaky: one retry before giving up to the fallback,
      // so a transient stall doesn't swap the official advisory for a derived one.
      if (entries === null) entries = await fetchLive()
      if (entries) {
        saveLocalCache(entries)
        advisories.value = entries
        loading.value = false
        diag.value = { source: 'live', error: null, detail: null, entryCount: entries.length, at: Date.now() }
        return { entries, source: 'live' }
      }
    } else {
      diag.value = { ...diag.value, error: 'offline', detail: 'navigator.onLine was false — live fetch skipped', at: Date.now() }
    }

    // 3. Derived fallback from live rainfall (offline or fetch failed) — never cached
    const fallback = deriveFallbackList()
    advisories.value = fallback
    loading.value = false
    diag.value = { source: 'derived', error: diag.value.error ?? null, detail: diag.value.detail ?? null, entryCount: fallback.length, at: Date.now() }
    return { entries: fallback, source: 'derived' }
  }

  return {
    advisories,
    loading,
    error,
    diag,
    getAdvisoryData
  }
}
