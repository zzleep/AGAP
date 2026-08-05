import { ref } from 'vue'
import { useFlowStore } from '@/stores/flowStore'
import { NETWORK_CONFIG } from '@/lib/networkConfig'
import { getDistanceToRouteKm } from '@/utils/geo'

export function useEvacRouteLine({ map, mapboxgl, mapboxToken, userLocation, nearestEvacCenter, lastAutopilotReason, routeReason }) {
  const flow = useFlowStore()
  const nearestEvacRouteInfo = ref(null)
  const activeRouteCoordinates = ref([])
  const evacRouteSourceId = 'evac-user-route'
  const evacRouteLayerId = 'evac-user-route-line'
  const evacRouteFallbackLayerId = 'evac-user-route-fallback'
  let evacRouteAbortController = null

  async function renderEvacRouteLine(options = {}) {
    if (!userLocation.value || !nearestEvacCenter.value) return

    clearEvacRouteLine()
    addUserLocationPoint()

    if (evacRouteAbortController) evacRouteAbortController.abort()
    evacRouteAbortController = new AbortController()
    // 10s timeout prevents hanging on slow 3G networks
    const mapboxRouteTimeout = setTimeout(() => evacRouteAbortController.abort(), NETWORK_CONFIG.mapboxDirectionsTimeout)

    const origin = `${userLocation.value.longitude},${userLocation.value.latitude}`
    const destination = `${nearestEvacCenter.value.coords.longitude},${nearestEvacCenter.value.coords.latitude}`

    if (options?.avoidIncidents && Array.isArray(options.incidents) && options.incidents.length > 0) {
      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/walking/${origin};${destination}?geometries=geojson&overview=full&steps=false&alternatives=true&access_token=${encodeURIComponent(mapboxToken)}`
      try {
        const response = await fetch(directionsUrl, { signal: evacRouteAbortController.signal })
        if (!response.ok) throw new Error(`Directions request failed (${response.status})`)

        const payload = await response.json()
        const routes = payload?.routes || []
        if (routes.length > 0) {
          const scored = routes.map(r => {
            const coords = r.geometry?.coordinates || []
            let minDist = Infinity
            for (const inc of options.incidents) {
              if (inc.latitude == null || inc.longitude == null) continue
              const d = getDistanceToRouteKm(inc.latitude, inc.longitude, coords)
              if (d < minDist) minDist = d
            }
            return { route: r, minDist }
          })

          scored.sort((a, b) => {
            if (b.minDist === a.minDist) return (a.route.distance || 0) - (b.route.distance || 0)
            return b.minDist - a.minDist
          })

          const chosen = scored[0].route
          nearestEvacRouteInfo.value = {
            distanceKm: chosen.distance / 1000,
            durationMinutes: chosen.duration / 60
          }

          routeReason.value = 'Route updated to avoid nearby anonymous incident.'

          addRouteLine({
            type: 'Feature',
            properties: {
              name: nearestEvacCenter.value.name,
              kind: 'nearest-evac-route'
            },
            geometry: chosen.geometry
          })

          return
        }
      } catch (err) {
        console.warn('Safe-route selection via alternatives failed, falling back:', err)
        // continue to fallback below
      }
    }

    // Default: request single best route (Map Matching / Directions fallback)
    const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/walking/${origin};${destination}?geometries=geojson&overview=full&steps=false&access_token=${encodeURIComponent(mapboxToken)}`

    try {
      const response = await fetch(directionsUrl, { signal: evacRouteAbortController.signal })
      if (!response.ok) throw new Error(`Directions request failed (${response.status})`)

      const payload = await response.json()
      const route = payload?.routes?.[0]
      if (!route?.geometry?.coordinates?.length) throw new Error('No route returned by Mapbox Directions')

      nearestEvacRouteInfo.value = {
        distanceKm: route.distance / 1000,
        durationMinutes: route.duration / 60
      }

      if (lastAutopilotReason.value === 'reports') {
        routeReason.value = `Route updated: nearby community incidents increased in ${userLocation.value.barangay || 'your area'}.`
      } else if (lastAutopilotReason.value === 'weather') {
        routeReason.value = `Route updated for ${flow.mappedRiskLevel} weather risk.`
      }

      addRouteLine({
        type: 'Feature',
        properties: {
          name: nearestEvacCenter.value.name,
          kind: 'nearest-evac-route'
        },
        geometry: route.geometry
      })
    } catch (err) {
      if (err?.name === 'AbortError') {
        console.warn('Mapbox Directions timed out on slow network, using fallback route')
      } else {
        console.warn('Using fallback evacuation route line:', err)
      }
      nearestEvacRouteInfo.value = null
      routeReason.value = 'Road route unavailable; using direct fallback path.'
      addRouteLine({
        type: 'Feature',
        properties: {
          name: nearestEvacCenter.value.name,
          kind: 'nearest-evac-route-fallback'
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [userLocation.value.longitude, userLocation.value.latitude],
            [nearestEvacCenter.value.coords.longitude, nearestEvacCenter.value.coords.latitude]
          ]
        }
      }, true)
    } finally {
      clearTimeout(mapboxRouteTimeout)
    }
  }

  function addRouteLine(feature, useFallback = false) {
    activeRouteCoordinates.value = feature?.geometry?.type === 'LineString'
      ? (feature.geometry.coordinates || [])
      : []

    if (map.value && map.value.isStyleLoaded()) {
      if (map.value.getLayer(evacRouteLayerId)) map.value.removeLayer(evacRouteLayerId)
      if (map.value.getLayer(evacRouteFallbackLayerId)) map.value.removeLayer(evacRouteFallbackLayerId)
      if (map.value.getSource(evacRouteSourceId)) map.value.removeSource(evacRouteSourceId)

      map.value.addSource(evacRouteSourceId, {
        type: 'geojson',
        data: feature
      })

      map.value.addLayer({
        id: useFallback ? evacRouteFallbackLayerId : evacRouteLayerId,
        type: 'line',
        source: evacRouteSourceId,
        paint: {
          'line-color': '#902715',
          'line-width': useFallback ? 3 : 5,
          'line-opacity': 0.95,
          ...(useFallback ? { 'line-dasharray': [2, 2] } : {})
        }
      })
    }
  }

  function addUserLocationPoint() {
    if (!userLocation.value) return

    if (map.value && map.value.isStyleLoaded()) {
      if (map.value.getLayer('user-location-point')) map.value.removeLayer('user-location-point')
      if (map.value.getSource('user-location-point')) map.value.removeSource('user-location-point')

      map.value.addSource('user-location-point', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: { name: 'Current Location' },
          geometry: {
            type: 'Point',
            coordinates: [userLocation.value.longitude, userLocation.value.latitude]
          }
        }
      })

      map.value.addLayer({
        id: 'user-location-point',
        type: 'circle',
        source: 'user-location-point',
        paint: {
          'circle-color': '#1d4ed8',
          'circle-radius': 7,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff'
        }
      })
    }
  }

  function clearEvacRouteLine() {
    activeRouteCoordinates.value = []

    if (map.value && map.value.isStyleLoaded()) {
      if (map.value.getLayer('user-location-point')) map.value.removeLayer('user-location-point')
      if (map.value.getSource('user-location-point')) map.value.removeSource('user-location-point')

      if (map.value.getLayer(evacRouteLayerId)) map.value.removeLayer(evacRouteLayerId)
      if (map.value.getLayer(evacRouteFallbackLayerId)) map.value.removeLayer(evacRouteFallbackLayerId)
      if (map.value.getSource(evacRouteSourceId)) map.value.removeSource(evacRouteSourceId)
    }
  }

  function dispose() {
    if (evacRouteAbortController) evacRouteAbortController.abort()
    clearEvacRouteLine()
  }

  return { nearestEvacRouteInfo, activeRouteCoordinates, renderEvacRouteLine, clearEvacRouteLine, dispose }
}