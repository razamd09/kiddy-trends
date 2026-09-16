// Fires GA4 Enhanced Ecommerce events via the global gtag() loaded in
// app/layout.js. No-ops safely if gtag hasn't loaded yet (e.g. ad blockers,
// slow script load) instead of throwing.
export function trackGA4Event(eventName, params) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  try {
    window.gtag('event', eventName, params)
  } catch {}
}

export function ga4Item({ id, name, price, quantity = 1, brand }) {
  const item = {
    item_id: String(id || ''),
    item_name: String(name || ''),
    price: Number(price || 0),
    quantity: Number(quantity || 1),
  }
  if (brand) item.item_brand = String(brand)
  return item
}
