import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInventory } from '../hooks/useInventory'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/UI/Toast'
import Spinner from '../components/UI/Spinner'
import { compressToThumbnail } from '../utils/image'

function TextInput({ value, onChange, placeholder, disabled, type = 'text' }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5
                 text-sm text-slate-200 placeholder-slate-600
                 focus:outline-none focus:border-slate-500
                 disabled:opacity-40 disabled:cursor-not-allowed"
    />
  )
}

function ImageUpload({ label, current, onUpload, disabled }) {
  const [compressing, setCompressing] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCompressing(true)
    try {
      const b64 = await compressToThumbnail(file)
      onUpload(b64)
    } catch (err) {
      console.error('Image compress error:', err)
    } finally {
      setCompressing(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700
                      flex items-center justify-center flex-shrink-0 overflow-hidden">
        {compressing ? <Spinner size="sm" /> : current
          ? <img src={current} alt={label} className="w-full h-full object-cover" />
          : <span className="text-2xl">📷</span>
        }
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <label className={`
          inline-block text-xs px-3 py-1.5 rounded-lg border border-slate-600
          text-slate-300 cursor-pointer hover:border-slate-400 transition-colors
          ${disabled || compressing ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
        `}>
          {current ? 'Cambiar foto' : 'Subir foto'}
          <input type="file" accept="image/*" className="hidden"
                 onChange={handleFile} disabled={disabled || compressing} />
        </label>
      </div>
    </div>
  )
}

const EMPTY_FORM = {
  name: '', number: '', line: '', series: '',
  exclusive: '', is_exclusive: false,
  price: '', notes: '',
  image_front: null, image_base: null,
}

export default function ProductEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { findByBarcode, editProduct, loading } = useInventory()
  const { toasts, toast, dismiss } = useToast()

  const [form, setForm]     = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [ready, setReady]   = useState(false)   // true once form is populated

  const product = findByBarcode(id)

  // Populate form once the product is available from context
  useEffect(() => {
    if (product && !ready) {
      setForm({
        name:        product.name        || '',
        number:      product.number      || '',
        line:        product.line        || '',
        series:      product.series      || '',
        exclusive:   product.exclusive   || '',
        is_exclusive: product.is_exclusive || false,
        price:       product.price != null ? String(product.price) : '',
        notes:       product.notes       || '',
        image_front: product.image_front || null,
        image_base:  product.image_base  || null,
      })
      setReady(true)
    }
  }, [product, ready])

  const set = (key) => (value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'exclusive')    next.is_exclusive = Boolean(String(value || '').trim())
      if (key === 'is_exclusive' && !value) next.exclusive = ''
      return next
    })
  }

  // Still loading from GitHub
  if (loading || !ready) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto py-8 text-center space-y-3">
        <p className="text-slate-400">Producto no encontrado.</p>
        <button onClick={() => navigate('/catalog')}
          className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm">
          Volver al catálogo
        </button>
      </div>
    )
  }

  const handleSave = async () => {
    if (!form.name?.trim()) { toast.error('El nombre es requerido.'); return }
    const exclusive = form.exclusive?.trim() || ''
    setSaving(true)
    try {
      const ok = await editProduct(product.barcode, {
        ...form,
        price:       form.price ? parseFloat(form.price) : null,
        exclusive:   exclusive || null,
        is_exclusive: Boolean(exclusive),
      })
      if (ok) {
        toast.success('Cambios guardados ✓')
        setTimeout(() => navigate(`/product/${id}`), 800)
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

        <h2 className="text-xl font-bold text-slate-100">Editar Funko</h2>

        <div className="card p-4 space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Nombre *</label>
            <TextInput value={form.name} onChange={set('name')} placeholder="Ej. Spider-Man" disabled={saving} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Número</label>
              <TextInput value={form.number} onChange={set('number')} placeholder="Ej. 03" disabled={saving} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Precio (MXN)</label>
              <TextInput type="number" value={form.price} onChange={set('price')} placeholder="0.00" disabled={saving} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Línea</label>
            <TextInput value={form.line} onChange={set('line')} placeholder="Ej. Marvel" disabled={saving} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Serie</label>
            <TextInput value={form.series} onChange={set('series')} placeholder="Ej. Marvel Studios" disabled={saving} />
          </div>

          {/* Exclusive toggle */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Exclusivo de</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set('is_exclusive')(!form.is_exclusive)}
                className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                  form.is_exclusive ? 'bg-funko-orange' : 'bg-slate-700'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.is_exclusive ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
              <span className="text-xs text-slate-400">
                {form.is_exclusive ? 'Es exclusivo' : 'No es exclusivo'}
              </span>
            </div>
            <TextInput
              value={form.exclusive}
              onChange={set('exclusive')}
              placeholder="Ej. Hot Topic, GameStop..."
              disabled={saving}
            />
            <p className="text-xs text-slate-500">
              Si capturas una tienda o evento, se marcará como exclusivo. Si lo dejas vacío, se guarda como no exclusivo.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes')(e.target.value)}
              placeholder="Notas adicionales..."
              rows={3}
              disabled={saving}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5
                         text-sm text-slate-200 placeholder-slate-600 resize-none
                         focus:outline-none focus:border-slate-500 disabled:opacity-40"
            />
          </div>
        </div>

        {/* Images */}
        <div className="card p-4 space-y-4">
          <p className="text-sm font-semibold text-slate-300">Fotos</p>
          <ImageUpload label="Foto frontal"    current={form.image_front} onUpload={set('image_front')} disabled={saving} />
          <ImageUpload label="Foto de la base" current={form.image_base}  onUpload={set('image_base')}  disabled={saving} />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/product/${id}`)}
            disabled={saving}
            className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300
                       text-sm font-medium hover:border-slate-500 transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-funko-orange hover:bg-funko-orange/90
                       text-white text-sm font-semibold transition-colors
                       disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Spinner size="sm" />}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  )
}
