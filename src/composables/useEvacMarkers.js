import { EVAC_CENTERS } from '@/data/evac_deets.vue'

export function useEvacMarkers({ map, mapboxgl }) {
  const evacMarkers = []

  function renderEvacMarkers() {
    if (!map.value) return

    clearEvacMarkers()

    EVAC_CENTERS.forEach(center => {
      const popupHtml = `
        <div class="p-1 text-slate-900 min-w-[180px]">
          <h4 class="font-bold text-xs text-blue-900">${center.name}</h4>
          <p class="text-[11px] text-slate-700 mt-0.5">${center.description || ''}</p>
          <div class="mt-2 space-y-1 text-[11px] text-slate-700">
            <p><strong>Floor area (in sqm):</strong> ${center.floorArea} </p>
            <p><strong>Family size:</strong> ${center.FamilySize}</p>
            <p><strong>Individual size:</strong> ${center.indivSize}</p>
            <p><strong>CRs:</strong> F ${center.femaleCR} / M ${center.maleCR} / C ${center.commonCR}</p>
          </div>
        </div>
      `

      const el = document.createElement('div')
      el.className = 'evac-center-marker'
      el.style.width = '32px'
      el.style.height = '32px'
      el.innerHTML = `
        <svg viewBox="0 0 24 24" width="32" height="32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path fill="#902715" d="M12 3l8 6v10a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1V9l8-6z"/>
          <path fill="#fff" d="M9 12h6v2H9z"/>
        </svg>
      `

      const marker = new mapboxgl.value.Marker(el)
        .setLngLat([center.coords.longitude, center.coords.latitude])
        .setPopup(new mapboxgl.value.Popup({ offset: 18 }).setHTML(popupHtml))
        .addTo(map.value)

      evacMarkers.push(marker)
    })
  }

  function clearEvacMarkers() {
    while (evacMarkers.length) {
      const marker = evacMarkers.pop()
      marker.remove()
    }
  }

  return { renderEvacMarkers, clearEvacMarkers }
}