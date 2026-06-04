import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { scheduleReminders } from './utils/notifications'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Registrar Service Worker solo en producción
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker
    .register(`${import.meta.env.BASE_URL}sw.js`)
    .then(reg => console.log('[SW] Registrado. Scope:', reg.scope))
    .catch(err => console.error('[SW] Error:', err))
}

// Si el permiso ya estaba concedido de sesiones previas, arrancar recordatorios
if (
  typeof Notification !== 'undefined' &&
  Notification.permission === 'granted' &&
  localStorage.getItem('notifications_enabled') !== 'false'
) {
  scheduleReminders()
}
