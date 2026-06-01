const variants = {
  default: 'bg-slate-800 text-slate-300',
  exclusive: 'bg-amber-900/60 text-amber-300 border border-amber-700/50',
  stock: 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/40',
  'stock-low': 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/40',
  empty: 'bg-red-900/50 text-red-400 border border-red-700/40',
  info: 'bg-blue-900/50 text-blue-300 border border-blue-700/40',
}

/**
 * Badge — small pill label with semantic color variants.
 * @param {'default'|'exclusive'|'stock'|'stock-low'|'empty'|'info'} variant
 */
export default function Badge({ variant = 'default', children, className = '' }) {
  const cls = variants[variant] || variants.default
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${cls} ${className}`}>
      {children}
    </span>
  )
}
