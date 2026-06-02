import { useNavigate } from 'react-router-dom'

/**
 * Stock badge color semantics:
 *  green  → stock >= 2
 *  yellow → stock === 1
 *  red    → stock === 0
 */
function StockBadge({ stock }) {
  const s = stock || 0
  const color =
    s === 0
      ? 'bg-red-900/60 text-red-300 border-red-700/50'
      : s === 1
      ? 'bg-amber-900/60 text-amber-300 border-amber-700/50'
      : 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50'

  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {s === 0 ? 'Sin stock' : `${s} uds`}
    </span>
  )
}

/**
 * Placeholder shown when a product has no front image.
 */
function ImagePlaceholder() {
  return (
    <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700/50">
      <span className="text-2xl">🧸</span>
    </div>
  )
}

/**
 * ProductCard — compact card for the catalog grid.
 * Tapping navigates to /product/:id
 */
export default function ProductCard({ product }) {
  const navigate = useNavigate()

  if (!product) return null

  const { id, name, number, line, is_exclusive, exclusive, stock, image_front } = product

  return (
    <button
      onClick={() => navigate(`/product/${id}`)}
      className="w-full text-left card p-3 flex items-center gap-3 
                 active:scale-[0.98] transition-transform duration-100
                 hover:border-slate-600/80"
    >
      {/* Thumbnail */}
      {image_front ? (
        <img
          src={image_front}
          alt={name}
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-slate-700/50"
        />
      ) : (
        <ImagePlaceholder />
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-100 leading-tight truncate">
            {name || 'Sin nombre'}
          </p>
          <StockBadge stock={stock} />
        </div>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {line && (
            <span className="text-xs text-slate-400">{line}</span>
          )}
          {number && (
            <span className="text-xs text-slate-600">#{number}</span>
          )}
        </div>

        {is_exclusive && exclusive && (
          <span className="inline-block mt-1.5 text-xs font-medium
                           bg-funko-orange/15 text-funko-orange
                           border border-funko-orange/30
                           px-2 py-0.5 rounded-full">
            {exclusive}
          </span>
        )}
      </div>

      {/* Chevron */}
      <span className="text-slate-600 flex-shrink-0 text-lg">›</span>
    </button>
  )
}
