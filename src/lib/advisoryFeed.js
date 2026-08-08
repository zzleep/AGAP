/**
 * PAGASA advisory feed parsing (pure module — no Vue/reactivity imports).
 * Geographic scope comes from src/config/locality.js.
 *
 * SECURITY: advisory text must ONLY render via Vue {{ }} interpolation
 * (auto-escaped); NEVER use v-html — the live feed has contained <script>
 * content inside headlines.
 */

import { NEARBY_MUNICIPALITIES, HOME_PROVINCE } from '@/config/locality'

// Re-exported so existing importers keep working; the single source of truth
// for the geographic scope is src/config/locality.js.
export { NEARBY_MUNICIPALITIES, HOME_PROVINCE }

/** Official PAGASA rainfall intensity thresholds (mm/hr). */
export const PAGASA_THRESHOLDS = { yellow: 7.5, orange: 15, red: 30 }

const MAX_ENTRIES = 200
const DAY_MS = 24 * 60 * 60 * 1000
const SEVERITY_RANK = { watch: 0, yellow: 1, orange: 2, red: 3 }

/** Parse "YYYY-MM-DD HH:mm:ss" as Asia/Manila (UTC+8, no DST) -> epoch ms, or null when invalid. */
function parseManilaDate(value) {
  if (typeof value !== 'string' || value.trim() === '') return null
  const ts = Date.parse(value + ' +08:00')
  return Number.isNaN(ts) ? null : ts
}

/** max_severity first; fall back to the highest per-province `type`, default 'watch'. */
function resolveSeverity(raw) {
  const maxSeverity = typeof raw.max_severity === 'string' ? raw.max_severity.toLowerCase() : ''
  if (SEVERITY_RANK[maxSeverity] !== undefined) return maxSeverity
  let best = 'watch'
  let bestRank = -1
  const provinces = Array.isArray(raw.provinces) ? raw.provinces : []
  for (const p of provinces) {
    const t = p && typeof p.type === 'string' ? p.type.toLowerCase() : ''
    const rank = SEVERITY_RANK[t]
    if (rank !== undefined && rank > bestRank) {
      bestRank = rank
      best = t
    }
  }
  return best
}

/**
 * Keep municipality/psgc/type for filtering but strip `shape` polygons — bulky
 * geometry the UI never renders, and dropping it keeps cache payloads small.
 */
function collectProvinces(entry) {
  if (!Array.isArray(entry.provinces)) return []
  return entry.provinces
    .filter(p => p && typeof p === 'object')
    .map(p => ({
      province: typeof p.province === 'string' ? p.province : '',
      municipality: typeof p.municipality === 'string' ? p.municipality : '',
      psgc_code: typeof p.psgc_code === 'string' ? p.psgc_code : '',
      type: typeof p.type === 'string' ? p.type : ''
    }))
}

/** FLOOD-type entries carry areaDesc/polygon instead of provinces — normalize both shapes. */
function collectAreaDesc(entry) {
  if (Array.isArray(entry.areaDesc)) return entry.areaDesc.map(a => String(a)).join(', ')
  return typeof entry.areaDesc === 'string' ? entry.areaDesc : ''
}

/** Highest severity across the nearby towns; falls back to the entry severity
 * only when there is no municipality detail (e.g. derived fallbacks). */
function resolveLocalSeverity(normalized, coverage) {
  if (coverage.length === 0) return normalized.severity
  let best = coverage[0].severity
  for (const item of coverage) {
    if (SEVERITY_RANK[item.severity] > SEVERITY_RANK[best]) best = item.severity
  }
  return best
}

/**
 * Nearby places named by the advisory, pulled from the structured province list
 * (municipality + severity) so the card can show a scannable local summary
 * instead of the full SMS text that names every affected town across Luzon.
 */
function collectLocalCoverage(provinces, normalized) {
  const byName = new Map()
  for (const p of provinces) {
    const name = normalizeName(p.municipality)
    if (!NEARBY_MUNICIPALITIES.includes(name)) continue
    // Per-municipality severity when given, otherwise inherit the entry's severity
    const severity = SEVERITY_RANK[p.type] !== undefined ? p.type : normalized.severity
    const existing = byName.get(name)
    if (!existing || SEVERITY_RANK[severity] > SEVERITY_RANK[existing.severity]) {
      byName.set(name, { name: p.municipality.trim(), severity })
    }
  }
  if (byName.size > 0) {
    return [...byName.values()].sort((a, b) =>
      SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || a.name.localeCompare(b.name))
  }
  // Province-granular only (e.g. General Flood Advisories list provinces without
  // municipalities) — a home-province match means the whole province is covered.
  if (provinces.some(p => normalizeName(p.province) === HOME_PROVINCE)) {
    return [{ name: 'Laguna', severity: normalized.severity, provinceWide: true }]
  }
  return []
}

/**
 * Clean PAGASA CAP message text for plaintext display: generated messages embed
 * markdown-style syntax (`**bold**`, `+ ` bullets) that renders as literal
 * symbols in a plaintext UI. Strip the artifacts while keeping the content —
 * the official wording is still reachable via the PAGASA link. Rendering stays
 * {{ }}-only; this never produces HTML.
 */
