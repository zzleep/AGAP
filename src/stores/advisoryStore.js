import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAdvisory } from '@/composables/useAdvisory'

// How long an authoritative result keeps the store's data "current". Mirrors
// the composable's cache TTL; beyond this, a degraded fallback may fill in.
const AUTHORITATIVE_FRESH_MS = 15 * 60 * 1000

export const useAdvisoryStore = defineStore('advisory', () => {
  // All relevant advisories for the area, sorted by severity (top first).
  const advisories = ref([])
  const isLoading = ref(false)
  // 0 = never fetched — callers can distinguish "no data yet" from
  // "fetched and found no active advisory". Advanced ONLY on authoritative
  // results (cache hit or live feed), so a degraded fetch never looks fresh.
  const lastFetched = ref(0)

  // The single most severe advisory — what the home card leads with.
  const currentAdvisory = computed(() => advisories.value[0] || null)

  const advisorySummary = computed(() => {
    // Only surface official PAGASA advisories in auto-trigger inputs — a derived
    // rainfall fallback would double-count the rainfall signal already present.
    if (currentAdvisory.value && !currentAdvisory.value.isDerived) {
      // Report the LOCAL level (what the configured area faces) — the regional
      // severity can be higher elsewhere in Luzon and would overstate the alert.
      return `${currentAdvisory.value.localSeverity.toUpperCase()} - ${currentAdvisory.value.headline} (PAGASA)`
    }
    return null
  })

  // Single composable instance for the whole store lifetime — the fetch logic
  // is stateless (the store owns advisories/isLoading), so creating a new
  // instance per call would only redo setup work.
  const { getAdvisoryData } = useAdvisory()

  // Monotonic request counter: overlapping fetchAdvisory calls (HomeView
  // fetches on mount AND again once weather resolves) can resolve out of
  // order — a request that STARTED earlier may FINISH later and carry an older
  // feed snapshot. Only the latest issued request may commit state.
  let fetchSeq = 0

  const fetchAdvisory = async () => {
    // Stale results (a newer request superseded this one) must not commit:
    // an older official snapshot landing late would revert the card and the
    // Aegis weather context to a superseded state.
    const seq = ++fetchSeq
    isLoading.value = true
    try {
      const result = await getAdvisoryData()
      if (seq !== fetchSeq) return
      const source = result?.source ?? 'derived'
      const authoritative = source === 'cache' || source === 'live'
      // A degraded result that lands after an authoritative one must not
      // clobber it — Aegis and the card would keep reading the degraded
      // state even though the store is fresh.
      const storeIsFresh = lastFetched.value !== 0 && Date.now() - lastFetched.value < AUTHORITATIVE_FRESH_MS
      if (!authoritative && storeIsFresh) return
      advisories.value = result?.entries || []
      // Only authoritative results prove the official state (see lastFetched).
      if (authoritative) lastFetched.value = Date.now()
    } catch (err) {
      console.warn('advisoryStore fetch error:', err)
    } finally {
      // The flag belongs to the latest request only — an older request
      // finishing later must not clear it while the newer one still runs.
      if (seq === fetchSeq) isLoading.value = false
    }
  }

  return {
    advisories,
    currentAdvisory,
    isLoading,
    lastFetched,
    advisorySummary,
    fetchAdvisory
  }
})
