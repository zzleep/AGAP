import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAdvisory } from '@/composables/useAdvisory'

export const useAdvisoryStore = defineStore('advisory', () => {
  // All relevant advisories for the area, sorted by severity (top first).
  const advisories = ref([])
  const isLoading = ref(false)
  const lastFetched = ref(Date.now())

  // The single most severe advisory — what the home card leads with.
  const currentAdvisory = computed(() => advisories.value[0] || null)

  const advisorySummary = computed(() => {
    // Only surface official PAGASA advisories in auto-trigger inputs — a derived
    // rainfall fallback would double-count the rainfall signal already present.
    if (currentAdvisory.value && !currentAdvisory.value.isDerived) {
      return `${currentAdvisory.value.severity.toUpperCase()} - ${currentAdvisory.value.headline} (PAGASA)`
    }
    return null
  })

  const fetchAdvisory = async () => {
    isLoading.value = true
    try {
      const { getAdvisoryData } = useAdvisory()
      const data = await getAdvisoryData()
      advisories.value = data || []
      lastFetched.value = Date.now()
    } catch (err) {
      console.warn('advisoryStore fetch error:', err)
    } finally {
      isLoading.value = false
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
