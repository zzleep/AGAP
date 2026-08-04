import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { BARANGAY_COORDS } from '@/data/barangay_coords'
import { getDistanceKm, getDistanceToRouteKm, normalizeBarangayName } from '@/utils/geo'
import { getIncidentMarkerColor } from '@/utils/risk'

export function useIncidents({ map, mapboxgl, userLocation, activeRouteCoordinates }) {
  const nearbyIncidentCount = ref(0)
  const incidentMarkers = []
  const routeIncidentCorridorKm = 0.6

  function clearIncidentMarkers() {
    while (incidentMarkers.length) {
      const marker = incidentMarkers.pop()
      marker.remove()
    }
  }

  function resolveIncidentCoordinates(report) {
    const directLat = typeof report.latitude === 'number' ? report.latitude : null
    const directLng = typeof report.longitude === 'number' ? report.longitude : null
    if (directLat !== null && directLng !== null) {
      return { latitude: directLat, longitude: directLng }
    }

    const matchByBarangay = BARANGAY_COORDS[report.barangay]
    if (matchByBarangay) {
      return { latitude: matchByBarangay.lat, longitude: matchByBarangay.lng }
    }

    const normalizedTarget = normalizeBarangayName(report.barangay)
    if (!normalizedTarget) return null

    for (const [name, coords] of Object.entries(BARANGAY_COORDS)) {
      const normalizedName = normalizeBarangayName(name)
      if (normalizedName.includes(normalizedTarget) || normalizedTarget.includes(normalizedName)) {
        return { latitude: coords.lat, longitude: coords.lng }
      }
    }

    return null
  }

  function renderIncidentMarkers(reports) {
    clearIncidentMarkers()

    reports.forEach(report => {
      const coords = resolveIncidentCoordinates(report)
      if (!coords) return

      const popupHtml = `
        <div class="p-1 text-slate-900 min-w-[200px]">
          <h4 class="font-bold text-xs text-[#902715]">Unresolved Incident</h4>
          <p class="text-[11px] text-slate-700 mt-0.5"><strong>Barangay:</strong> ${report.barangay || 'Unknown'}</p>
          <p class="text-[11px] text-slate-700"><strong>Priority:</strong> ${report.ai_priority || 'unknown'}</p>
          <p class="text-[11px] text-slate-700"><strong>Status:</strong> ${report.status || 'open'}</p>
          <p class="text-[11px] text-slate-700 mt-1">${report.raw_description || 'No description provided.'}</p>
        </div>
      `

      if (map.value && map.value.isStyleLoaded()) {
        const marker = new mapboxgl.value.Marker({ color: getIncidentMarkerColor(report.ai_priority) })
          .setLngLat([coords.longitude, coords.latitude])
          .setPopup(new mapboxgl.value.Popup({ offset: 14 }).setHTML(popupHtml))
          .addTo(map.value)

        incidentMarkers.push(marker)
      }
    })
  }

  async function getNearbyIncidentSummary() {
    if (!userLocation.value) {
      nearbyIncidentCount.value = 0
      clearIncidentMarkers()
      return { count: 0, criticalLike: 0 }
    }

    try {
      const { data, error } = await supabase
        .from('community_reports')
        .select('id, ai_priority, status, barangay, created_at, raw_description')
        .in('status', ['open', 'in_review'])
        .order('created_at', { ascending: false })
        .limit(120)

      if (error) throw error

      const reports = (data || []).map(report => {
        const coords = resolveIncidentCoordinates(report)
        if (!coords) return null

        const distanceKm = getDistanceKm(
          userLocation.value.latitude,
          userLocation.value.longitude,
          coords.latitude,
          coords.longitude
        )

        return {
          ...report,
          latitude: coords.latitude,
          longitude: coords.longitude,
          distanceKm,
          distanceToRouteKm: getDistanceToRouteKm(
            coords.latitude,
            coords.longitude,
            activeRouteCoordinates.value
          )
        }
      }).filter(Boolean)

      const routeBasedFilteringReady = activeRouteCoordinates.value.length >= 2
      const nearbyReports = reports.filter(report => {
        if (routeBasedFilteringReady) {
          return report.distanceToRouteKm <= routeIncidentCorridorKm
        }
        return report.distanceKm <= 3.5
      })
      nearbyIncidentCount.value = nearbyReports.length
      renderIncidentMarkers(nearbyReports)

      const criticalLike = nearbyReports.filter(r => r.ai_priority === 'high' || r.ai_priority === 'critical').length
      return { count: nearbyReports.length, criticalLike }
    } catch (err) {
      console.warn('Autopilot incident scan fallback:', err)
      nearbyIncidentCount.value = 0
      clearIncidentMarkers()
      return { count: 0, criticalLike: 0 }
    }
  }

  return { nearbyIncidentCount, renderIncidentMarkers, clearIncidentMarkers, getNearbyIncidentSummary }
}