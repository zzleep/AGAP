import { ref } from 'vue'

const needRefresh = ref(false)
let registrationRef = null
let initPromise = null

/**
 * Composable that monitors the service worker lifecycle and surfaces
 * when a new version of the app is available.
 *
 * Usage:
 *   const { needRefresh, updateServiceWorker } = useUpdatePrompt()
 *   // In template: show update banner when needRefresh is true
 *   // On button click: call updateServiceWorker() to activate the new version
 */
export function useUpdatePrompt() {
  if (!initPromise) {
    initPromise = initSWMonitoring()
  }

  async function initSWMonitoring() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    try {
      const reg = await navigator.serviceWorker.ready
      registrationRef = reg

      // If a new SW is already waiting (installed but not activated), surface it
      if (reg.waiting && navigator.serviceWorker.controller) {
        needRefresh.value = true
      }

      // Listen for future updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // A new version has finished installing and is waiting to activate
            needRefresh.value = true
          }
        })
      })
    } catch (err) {
      console.warn('[UpdatePrompt] SW monitoring init failed:', err)
    }
  }

  /**
   * Activates the waiting service worker, which triggers a controllerchange
   * event and a safe page reload (handled by the existing agapSafeReload
   * mechanism in main.js).
   */
  function updateServiceWorker() {
    if (!registrationRef || !registrationRef.waiting) return

    registrationRef.waiting.postMessage({ type: 'SKIP_WAITING' })
    needRefresh.value = false
  }

  return { needRefresh, updateServiceWorker }
}
