import { useState, useEffect, useCallback } from 'react';
import { scheduleReminders, cancelReminders } from '../utils/notifications';

const LS_DISMISSED = 'notifications_dismissed';
const LS_ENABLED   = 'notifications_enabled';

/**
 * Hook para gestionar el permiso y estado de las notificaciones.
 *
 * @returns {{
 *   permission: 'granted' | 'denied' | 'default' | 'unsupported',
 *   enabled: boolean,
 *   dismissed: boolean,
 *   requestPermission: () => Promise<void>,
 *   dismiss: () => void,
 *   setEnabled: (value: boolean) => void,
 * }}
 */
export function useNotifications() {
  const supported = typeof Notification !== 'undefined';

  const [permission, setPermission] = useState(
    supported ? Notification.permission : 'unsupported'
  );
  const [enabled, setEnabledState]   = useState(
    () => localStorage.getItem(LS_ENABLED) !== 'false'
  );
  const [dismissed, setDismissedState] = useState(
    () => localStorage.getItem(LS_DISMISSED) === 'true'
  );

  // Sincronizar el estado de permiso si cambia externamente
  useEffect(() => {
    if (!supported) return;

    // La Permission API no emite eventos de cambio en todos los navegadores,
    // así que hacemos polling liviano solo mientras el permiso es 'default'.
    if (permission !== 'default') return;

    const interval = setInterval(() => {
      if (Notification.permission !== permission) {
        setPermission(Notification.permission);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [permission, supported]);

  // Arrancar o detener recordatorios al cambiar enabled/permission
  useEffect(() => {
    if (permission === 'granted' && enabled) {
      scheduleReminders();
    } else {
      cancelReminders();
    }
  }, [permission, enabled]);

  /** Solicita permiso al sistema operativo */
  const requestPermission = useCallback(async () => {
    if (!supported) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        localStorage.setItem(LS_ENABLED, 'true');
        setEnabledState(true);
      }
    } catch (err) {
      console.error('Error solicitando permiso de notificaciones:', err);
    }
  }, [supported]);

  /** Descarta el banner sin pedir permiso */
  const dismiss = useCallback(() => {
    localStorage.setItem(LS_DISMISSED, 'true');
    setDismissedState(true);
  }, []);

  /** Activa o desactiva los recordatorios (solo cuando el permiso ya está granted) */
  const setEnabled = useCallback((value) => {
    localStorage.setItem(LS_ENABLED, String(value));
    setEnabledState(value);
  }, []);

  return {
    permission,
    enabled,
    dismissed,
    requestPermission,
    dismiss,
    setEnabled,
    supported,
  };
}
