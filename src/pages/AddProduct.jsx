import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInventory } from '../hooks/useInventory'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/UI/Toast'
import Spinner from '../components/UI/Spinner'
import { compressToThumbnail } from '../utils/image'

function TextInput({ value, onChange, placeholder, disabled, type = 'text', required }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5
                 text-sm text-slate-200 placeholder-slate-600
                 focus:outline-none focus:border-slate-500
                 disabled:opacity-40"
    />
  )
}

function ImagePickerButton({ label, value, onChange, disabled }) {
  const [compressing, setCompressing] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCompressing(true)
    try {
      const b64 = await compressToThumbnail(file)
      onChange(b64)
    } catch (err) {
      console.error(err)
    } finally {
      setCompressing(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {compressing ? <Spinner size="sm" /> : value ? (
          <img src={value} alt={label} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl">📷</span>
        )}
      </div>
      <label className={`text-xs px-3 py-1.5 rounded-lg border border-slate-600
        text-slate-300 cursor-pointer hover:border-slate-400 transition-colors
        ${disabled || compressing ? 'opacity-40 pointer-events-none' : ''}`}>
        {value ? `${label} ✓` : label}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={disabled || compressing} />
      </label>
    </div>
  )
}

const EMPTY_FORM = {
  barcode: '', name: '', number: '', line: '', series: '',
  exclusive: '', is_exclusive: false, price: '', notes: '',
  image_front: null, image_base: null,
}

export default function AddProduct() {
  const navigate = useNavigate()
  const { addNewProduct, findByBarcode, loading } = useInventory()
  const { toasts, toast, dismiss } = useToast()

  const [mode, setMode] = useState('choice') // 'choice' | 'manual'
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (key) => (value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'exclusive') next.is_exclusive = Boolean(value)
      if (key === 'is_exclusive' && !value) next.exclusive = ''
      return next
    })
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.barcode.trim()) e.barcode = 'Requerido'
    if (!form.name.trim()) e.name = 'Requerido'
    if (findByBarcode(form.barcode)) e.barcode = 'Este código ya existe en el inventario'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    setSaving(true)
    try {
      await addNewProduct({
        ...form,
        price: form.price ? parseFloat(form.price) : null,
        exclusive: form.exclusive || null,
        is_exclusive: Boolean(form.exclusive),
      })
      toast.success(`"${form.name}" agregado al inventario`)
      setTimeout(() => navigate(`/product/${form.barcode}`), 800)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Choice screen ──────────────────────────────────────────────
  if (mode === 'choice') {
    return (
      <>
        <div className="max-w-md mx-auto py-4 space-y-4">
          <h2 className="text-xl font-bold text-slate-100">Agregar Funko</h2>

          {/* Manual option */}
          <button
            onClick={() => setMode('manual')}
            className="w-full card p-5 flex items-center gap-4 text-left
                       hover:border-slate-500 active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-2xl flex-shrink-0">
              ✏️
            </div>
            <div>
              <p className="font-semibold text-slate-200">Agregar manualmente</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Llena los datos del Funko a mano
              </p>
            </div>
            <span className="text-slate-600 ml-auto text-lg">›</span>
          </button>

          {/* Phase 3 placeholder */}
          <div className="card p-5 flex items-center gap-4 opacity-50 cursor-not-allowed border-dashed">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0">
              📸
            </div>
            <div>
              <p className="font-semibold text-slate-400">Con fotos — IA</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Próximamente en Fase 3 · Claude Vision
              </p>
            </div>
            <span className="text-xs bg-slate-800 text-slate-500 px-2 py-1 rounded-full ml-auto flex-shrink-0">
              Pronto
            </span>
          </div>

          {/* Steps reference */}
          <div className="card p-4 space-y-2 border-dashed border-slate-700">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Flujo Fase 3 (próximamente)
            </p>
            {[
              ['1', 'Foto frontal', 'IA extrae nombre, número y línea', false],
              ['2', 'Foto de la base', 'Lee el código de barras', false],
              ['3', 'Confirmar y guardar', 'Crea o actualiza el producto', false],
            ].map(([n, label, detail, ready]) => (
              <div key={n} className="flex items-start gap-3 py-1.5 border-b border-slate-800 last:border-0">
                <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {n}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                  <p className="text-xs text-slate-600">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </>
    )
  }

  // ── Manual form ────────────────────────────────────────────────
  return (
    <>
      <div className="max-w-md mx-auto py-4 space-y-4 pb-8">
        <button
          onClick={() => setMode('choice')}
          className="flex items-center gap-1 text-slate-400 text-sm hover:text-slate-200 transition-colors"
        >
          ‹ Atrás
        </button>

        <h2 className="text-xl font-bold text-slate-100">Nuevo Funko</h2>

        {/* Required fields */}
        <div className="card p-4 space-y-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Obligatorios</p>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Código de barras *
            </label>
            <TextInput
              value={form.barcode}
              onChange={set('barcode')}
              placeholder="Ej. 012345678901"
              disabled={saving}
              type="text"
            />
            {errors.barcode && <p className="text-xs text-red-400">{errors.barcode}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Nombre *
            </label>
            <TextInput
              value={form.name}
              onChange={set('name')}
              placeholder="Ej. Spider-Man"
              disabled={saving}
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
          </div>
        </div>

        {/* Optional fields */}
        <div className="card p-4 space-y-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Opcionales</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Número</label>
              <TextInput value={form.number} onChange={set('number')} placeholder="#03" disabled={saving} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Precio</label>
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

          {/* Exclusive */}
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
            {form.is_exclusive && (
              <TextInput
                value={form.exclusive}
                onChange={set('exclusive')}
                placeholder="Ej. Hot Topic, GameStop..."
                disabled={saving}
              />
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes')(e.target.value)}
              placeholder="Notas adicionales..."
              rows={2}
              disabled={saving}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5
                         text-sm text-slate-200 placeholder-slate-600 resize-none
                         focus:outline-none focus:border-slate-500 disabled:opacity-40"
            />
          </div>
        </div>

        {/* Images */}
        <div className="card p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fotos (opcional)</p>
          <ImagePickerButton label="Foto frontal" value={form.image_front} onChange={set('image_front')} disabled={saving} />
          <ImagePickerButton label="Foto de la base" value={form.image_base} onChange={set('image_base')} disabled={saving} />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setMode('choice')}
            disabled={saving}
            className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300
                       text-sm font-medium hover:border-slate-500 transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 py-3 rounded-xl bg-funko-orange hover:bg-funko-orange/90
                       text-white text-sm font-semibold transition-colors
                       disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Spinner size="sm" />}
            {saving ? 'Guardando...' : 'Agregar Funko'}
          </button>
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  )
}
