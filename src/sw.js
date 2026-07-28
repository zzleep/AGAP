import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkOnly } from 'workbox-strategies'
import { BackgroundSyncPlugin } from 'workbox-background-sync'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

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

const GPS_REFRESH_INTERVAL_MS = 60 * 1000

async function notifyClientsToRefreshGPS() {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  windows.forEach(client => client.postMessage({ type: 'AGAP_GPS_REFRESH' }))
}

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    if (self.registration.periodicSync) {
      try {
        await self.registration.periodicSync.register('agap-gps-refresh', {
          minInterval: GPS_REFRESH_INTERVAL_MS
        })
      } catch (err) {
        console.warn('Periodic GPS refresh unavailable:', err)
      }
    }
  })())
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
})
