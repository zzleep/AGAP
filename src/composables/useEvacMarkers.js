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

      const marker = new mapboxgl.value.Marker({ color: '#902715' })
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