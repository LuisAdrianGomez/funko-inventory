import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInventory } from '../hooks/useInventory'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/UI/Toast'
import Spinner from '../components/UI/Spinner'

function formatSoldDate(date) {
  return new Date(date).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function SoldCleanup() {
  const navigate = useNavigate()
  const { inventory, deleteSoldCleanupEntries, loading } = useInventory()
  const { toasts, toast, dismiss } = useToast()

  const [selected, setSelected] = useState(() => new Set())
  const [saving, setSaving] = useState(false)

  const entries = useMemo(() => {
    return [...(inventory?.sold_cleanup || [])].sort((a, b) => {
      return new Date(b.sold_at).getTime() - new Date(a.sold_at).getTime()
    })
  }, [inventory?.sold_cleanup])

  const productsByBarcode = useMemo(() => {
    return new Map((inventory?.products || []).map((product) => [String(product.barcode), product]))
  }, [inventory?.products])

  const selectedIds = [...selected]
  const allSelected = entries.length > 0 && selected.size === entries.length

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(() => {
      if (allSelected) return new Set()
      return new Set(entries.map((entry) => entry.id))
    })
  }

  async function handleDeleteSelected() {
    if (selectedIds.length === 0) return
    setSaving(true)
    try {
      const ok = await deleteSoldCleanupEntries(selectedIds)
      if (ok) {
        toast.success(`${selectedIds.length} registro${selectedIds.length !== 1 ? 's' : ''} eliminado${selectedIds.length !== 1 ? 's' : ''}.`)
        setSelected(new Set())
      } else {
        toast.error('No se pudo actualizar la lista. Intenta de nuevo.')
      }
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  }

  return (
    <>
      <div className="max-w-3xl mx-auto py-4 space-y-4 pb-24">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              aria-label="Volver"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Depuración de vendidos</h2>
              <p className="text-xs text-slate-500">
                Piezas vendidas pendientes de quitar de tus fotos.
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                disabled={entries.length === 0 || saving}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-funko-orange"
              />
              Seleccionar todo
            </label>

            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={selected.size === 0 || saving}
              className="px-3 py-2 rounded-xl border border-red-800/60 text-sm font-semibold text-red-400
                         hover:bg-red-900/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors
                         flex items-center gap-2"
            >
              {saving && <Spinner size="sm" />}
              Eliminar seleccionados
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Esto solo quita registros de esta lista. No cambia stock ni historial.
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-slate-400">No hay piezas vendidas pendientes de depurar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const checked = selected.has(entry.id)
              const product = productsByBarcode.get(String(entry.barcode))

              return (
                <div key={entry.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(entry.id)}
                      disabled={saving}
                      className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-800 accent-funko-orange"
                    />

                    <button
                      type="button"
                      onClick={() => navigate(`/product/${entry.barcode}`)}
                      className="flex-1 min-w-0 text-left flex gap-3"
                    >
                      <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                        {product?.image_front ? (
                          <img
                            src={product.image_front}
                            alt={entry.product_name || 'Figura vendida'}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-2xl">📦</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-100 truncate">
                              {entry.product_name || 'Sin nombre'}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {entry.number ? `#${entry.number}` : 'Sin número'}
                              {entry.line ? ` · ${entry.line}` : ''}
                              {entry.series ? ` · ${entry.series}` : ''}
                            </p>
                          </div>
                          <p className="text-xs text-red-400 font-semibold shrink-0">Vendido</p>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>{formatSoldDate(entry.sold_at)}</span>
                          {entry.exclusive && <span>· {entry.exclusive}</span>}
                          <span>· Barcode {entry.barcode}</span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  )
}
