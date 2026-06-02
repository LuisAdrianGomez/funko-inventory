/**
 * github.js — GitHub Contents API integration
 *
 * Reads and writes inventory.json stored in the GitHub repo.
 * Auth: VITE_GITHUB_TOKEN (Personal Access Token with contents:write scope).
 * The token lives in .env.local and is NEVER committed.
 *
 * API reference: https://docs.github.com/en/rest/repos/contents
 */

const GITHUB_API = 'https://api.github.com'

// Config from environment (set in .env.local)
const OWNER  = import.meta.env.VITE_GITHUB_OWNER
const REPO   = import.meta.env.VITE_GITHUB_REPO
const BRANCH = import.meta.env.VITE_GITHUB_BRANCH || 'main'
const TOKEN  = import.meta.env.VITE_GITHUB_TOKEN

// Path to the inventory file inside the repo
const INVENTORY_PATH = 'public/data/inventory.json'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`
  return headers
}

function apiUrl(path) {
  return `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`
}

/**
 * Encodes a JavaScript string to Base64 (UTF-8 safe).
 */
function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)))
}

/**
 * Decodes a Base64 string to a JavaScript string (UTF-8 safe).
 */
function fromBase64(b64) {
  return decodeURIComponent(escape(atob(b64)))
}

// ---------------------------------------------------------------------------
// Core API functions
// ---------------------------------------------------------------------------

/**
 * Reads the inventory.json from GitHub.
 * Returns { data: inventoryObject, sha: string }
 * The SHA is required for subsequent writes.
 *
 * On a public repo this works without a token.
 * On a private repo the token must be present.
 */
export async function readInventory() {
  const res = await fetch(apiUrl(INVENTORY_PATH), {
    headers: authHeaders(),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    // 404 means the file doesn't exist yet — return empty inventory
    if (res.status === 404) {
      return { data: createEmptyInventory(), sha: null }
    }
    throw new Error(
      `GitHub read failed [${res.status}]: ${err.message || res.statusText}`
    )
  }

  const file = await res.json()
  // GitHub returns content base64-encoded (with newlines)
  const content = fromBase64(file.content.replace(/\n/g, ''))
  const data = JSON.parse(content)

  return { data, sha: file.sha }
}

/**
 * Writes the updated inventoryData back to GitHub.
 * Requires the current file SHA (from readInventory) to avoid conflicts.
 *
 * @param {object} inventoryData - The full inventory object
 * @param {string|null} sha      - Current file SHA (null to create new file)
 * @returns {Promise<string>}    - New SHA after write
 */
export async function writeInventory(inventoryData, sha) {
  if (!TOKEN) {
    throw new Error(
      'VITE_GITHUB_TOKEN is required for write operations. Add it to .env.local'
    )
  }

  const updatedInventory = {
    ...inventoryData,
    last_updated: new Date().toISOString(),
  }

  const body = {
    message: `chore: update inventory [${new Date().toISOString()}]`,
    content: toBase64(JSON.stringify(updatedInventory, null, 2)),
    branch: BRANCH,
  }

  // sha is required when updating an existing file
  if (sha) body.sha = sha

  const res = await fetch(
    `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${INVENTORY_PATH}`,
    {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    // 409 Conflict: someone else updated the file — caller should re-read and retry
    if (res.status === 409) {
      throw new Error(
        'Conflicto de escritura: el archivo fue modificado externamente. ' +
        'Recarga la app para obtener la versión más reciente.'
      )
    }
    throw new Error(
      `GitHub write failed [${res.status}]: ${err.message || res.statusText}`
    )
  }

  const result = await res.json()
  return result.content.sha
}

// ---------------------------------------------------------------------------
// Inventory mutation helpers (pure functions — no side effects)
// ---------------------------------------------------------------------------

/**
 * Returns an empty inventory object matching the schema v1.0.
 */
export function createEmptyInventory() {
  return {
    version: '1.0',
    last_updated: new Date().toISOString(),
    products: [],
  }
}

/**
 * Finds a product by its barcode value.
 * Returns the product object or undefined.
 *
 * @param {object} inventory
 * @param {string} barcode
 */
export function findByBarcode(inventory, barcode) {
  if (!inventory?.products || !barcode) return undefined
  return inventory.products.find(
    (p) => String(p.barcode) === String(barcode)
  )
}

/**
 * Adds +1 unit to an existing product identified by barcode.
 * Returns a NEW inventory object (immutable update).
 * Throws if the product is not found.
 *
 * @param {object} inventory
 * @param {string} barcode
 * @returns {object} updated inventory
 */
export function addUnit(inventory, barcode) {
  const productIndex = inventory.products.findIndex(
    (p) => String(p.barcode) === String(barcode)
  )
  if (productIndex === -1) {
    throw new Error(`Producto con código ${barcode} no encontrado.`)
  }

  const now = new Date().toISOString()
  const updated = { ...inventory.products[productIndex] }
  updated.stock = (updated.stock || 0) + 1
  updated.updated_at = now
  updated.history = [
    ...(updated.history || []),
    { action: 'add', units: 1, date: now, note: '' },
  ]

  const products = [...inventory.products]
  products[productIndex] = updated

  return { ...inventory, products, last_updated: now }
}

/**
 * Removes 1 unit from an existing product identified by barcode.
 * Stock cannot go below 0.
 * Returns a NEW inventory object (immutable update).
 * Throws if the product is not found.
 *
 * @param {object} inventory
 * @param {string} barcode
 * @returns {object} updated inventory
 */
export function removeUnit(inventory, barcode) {
  const productIndex = inventory.products.findIndex(
    (p) => String(p.barcode) === String(barcode)
  )
  if (productIndex === -1) {
    throw new Error(`Producto con código ${barcode} no encontrado.`)
  }

  const product = inventory.products[productIndex]
  if ((product.stock || 0) <= 0) {
    throw new Error(`El stock de "${product.name}" ya está en 0.`)
  }

  const now = new Date().toISOString()
  const updated = { ...product }
  updated.stock = updated.stock - 1
  updated.updated_at = now
  updated.history = [
    ...(updated.history || []),
    { action: 'remove', units: 1, date: now, note: '' },
  ]

  const products = [...inventory.products]
  products[productIndex] = updated

  return { ...inventory, products, last_updated: now }
}

/**
 * Sets the stock of a product to an explicit value.
 * Records the delta as a history entry.
 * Returns a NEW inventory object (immutable update).
 * Throws if the product is not found or value is invalid.
 *
 * @param {object} inventory
 * @param {string} barcode
 * @param {number} newValue  - Must be >= 0
 * @returns {object} updated inventory
 */
export function setStock(inventory, barcode, newValue) {
  const parsed = parseInt(newValue, 10)
  if (isNaN(parsed) || parsed < 0) {
    throw new Error('El stock debe ser un número entero igual o mayor a 0.')
  }

  const productIndex = inventory.products.findIndex(
    (p) => String(p.barcode) === String(barcode)
  )
  if (productIndex === -1) {
    throw new Error(`Producto con código ${barcode} no encontrado.`)
  }

  const product = inventory.products[productIndex]
  const oldStock = product.stock || 0
  const delta = parsed - oldStock

  if (delta === 0) return inventory // No change needed

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

/**
 * Updates the metadata fields of an existing product.
 * Does NOT modify stock or history — use addUnit/removeUnit/setStock for that.
 * Returns a NEW inventory object (immutable update).
 * Throws if the product is not found.
 *
 * @param {object} inventory
 * @param {string} barcode      - Identifies the product to update
 * @param {object} fields       - Partial product fields to merge in
 * @returns {object} updated inventory
 */
export function updateProduct(inventory, barcode, fields) {
  const productIndex = inventory.products.findIndex(
    (p) => String(p.barcode) === String(barcode)
  )
  if (productIndex === -1) {
    throw new Error(`Producto con código ${barcode} no encontrado.`)
  }

  const now = new Date().toISOString()
  // Protect immutable fields
  const { id, barcode: _bc, stock, history, created_at, ...safeFields } = fields

  const updated = {
    ...inventory.products[productIndex],
    ...safeFields,
    // Sync is_exclusive with exclusive field
    is_exclusive: Boolean(safeFields.exclusive || inventory.products[productIndex].exclusive),
    updated_at: now,
  }

  // If exclusive is explicitly set to empty string, clear is_exclusive too
  if ('exclusive' in safeFields) {
    updated.is_exclusive = Boolean(safeFields.exclusive)
  }

  const products = [...inventory.products]
  products[productIndex] = updated

  return { ...inventory, products, last_updated: now }
}

/**
 * Removes a product from the inventory entirely.
 * Returns a NEW inventory object (immutable update).
 *
 * @param {object} inventory
 * @param {string} barcode
 * @returns {object} updated inventory
 */
export function deleteProduct(inventory, barcode) {
  const exists = findByBarcode(inventory, barcode)
  if (!exists) {
    throw new Error(`Producto con código ${barcode} no encontrado.`)
  }

  const now = new Date().toISOString()
  return {
    ...inventory,
    products: inventory.products.filter(
      (p) => String(p.barcode) !== String(barcode)
    ),
    last_updated: now,
  }
}

/**
 * Adds a brand-new product to the inventory.
 * Returns a NEW inventory object (immutable update).
 * Throws if a product with the same barcode already exists.
 *
 * @param {object} inventory
 * @param {object} product - Must include at least { barcode, name }
 * @returns {object} updated inventory
 */
export function addProduct(inventory, product) {
  if (!product?.barcode) {
    throw new Error('El producto debe incluir un código de barras.')
  }
  if (findByBarcode(inventory, product.barcode)) {
    throw new Error(
      `Ya existe un producto con el código ${product.barcode}. ` +
      'Usa addUnit() para incrementar el stock.'
    )
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
