// ─────────────────────────────────────────────────────────────────────────────
// src/components/UI/NotificationBanner.jsx
//
// Banner que aparece en Home.jsx cuando el permiso de notificaciones
// está en 'default' y el usuario aún no lo ha descartado.
// ─────────────────────────────────────────────────────────────────────────────

export default function NotificationBanner({ onActivate, onDismiss }) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-4 flex items-start gap-3">
      <span className="text-xl leading-none mt-0.5">🔔</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-200 mb-0.5">
          Activa los recordatorios
        </p>
        <p className="text-xs text-zinc-500">
          Te avisamos 3 veces al día para actualizar tu inventario.
        </p>

        <div className="flex gap-2 mt-3">
          <button
            onClick={onActivate}
            className="bg-white text-zinc-900 text-xs font-semibold rounded-lg px-3 py-1.5"
          >
            Activar
          </button>
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="text-zinc-600 hover:text-zinc-400 transition-colors flex-shrink-0 p-0.5"
        aria-label="Cerrar"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
