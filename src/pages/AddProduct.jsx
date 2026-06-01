export default function AddProduct() {
  return (
    <div className="max-w-md mx-auto py-4 space-y-4">
      <h2 className="text-xl font-bold text-slate-100">Agregar Funko</h2>

      {/* Phase 3 placeholder */}
      <div className="card p-6 flex flex-col items-center text-center space-y-4 border-dashed border-slate-700">
        <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center text-4xl">
          📸
        </div>
        <div>
          <p className="font-semibold text-slate-200">Próximamente — Fase 3</p>
          <p className="text-sm text-slate-400 mt-1 max-w-xs">
            Esta pantalla contendrá el flujo de captura de fotos + lectura de
            código de barras + extracción de metadatos con IA (Claude Vision).
          </p>
        </div>

        <div className="w-full space-y-2 text-left">
          <StepRow number={1} label="Toma foto frontal" detail="El agente IA extrae nombre, número y línea" ready={false} />
          <StepRow number={2} label="Toma foto de la base" detail="Se lee el código de barras" ready={false} />
          <StepRow number={3} label="Confirmar y guardar" detail="Se crea o actualiza el producto" ready={false} />
        </div>
      </div>
    </div>
  )
}

function StepRow({ number, label, detail, ready }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-800 last:border-0">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
        ready ? 'bg-funko-orange text-white' : 'bg-slate-800 text-slate-500'
      }`}>
        {number}
      </div>
      <div>
        <p className={`text-sm font-medium ${ready ? 'text-slate-200' : 'text-slate-500'}`}>{label}</p>
        <p className="text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  )
}
