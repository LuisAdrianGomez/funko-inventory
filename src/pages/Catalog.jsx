import { useInventory } from '../hooks/useInventory'
import ProductCard from '../components/Inventory/ProductCard'
import Spinner from '../components/UI/Spinner'
import { sortProducts } from '../utils/inventory'

export default function Catalog() {
  const { inventory, loading, error, stats } = useInventory()
  const products = sortProducts(inventory?.products || [], 'name', 'asc')

  return (
    <div className="max-w-md mx-auto py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-100">Catálogo</h2>
        {!loading && (
          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-full">
            {stats.totalProducts} producto{stats.totalProducts !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/40 border border-red-700/50 rounded-xl px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <span className="text-5xl">📦</span>
          <p className="text-slate-300 font-semibold">Sin productos aún</p>
          <p className="text-sm text-slate-500 max-w-xs">
            Agrega tu primer Funko usando el botón{' '}
            <span className="text-funko-orange font-bold">+</span> en la barra inferior.
          </p>
        </div>
      )}

      {/* Product grid */}
      {!loading && products.length > 0 && (
        <div className="space-y-2">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
