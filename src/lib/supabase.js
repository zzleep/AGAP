import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'anon-key-placeholder'

import { NETWORK_CONFIG } from './networkConfig'

function createFetchWithTimeout(defaultTimeoutMs) {
  return async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), defaultTimeoutMs)
    try {
      const response = await fetch(url, {
        ...options,
        signal: options.signal
          ? // If caller already passed a signal, race it with our timeout
            (() => {
              const outerSignal = options.signal
              outerSignal.addEventListener('abort', () => controller.abort(), { once: true })
              return controller.signal
            })()
          : controller.signal
      })
      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    fetch: createFetchWithTimeout(NETWORK_CONFIG.supabaseTimeout)
  }
})
