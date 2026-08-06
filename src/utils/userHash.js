function buildUserHash() {
  return 'usr_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now()
}

export function getOrCreateAgapUserHash() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null

  try {
    let hash = localStorage.getItem('agap_user_hash')
    if (!hash) {
      hash = buildUserHash()
      localStorage.setItem('agap_user_hash', hash)
    }
    return hash
  } catch (err) {
    console.warn('agap_user_hash storage unavailable:', err)
    return null
  }
}