// ============================================================
// Funko Inventory — AddProduct
// ============================================================
// Flujo completo de agregar un Funko por foto con IA.
//
// Estados:
//   idle              → pantalla de elección (foto IA vs manual)
//   step_front_photo  → CameraCapture para foto frontal
//   step_analyzing    → spinner mientras Claude extrae metadatos
//   step_base_photo   → CameraCapture para foto de la base
//   step_reading_barcode → spinner mientras ZXing lee el código
//   step_confirm      → formulario pre-llenado, editable
//   step_duplicate    → el barcode ya existe, ofrecer +1 unidad
//   step_saving       → spinner mientras se guarda en Drive
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInventory } from '../context/InventoryContext'
import { useToast } from '../hooks/useToast'
import { extractFunkoMetadata } from '../services/ai'
import { readBarcodeFromImage } from '../utils/barcode'
import { compressToThumbnail } from '../utils/image'
import CameraCapture from '../components/Camera/CameraCapture'
import Spinner from '../components/UI/Spinner'

// ── Constantes de estado ─────────────────────────────────────
const STEP = {
  IDLE:            'idle',
  FRONT_PHOTO:     'step_front_photo',
  ANALYZING:       'step_analyzing',
  BASE_PHOTO:      'step_base_photo',
  READING_BARCODE: 'step_reading_barcode',
  CONFIRM:         'step_confirm',
  DUPLICATE:       'step_duplicate',
  SAVING:          'step_saving',
  MANUAL:          'manual',
}

