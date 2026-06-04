/**
 * src/utils/notifications.js
 *
 * Notificaciones locales programadas con setTimeout.
 * No requieren servidor push: funcionan mientras el navegador/app está abierto.
 *
 * Limitación conocida: los timeouts se pierden al cerrar el navegador.
 * En iOS requiere iOS 16.4+ y la app instalada como PWA (Add to Home Screen).
 */

const activeTimers = [];

const SCHEDULES = [
  { hour: 10, minute: 0, message: '¿Ya revisaste tu inventario hoy? Empieza el día actualizado.' },
  { hour: 15, minute: 0, message: 'Recuerda actualizar tu inventario si conseguiste Funkos nuevos.' },
  { hour: 20, minute: 0, message: 'Cierra el día con tu inventario al día. ¿Algo nuevo por registrar?' },
];

const TITLE = 'Funko Inventory 📦';
const ICON = `${import.meta.env.BASE_URL}icon-192.png`;

function msUntilNext(hour, minute) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

async function showNotification(body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL);
      if (reg) {
        reg.showNotification(TITLE, {
          body,
          icon: ICON,
          badge: ICON,
          tag: 'funko-reminder',
          renotify: true,
        });
        return;
      }
    }
  } catch {
    // Fallback a Notification directa si el SW no está disponible.
  }

  new Notification(TITLE, { body, icon: ICON });
}

function scheduleOne({ hour, minute, message }) {
  const delay = msUntilNext(hour, minute);

  const timerId = setTimeout(async () => {
    await showNotification(message);
    scheduleOne({ hour, minute, message });
  }, delay);

  activeTimers.push(timerId);
}

export function scheduleReminders() {
  cancelReminders();
  SCHEDULES.forEach(scheduleOne);
  console.log(`[Notificaciones] ${SCHEDULES.length} recordatorios programados.`);
}

export function cancelReminders() {
  while (activeTimers.length > 0) {
    clearTimeout(activeTimers.pop());
  }
}

export async function showTestNotification() {
  await showNotification('¡Las notificaciones están funcionando correctamente! 🎉');
}
