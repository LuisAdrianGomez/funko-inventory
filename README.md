# Funko Inventory 📦

App web personal para gestionar inventario de Funko Pops a la venta.  
Desplegada en GitHub Pages — el inventario vive en **Google Drive** vía Apps Script.

## Stack

- **React + Vite** — UI
- **Tailwind CSS** — Estilos (dark mode)
- **Google Drive + Apps Script** — Persistencia del inventario (`funko-inventory.json` en Drive)
- **Claude API + Apps Script proxy** — Extracción de metadatos desde fotos con visión
- **@zxing/browser** — Lectura de códigos de barras desde imagen, sin API externa
- **PWA + Service Worker** (Fase 4) — Instalable + notificaciones locales programadas

## Setup local

```bash
# 1. Clonar
git clone https://github.com/TU_USUARIO/funko-inventory.git
cd funko-inventory

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con la URL de tu Apps Script

# 4. Correr en desarrollo
npm run dev
```

## Variables de entorno

Ver `.env.example` para la lista completa y documentación.

| Variable | Requerida | Descripción |
|---|---|---|
| `VITE_APPS_SCRIPT_URL` | ✅ | URL del Web App de Apps Script (Drive backend) |
| `VITE_CLAUDE_PROXY_URL` | ✅ | URL del segundo Web App de Apps Script (proxy Claude) |

> ⚠️ Estas URLs nunca deben ir al repositorio. Solo en `.env.local` (ignorado por git).

## Despliegue en GitHub Pages

1. Crear el repositorio en GitHub.
2. Ir a **Settings → Pages → Source: GitHub Actions**.
3. Agregar los siguientes **Secrets** (Settings → Secrets and variables → Actions):
   - `VITE_APPS_SCRIPT_URL`
   - `VITE_CLAUDE_PROXY_URL`
4. El workflow `.github/workflows/deploy.yml` se dispara con cada push a `main`.

## Apps Script — Backend de persistencia (Drive)

