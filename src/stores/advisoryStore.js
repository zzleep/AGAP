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
  // Requests currently in flight — a degraded result must not fill the store
  // while an earlier request is still running, because that one may yet
  // deliver an official response.
  let pendingFetches = 0

  const fetchAdvisory = async () => {
    // Overlapping HomeView requests can resolve out of order. The rules keep
    // the store on the best data:
    //  1. AUTHORITATIVE (cache/live) always beats DEGRADED (derived) — an
    //     official response from an earlier request must not be discarded
    //     just because a later request only got fallback data.
    //  2. Within the same class, only the LATEST request may commit — an
    //     older official snapshot landing late must not revert a newer one.
    //  3. Degraded results never render while any earlier request is still
    //     in flight (it may deliver official data) or while the store is
    //     already showing fresh official data.
    const seq = ++fetchSeq
    pendingFetches++
    isLoading.value = true
    try {
      const result = await getAdvisoryData()
      const source = result?.source ?? 'derived'
      const authoritative = source === 'cache' || source === 'live'
      const isLatest = seq === fetchSeq
      // Fresh authoritative data already in the store (see lastFetched) —
      // nothing below may overwrite it.
      const storeIsAuthoritative =
        lastFetched.value !== 0 && Date.now() - lastFetched.value < AUTHORITATIVE_FRESH_MS

      if (!authoritative) {
        if (storeIsAuthoritative || !isLatest || pendingFetches > 1) return
        advisories.value = result?.entries || []
        return
      }

      // Authoritative: yield to a NEWER authoritative result, but still win
      // over a degraded/empty store (official data arriving late must land).
      if (!isLatest && storeIsAuthoritative) return
      advisories.value = result?.entries || []
      // Only authoritative results prove the official state (see lastFetched).
      lastFetched.value = Date.now()
    } catch (err) {
      console.warn('advisoryStore fetch error:', err)
    } finally {
      pendingFetches--
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
