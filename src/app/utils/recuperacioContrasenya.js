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
    hashTeTokensAuth()
  )
}

/** Llegeix access_token / refresh_token del hash (enllaç del correu). */
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