El archivo `proxy/Code.gs` no es el backend de Drive — ese vive en un proyecto separado en [script.google.com](https://script.google.com).

### Setup inicial (una sola vez)

1. Ir a [script.google.com](https://script.google.com) y crear un nuevo proyecto.
2. Copiar el contenido de `apps-script/drive/Code.gs` al editor.
3. Ejecutar `initInventory()` una vez desde el editor — esto crea el archivo `funko-inventory.json` en tu Drive.
4. Desplegar como **Web App**:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copiar la URL del Web App a `VITE_APPS_SCRIPT_URL` en `.env.local`.

## Apps Script — Proxy para Claude API

El proxy vive en un **segundo proyecto separado** en [script.google.com](https://script.google.com) — independiente del backend de Drive.

### Setup inicial (una sola vez)

1. Ir a [script.google.com](https://script.google.com) y crear un **nuevo proyecto** (distinto al de Drive).
2. Copiar el contenido de `proxy/Code.gs` al editor.
3. Agregar la API key de Claude en **Properties Service**:
   - Menú: Proyecto → Configuración del proyecto → Propiedades del script
   - Agregar propiedad: `CLAUDE_API_KEY` = `sk-ant-...`
4. Desplegar como **Web App**:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copiar la URL del Web App a `VITE_CLAUDE_PROXY_URL` en `.env.local`.

> ⚠️ La API key **nunca** va hardcodeada en el script — solo en Properties Service. Así no queda expuesta en el código aunque el script sea compartido.

### Cómo funciona

La app envía la foto en base64 al proxy vía POST. El proxy llama a `api.anthropic.com` con la API key almacenada en Properties Service y devuelve los metadatos extraídos como JSON. La API key de Claude nunca toca el navegador.



```
src/
├── components/
│   ├── Camera/         CameraCapture — captura foto con <input capture="environment">
│   ├── Layout/         Header, BottomNav, Layout
│   ├── Inventory/      ProductCard
│   └── UI/             Badge, Spinner, Toast
├── context/
│   └── InventoryContext.jsx   Estado global del inventario
├── pages/
│   ├── Home.jsx         Dashboard con stats
│   ├── Catalog.jsx      Grid con filtros y ordenamiento
│   ├── ProductDetail.jsx  Detalle, ajuste de stock, historial
│   ├── ProductEdit.jsx  Formulario de edición
│   ├── AddProduct.jsx   Agregar manual + flujo IA (foto → Claude → barcode → confirmar)
│   ├── Search.jsx       Búsqueda por texto + búsqueda por foto de barcode (Fase 4)
│   └── Settings.jsx     Notificaciones, recarga, versión (Fase 4)
├── services/
│   ├── drive.js         readInventory, writeInventory, helpers CRUD
│   └── ai.js            extractFunkoMetadata via Claude Vision
├── hooks/
│   ├── useToast.js      Toasts apilables
│   └── useNotifications.js  Permiso y estado de notificaciones (Fase 4)
└── utils/
    ├── image.js         compressToThumbnail(200px), compressForAI(800px)
    ├── barcode.js       readBarcodeFromImage via @zxing/browser — sin API externa
    ├── notifications.js scheduleReminders, cancelReminders, showTestNotification (Fase 4)
    └── inventory.js     searchProducts, sortProducts, formatDate, etc.

proxy/
└── Code.gs              Apps Script — proxy para Claude API (proyecto separado)

public/
├── manifest.json        PWA manifest (Fase 4)
├── icon-192.png         Ícono PWA (Fase 4)
└── icon-512.png         Ícono PWA splash (Fase 4)

src/sw.js                Service Worker manual — cache + notificaciones push (Fase 4)
```

## Schema del inventario

```json
{
  "version": "1.0",
  "last_updated": "ISO-8601",
  "sold_cleanup": [{
    "id": "barcode-ISO-8601-historyIndex-unitIndex",
    "barcode": "012345678901",
    "product_name": "Spider-Man",
    "number": "03",
    "line": "Marvel",
    "series": "Marvel Studios",
    "exclusive": "Hot Topic",
    "sold_at": "ISO-8601",
    "history_index": 3
  }],
  "products": [{
    "id": "barcode_value",
    "barcode": "012345678901",
    "name": "Spider-Man",
    "number": "03",
    "line": "Marvel",
    "series": "Marvel Studios",
    "exclusive": "Hot Topic",
    "is_exclusive": true,
    "image_front": "data:image/jpeg;base64,...",
    "image_base": "data:image/jpeg;base64,...",
    "stock": 2,
    "price": null,
    "notes": "",
    "created_at": "ISO-8601",
    "updated_at": "ISO-8601",
    "history": [{ "action": "add", "units": 1, "date": "ISO-8601", "note": "" }]
  }]
}
```

### Consideraciones de tamaño

Con ~500 Funkos × 2 fotos thumbnail (~15KB c/u en base64) el JSON puede llegar a ~15MB.  
Google Drive soporta archivos de texto de hasta 5GB. Para esta escala es completamente viable.

La lista `sold_cleanup` no duplica imágenes: muestra la foto frontal resolviéndola por `barcode` desde `products`.

### Consideraciones de notificaciones (Fase 4)

Las notificaciones son **locales** — se programan con `setTimeout` desde el navegador, no requieren servidor push. Limitación: si el navegador/app está cerrada, los timeouts no corren. Para uso personal con la app abierta regularmente esto es aceptable.

En **iOS**, las notificaciones push requieren iOS 16.4+ **y** que la app esté instalada como PWA (Add to Home Screen). En versiones anteriores no funcionan.

## Roadmap de fases

| Fase | Estado | Descripción |
|---|---|---|
| 1 — Setup & estructura | ✅ Completo | React + Vite + Google Drive + layout base |
| 2 — CRUD completo | ✅ Completo | Catálogo, detalle, edición, ajuste de stock |
| 3 — Agente IA | ✅ Completo | Claude Vision + ZXing barcodes + Apps Script proxy |
| 4 — Notificaciones | 🔜 Siguiente | PWA + Service Worker + notificaciones locales |
