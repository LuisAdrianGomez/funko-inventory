/**
 * drive.js — Google Drive persistence via Apps Script Web App
 *
 * Replaces github.js. All inventory helpers (addUnit, removeUnit, etc.)
 * are unchanged — only the network layer is different.
 *
 * Setup:
 *   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
 *   (set in .env.local for dev, GitHub Actions secret for production)
 */

const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL

// ---------------------------------------------------------------------------
// Core API functions
// ---------------------------------------------------------------------------

/**
 * Reads the inventory from Google Drive via Apps Script.
 * Returns the inventory object.
 */
export async function readInventory() {
  if (!SCRIPT_URL) {
    throw new Error('VITE_APPS_SCRIPT_URL is not set. Add it to .env.local')
  }

  const res = await fetch(`${SCRIPT_URL}?action=read`)

  if (!res.ok) {
    throw new Error(`Drive read failed [${res.status}]: ${res.statusText}`)
  }

  const json = await res.json()

  if (!json.ok) {
    throw new Error(`Drive read error: ${json.error}`)
  }

  return { data: json.data, sha: null }  // sha kept for API compatibility
}

/**
 * Writes the updated inventory to Google Drive via Apps Script.
 * The sha parameter is ignored (kept for API compatibility with old github.js).
 *
 * @param {object} inventoryData - The full inventory object
 * @returns {Promise<null>} - Returns null (no SHA needed)
 */
export async function writeInventory(inventoryData) {
  if (!SCRIPT_URL) {
    throw new Error('VITE_APPS_SCRIPT_URL is not set. Add it to .env.local')
  }

  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' }, // Apps Script requires text/plain for doPost
    body: JSON.stringify({
      action: 'write',
      data: inventoryData,
    }),
  })

  if (!res.ok) {
    throw new Error(`Drive write failed [${res.status}]: ${res.statusText}`)
  }

  const json = await res.json()

  if (!json.ok) {
    throw new Error(`Drive write error: ${json.error}`)
  }

  return null  // No SHA needed with Drive
}

// ---------------------------------------------------------------------------
// Inventory mutation helpers — identical to github.js
// (Kept here so imports from drive.js work without changes elsewhere)
// ---------------------------------------------------------------------------

export function createEmptyInventory() {
  return {
    version: '1.0',
    last_updated: new Date().toISOString(),
    products: [],
  }
}

export function findByBarcode(inventory, barcode) {
  if (!inventory?.products || !barcode) return undefined
  return inventory.products.find(
    (p) => String(p.barcode) === String(barcode)
  )
}

export function addUnit(inventory, barcode) {
  const productIndex = inventory.products.findIndex(
    (p) => String(p.barcode) === String(barcode)
  )
  if (productIndex === -1) throw new Error(`Producto con código ${barcode} no encontrado.`)

  const now = new Date().toISOString()
  const updated = { ...inventory.products[productIndex] }
  updated.stock = (updated.stock || 0) + 1
  updated.updated_at = now
  updated.history = [...(updated.history || []), { action: 'add', units: 1, date: now, note: '' }]

  const products = [...inventory.products]
  products[productIndex] = updated
  return { ...inventory, products, last_updated: now }
}

export function removeUnit(inventory, barcode) {
  const productIndex = inventory.products.findIndex(
    (p) => String(p.barcode) === String(barcode)
  )
  if (productIndex === -1) throw new Error(`Producto con código ${barcode} no encontrado.`)

  const product = inventory.products[productIndex]
  if ((product.stock || 0) <= 0) throw new Error(`El stock de "${product.name}" ya está en 0.`)

  const now = new Date().toISOString()
  const updated = { ...product }
  updated.stock = updated.stock - 1
  updated.updated_at = now
  updated.history = [...(updated.history || []), { action: 'remove', units: 1, date: now, note: '' }]

  const products = [...inventory.products]
  products[productIndex] = updated
  return { ...inventory, products, last_updated: now }
}

export function setStock(inventory, barcode, newValue) {
  const parsed = parseInt(newValue, 10)
  if (isNaN(parsed) || parsed < 0) throw new Error('El stock debe ser un número entero igual o mayor a 0.')

  const productIndex = inventory.products.findIndex(
    (p) => String(p.barcode) === String(barcode)
  )
  if (productIndex === -1) throw new Error(`Producto con código ${barcode} no encontrado.`)

  const product = inventory.products[productIndex]
  const oldStock = product.stock || 0
  const delta = parsed - oldStock
  if (delta === 0) return inventory

  const now = new Date().toISOString()
  const updated = { ...product }
  updated.stock = parsed
  updated.updated_at = now
  updated.history = [
    ...(updated.history || []),
    {
      action: delta > 0 ? 'add' : 'remove',
      units: Math.abs(delta),
      date: now,
      note: `Ajuste manual: ${oldStock} → ${parsed}`,
    },
  ]

  const products = [...inventory.products]
  products[productIndex] = updated
  return { ...inventory, products, last_updated: now }
}

export function updateProduct(inventory, barcode, fields) {
  const productIndex = inventory.products.findIndex(
    (p) => String(p.barcode) === String(barcode)
  )
  if (productIndex === -1) throw new Error(`Producto con código ${barcode} no encontrado.`)

  const now = new Date().toISOString()
  const safeFields = { ...fields }
  delete safeFields.id
  delete safeFields.barcode
  delete safeFields.stock
  delete safeFields.history
  delete safeFields.created_at

  const updated = {
    ...inventory.products[productIndex],
    ...safeFields,
    updated_at: now,
  }

  if ('exclusive' in safeFields) {
    updated.is_exclusive = Boolean(safeFields.exclusive)
  }

  const products = [...inventory.products]
  products[productIndex] = updated
  return { ...inventory, products, last_updated: now }
}

export function deleteProduct(inventory, barcode) {
  if (!findByBarcode(inventory, barcode)) {
    throw new Error(`Producto con código ${barcode} no encontrado.`)
  }
  const now = new Date().toISOString()
  return {
    ...inventory,
    products: inventory.products.filter((p) => String(p.barcode) !== String(barcode)),
    last_updated: now,
  }
}

export function addProduct(inventory, product) {
  if (!product?.barcode) throw new Error('El producto debe incluir un código de barras.')
  if (findByBarcode(inventory, product.barcode)) {
    throw new Error(`Ya existe un producto con el código ${product.barcode}.`)
  }

  const now = new Date().toISOString()
  const newProduct = {
    id: String(product.barcode),
    barcode: String(product.barcode),
    name: product.name || 'Sin nombre',
    number: product.number || null,
    line: product.line || null,
    series: product.series || null,
    exclusive: product.exclusive || null,
    is_exclusive: Boolean(product.exclusive),
    image_front: product.image_front || null,
    image_base: product.image_base || null,
    stock: 1,
    price: product.price || null,
    notes: product.notes || '',
    created_at: now,
    updated_at: now,
    history: [{ action: 'add', units: 1, date: now, note: 'Producto creado' }],
  }

  return {
    ...inventory,
    products: [...inventory.products, newProduct],
    last_updated: now,
  }
}
