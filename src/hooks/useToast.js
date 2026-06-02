import { useState, useCallback } from 'react'

let toastId = 0

/**
 * useToast — manages a stack of toast notifications.
 *
 * @returns {{ toasts, toast }}
 *   - toasts: array of active toast objects
 *   - toast.success(msg) / toast.error(msg) / toast.info(msg)
 */
export function useToast() {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message, variant = 'info', duration = 3000) => {
      const id = ++toastId
      setToasts((prev) => {
        // Keep max 3 toasts — drop the oldest if needed
        const next = prev.length >= 3 ? prev.slice(1) : prev
        return [...next, { id, message, variant }]
      })
      setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss]
  )

  const toast = {
    success: (msg, duration) => push(msg, 'success', duration),
    error: (msg, duration) => push(msg, 'error', duration ?? 5000),
    info: (msg, duration) => push(msg, 'info', duration),
  }

  return { toasts, toast, dismiss }
}
