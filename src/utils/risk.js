export function getRiskColor(level) {
  switch (level) {
    case 'low': return '#22c55e'
    case 'moderate': return '#f97316'
    case 'high': return '#ef4444'
    default: return '#3b82f6'
  }
}

export function getBadgeBg(level) {
  switch (level) {
    case 'low': return 'bg-emerald-600'
    case 'moderate': return 'bg-amber-600'
    case 'high': return 'bg-red-600'
    default: return 'bg-blue-600'
  }
}

export function getIncidentMarkerColor(priority) {
  if (priority === 'critical') return '#b91c1c'
  if (priority === 'high') return '#dc2626'
  if (priority === 'medium') return '#f97316'
  if (priority === 'low') return '#eab308'
  return '#f97316'
}

export function getWeatherPenalty(riskLevel) {
  if (riskLevel === 'high') return 38
  if (riskLevel === 'moderate') return 20
  return 8
}

export function getSafetyMeterColor(score) {
  if (score >= 70) return '#556B2F'   // Dark Olive green — safe
  if (score >= 40) return '#D14D3E'   // Rosy Copper amber — caution
  return '#902715'                // Brandy Red — danger
}

export function getSafetyMeterLabel(score) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Caution'
  if (score >= 20) return 'Warning'
  return 'Danger'
}
