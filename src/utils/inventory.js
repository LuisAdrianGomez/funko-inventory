/**
 * inventory.js — Pure utility helpers for inventory data.
 * No side effects, no API calls — safe to use anywhere.
 */

/**
 * Calculates total stock across all products.
 */
export function totalStock(inventory) {
  return (inventory?.products || []).reduce(
    (sum, p) => sum + (p.stock || 0), 0
  )
}

/**
 * Filters products by search query (name, line, series, number, barcode).
 * Case-insensitive.
 *
 * @param {object} inventory
 * @param {string} query
 * @returns {Array}
 */
export function searchProducts(inventory, query) {
  if (!query?.trim()) return inventory?.products || []
  const q = query.trim().toLowerCase()
  return (inventory?.products || []).filter((p) =>
    [p.name, p.line, p.series, p.number, p.barcode, p.exclusive]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(q))
  )
}

/**
 * Sorts products by a given field.
 * @param {Array} products
 * @param {'name'|'stock'|'created_at'|'updated_at'} field
 * @param {'asc'|'desc'} direction
 */
export function sortProducts(products, field = 'name', direction = 'asc') {
  return [...products].sort((a, b) => {
    const valA = a[field] ?? ''
    const valB = b[field] ?? ''
    const cmp = typeof valA === 'string'
      ? valA.localeCompare(valB)
      : valA - valB
    return direction === 'asc' ? cmp : -cmp
  })
}

/**
 * Groups products by their `line` field.
 * @param {Array} products
 * @returns {Object} { lineName: [products] }
 */
export function groupByLine(products) {
  return products.reduce((acc, p) => {
    const line = p.line || 'Sin línea'
    if (!acc[line]) acc[line] = []
    acc[line].push(p)
    return acc
  }, {})
}

/**
 * Formats an ISO timestamp to a readable locale string in Spanish.
 * @param {string} isoString
 * @returns {string}
 */
export function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Checks whether an inventory needs to be initialized.
 */
export function isEmptyInventory(inventory) {
  return !inventory?.products?.length
}
