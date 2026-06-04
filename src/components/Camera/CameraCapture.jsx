// ============================================================
// Funko Inventory — CameraCapture
// ============================================================
// Componente reutilizable para capturar fotos desde móvil.
// Usa <input type="file" capture="environment"> — método
// confiable en iOS Safari y Android Chrome sin quirks de
// getUserMedia.
//
// Props:
//   onCapture(base64: string) — Data URL de la foto comprimida
//   onCancel()                — usuario canceló
//   label   string            — título de la pantalla
//   hint    string            — instrucción secundaria
//   maxPx   number            — tamaño máx de compresión (default 800)
// ============================================================

import { useRef, useState } from 'react'
import { compressToThumbnail } from '../../utils/image'

const STATE = { IDLE: 'idle', PREVIEW: 'preview' }

export default function CameraCapture({
  onCapture,
  onCancel,
  label = 'Toma la foto',
  hint  = '',
  maxPx = 800,
  quality = 0.75,
}) {
  const inputRef              = useRef(null)
  const [step, setStep]       = useState(STATE.IDLE)
  const [preview, setPreview] = useState(null)
  const [compressing, setCompressing] = useState(false)

  // --- El usuario seleccionó/tomó una foto ---
  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setCompressing(true)
    try {
      const base64 = await compressToThumbnail(file, maxPx, quality)
      setPreview(base64)
      setStep(STATE.PREVIEW)
    } catch {
      // Si falla la compresión, usar el archivo original como Data URL
      const reader = new FileReader()
      reader.onload = (ev) => {
        setPreview(ev.target.result)
        setStep(STATE.PREVIEW)
      }
      reader.readAsDataURL(file)
    } finally {
      setCompressing(false)
      // Limpiar el input para que onChange se dispare si el usuario retoma la misma foto
      e.target.value = ''
    }
  }

  function handleRetake() {
    setPreview(null)
    setStep(STATE.IDLE)
    // Pequeño delay para que el DOM limpie antes de re-abrir la cámara
    setTimeout(() => inputRef.current?.click(), 100)
  }

 function handleConfirm() {
    if (preview) onCapture(preview)
  }

  // ---- Render: IDLE ----
  if (step === STATE.IDLE) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 px-6 py-10">

        {/* Ícono cámara */}
        <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center">
          <svg className="w-12 h-12 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
        </div>

        {/* Texto */}
        <div className="text-center">
          <p className="text-lg font-semibold text-white">{label}</p>
          {hint && <p className="mt-1 text-sm text-zinc-400">{hint}</p>}
        </div>

        {/* Input oculto — abre cámara trasera directamente */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Botones */}
        <div className="flex flex-col w-full gap-3">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={compressing}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                       text-white font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {compressing ? 'Procesando…' : 'Abrir cámara'}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900
                       text-zinc-300 font-semibold text-sm transition-colors"
          >
            Cancelar
          </button>
        </div>

      </div>
    )
  }

  // ---- Render: PREVIEW ----
  return (
    <div className="flex flex-col items-center gap-6 px-6 py-6">

      <p className="text-base font-semibold text-white">{label}</p>

      {/* Preview de la foto */}
      <div className="w-full rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-900">
        <img
          src={preview}
          alt="Vista previa"
          className="w-full object-contain max-h-72"
        />
      </div>

      {/* Botones */}
      <div className="flex flex-col w-full gap-3">
        <button
          onClick={handleConfirm}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                     text-white font-semibold text-sm transition-colors"
        >
          Usar esta foto
        </button>
        <button
          onClick={handleRetake}
          className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900
                     text-zinc-300 font-semibold text-sm transition-colors"
        >
          Retomar foto
        </button>
        <button
          onClick={onCancel}
          className="w-full py-3 rounded-xl text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          Cancelar
        </button>
      </div>

    </div>
  )
}
