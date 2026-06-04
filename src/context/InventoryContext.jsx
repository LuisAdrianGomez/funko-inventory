/* eslint-disable react-refresh/only-export-components */

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
  updateHistoryEntry as updateHistoryEntryHelper,
  deleteSoldCleanupEntries as deleteSoldCleanupEntriesHelper,
  deleteProduct as deleteProductHelper,
} from '../services/drive'

const InventoryContext = createContext(null)

export function InventoryProvider({ children }) {
  const [inventory, setInventory] = useState(createEmptyInventory())
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  // No SHA needed with Drive — kept as null for API compatibility
  const shaRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await readInventory()
      setInventory({
        ...data,
        products: data?.products || [],
        sold_cleanup: data?.sold_cleanup || [],
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const persist = useCallback(async (updatedInventory) => {
    setError(null)
    try {
      await writeInventory(updatedInventory, shaRef.current)
      setInventory(updatedInventory)
      return true
    } catch (e) {
      setError(e.message)
      return false
    }
  }, [])

  const refresh = useCallback(async () => { await load() }, [load])

  const addUnit = useCallback(async (barcode) => {
    return persist(addUnitHelper(inventory, barcode))
  }, [inventory, persist])

  const removeUnit = useCallback(async (barcode) => {
    return persist(removeUnitHelper(inventory, barcode))
  }, [inventory, persist])

  const updateStock = useCallback(async (barcode, newValue) => {
    return persist(setStockHelper(inventory, barcode, newValue))
  }, [inventory, persist])

  const addNewProduct = useCallback(async (product) => {
    return persist(addProductHelper(inventory, product))
  }, [inventory, persist])

  const editProduct = useCallback(async (barcode, fields) => {
    return persist(updateProductHelper(inventory, barcode, fields))
  }, [inventory, persist])

  const editHistoryEntry = useCallback(async (barcode, historyIndex, fields) => {
    return persist(updateHistoryEntryHelper(inventory, barcode, historyIndex, fields))
  }, [inventory, persist])

  const deleteSoldCleanupEntries = useCallback(async (ids) => {
    return persist(deleteSoldCleanupEntriesHelper(inventory, ids))
  }, [inventory, persist])

  const removeProduct = useCallback(async (barcode) => {
    return persist(deleteProductHelper(inventory, barcode))
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

  return (
    <InventoryContext.Provider value={{
      inventory, loading, error, stats,
      refresh, handleBarcode,
      addUnit, removeUnit, updateStock,
      addNewProduct, editProduct, editHistoryEntry, deleteSoldCleanupEntries, removeProduct,
      findByBarcode: (barcode) => findByBarcodeHelper(inventory, barcode),
    }}>
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory() {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error('useInventory must be used inside <InventoryProvider>')
  return ctx
}
