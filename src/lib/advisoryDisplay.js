/**
 * Advisory display helpers (pure module — no Vue/reactivity imports).
 *
 * Shared by AdvisoryCard (card face) and AdvisoryDetailsSheet (bottom sheet)
 * so severity palettes, coverage chips, headline splitting, and time
 * formatting stay in one place. Locality matching is driven by
 * src/config/locality.js.
 */

import { HOME_MUNICIPALITY, HOME_PROVINCE } from '@/config/locality'

export const OFFICIAL_ADVISORY_URL = 'https://bagong.pagasa.dost.gov.ph/weather/weather-advisory'

export const VALID_LEVELS = ['watch', 'yellow', 'orange', 'red']

/* Solid chips mirror HomeView's risk chip; translucent *-400 tinted variants
   are tuned for the dark hero and would fail contrast on a light surface.
   `accent` tints the guidance callout icon for the user's local level. */
export const SEVERITY_META = {
  watch: {
    label: 'WATCH',
    badge: 'bg-[#E3EBF0] text-[#1F3A4B]',
    border: 'border-[#1F3A4B]/15',
    accent: 'text-[#1F3A4B]',
    isAlert: false
  },
  yellow: {
    label: 'YELLOW',
    badge: 'bg-[#F7FB41] text-[#902715]',
    border: 'border-[#8a7e00]/35',
    accent: 'text-sr-canary-text',
    isAlert: true
  },
  orange: {
    label: 'ORANGE',
    badge: 'bg-[#D14D3E] text-white',
    border: 'border-[#D14D3E]/35',
    accent: 'text-sr-copper-hover',
    isAlert: true
  },
  red: {
    label: 'RED',
    badge: 'bg-[#902715] text-white animate-pulse',
    border: 'border-[#902715]/50',
    accent: 'text-sr-brandy',
    isAlert: true
  }
}

/* Coverage chips palette on a translucent base; the colored dot carries the
   severity signal and the tinted border groups chips at a glance. */
export const COVERAGE_SEVERITY_META = {
  watch: {
    dot: 'bg-slate-500',
    chip: 'bg-slate-100 text-slate-600 border-slate-300'
  },
  yellow: {
    dot: 'bg-sr-canary ring-1 ring-inset ring-sr-canary-text/50',
    chip: 'bg-sr-canary/25 text-sr-canary-text border-sr-canary-text/30'
  },
  orange: {
    dot: 'bg-sr-copper',
    chip: 'bg-sr-copper/10 text-sr-copper-hover border-sr-copper/30'
  },
  red: {
    dot: 'bg-sr-brandy',
    chip: 'bg-sr-brandy/10 text-sr-brandy border-sr-brandy/30'
  }
}

/** Normalized comparison form: lowercase, trimmed, "city" suffix stripped. */
export function normalizeName(name) {
  return String(name ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s*city$/i, '')
    .trim()
}

/** Badge, card border and guidance reflect the user's LOCAL level (max severity
 *  across the covered towns), not the Luzon-wide headline level. Falls back to
 *  the advisory's own severity for legacy data without localSeverity. */
export function severityLevelOf(a) {
  const raw = a?.localSeverity || a?.severity
  return VALID_LEVELS.includes(raw) ? raw : 'watch'
}

export function severityOf(a) {
  return SEVERITY_META[severityLevelOf(a)]
}

export function coverageOf(a) {
  return Array.isArray(a?.localCoverage) ? a.localCoverage : []
}

export function coverageMeta(item) {
  return COVERAGE_SEVERITY_META[item?.severity] || COVERAGE_SEVERITY_META.watch
}

export function dotForLevel(level) {
  return COVERAGE_SEVERITY_META[level]?.dot || COVERAGE_SEVERITY_META.watch.dot
}

/** "Your area" personal relevance: chip name normalized against the home
 *  municipality (e.g. "Santa Rosa City" -> "santa rosa"). */
export function isYourArea(item) {
  return normalizeName(item?.name) === HOME_MUNICIPALITY
}

