import { cleanupOutdatedCaches, precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { CacheFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies'
import { BackgroundSyncPlugin } from 'workbox-background-sync'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// SPA Offline Navigation Fallback — routes all client-side navigation (e.g. /app/sos) to precached index.html
const navigationHandler = createHandlerBoundToURL('/index.html')
const navigationRoute = new NavigationRoute(navigationHandler, {
  denylist: [/^\/api\//, /^\/rest\//]
})
registerRoute(navigationRoute)

// Cache Google Fonts stylesheets and webfonts for offline PWA rendering
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
)

const sosQueue = new BackgroundSyncPlugin('sos-queue', {
  maxRetentionTime: 24 * 60
})

registerRoute(
  ({ url }) => /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/i.test(url.href) || /^https:\/\/api\.mapbox\.com\/.*/i.test(url.href),
  new CacheFirst({
    cacheName: 'map-tiles',
    plugins: [
      new ExpirationPlugin({ maxEntries: 1000, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
)

registerRoute(
  ({ url }) => url.pathname.includes('/rest/v1/sos_reports'),
  new NetworkOnly({ plugins: [sosQueue] }),
  'POST'
)

// Cache Supabase REST API GET responses (evac routes, flood zones, reports, weather)
// Serves cached data instantly on slow networks while refreshing in the background.
registerRoute(
  ({ url, request }) => {
    if (request.method !== 'GET') return false
    return /\/rest\/v1\//.test(url.pathname)
  },
  new StaleWhileRevalidate({
    cacheName: 'supabase-api-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 10 * 60 }), // 10 min TTL
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
)

const GPS_REFRESH_INTERVAL_MS = 60 * 1000

async function notifyClientsToRefreshGPS() {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  windows.forEach(client => client.postMessage({ type: 'AGAP_GPS_REFRESH' }))
}

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      await self.clients.claim()
      if (self.registration.periodicSync) {
        try {
          await self.registration.periodicSync.register('agap-gps-refresh', {
            minInterval: GPS_REFRESH_INTERVAL_MS
          })
        } catch (err) {
          console.warn('Periodic GPS refresh unavailable:', err)
        }
      }
    })()
  )
})

self.addEventListener('periodicsync', event => {
  if (event.tag === 'agap-gps-refresh') {
    event.waitUntil(notifyClientsToRefreshGPS())
  }
})

self.addEventListener('message', event => {
  if (event.data?.type === 'AGAP_GPS_REFRESH_NOW') {
    event.waitUntil(notifyClientsToRefreshGPS())
  }
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
