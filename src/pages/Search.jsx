import { useState } from 'react'
import { useInventory } from '../hooks/useInventory'
import ProductCard from '../components/Inventory/ProductCard'
import Spinner from '../components/UI/Spinner'
import { searchProducts } from '../utils/inventory'

export default function Search() {
  const [query, setQuery] = useState('')
  const { inventory, loading } = useInventory()

  const results = searchProducts(inventory, query)

  return (
    <div className="max-w-md mx-auto py-4 space-y-4">
      <h2 className="text-xl font-bold text-slate-100">Buscar</h2>

      {/* Search input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="search"
          placeholder="Nombre, línea, número, barcode…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-funko-orange transition-colors"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            aria-label="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {/* Results */}
      {!loading && query && (
        <p className="text-xs text-slate-500">
          {results.length} resultado{results.length !== 1 ? 's' : ''} para &ldquo;{query}&rdquo;
        </p>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center space-y-2">
          <span className="text-4xl">🔍</span>
          <p className="text-slate-400 font-medium">Sin resultados</p>
          <p className="text-sm text-slate-500">Intenta con otro término de búsqueda.</p>
        </div>
      )}

      {!loading && !query && (
        <p className="text-sm text-slate-500 text-center py-8">
          Escribe para buscar en tu inventario.
        </p>
      )}
    </div>
  )
}
