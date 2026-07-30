import { ref, onUnmounted } from 'vue'

const needRefresh = ref(false)
let wb = null
let initPromise = null
let updateInterval = null
const UPDATE_POLL_MS = 30_000

/**
 * Composable that monitors the service worker lifecycle using workbox-window
 * and surfaces when a new version of the app is available.
 *
 * Usage:
 *   const { needRefresh, updateServiceWorker } = useUpdatePrompt()
 *   // In template: show update banner when needRefresh is true
 *   // On button click: call updateServiceWorker() to activate the new version
 */
export function useUpdatePrompt() {
  // Initialise once (module singleton) but call register() on every mount
  // so the browser checks for SW updates immediately.
  if (!initPromise && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    initPromise = initSWRegistration()
  }

  // Proactive polling: check for updates every 30s so the banner appears
  // promptly after a deploy even if the user hasn't navigated.
  if (wb) {
    wb.update()
  } else if (initPromise) {
    initPromise.then(() => wb?.update())
  }

  if (!updateInterval && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    updateInterval = setInterval(() => {
      if (wb) wb.update()
    }, UPDATE_POLL_MS)
  }

  onUnmounted(() => {
    if (updateInterval) {
      clearInterval(updateInterval)
      updateInterval = null
    }
  })

  async function initSWRegistration() {
    try {
      const { Workbox } = await import('workbox-window')
      wb = new Workbox('/sw.js')

      // When a new SW is installed and waiting (prompt flow)
      wb.addEventListener('waiting', () => {
        needRefresh.value = true
      })

      // When the waiting SW takes control — reload to apply the new version
      wb.addEventListener('controlling', () => {
        window.location.reload()
      })

      await wb.register()
    } catch (err) {
      console.warn('[UpdatePrompt] Workbox registration failed:', err)
    }
  }

  /**
   * Activates the waiting service worker by sending SKIP_WAITING.
   * The worker will activate and trigger controllerchange → page reload.
   */
  function updateServiceWorker() {
    if (!wb) return
    wb.messageSW({ type: 'SKIP_WAITING' })
    needRefresh.value = false
  }

  return { needRefresh, updateServiceWorker }
}
