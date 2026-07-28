import 'leaflet/dist/leaflet.css'
import 'mapbox-gl/dist/mapbox-gl.css'
// Auto-upgrade HTTP to HTTPS on non-localhost IP addresses (Geolocation API requires HTTPS)
if (typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  window.location.href = window.location.href.replace('http:', 'https:')
}

// Silently intercept Mapbox telemetry requests to prevent browser console spam/errors from adblockers
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input?.url || '')
    if (url.includes('events.mapbox.com')) {
      return Promise.resolve(new Response(null, { status: 200 }))
    }
    return originalFetch.apply(this, arguments)
  }

  if (navigator.sendBeacon) {
    const originalSendBeacon = navigator.sendBeacon
    navigator.sendBeacon = function (url, data) {
      if (typeof url === 'string' && url.includes('events.mapbox.com')) {
        return true
      }
      return originalSendBeacon.apply(this, arguments)
    }
  }
}

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import en from './locales/en.json'
import fil from './locales/fil.json'

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('agap_locale') || 'fil',
  fallbackLocale: 'en',
  messages: { en, fil }
})

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

app.mount('#app')
