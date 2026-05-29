export function urlTeCodiAuth() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('code')
}

export function hashTeTokensAuth() {
  if (typeof window === 'undefined') return false
  const hash = window.location.hash
  return hash.includes('access_token') || hash.includes('type=recovery')
}

export function esEnllaçRecuperacioContrasenya() {
  if (typeof window === 'undefined') return false
  const hash = window.location.hash
  return (
    hash.includes('canviar-contrasenya') ||
    hash.includes('type=recovery') ||
    hashTeTokensAuth() ||
    urlTeCodiAuth()
  )
}

/** Llegeix access_token / refresh_token del hash (flux implícit / enllaços antics). */
export function parseTokensDelHash() {
  if (typeof window === 'undefined') return null
  let fragment = window.location.hash.replace(/^#/, '')
  if (!fragment) return null

  if (fragment.startsWith('canviar-contrasenya')) {
    fragment = fragment.replace(/^canviar-contrasenya&?/, '')
  }

  const params = new URLSearchParams(fragment)
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  if (!access_token || !refresh_token) return null
  return { access_token, refresh_token }
}

export function vistaDesDeUrl() {
  if (typeof window === 'undefined') return 'inici'
  if (esEnllaçRecuperacioContrasenya()) return 'canviar-contrasenya'
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash) return 'inici'
  return hash.split('&')[0] || 'inici'
}

export function urlActualSenseCanviar() {
  if (typeof window === 'undefined') return '/'
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}
