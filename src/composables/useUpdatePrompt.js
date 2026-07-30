import { ref, onUnmounted } from 'vue'

const needRefresh = ref(false)
let wb = null
let initPromise = null

// ── Singleton lifecycle management ───────────────────────────
// Reference counter: tracks how many components are currently
// using this composable so the polling interval is only cleared
// when every caller has unmounted.
let refCount = 0
let updateInterval = null
const UPDATE_POLL_MS = 30_000

function startPolling() {
  if (updateInterval || typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  updateInterval = setInterval(() => {
    if (wb) wb.update()
  }, UPDATE_POLL_MS)
}

function stopPolling() {
  if (!updateInterval) return
  clearInterval(updateInterval)
  updateInterval = null
}

/**
 * Composable that monitors the service worker lifecycle using workbox-window
 * and surfaces when a new version of the app is available.
 *
 * Singleton — all callers share the same Workbox instance and polling
 * interval. The interval lives until every caller has unmounted.
 *
 * Usage:
 *   const { needRefresh, updateServiceWorker } = useUpdatePrompt()
 *   // In template: show update banner when needRefresh is true
 *   // On button click: call updateServiceWorker() to activate the new version
 */
export function useUpdatePrompt() {
  // ── Bootstrap the Workbox instance once ───────────────────
  if (!initPromise && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    initPromise = initSWRegistration()
  }

  // ── Mount tracking ────────────────────────────────────────
  refCount++

  // Trigger an immediate update check on mount so a freshly
  // deployed SW is noticed without waiting for the next poll.
  if (wb) {
    wb.update()
  } else if (initPromise) {
    initPromise.then(() => wb?.update())
  }

  // Start the background poll if this is the first caller.
  startPolling()

  onUnmounted(() => {
    refCount--
    if (refCount <= 0) {
      stopPolling()
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
