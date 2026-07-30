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
    if (!data || data.isFallback) return
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
      fetchedAt: Date.now(),
      isFallback: false
    }
  }

  function getFallbackWeather() {
    return {
      temp: 28,
      condition: 'Clouds',
      description: 'Weather data temporarily unavailable',
      rainfallRate: 0,
      humidity: 80,
      windSpeed: 10,
      location: 'Santa Rosa City, Laguna',
      icon: '02d',
      fetchedAt: Date.now(),
      isFallback: true
    }
  }

  async function getWeatherData() {
    loading.value = true
    error.value = null

    // 1. Check local storage cache first (only if valid & not a fallback)
    try {
      const localCached = localStorage.getItem('agap_weather_cache')
      if (localCached) {
        const parsed = JSON.parse(localCached)
        if (parsed.data && !parsed.data.isFallback && (Date.now() - parsed.timestamp < CACHE_TTL_MS)) {
          weatherData.value = parsed.data
          loading.value = false
          return parsed.data
        }
      }
    } catch (e) {
      console.warn('Weather local cache read error:', e)
    }

    // 2. Fetch live from OpenWeatherMap API
    if (typeof navigator !== 'undefined' && navigator.onLine && OWM_API_KEY) {
      const owmController = new AbortController()
      const owmTimeout = setTimeout(() => owmController.abort(), 10000)
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${SANTA_ROSA_LAT}&lon=${SANTA_ROSA_LON}&units=metric&appid=${OWM_API_KEY}`,
          { signal: owmController.signal }
        )
        if (res.ok) {
          const raw = await res.json()
          const formatted = formatOWMData(raw)

          saveLocalCache(formatted)

          // Async DB cache upsert (non-blocking)
          supabase.from('weather_cache').upsert({
            location_key: 'santa_rosa_city',
            data: formatted,
            cached_at: new Date().toISOString()
          }, { onConflict: 'location_key' }).then(() => {}).catch(err => {
            console.warn('Weather DB cache upsert warning:', err)
          })

          weatherData.value = formatted
          loading.value = false
          return formatted
        } else {
          console.warn('OpenWeatherMap API response not OK:', res.status)
        }
      } catch (owmErr) {
        if (owmErr.name === 'AbortError') {
          console.warn('OpenWeatherMap fetch timed out (10s)')
        } else {
          console.warn('OpenWeatherMap live fetch failed:', owmErr.message)
        }
      } finally {
        clearTimeout(owmTimeout)
      }
    }

    // 3. Fallback to Supabase DB cache
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const { data: dbCache, error: dbErr } = await supabase
          .from('weather_cache')
          .select('data, cached_at')
          .eq('location_key', 'santa_rosa_city')
          .maybeSingle()

        if (!dbErr && dbCache && dbCache.data && !dbCache.data.isFallback) {
          weatherData.value = dbCache.data
          saveLocalCache(dbCache.data)
          loading.value = false
          return dbCache.data
        }
      } catch (dbQueryErr) {
        console.warn('Weather DB cache lookup error:', dbQueryErr)
      }
    }

    // 4. Deterministic fallback (offline or all calls fail)
    loading.value = false
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
