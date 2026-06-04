# Funko Inventory App — Briefing Fase 4
**Para:** agente `architect-fase4`  
**Proyecto:** Funko Inventory — Web App personal  
**Fase:** 4 de 4 — Notificaciones Push + Búsqueda por Barcode  
**Duración estimada:** Semana 4  
**Prerequisito:** Fase 3 completada (flujo IA funcionando en producción)
 
---
 
## Contexto heredado de Fases 1–3
 
La Fase 3 entregó:
- App React + Vite + Tailwind CSS desplegada en GitHub Pages.
- Backend: `src/services/drive.js` — persistencia en Google Drive vía Apps Script.
- `src/context/InventoryContext.jsx` — estado global, API: `addNewProduct`, `addUnit`, `removeUnit`, `updateStock`, `editProduct`, `removeProduct`, `findByBarcode`, `refresh`.
- `src/services/ai.js` — `extractFunkoMetadata(imageBase64)` → llama al proxy de Claude (Apps Script).
- `src/utils/barcode.js` — `readBarcodeFromImage(imageSource)` → ZXing con 4 rotaciones de fallback.
- `src/utils/image.js` — `compressToThumbnail(file, maxPx, quality)`.
- `src/components/Camera/CameraCapture.jsx` — captura de foto con `<input capture="environment">`.
- `src/pages/AddProduct.jsx` — flujo completo IA + manual.
- `src/components/UI/Toast.jsx` + `src/hooks/useToast.js` — toasts apilables.
**Variables de entorno en producción:**
```
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
VITE_CLAUDE_PROXY_URL=https://script.google.com/macros/s/.../exec
```
 
---
 
## Objetivo de Fase 4
 
1. **Búsqueda por foto de barcode** — desde la página Search, el usuario toma una foto de la base de un Funko y la app lo busca directamente en el inventario por código de barras.
2. **Notificaciones push PWA** — 3 recordatorios diarios (mañana, tarde, noche) para actualizar el inventario.
---
 
## Tareas de Fase 4
 
### Tarea 4.1 — Búsqueda por foto de barcode
 
**Archivo actualizado:** `src/pages/Search.jsx`
 
Añadir un botón de cámara junto a la barra de búsqueda de texto existente. Al tocarlo, abre `CameraCapture` para tomar una foto de la base del Funko — ZXing lee el barcode y navega directamente al producto si existe, o muestra un mensaje si no.
 
**Flujo:**
```
idle
  → step_camera      (CameraCapture — foto de la base)
  → step_reading     (spinner "Leyendo código...")
  → resultado:
      barcode encontrado  → navega a /product/:id
      barcode no encontrado en inventario → toast "Funko no encontrado. ¿Agregar?" + botón a /add
      ZXing no lee código → toast "No se detectó código. Intenta de nuevo."
```
 
**UI:**
- Barra de búsqueda existente se mantiene intacta.
- Botón de cámara (ícono) a la derecha de la barra de búsqueda.
- Spinner con mensaje "Leyendo código..." mientras ZXing procesa.
- Si ZXing falla → fallback a campo manual de barcode (igual que en AddProduct).
**Notas:**
- Reutilizar `CameraCapture` con `label="Foto de la base"` y `hint="Enfoca el código de barras"`.
- Reutilizar `readBarcodeFromImage` de `src/utils/barcode.js` — ya soporta rotaciones.
- `findByBarcode` ya existe en `InventoryContext` — usarlo directamente.
- No llamar a Claude/IA en este flujo — solo ZXing, sin IA.
---
 
### Tarea 4.2 — Convertir la app en PWA
 
**Archivos nuevos/actualizados:**
 
```
public/
├── manifest.json          ← nuevo
├── icon-192.png           ← nuevo (ícono PWA)
└── icon-512.png           ← nuevo (ícono PWA splash)
 
src/
└── sw.js                  ← nuevo (Service Worker manual)
 
index.html                 ← agregar <link rel="manifest"> y metas PWA
vite.config.js             ← agregar `build.rollupOptions` para copiar sw.js al output root
```
 
> ⚠️ El Service Worker se implementa **manualmente** — sin VitePWA ni plugins de terceros. Esto da control total sobre los eventos y evita abstracciones innecesarias para un SW tan simple.
 