export function formatAdvisoryText(text) {
  if (typeof text !== 'string' || text === '') return ''
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')   // **bold** -> text
    .replace(/^\s*[+\-*•]\s+/gm, '')     // bullet lines ("+ ", "- ", "* ", "• ")
    .replace(/[ \t]+$/gm, '')            // trailing spaces per line
    .replace(/\n{3,}/g, '\n\n')          // collapse blank-line runs
    .trim()
}

/**
 * Split a formatted message into structured blocks so the UI can lead with the
 * user's own tier instead of one dense wall of text.
 *
 * Block shapes (see parseMessageBlocks):
 *  - tier block:      { severity: 'red'|'orange'|'yellow', title: null, text,
 *                       hazard: null|string, areas: null|[ {province, municipalities} ] }
 *  - river-list block:{ severity: null, title: null, text, items: [{label, text}] }
 *  - plain block:     { severity: null, title: null, text }
 *
 * Heuristics are line-anchored and defensive: unknown lines degrade into the
 * current block (or a new plain block after a blank line) rather than being lost.
 */
const LEVEL_SECTION_RE = /^(red|orange|yellow)\s+warning\s+level\s*:/i
const HAZARD_RE = /^associated\s+hazard\s*:/i
const WATERCOURSES_HEADER_RE = /^watercourses\s+likely\s+to\s+be\s+affected\s*:/i

/**
 * Split an area list like "Laguna(Santa Rosa, Calamba), Metro Manila,
 * Cavite(Silang)" into province groups. Commas inside parentheses are kept;
 * entries without parentheses (e.g. "Metro Manila") are province-wide.
 */
