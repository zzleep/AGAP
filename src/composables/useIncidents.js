import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { BARANGAY_COORDS } from '@/data/barangay_coords'
import { getDistanceKm, getDistanceToRouteKm, normalizeBarangayName } from '@/utils/geo'
import { getIncidentMarkerColor } from '@/utils/risk'

function escapeHtml(value) {
  if (value == null) return ''
  const str = String(value)
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeCssColor(value) {
  if (typeof value !== 'string') return '#000000'
  if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return value
  return '#000000'
}

function buildIncidentMarkerSvg(markerColor) {
  const safeColor = escapeCssColor(markerColor)
  const svgNs = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNs, 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('width', '28')
  svg.setAttribute('height', '28')
  svg.setAttribute('xmlns', svgNs)
  svg.setAttribute('aria-hidden', 'true')

  const path = document.createElementNS(svgNs, 'path')
  path.setAttribute('fill', safeColor)
  path.setAttribute('d', 'M1 21h22L12 2 1 21z')
  svg.appendChild(path)

  const r1 = document.createElementNS(svgNs, 'rect')
  r1.setAttribute('x', '11')
  r1.setAttribute('y', '9')
  r1.setAttribute('width', '2')
  r1.setAttribute('height', '6')
  r1.setAttribute('fill', '#fff')
  r1.setAttribute('rx', '0.4')
  svg.appendChild(r1)

  const r2 = document.createElementNS(svgNs, 'rect')
  r2.setAttribute('x', '11')
  r2.setAttribute('y', '17')
  r2.setAttribute('width', '2')
  r2.setAttribute('height', '2')
  r2.setAttribute('fill', '#fff')
  r2.setAttribute('rx', '0.4')
  svg.appendChild(r2)

  return svg
}

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

  function enrichIncidentRecord(record, type) {
    const coords = resolveIncidentCoordinates(record)
    if (!coords) return null

    const distanceKm = getDistanceKm(
      userLocation.value.latitude,
      userLocation.value.longitude,
      coords.latitude,
      coords.longitude
    )

    return {
      ...record,
      _type: type,
      latitude: coords.latitude,
      longitude: coords.longitude,
      distanceKm,
      distanceToRouteKm: getDistanceToRouteKm(
        coords.latitude,
        coords.longitude,
        activeRouteCoordinates.value
      )
    }
  }

  function renderIncidentMarkers(reports) {
    clearIncidentMarkers()

    reports.forEach(report => {
      const coords = resolveIncidentCoordinates(report)
      if (!coords) return

      const isSOS = report._type === 'sos'
      const popupTitle = isSOS ? 'Active SOS Alert' : 'Unresolved Incident'
      const titleColor = isSOS ? '#902715' : '#8A4B08'
      const priorityText = isSOS
        ? (report.status === 'responding' ? 'Response in Progress' : 'Emergency')
        : (report.ai_priority || 'unknown')
      const statusText = report.status || (isSOS ? 'pending' : 'open')
      const descText = isSOS
        ? (report.mode ? `Alert type: ${report.mode}` : 'Citizen emergency alert')
        : (report.raw_description || 'No description provided.')

      const safeTitle = escapeHtml(popupTitle)
      const safeTitleColor = escapeCssColor(titleColor)
      const safeBarangay = escapeHtml(report.barangay || 'Unknown')
      const safePriority = escapeHtml(priorityText)
      const safeStatus = escapeHtml(statusText)
      const safeDesc = escapeHtml(descText)

      const prioritySection = priorityText
        ? `<p class="text-[11px] text-slate-700"><strong>Priority:</strong> ${safePriority}</p>`
        : ''

      const popupHtml = `
        <div class="p-1 text-slate-900 min-w-[200px]">
          <h4 class="font-bold text-xs" style="color:${safeTitleColor}">${safeTitle}</h4>
          <p class="text-[11px] text-slate-700 mt-0.5"><strong>Barangay:</strong> ${safeBarangay}</p>
          ${prioritySection}
          <p class="text-[11px] text-slate-700"><strong>Status:</strong> ${safeStatus}</p>
          <p class="text-[11px] text-slate-700 mt-1">${safeDesc}</p>
        </div>
      `

      if (map.value && map.value.isStyleLoaded()) {
        const markerColor = isSOS ? getIncidentMarkerColor('critical') : getIncidentMarkerColor(report.ai_priority)
        const el = document.createElement('div')
        el.className = 'incident-marker'
        el.style.width = '28px'
        el.style.height = '28px'
        el.appendChild(buildIncidentMarkerSvg(markerColor))

        const marker = new mapboxgl.value.Marker(el)
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
      const [reportsResult, sosResult] = await Promise.all([
        supabase
          .from('community_reports')
          .select('id, ai_priority, status, barangay, created_at, raw_description, user_hash')
          .in('status', ['open', 'in_review'])
          .order('created_at', { ascending: false })
          .limit(120),
        supabase
          .from('sos_reports')
          .select('id, status, barangay, created_at, latitude, longitude, mode')
          .not('status', 'eq', 'resolved')
          .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(120)
      ])

      if (reportsResult.error) throw reportsResult.error
      if (sosResult.error) throw sosResult.error

      const communityReports = (reportsResult.data || [])
        .map(report => {
          const enriched = enrichIncidentRecord(report, 'report')
          if (enriched) enriched.user_hash = report.user_hash
          return enriched
        })
        .filter(Boolean)

      const sosReports = (sosResult.data || [])
        .map(sos => enrichIncidentRecord(sos, 'sos'))
        .filter(Boolean)

      const allReports = [...communityReports, ...sosReports]

      const routeBasedFilteringReady = activeRouteCoordinates.value.length >= 2
      const nearbyReports = allReports.filter(report => {
        if (routeBasedFilteringReady) {
          return report.distanceToRouteKm <= routeIncidentCorridorKm
        }
        return report.distanceKm <= 3.5
      })
      nearbyIncidentCount.value = nearbyReports.length
      renderIncidentMarkers(nearbyReports)

      const criticalLike = nearbyReports.filter(r =>
        r._type === 'sos' || r.ai_priority === 'high' || r.ai_priority === 'critical'
      ).length
      const anonOnRoute = nearbyReports.some(r => !r.user_hash && r._type === 'report')
      return { count: nearbyReports.length, criticalLike, nearbyReports, anonOnRoute }
    } catch (err) {
      console.warn('Autopilot incident scan fallback:', err)
      nearbyIncidentCount.value = 0
      clearIncidentMarkers()
      return { count: 0, criticalLike: 0 }
    }
  }

  return { nearbyIncidentCount, renderIncidentMarkers, clearIncidentMarkers, getNearbyIncidentSummary }
}