**Configuración de Vite para el Service Worker:**
 
El SW debe quedar en la raíz del sitio (`/funko-inventory/sw.js`), no dentro de `/assets/`. Para lograrlo, colocar `sw.js` en la carpeta `public/` en lugar de `src/` — Vite copia `public/` tal cual al output sin procesar:
 
```
public/
├── manifest.json
├── icon-192.png
├── icon-512.png
└── sw.js                  ← aquí, no en src/
```
 
> No se necesita modificar `vite.config.js` para esto. El archivo en `public/sw.js` queda disponible en `/funko-inventory/sw.js` en producción.
 
**`public/manifest.json`:**
```json
{
  "name": "Funko Inventory",
  "short_name": "Funkos",
  "description": "Gestión de inventario de Funko Pops",
  "start_url": "/funko-inventory/",
  "scope": "/funko-inventory/",
  "display": "standalone",
  "background_color": "#09090b",
  "theme_color": "#09090b",
  "icons": [
    { "src": "/funko-inventory/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/funko-inventory/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
 
> ⚠️ El `start_url` y `scope` deben incluir el subdirectorio de GitHub Pages (`/funko-inventory/`). Ajustar al nombre real del repo del usuario.
 
**`index.html`:**
```html
<link rel="manifest" href="/funko-inventory/manifest.json" />
<meta name="theme-color" content="#09090b" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```
 
**Service Worker (`public/sw.js`):**
- Registrar en `src/main.jsx` solo en producción, apuntando a `/funko-inventory/sw.js`.
- Implementar cache básico de assets (estrategia cache-first para shell de la app).
- Escuchar evento `push` para mostrar notificaciones.
- Escuchar evento `notificationclick` para navegar a la app al tocar la notificación.
```js
// Eventos mínimos requeridos:
self.addEventListener('install', ...)
self.addEventListener('activate', ...)
self.addEventListener('fetch', ...)       // cache-first para assets estáticos
self.addEventListener('push', ...)        // mostrar notificación
self.addEventListener('notificationclick', ...) // abrir app al tocar notificación
```
 
**Registro en `src/main.jsx`:**
```js
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/funko-inventory/sw.js')
    .then(reg => console.log('SW registrado', reg.scope))
    .catch(err => console.error('SW error', err));
}
```
 
---
 
### Tarea 4.3 — Solicitar permiso de notificaciones
 
**Archivo nuevo:** `src/hooks/useNotifications.js`
 
```js
/**
 * Solicita permiso de notificaciones al usuario.
 * Devuelve el estado actual del permiso.
 *
 * @returns {{ permission, requestPermission }}
 */
export function useNotifications()
```
 
**Cuándo pedir el permiso:**
- En `src/pages/Home.jsx` — mostrar un banner/card al usuario la primera vez que abre la app si `Notification.permission === 'default'`.
- No pedir el permiso de forma abrupta al cargar — esperar a que el usuario lo active desde el banner.
- Guardar en `localStorage` si el usuario ya rechazó para no volver a mostrar el banner.
**Banner UI (en Home.jsx):**
```
┌─────────────────────────────────────────┐
│ 🔔 Activa los recordatorios             │
│ Te avisamos 3 veces al día para         │
│ actualizar tu inventario.               │
│                          [Activar] [×]  │
└─────────────────────────────────────────┘
```
 
---
 
### Tarea 4.4 — Programar notificaciones locales
 
**Archivo nuevo:** `src/utils/notifications.js`
 
Las notificaciones son **locales** (no requieren servidor push) — se programan con `setTimeout` o usando la Notification API directamente desde el Service Worker vía `postMessage`.
 
**Horarios de recordatorio:**
```
Mañana: 10:00 AM
Tarde:  03:00 PM
Noche:  08:00 PM
```
 
```js
/**
 * Programa los 3 recordatorios diarios.
 * Calcula el tiempo restante hasta el próximo horario y usa setTimeout.
 * Si el horario ya pasó hoy, programa para mañana.
 */
export function scheduleReminders()
 
/**
 * Cancela todos los recordatorios activos.
 */
export function cancelReminders()
 
/**
 * Muestra una notificación inmediata (para testing).
 */
