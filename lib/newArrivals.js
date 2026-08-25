export function normalizeProductVersion(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isNewArrivalsVersion(value) {
  const normalized = normalizeProductVersion(value)
  return normalized.includes('new') && normalized.includes('arrival')
}

export function getCreatedAtValue(product) {
  const value = new Date(product?.created_at || 0).getTime()
  return Number.isFinite(value) ? value : 0
}

export function compareNewestNewArrivalsFirst(a, b) {
  return getCreatedAtValue(b) - getCreatedAtValue(a)
}
