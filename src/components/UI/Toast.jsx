import { useEffect, useState } from 'react'

/**
 * ToastItem — individual toast notification with enter/exit animation.
 */
function ToastItem({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger enter animation on mount
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const variantClasses = {
    success: 'bg-emerald-900/90 border-emerald-600/60 text-emerald-100',
    error:   'bg-red-900/90 border-red-600/60 text-red-100',
    info:    'bg-slate-800/90 border-slate-600/60 text-slate-100',
  }

  const iconMap = {
    success: '✓',
    error:   '✕',
    info:    'ℹ',
  }

  const iconClasses = {
    success: 'bg-emerald-500/30 text-emerald-300',
    error:   'bg-red-500/30 text-red-300',
    info:    'bg-slate-600/50 text-slate-300',
  }

  const variant = toast.variant || 'info'

  return (
    <div
      onClick={() => onDismiss(toast.id)}
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm
        shadow-xl cursor-pointer select-none
        transition-all duration-300 ease-out
        ${variantClasses[variant]}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      <span className={`
        w-5 h-5 rounded-full flex items-center justify-center
        text-xs font-bold flex-shrink-0 mt-0.5
        ${iconClasses[variant]}
      `}>
        {iconMap[variant]}
      </span>
      <p className="text-sm leading-snug flex-1">{toast.message}</p>
    </div>
  )
}

/**
 * ToastContainer — renders the active toast stack.
 * Place this once at the root of the app (inside Layout or App).
 *
 * @param {{ toasts: Array, onDismiss: Function }} props
 */
export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts?.length) return null

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  )
}
