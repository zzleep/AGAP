import { ref } from 'vue'
import santaRosaBoundaries from '@/data/santa_rosa_boundaries.json'
import highRiskData from '@/data/high_risk.json'
import modRiskData from '@/data/mod.json'
import lowRiskData from '@/data/low.json'

export function useRiskZones({ map, mapboxgl }) {
  function getShowFloodZones() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return true
    try {
      return JSON.parse(localStorage.getItem('agap_show_flood_zones') ?? 'true')
    } catch {
      return true
    }
  }
  const showFloodZones = ref(getShowFloodZones())

  const RISK_ZONE_LAYER_IDS = [
    'risk-zone-base-fill',
    'risk-zone-high-fill', 'risk-zone-high-outline',
    'risk-zone-moderate-fill', 'risk-zone-moderate-outline',
    'risk-zone-low-fill', 'risk-zone-low-outline'
  ]
  let riskZoneHandlersAttached = false

  function addBoundaryLayer() {
    if (!map.value || !map.value.isStyleLoaded() || map.value.getSource('santa-rosa-boundary')) return

    map.value.addSource('santa-rosa-boundary', {
      type: 'geojson',
      data: santaRosaBoundaries
    })

    map.value.addLayer({
      id: 'santa-rosa-boundary-fill',
      type: 'fill',
      source: 'santa-rosa-boundary',
      paint: {
        'fill-color': '#94a3b8',
        'fill-opacity': 0.16
      }
    })

    map.value.addLayer({
      id: 'santa-rosa-boundary-line',
      type: 'line',
      source: 'santa-rosa-boundary',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 2,
        'line-dasharray': [4, 4]
      }
    })
  }

  function renderRiskZones() {
    if (!map.value) return

    // Style may be mid-transition (e.g. OSM fallback via setStyle).
    // Defer silently until the render loop picks up the new style.
    if (!map.value.isStyleLoaded()) {
      requestAnimationFrame(() => renderRiskZones())
      return
    }

    try {
      // Clean up previous layers/sources
      RISK_ZONE_LAYER_IDS.forEach(id => { if (map.value.getLayer(id)) map.value.removeLayer(id) })
      if (map.value.getSource('risk-zones')) map.value.removeSource('risk-zones')

      // Base fill: cover the entire city boundary so gaps between risk zones
      // don't show bare map tiles. Sits beneath all risk zone layers.
      if (map.value.getSource('santa-rosa-boundary')) {
        map.value.addLayer({
          id: 'risk-zone-base-fill',
          type: 'fill',
          source: 'santa-rosa-boundary',
          paint: {
            'fill-color': '#e4ece4',
            'fill-opacity': 0.35
          }
        })
      }

      // Convert LineString → Polygon by closing the ring.
      // The source data was stored as unclosed LineStrings but represents
      // risk zone boundaries that should render as filled polygons.
      function toPolygonFeature(feature) {
        const t = feature.geometry.type
        if (t === 'Polygon' || t === 'MultiPolygon') return feature
        if (t === 'LineString') {
          const coords = feature.geometry.coordinates
          const ring = [...coords]
          const first = ring[0]
          const last = ring[ring.length - 1]
          if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first])
          return { ...feature, geometry: { type: 'Polygon', coordinates: [ring] } }
        }
        return null // skip unknown types
      }

      // Merge all risk data into one FeatureCollection with risk_level property
      // Guard toPolygonFeature result before spreading — it may return null
      function enrichFeature(f, riskLevel) {
        const poly = toPolygonFeature(f)
        return poly ? { ...poly, properties: { ...f.properties, risk_level: riskLevel } } : null
      }
      const mergedFeatures = [
        ...highRiskData.features.map(f => enrichFeature(f, 'high')),
        ...modRiskData.features.map(f => enrichFeature(f, 'moderate')),
        ...lowRiskData.features.map(f => enrichFeature(f, 'low'))
      ].filter(Boolean)

      const mergedCollection = { type: 'FeatureCollection', features: mergedFeatures }

      map.value.addSource('risk-zones', { type: 'geojson', data: mergedCollection })

      // Render in priority order: low → moderate → high (high on top).
      // Higher risk levels visually dominate overlap areas.
      const levels = [
        { id: 'low',      color: '#556B2F', opacity: 0.35 },
        { id: 'moderate', color: '#D14D3E', opacity: 0.40 },
        { id: 'high',     color: '#902715', opacity: 0.50 }
      ]

      levels.forEach(({ id, color, opacity }) => {
        const fillId = `risk-zone-${id}-fill`
        const outlineId = `risk-zone-${id}-outline`

        map.value.addLayer({
          id: fillId,
          type: 'fill',
          source: 'risk-zones',
          filter: ['==', ['get', 'risk_level'], id],
          paint: { 'fill-color': color, 'fill-opacity': opacity }
        })

        map.value.addLayer({
          id: outlineId,
          type: 'line',
          source: 'risk-zones',
          filter: ['==', ['get', 'risk_level'], id],
          paint: { 'line-color': color, 'line-width': 1.5, 'line-opacity': 0.7 }
        })
      })

      // Apply persisted visibility state from localStorage
      if (!showFloodZones.value) {
        RISK_ZONE_LAYER_IDS.forEach(id => {
          if (map.value.getLayer(id)) map.value.setLayoutProperty(id, 'visibility', 'none')
        })
      }

      // Click handler on each fill layer (attached once — re-runs of renderRiskZones
      // remove and re-add layers but must not stack duplicate listeners).
      if (!riskZoneHandlersAttached) {
        const labelMap = { high: 'High Risk', moderate: 'Moderate Risk', low: 'Low Risk' }
        levels.forEach(({ id, color }) => {
          const fillId = `risk-zone-${id}-fill`
          map.value.on('click', fillId, event => {
            const popupHtml = `
              <div class="p-1 text-slate-900">
                <h4 class="font-bold text-xs" style="color:${color}">${labelMap[id]}</h4>
                <p class="text-[11px] text-slate-600 mt-0.5">Santa Rosa risk zone</p>
              </div>
            `
            new mapboxgl.value.Popup({ closeButton: true, closeOnClick: true })
              .setLngLat(event.lngLat)
              .setHTML(popupHtml)
              .addTo(map.value)
          })
        })
        riskZoneHandlersAttached = true
      }

      console.log('Risk zones rendered successfully (merged, priority-ordered)')
    } catch (err) {
      console.error('Risk zone rendering failed:', err)
    }
  }

  function toggleFloodZones() {
    showFloodZones.value = !showFloodZones.value
    localStorage.setItem('agap_show_flood_zones', JSON.stringify(showFloodZones.value))
    if (!map.value || !map.value.isStyleLoaded()) return

    const visibility = showFloodZones.value ? 'visible' : 'none'
    RISK_ZONE_LAYER_IDS.forEach(id => {
      if (map.value.getLayer(id)) map.value.setLayoutProperty(id, 'visibility', visibility)
    })
  }

  return { showFloodZones, addBoundaryLayer, renderRiskZones, toggleFloodZones }
}