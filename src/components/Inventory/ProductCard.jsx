import Badge from '../UI/Badge'

/**
 * ProductCard — displays a single Funko Pop from the inventory.
 * In Fase 1 this is a visual scaffold; full interaction comes in Fase 2.
 */
export default function ProductCard({ product }) {
  const {
    name = 'Sin nombre',
    number,
    line,
    exclusive,
    is_exclusive,
    stock = 0,
    image_front,
  } = product || {}

  return (
    <div className="card p-3 flex gap-3 tap-highlight cursor-pointer hover:border-slate-700 transition-colors">
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {image_front ? (
          <img
            src={image_front}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-2xl text-slate-600 select-none">●</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-100 truncate">{name}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {line && <span>{line}</span>}
          {number && <span className="ml-1 text-slate-500">#{number}</span>}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {is_exclusive && exclusive && (
            <Badge variant="exclusive">{exclusive}</Badge>
          )}
          <Badge variant={stock > 1 ? 'stock' : stock === 1 ? 'stock-low' : 'empty'}>
            {stock} ud{stock !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>
    </div>
  )
}
