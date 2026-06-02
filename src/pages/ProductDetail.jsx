import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInventory } from '../hooks/useInventory'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/UI/Toast'
import Spinner from '../components/UI/Spinner'

function HistoryRow({ entry }) {
  const date = new Date(entry.date)
  const formatted = date.toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  const isAdd = entry.action === 'add'
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
      <div>
        <span className={`text-xs font-semibold ${isAdd ? 'text-emerald-400' : 'text-red-400'}`}>
          {isAdd ? `+${entry.units}` : `-${entry.units}`}
        </span>
        {entry.note && (
          <span className="text-xs text-slate-500 ml-2">{entry.note}</span>
        )}
      </div>
      <span className="text-xs text-slate-600">{formatted}</span>
    </div>
  )
}

function DeleteModal({ productName, onConfirm, onCancel, loading }) {
  return (
    // Fixed overlay — centered both axes
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-100">¿Eliminar producto?</h3>
        <p className="text-sm text-slate-400">
          Se eliminará{' '}
          <span className="text-slate-200 font-medium">"{productName}"</span>{' '}
          del inventario permanentemente. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300
                       text-sm font-medium hover:border-slate-500 transition-colors
                       disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700
                       text-white text-sm font-semibold transition-colors
                       disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Spinner size="sm" />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { findByBarcode, addUnit, removeUnit, updateStock, removeProduct, loading } = useInventory()
  const { toasts, toast, dismiss } = useToast()

  const [stockInput, setStockInput] = useState('')
  const [saving, setSaving]         = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  const product = findByBarcode(id)

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto py-8 text-center space-y-3">
        <span className="text-4xl">🔍</span>
        <p className="text-slate-400">Producto no encontrado.</p>
        <button onClick={() => navigate('/catalog')}
          className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm">
          Volver al catálogo
        </button>
      </div>
    )
  }

  const handleAddUnit = async () => {
    setSaving(true)
    try {
      const ok = await addUnit(product.barcode)
      if (ok) toast.success(`+1 unidad a "${product.name}"`)
      else toast.error('No se pudo guardar. Intenta de nuevo.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveUnit = async () => {
    if ((product.stock || 0) <= 0) return
    setSaving(true)
    try {
      const ok = await removeUnit(product.barcode)
      if (ok) toast.success(`-1 unidad a "${product.name}"`)
      else toast.error('No se pudo guardar. Intenta de nuevo.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSetStock = async () => {
    const val = parseInt(stockInput, 10)
    if (isNaN(val) || val < 0) {
      toast.error('Ingresa un número válido (0 o más).')
      return
    }
    setSaving(true)
    try {
      const ok = await updateStock(product.barcode, val)
      if (ok) { toast.success(`Stock actualizado a ${val}`); setStockInput('') }
      else toast.error('No se pudo guardar. Intenta de nuevo.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const ok = await removeProduct(product.barcode)
      if (ok) {
        navigate('/catalog', { replace: true })
      } else {
        toast.error('No se pudo eliminar. Intenta de nuevo.')
        setDeleting(false)
        setShowDelete(false)
      }
    } catch (e) {
      toast.error(e.message)
      setDeleting(false)
      setShowDelete(false)
    }
  }

  const stockColor =
    (product.stock || 0) === 0 ? 'text-red-400' :
    (product.stock || 0) === 1 ? 'text-amber-400' : 'text-emerald-400'

  return (
    <>
      <div className="max-w-md mx-auto py-4 space-y-4 pb-8">
        {/* Back */}
        <button
          onClick={() => navigate('/catalog')}
          className="flex items-center gap-1 text-slate-400 text-sm hover:text-slate-200 transition-colors"
        >
          ‹ Catálogo
        </button>

        {/* Front image */}
        <div className="rounded-2xl overflow-hidden bg-slate-800 border border-slate-700/50
                        max-h-64 flex items-center justify-center aspect-square">
          {product.image_front
            ? <img src={product.image_front} alt={product.name} className="w-full h-full object-contain" />
            : <span className="text-6xl">🧸</span>
          }
        </div>

        {/* Main info */}
        <div className="card p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-bold text-slate-100 leading-tight">{product.name}</h2>
            {product.is_exclusive && product.exclusive && (
              <span className="flex-shrink-0 text-xs font-medium bg-funko-orange/15 text-funko-orange
                               border border-funko-orange/30 px-2 py-1 rounded-full">
                {product.exclusive}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {product.line && (
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Línea</p>
                <p className="text-slate-200">{product.line}</p>
              </div>
            )}
            {product.number && (
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Número</p>
                <p className="text-slate-200">#{product.number}</p>
              </div>
            )}
            {product.series && (
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Serie</p>
                <p className="text-slate-200">{product.series}</p>
              </div>
            )}
            {product.price != null && (
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Precio</p>
                <p className="text-slate-200">${product.price}</p>
              </div>
            )}
          </div>

          {product.notes && (
            <p className="text-sm text-slate-400 bg-slate-800/60 rounded-lg px-3 py-2">
              {product.notes}
            </p>
          )}

          {product.image_base ? (
            <div className="flex items-center gap-3">
              <p className="text-xs text-slate-500">Base:</p>
              <img src={product.image_base} alt="Base"
                   className="w-12 h-12 rounded-lg object-cover border border-slate-700" />
              <p className="text-xs text-slate-500 font-mono">{product.barcode}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-600 font-mono">Barcode: {product.barcode}</p>
          )}
        </div>

        {/* Stock panel */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-300">Stock</p>
            <span className={`text-2xl font-bold ${stockColor}`}>{product.stock || 0}</span>
          </div>

          {/* +/- buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRemoveUnit}
              disabled={saving || (product.stock || 0) <= 0}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-200
                         text-lg font-bold hover:border-red-600/60 hover:text-red-400
                         disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              −
            </button>
            <span className={`text-xl font-bold w-10 text-center flex items-center justify-center ${stockColor}`}>
              {saving ? <Spinner size="sm" /> : (product.stock || 0)}
            </span>
            <button
              onClick={handleAddUnit}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-200
                         text-lg font-bold hover:border-emerald-600/60 hover:text-emerald-400
                         disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>

          {/* Direct input */}
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              value={stockInput}
              onChange={(e) => setStockInput(e.target.value)}
              placeholder="Valor exacto..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2
                         text-sm text-slate-200 placeholder-slate-600
                         focus:outline-none focus:border-slate-500"
            />
            <button
              onClick={handleSetStock}
              disabled={saving || stockInput === ''}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600
                         text-slate-200 text-sm font-medium transition-colors
                         disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Aplicar
            </button>
          </div>
        </div>

        {/* History */}
        {product.history?.length > 0 && (
          <div className="card p-4">
            <p className="text-sm font-semibold text-slate-300 mb-3">Historial</p>
            <div className="max-h-48 overflow-y-auto">
              {[...product.history].reverse().map((entry, i) => (
                <HistoryRow key={i} entry={entry} />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/product/${id}/edit`)}
            className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600
                       text-slate-100 text-sm font-semibold transition-colors"
          >
            ✏️ Editar
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="flex-1 py-3 rounded-xl border border-red-800/60 hover:bg-red-900/30
                       text-red-400 text-sm font-semibold transition-colors"
          >
            🗑 Eliminar
          </button>
        </div>
      </div>

      {showDelete && (
        <DeleteModal
          productName={product.name}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleting}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  )
}
