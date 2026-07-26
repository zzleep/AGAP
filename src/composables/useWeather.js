import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

const OWM_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || ''
const SANTA_ROSA_LAT = 14.3123
const SANTA_ROSA_LON = 121.1114
const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes TTL

export function useWeather() {
  const weatherData = ref(null)
  const loading = ref(false)
  const error = ref(null)

  function saveLocalCache(data) {
    try {
      localStorage.setItem('agap_weather_cache', JSON.stringify({
        timestamp: Date.now(),
        data
      }))
    } catch (e) {
      console.warn('localStorage save weather cache failed:', e)
    }
  }

  function formatOWMData(raw) {
    const rainfall = raw.rain ? (raw.rain['1h'] || raw.rain['3h'] || 0) : 0
    return {
      temp: Math.round(raw.main.temp),
      condition: raw.weather[0]?.main || 'Clear',
      description: raw.weather[0]?.description || '',
      rainfallRate: parseFloat(rainfall.toFixed(1)),
      humidity: raw.main.humidity,
      windSpeed: Math.round(raw.wind.speed * 3.6), // m/s to km/h
      location: 'Santa Rosa City, Laguna',
      icon: raw.weather[0]?.icon || '01d',
      fetchedAt: Date.now()
    }
  }

  function getFallbackWeather() {
    return {
      temp: 28,
      condition: 'Thunderstorm',
      description: 'Moderate to heavy rain showers',
      rainfallRate: 12.5,
      humidity: 88,
      windSpeed: 24,
      location: 'Santa Rosa City, Laguna',
      icon: '11d',
      fetchedAt: Date.now()
    }
  }

  async function getWeatherData() {
    loading.value = true
    error.value = null

    try {
      // 1. Check local storage cache first
      const localCached = localStorage.getItem('agap_weather_cache')
      if (localCached) {
        const parsed = JSON.parse(localCached)
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          weatherData.value = parsed.data
          loading.value = false
          return parsed.data
        }
      }

      // 2. Check Supabase weather_cache DB table if online
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        const { data: dbCache } = await supabase
          .from('weather_cache')
          .select('data, cached_at')
          .eq('location_key', 'santa_rosa_city')
          .single()

        if (dbCache && (Date.now() - new Date(dbCache.cached_at).getTime() < CACHE_TTL_MS)) {
          weatherData.value = dbCache.data
          saveLocalCache(dbCache.data)
          loading.value = false
          return dbCache.data
        }
      }

      // 3. Fetch live from OpenWeatherMap API if online and API key available
      if (typeof navigator !== 'undefined' && navigator.onLine && OWM_API_KEY) {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${SANTA_ROSA_LAT}&lon=${SANTA_ROSA_LON}&units=metric&appid=${OWM_API_KEY}`
        )
        if (res.ok) {
          const raw = await res.json()
          const formatted = formatOWMData(raw)

          // Save to Supabase weather_cache (upsert)
          try {
            await supabase.from('weather_cache').upsert({
              location_key: 'santa_rosa_city',
              data: formatted,
              cached_at: new Date().toISOString()
            }, { onConflict: 'location_key' })
          } catch (dbErr) {
            console.warn('Weather DB cache upsert warning:', dbErr)
          }

          weatherData.value = formatted
          saveLocalCache(formatted)
          loading.value = false
          return formatted
        }
      }
    } catch (err) {
      console.warn('Weather fetch fallback triggered:', err.message)
      error.value = err.message
    } finally {
      loading.value = false
    }

    // 4. Fallback weather
    const fallback = getFallbackWeather()
    weatherData.value = fallback
    return fallback
  }

  return {
    weatherData,
    loading,
    error,
    getWeatherData
  }
}