// ── Formulario de confirmación / edición ────────────────────
function ConfirmForm({ metadata, frontPhoto, basePhoto, barcode, onBarcodeChange, onMetaChange, onSave, onCancel, barcodeError }) {
  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <h2 className="text-lg font-semibold text-white">Confirmar datos</h2>

      {/* Thumbnails */}
      <div className="flex gap-3">
        {frontPhoto && (
          <div className="flex-1">
            <p className="text-xs text-zinc-500 mb-1">Foto frontal</p>
            <img src={frontPhoto} alt="Frontal" className="w-full h-28 object-contain rounded-lg bg-zinc-800" />
          </div>
        )}
        {basePhoto && (
          <div className="flex-1">
            <p className="text-xs text-zinc-500 mb-1">Base</p>
            <img src={basePhoto} alt="Base" className="w-full h-28 object-contain rounded-lg bg-zinc-800" />
          </div>
        )}
      </div>

      {/* Barcode */}
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Código de barras *</label>
        <input
          type="text"
          value={barcode}
          onChange={e => onBarcodeChange(e.target.value)}
          placeholder="Ingresa el código manualmente"
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700
                     text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
        />
        {barcodeError && (
          <p className="mt-1 text-xs text-amber-400">{barcodeError}</p>
        )}
      </div>

      {/* Campos de metadatos */}
      {[
        { key: 'name',      label: 'Nombre *',   placeholder: 'Ej. Spider-Man' },
        { key: 'number',    label: 'Número',      placeholder: 'Ej. 1234' },
        { key: 'line',      label: 'Línea',       placeholder: 'Ej. Marvel' },
        { key: 'series',    label: 'Serie',       placeholder: 'Ej. Marvel Studios' },
        { key: 'exclusive', label: 'Exclusiva',   placeholder: 'Ej. Hot Topic (o vacío)' },
      ].map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="block text-xs text-zinc-400 mb-1">{label}</label>
          <input
            type="text"
            value={metadata[key] || ''}
            onChange={e => onMetaChange(key, e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700
                       text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      ))}

      {/* Toggle exclusivo */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={() => onMetaChange('is_exclusive', !metadata.is_exclusive)}
          className={`w-11 h-6 rounded-full transition-colors ${metadata.is_exclusive ? 'bg-indigo-600' : 'bg-zinc-700'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white shadow mt-0.5 transition-transform
                          ${metadata.is_exclusive ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
        <span className="text-sm text-zinc-300">Es exclusivo</span>
      </label>

      {/* Botones */}
      <div className="flex flex-col gap-3 mt-2">
        <button
          onClick={onSave}
          disabled={!barcode || !metadata.name}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                     text-white font-semibold text-sm transition-colors disabled:opacity-40"
        >
          Confirmar y guardar
        </button>
        <button
          onClick={onCancel}
          className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700
                     text-zinc-300 font-semibold text-sm transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Formulario manual ────────────────────────────────────────
function ManualForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    barcode: '', name: '', number: '', line: '',
    series: '', exclusive: '', is_exclusive: false,
    price: '', notes: '',
  })

  function set(key, val) {
    setForm(prev => {
      const next = { ...prev, [key]: val }
      if (key === 'exclusive') next.is_exclusive = Boolean(String(val || '').trim())
      if (key === 'is_exclusive' && !val) next.exclusive = ''
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <h2 className="text-lg font-semibold text-white">Agregar manualmente</h2>

      {[
        { key: 'barcode',   label: 'Código de barras *', placeholder: '012345678901' },
        { key: 'name',      label: 'Nombre *',           placeholder: 'Ej. Spider-Man' },
        { key: 'number',    label: 'Número',             placeholder: 'Ej. 1234' },
        { key: 'line',      label: 'Línea',              placeholder: 'Ej. Marvel' },
        { key: 'series',    label: 'Serie',              placeholder: 'Ej. Marvel Studios' },
        { key: 'exclusive', label: 'Exclusiva',          placeholder: 'Ej. Hot Topic' },
        { key: 'price',     label: 'Precio',             placeholder: '9.99' },
        { key: 'notes',     label: 'Notas',              placeholder: '' },
      ].map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="block text-xs text-zinc-400 mb-1">{label}</label>
          <input
            type={key === 'price' ? 'number' : 'text'}
            value={form[key]}
            onChange={e => set(key, e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700
                       text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      ))}

      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={() => set('is_exclusive', !form.is_exclusive)}
          className={`w-11 h-6 rounded-full transition-colors ${form.is_exclusive ? 'bg-indigo-600' : 'bg-zinc-700'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white shadow mt-0.5 transition-transform
                          ${form.is_exclusive ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
        <span className="text-sm text-zinc-300">Es exclusivo</span>
      </label>

      <div className="flex flex-col gap-3 mt-2">
        <button
          onClick={() => onSave(form)}
          disabled={!form.barcode || !form.name}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500
                     text-white font-semibold text-sm transition-colors disabled:opacity-40"
        >
          Guardar
        </button>
        <button
          onClick={onCancel}
          className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700
                     text-zinc-300 font-semibold text-sm transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Spinner con mensaje ──────────────────────────────────────
function LoadingScreen({ message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-20">
      <Spinner />
      <p className="text-sm text-zinc-400 text-center">{message}</p>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────
export default function AddProduct() {
  const navigate                        = useNavigate()
  const { addNewProduct, addUnit, findByBarcode } = useInventory()
  const { toast }                       = useToast()

  const [step, setStep]                 = useState(STEP.IDLE)
  const [frontThumb, setFrontThumb]     = useState(null)
  const [baseThumb, setBaseThumb]       = useState(null)
  const [metadata, setMetadata]         = useState({
    name: '', number: '', line: '', series: '', exclusive: '', is_exclusive: false,
  })
  const [barcode, setBarcode]           = useState('')
  const [barcodeError, setBarcodeError] = useState('')
  const [duplicateProduct, setDuplicateProduct] = useState(null)

  // ── Helpers ────────────────────────────────────────────────

  function resetFlow() {
    setStep(STEP.IDLE)
    setFrontThumb(null)
    setBaseThumb(null)
    setMetadata({ name: '', number: '', line: '', series: '', exclusive: '', is_exclusive: false })
    setBarcode('')
    setBarcodeError('')
    setDuplicateProduct(null)
  }

  function setMeta(key, val) {
    setMetadata(prev => {
      const next = { ...prev, [key]: val }
      if (key === 'exclusive') next.is_exclusive = Boolean(String(val || '').trim())
      if (key === 'is_exclusive' && !val) next.exclusive = ''
      return next
    })
  }

  async function toThumb(base64, size) {
    try {
      // Convertir Data URL a Blob sin usar fetch (más compatible)
      const [header, data] = base64.split(',')
      const mime = header.match(/:(.*?);/)[1]
      const binary = atob(data)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      const file = new File([bytes], 'photo.jpg', { type: mime })
      return await compressToThumbnail(file, size)
    } catch {
      return base64
    }
  }

  // ── Paso 1: foto frontal capturada - luigomez ────────────────────────
  async function handleFrontPhoto(base64) {
    const thumb = await toThumb(base64, 200)
    setFrontThumb(thumb)
    setStep(STEP.ANALYZING)

    try {
      const meta = await extractFunkoMetadata(base64)
      if (meta._warning) toast.info(meta._warning)
      const exclusive = meta.exclusive?.trim() || ''
      setMetadata({
        name:         meta.name         || '',
        number:       meta.number       || '',
        line:         meta.line         || '',
        series:       meta.series       || '',
        exclusive,
        is_exclusive: Boolean(exclusive),
      })
      setStep(STEP.BASE_PHOTO)
    } catch (err) {
      toast.error(err.message || 'Error al analizar la foto con IA.')
      setStep(STEP.FRONT_PHOTO)
    }
  }

  // ── Paso 2: foto de la base capturada ────────────────────
  async function handleBasePhoto(base64) {
    setBaseThumb(await toThumb(base64, 200))
    setStep(STEP.READING_BARCODE)

    const result = await readBarcodeFromImage(base64)

    if (result.success) {
      setBarcode(result.value)
      setBarcodeError('')
    } else {
      setBarcode('')
      setBarcodeError('No se detectó el código automáticamente. Ingrésalo manualmente.')
      toast.info('No se pudo leer el código de barras. Puedes ingresarlo a mano.')
    }

    setStep(STEP.CONFIRM)
  }

  // ── Paso 3: guardar ───────────────────────────────────────
  async function handleSave() {
    if (!barcode) {
      setBarcodeError('El código de barras es obligatorio.')
      return
    }
    if (!metadata.name) {
      toast.error('El nombre del Funko es obligatorio.')
      return
    }

    const existing = findByBarcode(barcode)
    if (existing) {
      setDuplicateProduct(existing)
      setStep(STEP.DUPLICATE)
      return
    }

    setStep(STEP.SAVING)

    const exclusive = metadata.exclusive?.trim() || ''
    const product = {
      barcode,
      ...metadata,
      exclusive:   exclusive || null,
      is_exclusive: Boolean(exclusive),
      image_front: frontThumb || null,
      image_base:  baseThumb  || null,
      price:       null,
      notes:       '',
    }

    const ok = await addNewProduct(product)

    if (ok) {
      toast.success(`"${metadata.name}" agregado al inventario.`)
      navigate(`/product/${barcode}`)
    } else {
      toast.error('Error al guardar en Drive. Intenta de nuevo.')
      setStep(STEP.CONFIRM)
    }
  }

  // ── Paso duplicado: agregar unidad ────────────────────────
  async function handleAddUnit() {
    setStep(STEP.SAVING)
    const ok = await addUnit(barcode)
    if (ok) {
      toast.success(`+1 unidad a "${duplicateProduct?.name}".`)
      navigate(`/product/${barcode}`)
    } else {
      toast.error('Error al guardar en Drive. Intenta de nuevo.')
      setStep(STEP.DUPLICATE)
    }
  }

  // ── Guardar producto manual ───────────────────────────────
  async function handleManualSave(form) {
    const existing = findByBarcode(form.barcode)
    if (existing) {
      toast.error(`El código "${form.barcode}" ya existe en el inventario.`)
      return
    }

    setStep(STEP.SAVING)

    const exclusive = form.exclusive?.trim() || ''
    const product = {
      ...form,
      price:       form.price ? parseFloat(form.price) : null,
      exclusive:   exclusive || null,
      is_exclusive: Boolean(exclusive),
      image_front: null,
      image_base:  null,
    }

    const ok = await addNewProduct(product)

    if (ok) {
      toast.success(`"${form.name}" agregado al inventario.`)
      navigate(`/product/${form.barcode}`)
    } else {
      toast.error('Error al guardar en Drive. Intenta de nuevo.')
      setStep(STEP.MANUAL)
    }
  }

  // ── Renders por estado ────────────────────────────────────

  if (step === STEP.ANALYZING)       return <LoadingScreen message="Analizando la foto con IA…" />
  if (step === STEP.READING_BARCODE) return <LoadingScreen message="Leyendo código de barras…" />
  if (step === STEP.SAVING)          return <LoadingScreen message="Guardando en tu inventario…" />

  if (step === STEP.FRONT_PHOTO) {
    return (
      <CameraCapture
        label="Foto frontal del Funko"
        hint="Centra la caja o figura completa. Procura que nombre y número se lean, con buena luz, sin reflejos y sin cortar esquinas."
        maxPx={1200}
        quality={0.85}
        onCapture={handleFrontPhoto}
        onCancel={resetFlow}
      />
    )
  }

  if (step === STEP.BASE_PHOTO) {
    return (
      <CameraCapture
        label="Foto de la base del Funko"
        hint="Enfoca el código de barras claramente"
        maxPx={800}
        onCapture={handleBasePhoto}
        onCancel={resetFlow}
      />
    )
  }

  if (step === STEP.CONFIRM) {
    return (
      <ConfirmForm
        metadata={metadata}
        frontPhoto={frontThumb}
        basePhoto={baseThumb}
        barcode={barcode}
        barcodeError={barcodeError}
        onBarcodeChange={setBarcode}
        onMetaChange={setMeta}
        onSave={handleSave}
        onCancel={resetFlow}
      />
    )
  }

  if (step === STEP.DUPLICATE) {
    return (
      <div className="flex flex-col items-center gap-6 px-6 py-12">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-base font-semibold text-white">Este Funko ya está en tu inventario</p>
          <p className="mt-1 text-sm text-zinc-400">
            &quot;{duplicateProduct?.name}&quot; · {duplicateProduct?.stock} unidad{duplicateProduct?.stock !== 1 ? 'es' : ''}
          </p>
          <p className="mt-3 text-sm text-zinc-300">¿Agregar +1 unidad?</p>
        </div>

        <div className="flex flex-col w-full gap-3">
          <button
            onClick={handleAddUnit}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500
                       text-white font-semibold text-sm transition-colors"
          >
            Sí, agregar unidad
          </button>
          <button
            onClick={resetFlow}
            className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700
                       text-zinc-300 font-semibold text-sm transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  if (step === STEP.MANUAL) {
    return <ManualForm onSave={handleManualSave} onCancel={resetFlow} />
  }

  // ── IDLE — pantalla de elección ───────────────────────────
  return (
    <div className="flex flex-col gap-4 px-4 py-8">
      <h1 className="text-xl font-bold text-white">Agregar Funko</h1>
      <p className="text-sm text-zinc-400">¿Cómo quieres agregar la figura?</p>

      {/* Opción IA */}
      <button
        onClick={() => setStep(STEP.FRONT_PHOTO)}
        className="flex items-start gap-4 p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/30
                   hover:bg-indigo-600/20 active:bg-indigo-600/30 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Con fotos — IA</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            Toma una foto frontal y de la base. La IA extrae los datos automáticamente.
          </p>
        </div>
      </button>

      {/* Opción manual */}
      <button
        onClick={() => setStep(STEP.MANUAL)}
        className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-800 border border-zinc-700
                   hover:bg-zinc-700 active:bg-zinc-600 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Manual</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            Llena los campos a mano. Sin fotos ni IA.
          </p>
        </div>
      </button>
    </div>
  )
}
