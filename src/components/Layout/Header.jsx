import { useState } from 'react'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-slate-950/95 backdrop-blur border-b border-slate-800 flex items-center justify-between px-4">
      {/* Logo / App name */}
      <div className="flex items-center gap-2">
        <span className="text-funko-orange text-2xl select-none">●</span>
        <h1 className="font-bold text-base tracking-tight text-slate-100">
          Funko<span className="text-funko-orange">Inv</span>
        </h1>
      </div>

      {/* Settings button */}
      <button
        aria-label="Configuración"
        onClick={() => setMenuOpen(!menuOpen)}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors tap-highlight"
      >
        {/* Gear icon (inline SVG — no icon library needed in Fase 1) */}
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {/* Settings dropdown (placeholder — Fase 2 will flesh this out) */}
      {menuOpen && (
        <div className="absolute top-14 right-4 w-56 card shadow-xl py-1 z-50">
          <div className="px-4 py-3 border-b border-slate-800">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Configuración</p>
          </div>
          <div className="px-4 py-3 text-sm text-slate-400">
            Disponible en Fase 2
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </header>
  )
}