export function showTestNotification()
```
 
**Contenido de las notificaciones:**
```
Título: "Funko Inventory 📦"
Mañana: "¿Ya revisaste tu inventario hoy? Empieza el día actualizado."
Tarde:  "Recuerda actualizar tu inventario si conseguiste Funkos nuevos."
Noche:  "Cierra el día con tu inventario al día. ¿Algo nuevo por registrar?"
```
 
**Notas de implementación:**
- Los `setTimeout` se pierden al cerrar el navegador — esto es aceptable para una app personal.
- En iOS Safari las notificaciones push requieren que la app esté instalada como PWA (Add to Home Screen). Documentar este requisito.
- Llamar a `scheduleReminders()` en `main.jsx` después de que el Service Worker esté registrado y el permiso esté concedido.
---
 
### Tarea 4.5 — Settings page
 
**Archivo nuevo:** `src/pages/Settings.jsx`  
**Ruta:** `/settings`
 
Pantalla accesible desde el ícono de settings en el Header. Secciones:
 
**Notificaciones:**
- Toggle para activar/desactivar recordatorios.
- Mostrar estado actual del permiso (`granted` / `denied` / `default`).
- Botón "Probar notificación" → llama `showTestNotification()`.
- Si el permiso está `denied` → mostrar instrucciones para reactivarlo en settings del navegador.
**Datos:**
- Botón "Recargar inventario" → llama `refresh()` del contexto.
- Mostrar fecha de última actualización del inventario (`inventory.last_updated`).
**App:**
- Versión de la app (hardcodeada, ej. `v1.0.0`).
- Link al repo de GitHub.
---
 
### Tarea 4.6 — Actualizar Header
 
**Archivo actualizado:** `src/components/Layout/Header.jsx`
 
El botón de settings ya existe en el Header — conectarlo a la ruta `/settings` con `useNavigate`.
 
---
 
## Definición de "Done" para Fase 4
 
| Criterio | Verificación |
|---|---|
| Búsqueda por barcode funciona | Foto de base navega al producto correcto |
| Fallback "no encontrado" funciona | Barcode no en inventario muestra opción de agregar |
| App instalable como PWA | Chrome muestra "Agregar a pantalla de inicio" |
| Permiso de notificaciones funciona | Banner aparece, al aceptar el permiso se concede |
| Notificaciones llegan | `showTestNotification()` muestra notificación en el dispositivo |
| Recordatorios programados | 3 notificaciones al día en los horarios definidos |
| Settings page accesible | Header navega a `/settings` |
| Toggle de notificaciones funciona | Activar/desactivar cancela o reactiva los recordatorios |
 
---
 
## Entregables al cerrar Fase 4
 
1. Código de Fase 4 commiteado en `main` y desplegado en GitHub Pages.
2. App instalable como PWA en iOS y Android.
3. Notificaciones funcionando en al menos un dispositivo real.
4. `FASE_5_ARCHITECT_BRIEF.md` con la tarea de generación de reportes.
---
 
## Contexto adicional para el agente
 
- **No modificar `InventoryContext.jsx`**, `drive.js`, `ai.js` ni `barcode.js` — la lógica de negocio no cambia en Fase 4.
- **Service Worker en `public/`**: colocar `sw.js` en `public/sw.js`, no en `src/`. Vite copia `public/` sin procesar al output, así queda en `/funko-inventory/sw.js` con el scope correcto. No se necesita configuración adicional en `vite.config.js`.
- **Service Worker scope**: el SW solo puede controlar páginas dentro de su scope. Registrarlo desde `src/main.jsx` apuntando a `/funko-inventory/sw.js`.
- **iOS notificaciones**: requieren iOS 16.4+ y que la app esté instalada como PWA. En versiones anteriores las notificaciones push no funcionan — documentar este límite al usuario.
- **`localStorage` para preferencias**: guardar `notifications_enabled` y `notifications_dismissed` en localStorage. No persiste en Drive — es preferencia local del dispositivo.
- **Fase 5 (reporte)**: generar un reporte exportable (PDF o CSV) del inventario con estadísticas: total de productos, total de unidades, valor total estimado (si hay precios), desglose por línea y exclusivos. Scope a definir en el briefing correspondiente.