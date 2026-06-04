import { useNavigate } from 'react-router-dom';
import { useInventory } from '../hooks/useInventory';
import { useNotifications } from '../hooks/useNotifications';
import { showTestNotification } from '../utils/notifications';
import { useToast } from '../hooks/useToast';
import { formatDate } from '../utils/inventory';
import ToastContainer from '../components/UI/Toast';

const APP_VERSION = 'v1.0.0';
const GITHUB_URL = 'https://github.com/TU_USUARIO/funko-inventory';

export default function Settings() {
  const { inventory, refresh } = useInventory();
  const { permission, enabled, supported, requestPermission, setEnabled } = useNotifications();
  const { toasts, toast, dismiss } = useToast();
  const navigate = useNavigate();

  const lastUpdated = inventory?.last_updated
    ? formatDate(inventory.last_updated)
    : 'desconocida';

  async function handleTestNotification() {
    if (permission !== 'granted') {
      toast.error('Activa los permisos de notificaciones primero.');
      return;
    }
    await showTestNotification();
    toast.success('Notificación de prueba enviada.');
  }

  async function handleRefresh() {
    try {
      await refresh();
      toast.success('Inventario recargado.');
    } catch {
      toast.error('Error al recargar el inventario.');
    }
  }

  function permissionLabel() {
    switch (permission) {
      case 'granted': return { text: 'Activado', color: 'text-emerald-400' };
      case 'denied': return { text: 'Bloqueado', color: 'text-red-400' };
      case 'default': return { text: 'Sin configurar', color: 'text-zinc-400' };
      case 'unsupported': return { text: 'No soportado', color: 'text-zinc-500' };
      default: return { text: permission, color: 'text-zinc-400' };
    }
  }

  const pLabel = permissionLabel();

  return (
    <>
      <div className="px-4 pt-4 pb-24 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-zinc-100">Configuración</h1>
        </div>

        <section className="mb-6">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Notificaciones
          </h2>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-zinc-300">Estado del permiso</span>
              <span className={`text-sm font-medium ${pLabel.color}`}>{pLabel.text}</span>
            </div>

            {supported && permission === 'granted' && (
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-zinc-300">Recordatorios diarios</p>
                  <p className="text-xs text-zinc-500 mt-0.5">10:00 AM · 3:00 PM · 8:00 PM</p>
                </div>
                <button
                  onClick={() => setEnabled(!enabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                    enabled ? 'bg-white' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-zinc-900 shadow transition-transform duration-200 ${
                      enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

            {supported && permission === 'default' && (
              <div className="px-4 py-3">
                <p className="text-sm text-zinc-400 mb-3">
                  Activa las notificaciones para recibir recordatorios de actualizar tu inventario.
                </p>
                <button
                  onClick={requestPermission}
                  className="w-full bg-white text-zinc-900 text-sm font-medium rounded-lg py-2.5"
                >
                  Activar notificaciones
                </button>
              </div>
            )}

            {supported && permission !== 'denied' && (
              <div className="px-4 py-3">
                <p className="text-xs text-zinc-500">
                  En iPhone, instala la app en pantalla de inicio. Los recordatorios locales funcionan mejor mientras la PWA mantiene una sesión activa.
                </p>
              </div>
            )}

            {permission === 'denied' && (
              <div className="px-4 py-3">
                <p className="text-sm text-zinc-400 mb-1">
                  Las notificaciones están bloqueadas por el navegador.
                </p>
                <p className="text-xs text-zinc-500">
                  Para reactivarlas: en tu navegador → Configuración → Privacidad y seguridad →
                  Notificaciones → busca esta página y cambia a &quot;Permitir&quot;.
                </p>
              </div>
            )}

            {!supported && (
              <div className="px-4 py-3">
                <p className="text-sm text-zinc-500">
                  Tu navegador no soporta notificaciones. Instala la app como PWA para habilitarlas.
                </p>
              </div>
            )}

            <div className="px-4 py-3">
              <button
                onClick={handleTestNotification}
                disabled={permission !== 'granted'}
                className="text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Enviar notificación de prueba
              </button>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Datos
          </h2>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-zinc-300">Última actualización</span>
              <span className="text-sm text-zinc-500">{lastUpdated}</span>
            </div>

            <div className="px-4 py-3">
              <button
                onClick={handleRefresh}
                className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Recargar inventario desde Drive
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            App
          </h2>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-zinc-300">Versión</span>
              <span className="text-sm text-zinc-500 font-mono">{APP_VERSION}</span>
            </div>

            <div className="px-4 py-3">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                Ver repositorio en GitHub
              </a>
            </div>
          </div>
        </section>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
