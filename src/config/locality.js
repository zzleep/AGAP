/**
 * Geographic scope of the AGAP app (Santa Rosa, Laguna).
 *
 * This is the single place to re-target the app to another area: change these
 * and every feature that derives local relevance (weather advisory coverage,
 * severity, "your area" highlighting) follows. Names are normalized
 * (lowercase, trimmed, "city" suffix stripped) before comparison.
 */

// The user's own locality — gets the "Your area" emphasis everywhere.
export const HOME_MUNICIPALITY = 'santa rosa'

// Municipalities the app considers "nearby" for advisory coverage scope.
export const NEARBY_MUNICIPALITIES = ['santa rosa', 'cabuyao', 'biñan', 'binan', 'san pedro', 'calamba']

// Home province for province-level matches (flood river lists, coverage).
export const HOME_PROVINCE = 'laguna'
