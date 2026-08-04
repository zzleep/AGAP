import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFlowStore } from '@/stores/flowStore'
import { supabase } from '@/lib/supabase'
import fallbackRoutes from '@/data/evac_routes.json'
import { getRiskColor, getBadgeBg } from '@/utils/risk'

export function useEvacRoutes({ map, mapboxgl }) {
  const { t } = useI18n()
  const flow = useFlowStore()
  const routesData = ref([])
  const routeSourceIds = []
  const routeLayerIds = []

  async function loadEvacRoutes() {
    // Use bundled data immediately for instant render on slow networks
    routesData.value = fallbackRoutes

    // Background-refresh from Supabase (non-blocking, updates map when data arrives)
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        const { data, error } = await supabase.from('evac_routes').select('*')
        if (!error && data && data.length > 0) {
          routesData.value = data
          renderRoutes()
        }
      }
    } catch (err) {
      console.warn('bundled routes already shown, supabase update failed:', err.message)
    }
  }

  function renderRoutes() {
    if (!map.value || !map.value.isStyleLoaded()) return

    clearRouteLayers()
    const activeLevel = flow.mappedRiskLevel
    const filtered = routesData.value.filter(r => r.risk_level === activeLevel)

    filtered.forEach(route => {
      const sourceId = `route-source-${route.id || route.name || route.barangay || routeLayerIds.length}`
      const layerId = `route-layer-${route.id || route.name || route.barangay || routeLayerIds.length}`
      const color = getRiskColor(route.risk_level)
      const featureCollection = normalizeRouteGeojson(route.geojson, route)

      map.value.addSource(sourceId, {
        type: 'geojson',
        data: featureCollection
      })

      map.value.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': color,
          'line-width': 5,
          'line-opacity': 0.9
        }
      })

      map.value.on('click', layerId, event => {
        const centerName = route.geojson?.properties?.center || t('evacMap.designatedEvacHub')
        const popupHtml = `
          <div class="p-1 text-slate-900">
            <h4 class="font-bold text-xs text-blue-900">${route.name}</h4>
            <p class="text-[11px] text-slate-700">${t('evacMap.barangay')} <strong>${route.barangay}</strong></p>
            <p class="text-[11px] text-slate-700">${t('evacMap.evacHub')} <strong>${centerName}</strong></p>
            <span class="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded text-white ${getBadgeBg(route.risk_level)}">
              ${t('evacMap.riskRoute', { risk: t('evacMap.' + route.risk_level) })}
            </span>
          </div>
        `

        new mapboxgl.value.Popup({ closeButton: true, closeOnClick: true })
          .setLngLat(event.lngLat)
          .setHTML(popupHtml)
          .addTo(map.value)
      })

      routeSourceIds.push(sourceId)
      routeLayerIds.push(layerId)
    })
  }

  function clearRouteLayers() {
    if (map.value && map.value.isStyleLoaded()) {
      while (routeLayerIds.length) {
        const layerId = routeLayerIds.pop()
        if (map.value.getLayer(layerId)) map.value.removeLayer(layerId)
      }

      while (routeSourceIds.length) {
        const sourceId = routeSourceIds.pop()
        if (map.value.getSource(sourceId)) map.value.removeSource(sourceId)
      }
    }
  }

  function normalizeRouteGeojson(geojson, route) {
    if (!geojson) {
      return {
        type: 'FeatureCollection',
        features: []
      }
    }

    if (geojson.type === 'FeatureCollection') {
      return geojson
    }

    if (geojson.type === 'Feature') {
      return geojson
    }

    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            name: route.name,
            barangay: route.barangay,
            center: route.geojson?.properties?.center
          },
          geometry: geojson
        }
      ]
    }
  }

  return { routesData, loadEvacRoutes, renderRoutes }
}