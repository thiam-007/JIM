import dns from 'node:dns/promises'
import net from 'node:net'

function isPrivateIp(address) {
  if (net.isIPv4(address)) {
    const parts = address.split('.').map(Number)
    return parts[0] === 10 || parts[0] === 127 || parts[0] === 0 ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168)
  }

  const normalized = address.toLowerCase()
  return normalized === '::1' || normalized === '::' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:')
}

export async function validateRemoteUrl(value) {
  const parsed = new URL(value)
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Seules les URLs HTTP(S) sont autorisées')
  if (parsed.username || parsed.password) throw new Error('Les identifiants dans une URL sont interdits')

  const addresses = net.isIP(parsed.hostname)
    ? [parsed.hostname]
    : (await dns.lookup(parsed.hostname, { all: true })).map(result => result.address)

  if (!addresses.length || addresses.some(isPrivateIp)) throw new Error('Cette adresse réseau n’est pas autorisée')
  return parsed
}

export function isSafeImageContentType(contentType) {
  return /^image\/(jpeg|png|gif|webp|avif)$/.test(contentType.split(';')[0].trim().toLowerCase())
}
