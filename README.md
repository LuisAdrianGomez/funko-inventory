# Funko Inventory 📦

App web personal para gestionar inventario de Funko Pops a la venta.  
Desplegada en GitHub Pages — el inventario vive en **Google Drive** vía Apps Script.

## Stack

- **React + Vite** — UI
- **Tailwind CSS** — Estilos (dark mode)
- **Google Drive + Apps Script** — Persistencia del inventario (`funko-inventory.json` en Drive)
- **Claude API** (Fase 3) — Extracción de metadatos desde fotos con visión
- **Google Apps Script** (Fase 3) — Proxy para la API key de Claude
- **Web Push API** (Fase 4) — Notificaciones push

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
| `VITE_CLAUDE_PROXY_URL` | ✅ Fase 3 | URL del segundo Web App de Apps Script (proxy Claude) |

> ⚠️ Estas URLs nunca deben ir al repositorio. Solo en `.env.local` (ignorado por git).

## Despliegue en GitHub Pages

1. Crear el repositorio en GitHub.
2. Ir a **Settings → Pages → Source: GitHub Actions**.
3. Agregar los siguientes **Secrets** (Settings → Secrets and variables → Actions):
   - `VITE_APPS_SCRIPT_URL`
   - `VITE_CLAUDE_PROXY_URL` (agregar en Fase 3)
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

## Estructura del proyecto

```
src/
├── components/
│   ├── Camera/         CameraCapture (Fase 3)
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
│   ├── AddProduct.jsx   Agregar manual + flujo IA (Fase 3)
│   └── Search.jsx       Búsqueda en tiempo real
├── services/
│   ├── drive.js         readInventory, writeInventory, helpers CRUD
│   └── ai.js            extractFunkoMetadata via Claude (Fase 3)
└── utils/
    ├── image.js         compressToThumbnail, compressForAI
    ├── barcode.js       readBarcodeFromImage via ZXing (Fase 3)
    └── inventory.js     searchProducts, sortProducts, formatDate, etc.

proxy/
└── Code.gs              Apps Script — proxy para Claude API (Fase 3)
```

## Schema del inventario

```json
{
  "version": "1.0",
  "last_updated": "ISO-8601",
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

## Roadmap de fases

| Fase | Estado | Descripción |
|---|---|---|
| 1 — Setup & estructura | ✅ Completo | React + Vite + Google Drive + layout base |
| 2 — CRUD completo | ✅ Completo | Catálogo, detalle, edición, ajuste de stock |
| 3 — Agente IA | 🔜 Siguiente | Claude Vision + ZXing barcodes + Apps Script proxy |
| 4 — Notificaciones | ⏳ Planificado | PWA + Web Push API |
