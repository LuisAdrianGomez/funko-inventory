import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useInventory } from '../hooks/useInventory'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/UI/Toast'
import Spinner from '../components/UI/Spinner'

function formatHistoryDate(date) {
  return new Date(date).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toDateTimeLocalValue(date) {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function actionLabel(action) {
  if (action === 'add') return 'Entrada'
  if (action === 'remove') return 'Salida'
  return 'Movimiento'
}

function EditHistoryModal({ entry, initialNote, initialDate, saving, onCancel, onSave }) {
  const [note, setNote] = useState(initialNote)
  const [date, setDate] = useState(toDateTimeLocalValue(initialDate))

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card w-full max-w-sm p-5 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100">Editar movimiento</h3>
          <p className="text-xs text-slate-500 mt-1">
            {actionLabel(entry.action)} · {entry.units} unidad{entry.units !== 1 ? 'es' : ''}
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Fecha y hora
          </label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={saving}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5
                       text-sm text-slate-200 focus:outline-none focus:border-slate-500
                       disabled:opacity-40"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Descripción
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            disabled={saving}
            placeholder="Descripción del movimiento..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5
                       text-sm text-slate-200 placeholder-slate-600 resize-none
                       focus:outline-none focus:border-slate-500 disabled:opacity-40"
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300
                       text-sm font-medium hover:border-slate-500 transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave({ note, date })}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-funko-orange hover:bg-funko-orange/90
                       text-white text-sm font-semibold transition-colors
                       disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Spinner size="sm" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProductHistory() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { findByBarcode, editHistoryEntry, loading } = useInventory()
  const { toasts, toast, dismiss } = useToast()

  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const product = findByBarcode(id)
  const history = product?.history || []
  const entries = history
    .map((entry, index) => ({ entry, index }))
    .reverse()

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto py-8 text-center space-y-3">
        <p className="text-slate-400">Producto no encontrado.</p>
        <button
          onClick={() => navigate('/catalog')}
          className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm"
        >
          Volver al catálogo
        </button>
      </div>
    )
  }

  const handleSave = async ({ note, date }) => {
    if (!editing) return
    if (!date) {
      toast.error('La fecha del movimiento es requerida.')
      return
    }

    const parsedDate = new Date(date)
    if (Number.isNaN(parsedDate.getTime())) {
      toast.error('La fecha del movimiento no es válida.')
      return
    }

    setSaving(true)
    try {
      const ok = await editHistoryEntry(product.barcode, editing.index, {
        note,
        date: parsedDate.toISOString(),
      })
      if (ok) {
        toast.success('Movimiento actualizado.')
        setEditing(null)
      } else {
        toast.error('No se pudo guardar. Intenta de nuevo.')
      }
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="max-w-md mx-auto py-4 space-y-4 pb-8">
        <button
          onClick={() => navigate(`/product/${id}`)}
          className="flex items-center gap-1 text-slate-400 text-sm hover:text-slate-200 transition-colors"
        >
          ‹ Detalle
        </button>

        <div>
          <h2 className="text-xl font-bold text-slate-100">Historial</h2>
          <p className="text-sm text-slate-500 mt-1">{product.name}</p>
        </div>

        {entries.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-sm text-slate-500">Este producto aún no tiene movimientos.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map(({ entry, index }) => {
              const isAdd = entry.action === 'add'
              return (
                <div key={`${entry.date}-${index}`} className="card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-sm font-semibold ${isAdd ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isAdd ? '+' : '-'}{entry.units} unidad{entry.units !== 1 ? 'es' : ''}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatHistoryDate(entry.date)}</p>
                    </div>
                    <button
                      onClick={() => setEditing({ entry, index })}
                      className="text-xs text-funko-orange hover:text-funko-orange/80 transition-colors"
                    >
                      Editar
                    </button>
                  </div>

                  <p className="text-sm text-slate-300 bg-slate-800/60 rounded-lg px-3 py-2">
                    {entry.note || 'Sin descripción'}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {editing && (
        <EditHistoryModal
          entry={editing.entry}
          initialNote={editing.entry.note || ''}
          initialDate={editing.entry.date}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  )
}
