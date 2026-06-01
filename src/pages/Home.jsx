import { useInventory } from '../hooks/useInventory'
import Spinner from '../components/UI/Spinner'
import { formatDate } from '../utils/inventory'

export default function Home() {
  const { inventory, loading, error, stats, refresh } = useInventory()

  return (
    <div className="max-w-md mx-auto py-4 space-y-4">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-100">Dashboard</h2>
        <button
          onClick={refresh}
          disabled={loading}
          aria-label="Actualizar"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-40 transition-colors tap-highlight"
        >
          {loading ? (
            <Spinner size="sm" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          )}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-900/40 border border-red-700/50 rounded-xl px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Productos"
          value={loading ? '—' : stats.totalProducts}
          icon="📦"
          color="blue"
        />
        <StatCard
          label="Unidades"
          value={loading ? '—' : stats.totalUnits}
          icon="🔢"
          color="green"
        />
        <StatCard
          label="Exclusivos"
          value={loading ? '—' : stats.exclusives}
          icon="⭐"
          color="amber"
        />
        <StatCard
          label="Sin stock"
          value={loading ? '—' : stats.outOfStock}
          icon="⚠️"
          color={stats.outOfStock > 0 ? 'red' : 'slate'}
        />
      </div>

      {/* Last updated */}
      <p className="text-xs text-slate-500 text-center">
        Última actualización:{' '}
        <span className="text-slate-400">{formatDate(inventory?.last_updated)}</span>
      </p>

      {/* Quick actions */}
      <div className="card p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones rápidas</p>
        <p className="text-sm text-slate-400">
          Usa el botón <span className="text-funko-orange font-bold">+</span> en la barra inferior para agregar un Funko.
        </p>
      </div>

      {/* Upcoming phases hint */}
      <div className="card p-4 border-dashed border-slate-700 space-y-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Próximas fases</p>
        <ul className="text-xs text-slate-500 space-y-1 mt-1">
          <li>📋 Fase 2 — Catálogo completo + edición manual</li>
          <li>🤖 Fase 3 — Agente IA (lectura de fotos + código de barras)</li>
          <li>🔔 Fase 4 — Notificaciones push</li>
        </ul>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  const colors = {
    blue:  'bg-blue-900/30 border-blue-800/40',
    green: 'bg-emerald-900/30 border-emerald-800/40',
    amber: 'bg-amber-900/30 border-amber-800/40',
    red:   'bg-red-900/30 border-red-800/40',
    slate: 'bg-slate-900 border-slate-800',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.slate}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}
