/**
 * Centralized network configuration for AGAP app-side (citizen) optimizations.
 *
 * Tune these values per environment without hunting through multiple files.
 * All timeouts are in milliseconds unless otherwise noted.
 */
export const NETWORK_CONFIG = {
  /** Timeout for all Supabase REST/Realtime requests */
  supabaseTimeout: 15_000,

  /** Timeout for external weather API fetch (OpenWeatherMap) */
  owmFetchTimeout: 10_000,

  /** Timeout for PAGASA PANaHON cap-alerts feed fetch */
  pagasaFetchTimeout: 15_000,

  /** Timeout for Mapbox Directions API fetch */
  mapboxDirectionsTimeout: 10_000,

  /** Autopilot safety-check intervals (fast = good network, slow = 3G/slow 4G) */
  autopilotInterval: {
    fast: 15_000,
    slow: 60_000,
  },

  /** Retry behaviour for transient failures */
  retry: {
    maxAttempts: 2,
    baseDelayMs: 1_000,
  },
}
