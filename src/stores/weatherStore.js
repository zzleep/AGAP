import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useWeather } from '@/composables/useWeather'
import { useFlowStore } from '@/stores/flowStore'

export const useWeatherStore = defineStore('weather', () => {
  const currentWeather = ref({
    temp: 28,
    condition: 'Thunderstorm',
    description: 'Moderate to heavy rain showers',
    rainfallRate: 12.5,
    humidity: 88,
    windSpeed: 24,
    location: 'Santa Rosa City, Laguna'
  })
  const rainfallRate = ref(12.5)
  const lastFetched = ref(Date.now())
  const isLoading = ref(false)

  const riskCategory = computed(() => {
    if (rainfallRate.value < 7.5) return 'watch'
    if (rainfallRate.value <= 15) return 'warning'
    return 'danger'
  })

  const riskBadgeClass = computed(() => {
    switch (riskCategory.value) {
      case 'watch': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
      case 'warning': return 'bg-orange-500/20 text-orange-400 border-orange-500/40'
      case 'danger': return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
      default: return 'bg-slate-700 text-slate-300'
    }
  })

  async function fetchWeather() {
    isLoading.value = true
    try {
      const { getWeatherData } = useWeather()
      const data = await getWeatherData()
      if (data) {
        currentWeather.value = data
        rainfallRate.value = data.rainfallRate
        lastFetched.value = data.fetchedAt || Date.now()

        // Sync with Flow Engine risk thresholds
        const flowStore = useFlowStore()
        flowStore.updateThresholds(data.rainfallRate)
      }
    } catch (err) {
      console.warn('weatherStore fetch error:', err)
    } finally {
      isLoading.value = false
    }
  }

  return {
    currentWeather,
    rainfallRate,
    lastFetched,
    isLoading,
    riskCategory,
    riskBadgeClass,
    fetchWeather
  }
})
