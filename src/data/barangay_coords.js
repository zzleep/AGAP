export const BARANGAY_COORDS = {
  'Aplaya': { lat: 14.3151, lng: 121.1219 },
  'Balibago': { lat: 14.2946, lng: 121.1054 },
  'Caingin': { lat: 14.2985, lng: 121.1270 },
  'Dila': { lat: 14.2902, lng: 121.1095 },
  'Dita': { lat: 14.2818, lng: 121.1115 },
  'Don Jose': { lat: 14.2564, lng: 121.0664 },
  'Ibaba': { lat: 14.3146, lng: 121.1184 },
  'Kanluran (Poblacion Ward 1)': { lat: 14.3127, lng: 121.1103 },
  'Labas': { lat: 14.3070, lng: 121.1104 },
  'Macabling': { lat: 14.2986, lng: 121.0972 },
  'Malitlit': { lat: 14.2691, lng: 121.1111 },
  'Malusak (Poblacion Ward 2)': { lat: 14.3116, lng: 121.1138 },
  'Market Area (Poblacion Ward 8)': { lat: 14.3167, lng: 121.1156 },
  'Pooc': { lat: 14.3000, lng: 121.1117 },
  'Pulong Santa Cruz': { lat: 14.2766, lng: 121.0831 },
  'Santo Domingo': { lat: 14.2284, lng: 121.0479 },
  'Sinalhan': { lat: 14.3297, lng: 121.1113 },
  'Tagapo': { lat: 14.3185, lng: 121.1028 }
}

export const BARANGAY_LIST = Object.keys(BARANGAY_COORDS)

export function findNearestBarangay(lat, lng) {
  let nearest = 'Tagapo'
  let minDist = Infinity
  for (const [name, coords] of Object.entries(BARANGAY_COORDS)) {
    const d = Math.hypot(lat - coords.lat, lng - coords.lng)
    if (d < minDist) {
      minDist = d
      nearest = name
    }
  }
  return nearest
}
