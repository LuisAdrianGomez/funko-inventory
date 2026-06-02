import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import {
  readInventory,
  writeInventory,
  createEmptyInventory,
  findByBarcode as findByBarcodeHelper,
  addUnit as addUnitHelper,
  removeUnit as removeUnitHelper,
  setStock as setStockHelper,
  addProduct as addProductHelper,
  updateProduct as updateProductHelper,
  deleteProduct as deleteProductHelper,
} from '../services/github'

const InventoryContext = createContext(null)

export function InventoryProvider({ children }) {
  const [inventory, setInventory] = useState(createEmptyInventory())
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  // SHA ref — always reflects the latest SHA from GitHub
  // Using a ref (not state) so it never causes re-renders
  const shaRef = useRef(null)

  // ── Load ────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, sha } = await readInventory()
      shaRef.current = sha
      setInventory(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Persist ─────────────────────────────────────────────────────
  /**
   * Writes updatedInventory to GitHub using the current SHA.
   * Updates local state and SHA ref on success.
   * Returns true on success, false on failure.
   */
  const persist = useCallback(async (updatedInventory) => {
    setError(null)
    try {
      const newSha = await writeInventory(updatedInventory, shaRef.current)
      shaRef.current = newSha
      setInventory(updatedInventory)
      return true
    } catch (e) {
      setError(e.message)
      return false
    }
  }, [])

  // ── Public API ──────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    await load()
  }, [load])

  const addUnit = useCallback(async (barcode) => {
    const updated = addUnitHelper(inventory, barcode)
    return persist(updated)
  }, [inventory, persist])

  const removeUnit = useCallback(async (barcode) => {
    const updated = removeUnitHelper(inventory, barcode)
    return persist(updated)
  }, [inventory, persist])

  const updateStock = useCallback(async (barcode, newValue) => {
    const updated = setStockHelper(inventory, barcode, newValue)
    return persist(updated)
  }, [inventory, persist])

  const addNewProduct = useCallback(async (product) => {
    const updated = addProductHelper(inventory, product)
    return persist(updated)
  }, [inventory, persist])

  const editProduct = useCallback(async (barcode, fields) => {
    const updated = updateProductHelper(inventory, barcode, fields)
    return persist(updated)
  }, [inventory, persist])

  const removeProduct = useCallback(async (barcode) => {
    const updated = deleteProductHelper(inventory, barcode)
    return persist(updated)
  }, [inventory, persist])

  const handleBarcode = useCallback(async (barcode, productMeta = null) => {
    const existing = findByBarcodeHelper(inventory, barcode)
    if (existing) {
      const ok = await addUnit(barcode)
      return ok
        ? { action: 'added_unit', message: `+1 unidad a "${existing.name}"` }
        : { action: 'error', message: error }
    }
    if (!productMeta) {
      return { action: 'needs_metadata', message: 'Producto nuevo: se necesitan metadatos (Fase 3 — IA).' }
    }
    const ok = await addNewProduct({ ...productMeta, barcode })
    return ok
      ? { action: 'created_product', message: `Producto "${productMeta.name}" creado.` }
      : { action: 'error', message: error }
  }, [inventory, addUnit, addNewProduct, error])

  const stats = {
    totalProducts: inventory.products.length,
    totalUnits:    inventory.products.reduce((sum, p) => sum + (p.stock || 0), 0),
    exclusives:    inventory.products.filter((p) => p.is_exclusive).length,
    outOfStock:    inventory.products.filter((p) => (p.stock || 0) === 0).length,
  }

  const value = {
    inventory,
    loading,
    error,
    stats,
    refresh,
    handleBarcode,
    addUnit,
    removeUnit,
    updateStock,
    addNewProduct,
    editProduct,
    removeProduct,
    findByBarcode: (barcode) => findByBarcodeHelper(inventory, barcode),
  }

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  )
}

/**
 * useInventory — consumes the shared InventoryContext.
 * Must be used inside <InventoryProvider>.
 */
export function useInventory() {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error('useInventory must be used inside <InventoryProvider>')
  return ctx
}
