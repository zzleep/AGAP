// Shared confidence badge styling for Aegis advisories.
// Centralizes the visual thresholds across the admin UI (AegisPanel,
// AegisAdvisoryCard) so states stay in sync.
//
// Returns tailwind classes for a confidence chip/badge. `variant` allows
// banner-style overrides used when rendering on dark surfaces.

export function confidenceChipClass(conf, { variant = 'panel' } = {}) {
  if (conf === 'high') return 'bg-[#556B2F] text-white'
  if (conf === 'medium') return 'bg-[#F7FB41] text-[#0A0A0A] border border-[#8a7e00]'
  if (conf === 'low') return 'bg-[#D14D3E] text-white'
  // unknown / null
  return variant === 'banner'
    ? 'bg-white/15 text-white/90'
    : 'bg-[#1F3A4B]/10 text-[#1F3A4B]'
}

export function confidenceDotClass(conf, { variant = 'panel' } = {}) {
  if (conf === 'high') return 'bg-[#556B2F]'
  if (conf === 'medium') return 'bg-[#F7FB41] border border-[#8a7e00]'
  if (conf === 'low') return 'bg-[#D14D3E]'
  return variant === 'banner' ? 'bg-white/60' : 'bg-[#1F3A4B]/40'
}

export function confidenceLabel(conf) {
  if (conf === 'high') return 'High confidence'
  if (conf === 'medium') return 'Medium confidence'
  if (conf === 'low') return 'Low confidence'
  return 'Confidence unknown'
}