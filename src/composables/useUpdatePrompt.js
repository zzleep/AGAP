import { ref } from 'vue'

const needRefresh = ref(false)
let wb = null
let registrationAttempted = false

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
  if (!registrationAttempted && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    registrationAttempted = true
    initSWRegistration()
  }

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

      wb.register()
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
