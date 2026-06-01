import { useState, useEffect, useCallback } from 'react'
import { useGitHub } from './useGitHub'
import {
  addUnit as addUnitHelper,
  addProduct as addProductHelper,
  findByBarcode,
  createEmptyInventory,
} from '../services/github'

/**
 * useInventory — the primary hook for all inventory operations.
 *
 * Loads inventory on mount, exposes helpers that update local state
 * AND persist to GitHub in one step.
 *
 * @returns {InventoryContext}
 */
export function useInventory() {
  const [inventory, setInventory] = useState(createEmptyInventory())
  const { loading, error, read, write } = useGitHub()

  // Load inventory on mount
  useEffect(() => {
    read().then((data) => {
      if (data) setInventory(data)
    })
  }, [read])

  /**
   * Persists updated inventory to GitHub and updates local state.
   * Returns true on success.
   */
  const persist = useCallback(async (updatedInventory) => {
    const ok = await write(updatedInventory)
    if (ok) setInventory(updatedInventory)
    return ok
  }, [write])

  /**
   * Refresh inventory from GitHub (e.g. after conflict).
   */
  const refresh = useCallback(async () => {
    const data = await read()
    if (data) setInventory(data)
  }, [read])

  /**
   * Add +1 unit to existing product, or create new product.
   * This is the core "scan barcode" flow:
   *   - If barcode exists → addUnit
   *   - If not → requires product metadata (from AI agent in Fase 3)
   *
   * @param {string} barcode
   * @param {object|null} productMeta - Required if creating new product
   * @returns {{ action: 'added_unit'|'created_product'|'error', message: string }}
   */
  const handleBarcode = useCallback(async (barcode, productMeta = null) => {
    const existing = findByBarcode(inventory, barcode)

    if (existing) {
      const updated = addUnitHelper(inventory, barcode)
      const ok = await persist(updated)
      return ok
        ? { action: 'added_unit', message: `+1 unidad a "${existing.name}"` }
        : { action: 'error', message: error }
    }

    if (!productMeta) {
      return {
        action: 'needs_metadata',
        message: 'Producto nuevo: se necesitan metadatos (Fase 3 — IA).',
      }
    }

    const updated = addProductHelper(inventory, { ...productMeta, barcode })
    const ok = await persist(updated)
    return ok
      ? { action: 'created_product', message: `Producto "${productMeta.name}" creado.` }
      : { action: 'error', message: error }
  }, [inventory, persist, error])

  // Derived stats (used by Home dashboard)
  const stats = {
    totalProducts: inventory.products.length,
    totalUnits: inventory.products.reduce((sum, p) => sum + (p.stock || 0), 0),
    exclusives: inventory.products.filter((p) => p.is_exclusive).length,
    outOfStock: inventory.products.filter((p) => (p.stock || 0) === 0).length,
  }

  return {
    inventory,
    loading,
    error,
    stats,
    handleBarcode,
    refresh,
    findByBarcode: (barcode) => findByBarcode(inventory, barcode),
  }
}