export function parseAreaGroups(text) {
  if (typeof text !== 'string' || text.trim() === '') return []
  const parts = []
  let depth = 0
  let current = ''
  for (const ch of text) {
    if (ch === '(') depth += 1
    else if (ch === ')') depth -= 1
    if (ch === ',' && depth === 0) {
      if (current.trim()) parts.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) parts.push(current.trim())

  const groups = []
  for (const part of parts) {
    const open = part.indexOf('(')
    if (open > 0 && part.endsWith(')')) {
      const province = part.slice(0, open).trim()
      const municipalities = part
        .slice(open + 1, -1)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      if (province) groups.push({ province, municipalities })
    } else if (part) {
      groups.push({ province: part, municipalities: [] })
    }
  }
  return groups
}

export function parseMessageBlocks(message) {
  if (typeof message !== 'string' || message === '') return []
  const blocks = []
  let current = null
  let sawBlank = false

  const finish = () => {
    if (current) {
      if (current.severity && current.areas === null) {
        current.areas = parseAreaGroups(current.text.split('\n')[0])
      }
      blocks.push(current)
      current = null
    }
  }

  const startPlain = (line) => {
    finish()
    current = { severity: null, title: null, text: line }
  }

  for (const rawLine of message.split('\n')) {
    const line = rawLine.trim()
    if (line === '') {
      sawBlank = true
      continue
    }

    const level = line.match(LEVEL_SECTION_RE)
    if (level) {
      finish()
      current = {
        severity: level[1].toLowerCase(),
        title: null,
        text: line.slice(line.indexOf(':') + 1).trim(),
        hazard: null,
        areas: null
      }
      sawBlank = false
      continue
    }

    if (HAZARD_RE.test(line)) {
      // Attach each tier's hazard line to its own tier block (kept in text too)
      if (current && current.severity) {
        current.hazard = line
        current.text += '\n' + line
      } else {
        startPlain(line)
      }
      sawBlank = false
      continue
    }

    if (WATERCOURSES_HEADER_RE.test(line)) {
      finish()
      current = { severity: null, title: null, text: '', items: [] }
      sawBlank = false
      continue
    }

    // Inside a river-list block: "Province - rivers..." lines become items
    if (current && Array.isArray(current.items)) {
      const sep = line.indexOf(' - ')
      if (sep > 2) {
        current.items.push({ label: line.slice(0, sep).trim(), text: line.slice(sep + 3).trim() })
      } else {
        current.items.push({ label: null, text: line })
      }
      sawBlank = false
      continue
    }

    // A paragraph after a blank line closes the previous block (e.g. the
    // trailing "Meanwhile, ..." and closing instructions of HRWs)
    if (current && sawBlank) startPlain(line)
    else if (current) current.text += '\n' + line
    else startPlain(line)
    sawBlank = false
  }

  finish()
  return blocks
}

function normalizeEntry(raw) {
  const message = formatAdvisoryText(String(raw.message || '').trim())
  return {
    id: typeof raw.identifier === 'string' ? raw.identifier : '',
    severity: resolveSeverity(raw),
    type: String(raw.subtype || raw.type || 'weather advisory').toLowerCase().trim(),
    headline: String(raw.headline || '').trim(),
    message,
    messageBlocks: parseMessageBlocks(message),
    issuedAt: parseManilaDate(raw.issued_date) || Date.now(),
    validUntil: parseManilaDate(raw.valid_date),
    publishedBy: typeof raw.published_by === 'string' && raw.published_by.trim() ? raw.published_by : 'PAGASA',
    source: 'pagasa',
    isDerived: false
  }
}

/** Normalize a place name for matching: lowercase, trimmed, "City" suffix removed. */
function normalizeName(value) {
  return String(value || '').toLowerCase().trim().replace(/\s+city$/, '')
}

/**
 * Relevance: municipality-level data is the most precise signal — if an advisory
 * names specific towns and none are near Santa Rosa, drop it even when the
 * province matches (e.g. a warning covering only northern Bulacan). When an
 * advisory is province-granular only (no municipality detail), require the home
 * province; a publisher match alone is a last resort for entries with no
 * geographic data at all, so a warning is never hidden on missing metadata.
 */
function isRelevant(normalized, provinces, areaDesc) {
  const hasProvinceData = provinces.length > 0
  const hasMunicipalityData = provinces.some(p => normalizeName(p.municipality) !== '')
  const municipalityMatch = provinces.some(p =>
    NEARBY_MUNICIPALITIES.includes(normalizeName(p.municipality))
  )

  if (hasMunicipalityData) return municipalityMatch

  const provinceMatch = provinces.some(p => normalizeName(p.province) === HOME_PROVINCE)
  if (hasProvinceData && !provinceMatch) return false
  if (provinceMatch) return true

  const areaDescLower = areaDesc.toLowerCase()
  const areaMatch = NEARBY_MUNICIPALITIES.some(name => areaDescLower.includes(name))
    || areaDescLower.includes(HOME_PROVINCE)
  const publisher = normalized.publishedBy.toUpperCase()
  return areaMatch || publisher === 'NCRPRSD' || publisher === 'SLPRSD'
}

export function parseAdvisoryFeed(raw) {
  const now = Date.now()
  const rawEntries = raw && typeof raw === 'object' && Array.isArray(raw.data && raw.data.alert_data)
    ? raw.data.alert_data
    : []
  const seen = new Set()
  const entries = []

  for (const rawEntry of rawEntries.slice(0, MAX_ENTRIES)) {
    try {
      if (!rawEntry || typeof rawEntry !== 'object') continue
      const normalized = normalizeEntry(rawEntry)
      // Drop entries that can't be identified or shown
      if (!normalized.id || !normalized.headline) continue
      // Drop expired: explicit validity window, or a 24h freshness window when absent
      if (normalized.validUntil !== null) {
        if (normalized.validUntil < now) continue
      } else if (normalized.issuedAt < now - DAY_MS) {
        continue
      }
      const provinces = collectProvinces(rawEntry)
      const areaDesc = collectAreaDesc(rawEntry)
      if (!isRelevant(normalized, provinces, areaDesc)) continue
      normalized.localCoverage = collectLocalCoverage(provinces, normalized)
      // What the USER's area actually faces (max across nearby towns) vs the
      // warning's Luzon-wide maximum — drives the badge so it can't alarm with
      // a RED that only applies far away.
      normalized.localSeverity = resolveLocalSeverity(normalized, normalized.localCoverage)
      normalized.higherElsewhere = SEVERITY_RANK[normalized.severity] > SEVERITY_RANK[normalized.localSeverity]
      if (seen.has(normalized.id)) continue
      seen.add(normalized.id)
      entries.push(normalized)
    } catch (err) {
      // Malformed entry — skip it; one bad record must never break the whole feed
      console.warn('Skipping malformed PAGASA advisory entry:', err.message)
    }
  }

  // Most severe first; tie-break with newest issuedAt
  entries.sort((a, b) => {
    const diff = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]
    return diff !== 0 ? diff : b.issuedAt - a.issuedAt
  })
  return entries
}

export function pickTopAdvisory(entries) {
  return Array.isArray(entries) && entries.length > 0 ? entries[0] : null
}

/**
 * Local rainfall-based fallback. Never cached — always rebuilt from the live
 * rainfall rate so the derived advisory can't go stale like a network one.
 */
export function deriveAdvisoryFromRainfall(rateMmHr) {
  const rate = Number(rateMmHr)
  if (!Number.isFinite(rate) || rate < PAGASA_THRESHOLDS.yellow) return null

  let severity = 'yellow'
  if (rate >= PAGASA_THRESHOLDS.red) severity = 'red'
  else if (rate >= PAGASA_THRESHOLDS.orange) severity = 'orange'

  return {
    id: 'derived-rainfall-' + Date.now(),
    severity,
    localSeverity: severity,
    higherElsewhere: false,
    type: 'derived rainfall warning',
    headline: `Rainfall warning - ${severity} level`,
    message: `Heavy rain in progress (${rate.toFixed(1)} mm/hr). Possible flooding in low-lying areas. Stay alert and monitor advisories.`,
    issuedAt: Date.now(),
    validUntil: Date.now() + 3 * 60 * 60 * 1000,
    publishedBy: 'PAGASA',
    source: 'pagasa',
    isDerived: true
  }
}
