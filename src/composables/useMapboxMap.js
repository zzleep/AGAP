import { ref, shallowRef, nextTick } from 'vue'
import { useConnectivityStore } from '@/stores/connectivityStore'

export function useMapboxMap({ onMapReady }) {
  // Mapbox GL instances must NOT be deeply reactive: wrapping the map in a
  // reactive Proxy intercepts every internal property access during its render
  // loop and tanks frame rate. shallowRef tracks only the .value assignment.
  const map = shallowRef(null)
  const mapboxgl = shallowRef(null)
  const mapLoading = ref(true)
  const mapError = ref('')
  const isExpanded = ref(false)
  const mapWrapperEl = ref(null)
  const mapContainerEl = ref(null)
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || import.meta.env.VITE_MAPBOX_TOKEN || ''
  const connectivity = useConnectivityStore()
  const osmRasterStyle = {
    version: 8,
    sources: {
      'osm-raster-tiles': {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'osm-raster-layer',
        type: 'raster',
        source: 'osm-raster-tiles',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  }

  const SANTA_ROSA_CENTER = [121.1114, 14.3123]

  async function ensureMapboxGl() {
    if (mapboxgl.value) return mapboxgl.value
    mapLoading.value = true
    try {
      const [mapboxModule, workerModule] = await Promise.all([
        import('mapbox-gl'),
        import('mapbox-gl/dist/mapbox-gl-csp-worker?worker')
      ])
      mapboxgl.value = mapboxModule.default || mapboxModule
      mapboxgl.value.workerClass = workerModule.default || workerModule
      return mapboxgl.value
    } catch (err) {
      console.error('Failed to load mapbox-gl:', err)
      mapError.value = 'Map engine failed to load on this network. Please retry when connected to a faster network.'
      mapLoading.value = false
      throw err
    }
  }

  function initOsmMapInternal() {
    if (!mapContainerEl.value || map.value) return

    if (mapboxToken && typeof mapboxgl.value.setTelemetryEnabled === 'function') {
      mapboxgl.value.setTelemetryEnabled(false)
    }
    mapboxgl.value.accessToken = mapboxToken || ''
    try {
      map.value = new mapboxgl.value.Map({
        container: mapContainerEl.value,
        style: osmRasterStyle,
        center: SANTA_ROSA_CENTER,
        zoom: 15,
        minZoom: 12,
        maxZoom: 16
      })

      map.value.on('load', () => {
        mapLoading.value = false
        mapError.value = ''
        onMapReady()
      })

      requestAnimationFrame(() => { if (map.value) map.value.resize() })
      setTimeout(() => { if (map.value) map.value.resize() }, 50)
      setTimeout(() => { if (map.value) map.value.resize() }, 200)
      setTimeout(() => { if (map.value) map.value.resize() }, 500)
    } catch (err) {
      console.error('OSM map initialization error:', err)
      mapError.value = 'Failed to initialize map.'
      mapLoading.value = false
    }
  }

  async function initMap() {
    if (!mapContainerEl.value) return
    try {
      await ensureMapboxGl()

      // Emergency app: use OSM raster tiles on slow connections for instant render
      // Mapbox vector tiles add 5-15s load time on 3G/slow 4G which is unacceptable
      if (connectivity.isSlowConnection || !mapboxToken) {
        initOsmMapInternal()
        return
      }

      if (typeof mapboxgl.value.setTelemetryEnabled === 'function') {
        mapboxgl.value.setTelemetryEnabled(false)
      }

      mapboxgl.value.accessToken = mapboxToken

      map.value = new mapboxgl.value.Map({
        container: mapContainerEl.value,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: SANTA_ROSA_CENTER,
        zoom: 15,
        minZoom: 12,
        maxZoom: 16
      })

      let styleFailedOver = false

      map.value.on('error', (e) => {
        console.warn('Mapbox GL runtime notice:', e)
        if (!styleFailedOver && e?.error?.message?.includes('style')) {
          styleFailedOver = true
          console.warn('Mapbox GL: Vector style unreachable, applying Mapbox GL raster failover style.')
          map.value.setStyle(osmRasterStyle)
        }
      })

      map.value.on('load', () => {
        mapLoading.value = false
        mapError.value = ''
        onMapReady()
      })

      requestAnimationFrame(() => { if (map.value) map.value.resize() })
      setTimeout(() => { if (map.value) map.value.resize() }, 50)
      setTimeout(() => { if (map.value) map.value.resize() }, 200)
      setTimeout(() => { if (map.value) map.value.resize() }, 500)
    } catch (err) {
      console.error('Mapbox GL initialization error:', err)
      // Only attempt OSM fallback if mapboxgl loaded successfully but the map init threw
      if (!map.value && mapboxgl.value) initOsmMapInternal()
      mapLoading.value = false
    }
  }

  function handleViewportResize() {
    nextTick(() => {
      if (map.value) {
        map.value.resize()
        setTimeout(() => { if (map.value) map.value.resize() }, 50)
        setTimeout(() => { if (map.value) map.value.resize() }, 150)
        setTimeout(() => { if (map.value) map.value.resize() }, 300)
        setTimeout(() => { if (map.value) map.value.resize() }, 500)
      }
    })
  }

  function recenterMap(loc) {
    if (!map.value) return
    if (loc && typeof loc.longitude === 'number' && typeof loc.latitude === 'number') {
      map.value.easeTo({
        center: [loc.longitude, loc.latitude],
        zoom: 15,
        duration: 700
      })
    } else {
      map.value.easeTo({ center: SANTA_ROSA_CENTER, zoom: 13, duration: 700 })
    }
  }

  async function toggleExpand() {
    const wrapper = mapWrapperEl.value

    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }

    if (wrapper && typeof wrapper.requestFullscreen === 'function') {
      try {
        await wrapper.requestFullscreen()
        document.body.classList.add('overflow-hidden')
        return
      } catch (err) {
        console.warn('Fullscreen request failed, using overlay fallback:', err)
      }
    }

    isExpanded.value = !isExpanded.value
    document.body.classList.toggle('overflow-hidden', isExpanded.value)
    await nextTick()
    handleViewportResize()
  }

  function handleKeydown(event) {
    if (event.key !== 'Escape' || !isExpanded.value) return

    isExpanded.value = false
    document.body.classList.remove('overflow-hidden')
    nextTick(() => {
      handleViewportResize()
    })
  }

  function handleFullscreenChange() {
    const wrapper = mapWrapperEl.value
    isExpanded.value = document.fullscreenElement === wrapper
    document.body.classList.toggle('overflow-hidden', isExpanded.value)
    nextTick(() => {
      handleViewportResize()
    })
  }

  function mount() {
    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('resize', handleViewportResize)
    window.addEventListener('orientationchange', handleViewportResize)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
  }

  function cleanup() {
    if (map.value && typeof map.value.remove === 'function') map.value.remove()
    window.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('resize', handleViewportResize)
    window.removeEventListener('orientationchange', handleViewportResize)
    document.removeEventListener('fullscreenchange', handleFullscreenChange)

    // Reset expansion state and restore body scrolling so a later mount
    // doesn't inherit stale fullscreen/overlay state.
    if (isExpanded.value) {
      isExpanded.value = false
      if (typeof document !== 'undefined' && document.body && document.body.classList) {
        document.body.classList.remove('overflow-hidden')
      }
    }

    map.value = null
  }

  return { map, mapboxgl, mapLoading, mapError, isExpanded, mapWrapperEl, mapContainerEl, mapboxToken, initMap, handleViewportResize, recenterMap, toggleExpand, mount, cleanup }
}
