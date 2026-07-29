/**
 * Callback number utility functions for AGAP SOS reports.
 */

const PH_MOBILE_11 = /^09\d{9}$/

/**
 * Normalizes a raw callback number string down to canonical 11-digit local format (09XXXXXXXXX)
 * or returns null if input is empty or absent.
 * Strips formatting spaces, dashes, parentheses, dots.
 * Canonicalizes +639XXXXXXXXX or 639XXXXXXXXX to 09XXXXXXXXX.
 *
 * @param {string|null|undefined} raw
 * @returns {string|null}
 */
export function normalizeCallbackNumber(raw) {
  if (raw === null || raw === undefined) return null
  const str = String(raw).trim()
  if (!str) return null

  // Strip formatting spaces, dashes, parentheses, dots
  let cleaned = str.replace(/[\s\-\(\)\.]/g, '')
  if (!cleaned) return null

  // Canonicalize +639XXXXXXXXX or 639XXXXXXXXX or 9XXXXXXXXX to 09XXXXXXXXX
  if (cleaned.startsWith('+639')) {
    cleaned = '09' + cleaned.slice(4)
  } else if (cleaned.startsWith('639')) {
    cleaned = '09' + cleaned.slice(3)
  } else if (cleaned.startsWith('9') && cleaned.length === 10) {
    cleaned = '09' + cleaned.slice(1)
  } else if (cleaned.startsWith('+63')) {
    cleaned = '0' + cleaned.slice(3)
  } else if (cleaned.startsWith('63') && (cleaned.length === 12 || cleaned.length === 11)) {
    cleaned = '0' + cleaned.slice(2)
  }

  return cleaned
}

/**
 * Checks if a normalized callback number string looks valid (11 digits starting with 09).
 * Returns true if normalized is null, undefined, or empty (absent input is non-blocking and valid).
 *
 * @param {string|null|undefined} normalized
 * @returns {boolean}
 */
export function looksValid(normalized) {
  if (normalized === null || normalized === undefined || normalized === '') {
    return true
  }
  return PH_MOBILE_11.test(normalized)
}
