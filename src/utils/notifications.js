/**
 * src/utils/notifications.js
 *
 * Notificaciones locales programadas con setTimeout.
 * No requieren servidor push — funcionan mientras el navegador/app está abierto.
 *
 * Limitación conocida: los timeouts se pierden al cerrar el navegador.
 * En iOS requiere iOS 16.4+ y la app instalada como PWA (Add to Home Screen).
 */

// IDs de los timeouts activos, para poder cancelarlos
const activeTimers = [];

// Horarios diarios [hora, minutos]
const SCHEDULES = [
  { hour: 10, minute: 0, message: '¿Ya revisaste tu inventario hoy? Empieza el día actualizado.' },
  { hour: 15, minute: 0, message: 'Recuerda actualizar tu inventario si conseguiste Funkos nuevos.' },
  { hour: 20, minute: 0, message: 'Cierra el día con tu inventario al día. ¿Algo nuevo por registrar?' },
];

const TITLE = 'Funko Inventory 📦';
const ICON  = '/funko-inventory/icon-192.png';

/**
 * Calcula los milisegundos hasta la próxima ocurrencia de [hour:minute].
 * Si el horario ya pasó hoy, devuelve el tiempo hasta mañana.
 */
function msUntilNext(hour, minute) {
  const now    = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  if (target <= now) {
    // Ya pasó hoy → programar para mañana
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

/**
 * Muestra una notificación nativa.
 * Si el SW está activo, la despacha via registration para que funcione
 * incluso cuando la tab no tiene foco; de lo contrario usa Notification API.
 */
async function showNotification(body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration('/funko-inventory/sw.js');
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
    // Fallback a Notification directa si el SW no está disponible
  }

  new Notification(TITLE, { body, icon: ICON });
}

/**
 * Programa un recordatorio individual y, cuando se dispara,
 * se reprograma automáticamente para el día siguiente.
 */
function scheduleOne({ hour, minute, message }) {
  const delay = msUntilNext(hour, minute);

  const timerId = setTimeout(async () => {
    await showNotification(message);
    // Reprogramar para mañana a la misma hora
    scheduleOne({ hour, minute, message });
  }, delay);

  activeTimers.push(timerId);
}

/**
 * Programa los 3 recordatorios diarios.
 * Si ya hay timers activos, los cancela primero para evitar duplicados.
 */
export function scheduleReminders() {
  cancelReminders();
  SCHEDULES.forEach(scheduleOne);
  console.log(`[Notificaciones] ${SCHEDULES.length} recordatorios programados.`);
}

/**
 * Cancela todos los recordatorios activos.
 */
export function cancelReminders() {
  while (activeTimers.length > 0) {
    clearTimeout(activeTimers.pop());
  }
}

/**
 * Muestra una notificación de prueba inmediata.
 * Útil para verificar que los permisos y el SW funcionan.
 */
export async function showTestNotification() {
  await showNotification('¡Las notificaciones están funcionando correctamente! 🎉');
}
