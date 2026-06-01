/**
 * Spinner — animated loading indicator.
 * @param {'sm'|'md'|'lg'} size
 */
export default function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={`${sizes[size]} border-2 border-slate-700 border-t-funko-orange rounded-full animate-spin ${className}`}
    />
  )
}
