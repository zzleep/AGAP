export function getDistanceKm(lat1, lng1, lat2, lng2) {
  const earthRadiusKm = 6371
  const toRadians = degrees => (degrees * Math.PI) / 180
  const deltaLat = toRadians(lat2 - lat1)
  const deltaLng = toRadians(lng2 - lng1)
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLng / 2) ** 2
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a))
}

export function getDistancePointToSegmentKm(point, start, end) {
  const referenceLatRad = (point[1] * Math.PI) / 180
  const kmPerLng = 111.32 * Math.cos(referenceLatRad)
  const kmPerLat = 110.574

  const px = point[0] * kmPerLng
  const py = point[1] * kmPerLat
  const sx = start[0] * kmPerLng
  const sy = start[1] * kmPerLat
  const ex = end[0] * kmPerLng
  const ey = end[1] * kmPerLat

  const dx = ex - sx
  const dy = ey - sy
  const lengthSquared = (dx * dx) + (dy * dy)

  if (lengthSquared === 0) {
    return Math.hypot(px - sx, py - sy)
  }

  const t = Math.max(0, Math.min(1, ((px - sx) * dx + (py - sy) * dy) / lengthSquared))
  const projectionX = sx + (t * dx)
  const projectionY = sy + (t * dy)
  return Math.hypot(px - projectionX, py - projectionY)
}

export function getDistanceToRouteKm(latitude, longitude, routeCoordinates) {
  if (!Array.isArray(routeCoordinates) || routeCoordinates.length < 2) {
    return Infinity
  }

  const point = [longitude, latitude]
  let minimumDistanceKm = Infinity

  for (let i = 0; i < routeCoordinates.length - 1; i += 1) {
    const start = routeCoordinates[i]
    const end = routeCoordinates[i + 1]
    const segmentDistanceKm = getDistancePointToSegmentKm(point, start, end)
    if (segmentDistanceKm < minimumDistanceKm) {
      minimumDistanceKm = segmentDistanceKm
    }
  }

  return minimumDistanceKm
}

export function formatDistanceToKm(distanceKm) {
  if (typeof distanceKm !== 'number' || Number.isNaN(distanceKm)) return '0.0'
  return distanceKm < 1 ? distanceKm.toFixed(2) : distanceKm.toFixed(1)
}

export function formatDurationToMinutes(durationMinutes) {
  if (typeof durationMinutes !== 'number' || Number.isNaN(durationMinutes)) return '0'
  return Math.max(1, Math.round(durationMinutes)).toString()
}

export function normalizeBarangayName(name) {
  return String(name || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9\s]/g, '').trim()
}
