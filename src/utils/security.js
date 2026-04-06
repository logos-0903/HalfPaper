export async function hashPassword(password) {
  const encoder = new TextEncoder()
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(password))

  return Array.from(new Uint8Array(digest))
    .map((item) => item.toString(16).padStart(2, '0'))
    .join('')
}

export function clearSessionCookies() {
  if (typeof document === 'undefined') {
    return
  }

  const expireValue = 'Thu, 01 Jan 1970 00:00:00 GMT'
  const host = window.location.hostname
  const rootDomain = host.split('.').slice(-2).join('.')
  const domains = new Set(['', host, `.${host}`, rootDomain ? `.${rootDomain}` : '', '.halfpaper.top', 'api.halfpaper.top'])

  for (const domain of domains) {
    const domainPart = domain ? ` domain=${domain};` : ''
    document.cookie = `SESSTOKEN=; expires=${expireValue}; path=/;${domainPart}`
  }
}