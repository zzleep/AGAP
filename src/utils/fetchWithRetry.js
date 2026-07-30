/**
 * Retries an async function with exponential backoff.
 *
 * @param {() => Promise<T>} fn - The async function to execute
 * @param {object} [options]
 * @param {number} [options.retries=2] - Max retry attempts (not counting first try)
 * @param {number} [options.baseDelay=1000] - Base delay in ms (doubles each retry)
 * @param {(attempt: number, maxRetries: number) => void} [options.onRetry] - Called before each retry
 * @returns {Promise<T>}
 */
export async function fetchWithRetry(fn, options = {}) {
  const { retries = 2, baseDelay = 1000, onRetry } = options
  let lastError

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < retries) {
        if (onRetry) onRetry(attempt + 1, retries)
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}