/* ── Headline #tag de-emphasis (e.g. trailing "#NCR_PRSD") ───────────────── */
export function splitHeadline(headline) {
  const s = String(headline || '')
  const m = s.match(/^(.*?)(\s+#\w+)$/)
  if (m) return { text: m[1], tag: m[2] }
  return { text: s, tag: null }
}

/* ── Structured message block classifiers (see advisoryFeed.parseMessageBlocks) ── */
export function isTierBlock(b) {
  return !!b?.severity && !(Array.isArray(b?.items) && b.items.length > 0)
}
export function isFloodBlock(b) {
  return Array.isArray(b?.items) && b.items.length > 0
}
export function isPlainBlock(b) {
  return !isTierBlock(b) && !isFloodBlock(b)
}
export function isStructuredBlock(b) {
  return isTierBlock(b) || isFloodBlock(b)
}

export function severityOfBlock(b) {
  return SEVERITY_META[b?.severity] || SEVERITY_META.watch
}

/* Tier blocks (live data) carry `areas` — per-province scopes. Legacy cached
   entries lack it: fall back to the single-paragraph body. */
export function tierAreasOf(b) {
  return Array.isArray(b?.areas) ? b.areas : []
}
export function hasTierAreas(b) {
  return tierAreasOf(b).length > 0
}
export function tierAreaMunicipalities(area) {
  return Array.isArray(area?.municipalities) ? area.municipalities : []
}

/* Municipality-bearing rows are the user's area when the list contains their
   municipality; bare provinces (empty list) never match. */
export function isTierRowYourArea(area) {
  return tierAreaMunicipalities(area).some((m) => normalizeName(m) === HOME_MUNICIPALITY)
}

/* Bold the user's municipality inside the joined list without v-html: split
   the joined string around the matching entry's raw label. Returns null when
   there is nothing to emphasize. */
export function tierMunicipalityParts(area) {
  const munis = tierAreaMunicipalities(area)
  if (!munis.length) return null
  const joined = munis.join(', ')
  const idx = munis.findIndex((m) => normalizeName(m) === HOME_MUNICIPALITY)
  if (idx === -1) return null
  const label = munis[idx]
  const at = joined.indexOf(label)
  if (at === -1) return null
  return { before: joined.slice(0, at), match: label, after: joined.slice(at + label.length) }
}

/* Flood rows are labeled by province, not municipality (see advisoryFeed
   HOME_PROVINCE); the home-province row is the user's area. */
export function isFloodYourArea(item) {
  return normalizeName(item?.label) === HOME_PROVINCE
}

/* Date formatting, pinned to one layout across engines: "{Month} {d}, {h}:{mm}
   AM/PM" forced to Asia/Manila, so mobile and desktop read byte-identical
   strings regardless of the device's CLDR/ICU version ("Aug 8, 2:00 PM PHT"
   everywhere, never "Aug 8 at 2:00 PM"). The month stays localized via Intl;
   the date and time parts are fetched separately so no locale-specific
   combined pattern ("at", ",", "،") can leak in. "PHT" disambiguates. */
export function formatDateTime(ts, localeTag = 'en-PH') {
  if (!ts || !Number.isFinite(ts)) return ''
  try {
    const dayMonth = new Date(ts).toLocaleDateString(localeTag, {
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Manila'
    })
    const time = new Date(ts).toLocaleTimeString(localeTag, {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Manila'
    })
    return `${dayMonth}, ${time} PHT`
  } catch {
    return new Date(ts).toLocaleString()
  }
}

/** Epoch ms for valid timestamps; null for invalid/absent values. */
export function tsOf(value) {
  if (value == null) return null
  const ts = new Date(value).getTime()
  return Number.isFinite(ts) ? ts : null
}

/* One source of truth for what the card AND the details sheet show about a
   warning's times. A derived warning's timestamps are computation-time, not
   an official issue: never present them as "Issued", and it carries no
   expiry — so no countdown either. Both views consume this so they can't
   drift apart again. */
export function advisoryMeta(a, { nowTs = null, localeTag = 'en-PH' } = {}) {
  const isDerived = !!a?.isDerived
  const issuedTs = tsOf(a?.issuedAt)
  const validUntilTs = tsOf(a?.validUntil)
  return {
    isDerived,
    issuedLabel: isDerived ? '' : formatDateTime(issuedTs, localeTag),
    showIssued: !isDerived && issuedTs != null,
    validUntilTs,
    isExpired: validUntilTs != null && nowTs != null && validUntilTs - nowTs <= 0,
    remainingMs: validUntilTs != null && nowTs != null ? validUntilTs - nowTs : null
  }
}

/** "2h 48m" / "45m" from a remaining-duration in ms. */
export function formatRemaining(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return ''
  const totalMin = Math.max(1, Math.ceil(ms / 60_000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
