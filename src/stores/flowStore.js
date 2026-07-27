import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFlowStore = defineStore('flow', () => {
  const rainfallRate = ref(12.5) // mm/hr
  const zoneSeverity = ref('warning') // 'watch' | 'warning' | 'danger'
  const activeRoute = ref(null)
  const floodZones = ref({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Tagapo River Channel', severity: 'warning' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[121.10, 14.31], [121.12, 14.31], [121.12, 14.32], [121.10, 14.32], [121.10, 14.31]]]
        }
      }
    ]
  })
  const lastUpdated = ref(Date.now())

  const mappedRiskLevel = computed(() => {
    if (rainfallRate.value < 7.5) return 'low'
    if (rainfallRate.value <= 15) return 'moderate'
    return 'high'
  })

  const secondsAgo = computed(() => Math.floor((Date.now() - lastUpdated.value) / 1000))

  function updateThresholds(rainfall) {
    rainfallRate.value = rainfall
    if (rainfall < 7.5) zoneSeverity.value = 'watch'
    else if (rainfall <= 15) zoneSeverity.value = 'warning'
    else zoneSeverity.value = 'danger'
    lastUpdated.value = Date.now()
  }

  function setActiveRoute(route) {
    activeRoute.value = route
  }

  return {
    rainfallRate,
    zoneSeverity,
    activeRoute,
    floodZones,
    lastUpdated,
    mappedRiskLevel,
    secondsAgo,
    updateThresholds,
    setActiveRoute
  }
})
