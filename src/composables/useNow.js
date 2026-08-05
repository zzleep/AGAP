import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Reactive current time that refreshes on an interval.
 * Lets computeds (time-of-day greetings, dates) stay accurate as time
 * passes instead of freezing the initial `new Date()` at render time.
 */
export function useNow(intervalMs = 60_000) {
  const now = ref(new Date())
  let timer = null

  onMounted(() => {
    timer = setInterval(() => {
      now.value = new Date()
    }, intervalMs)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return { now }
}
