import { useState, useRef, useCallback } from 'react'
import { useInventory } from '../hooks/useInventory'
import ProductCard from '../components/Inventory/ProductCard'
import Spinner from '../components/UI/Spinner'

// Sort options
const SORT_OPTIONS = [
  { value: 'name_asc',    label: 'A → Z' },
  { value: 'name_desc',   label: 'Z → A' },
  { value: 'stock_desc',  label: 'Mayor stock' },
  { value: 'stock_asc',   label: 'Menor stock' },
  { value: 'newest',      label: 'Más reciente' },
]

function sortProducts(products, sortKey) {
  const arr = [...products]
  switch (sortKey) {
    case 'name_asc':   return arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    case 'name_desc':  return arr.sort((a, b) => (b.name || '').localeCompare(a.name || ''))
    case 'stock_desc': return arr.sort((a, b) => (b.stock || 0) - (a.stock || 0))
    case 'stock_asc':  return arr.sort((a, b) => (a.stock || 0) - (b.stock || 0))
    case 'newest':     return arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    default:           return arr
  }
}

export default function Catalog() {
  const { inventory, loading, error, stats, refresh } = useInventory()

  const [sortKey, setSortKey]           = useState('name_asc')
  const [filterLine, setFilterLine]     = useState('all')
  const [filterExclusive, setFilterExclusive] = useState(false)
  const [refreshing, setRefreshing]     = useState(false)
  const [pullDistance, setPullDistance] = useState(0)

  // Pull-to-refresh state
  const touchStartY = useRef(null)
  const PULL_THRESHOLD = 64 // px to trigger refresh

  const handleTouchStart = useCallback((e) => {
    // Only trigger if scrolled to the top
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (touchStartY.current === null) return
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.5, PULL_THRESHOLD + 20))
    }
  }, [])

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= PULL_THRESHOLD) {
      setRefreshing(true)
      await refresh()
      setRefreshing(false)
    }
    touchStartY.current = null
    setPullDistance(0)
  }, [pullDistance, refresh])

  // Derive unique lines for filter chips
  const allLines = ['all', ...new Set(
    inventory.products
      .map((p) => p.line)
      .filter(Boolean)
      .sort()
  )]

  // Apply filters and sort
  let products = inventory.products

  if (filterLine !== 'all') {
    products = products.filter((p) => p.line === filterLine)
  }
  if (filterExclusive) {
    products = products.filter((p) => p.is_exclusive)
  }
  products = sortProducts(products, sortKey)

  const resultCount = products.length

  return (
    <div
      className="max-w-md mx-auto py-4 space-y-3"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className="flex justify-center items-center text-slate-400 text-sm gap-2 transition-all"
          style={{ height: refreshing ? 40 : pullDistance * 0.6 }}
        >
          {refreshing ? (
            <><Spinner size="sm" /><span>Actualizando...</span></>
          ) : pullDistance >= PULL_THRESHOLD ? (
            <span className="text-funko-orange text-xs">Suelta para actualizar</span>
          ) : (
            <span className="text-xs">↓ Desliza para actualizar</span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-100">Catálogo</h2>
        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-full">
          {loading ? '...' : `${stats.totalProducts} total`}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/40 border border-red-700/50 rounded-xl px-4 py-3 text-sm text-red-300 flex items-center justify-between gap-2">
          <span>{error}</span>
          <button
            onClick={refresh}
            className="text-red-300 underline text-xs flex-shrink-0"
          >
            Recargar
          </button>
        </div>
      )}

      {/* Filters */}
      {!loading && inventory.products.length > 0 && (
        <div className="space-y-2">
          {/* Line filter chips */}
          {allLines.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {allLines.map((line) => (
                <button
                  key={line}
                  onClick={() => setFilterLine(line)}
                  className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    filterLine === line
                      ? 'bg-funko-orange border-funko-orange text-white font-semibold'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {line === 'all' ? 'Todas' : line}
                </button>
              ))}
            </div>
          )}

          {/* Second row: exclusives toggle + sort */}
          <div className="flex items-center justify-between gap-2">
            {/* Exclusives toggle */}
            <button
              onClick={() => setFilterExclusive((v) => !v)}
              className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filterExclusive
                  ? 'bg-funko-orange/20 border-funko-orange/60 text-funko-orange font-semibold'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <span>⭐</span>
              <span>Exclusivos</span>
            </button>

            {/* Sort dropdown */}
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="text-xs bg-slate-800 border border-slate-700 text-slate-300
                         rounded-full px-3 py-1.5 outline-none focus:border-slate-500
                         cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Result count */}
      {!loading && inventory.products.length > 0 && (
        <p className="text-xs text-slate-500">
          {resultCount === 0
            ? 'Sin resultados para estos filtros'
            : `${resultCount} producto${resultCount !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty state — no products at all */}
      {!loading && inventory.products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <span className="text-5xl">📦</span>
          <p className="text-slate-300 font-semibold">Sin productos aún</p>
          <p className="text-sm text-slate-500 max-w-xs">
            Agrega tu primer Funko usando el botón{' '}
            <span className="text-funko-orange font-bold">+</span> en la barra inferior.
          </p>
        </div>
      )}

      {/* Empty state — filters active but no results */}
      {!loading && inventory.products.length > 0 && resultCount === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
          <span className="text-3xl">🔍</span>
          <p className="text-slate-400 text-sm">Sin resultados para estos filtros</p>
          <button
            onClick={() => { setFilterLine('all'); setFilterExclusive(false) }}
            className="text-xs text-funko-orange underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Product list */}
      {!loading && resultCount > 0 && (
        <div className="space-y-2">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
