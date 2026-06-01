# Funko Inventory 📦

App web personal para gestionar inventario de Funko Pops a la venta.  
Desplegada en GitHub Pages, sin backend — el JSON vive en el repositorio.

## Stack

- **React + Vite** — UI
- **Tailwind CSS** — Estilos (dark mode)
- **GitHub Contents API** — Persistencia del inventario (`public/data/inventory.json`)
- **Claude API** (Fase 3) — Extracción de metadatos desde fotos
- **Cloudflare Worker** (Fase 3) — Proxy para la API key de Claude
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
# Editar .env.local con tu GitHub token, usuario y repo

# 4. Correr en desarrollo
npm run dev
```

## Variables de entorno

Ver `.env.example` para la lista completa y documentación.

| Variable | Requerida | Descripción |
|---|---|---|
| `VITE_GITHUB_TOKEN` | ✅ Para escribir | PAT con `contents:write` |
| `VITE_GITHUB_OWNER` | ✅ | Tu usuario de GitHub |
| `VITE_GITHUB_REPO` | ✅ | Nombre del repositorio |
| `VITE_GITHUB_BRANCH` | ✅ | Rama (default: `main`) |

> ⚠️ El token nunca debe ir al repositorio. Solo en `.env.local` (ignorado por git).

## Despliegue en GitHub Pages

1. Crear el repositorio en GitHub.
2. Ir a **Settings → Pages → Source: GitHub Actions**.
3. Agregar los siguientes **Secrets** (Settings → Secrets and variables → Actions):
   - `VITE_GITHUB_OWNER`
   - `VITE_GITHUB_REPO`
   - `VITE_GITHUB_BRANCH`
4. El workflow `.github/workflows/deploy.yml` se dispara con cada push a `main`.

> El `VITE_GITHUB_TOKEN` **no** va en los Secrets del Actions — se carga desde `.env.local` en el cliente del usuario.

## Estructura del proyecto

```
src/
├── components/
│   ├── Layout/         Header, BottomNav, Layout
│   ├── Inventory/      ProductCard
│   └── UI/             Badge, Spinner
├── hooks/
│   ├── useInventory.js  Estado central del inventario
│   └── useGitHub.js     Wrapper de la GitHub API
├── pages/
│   ├── Home.jsx         Dashboard con stats
│   ├── Catalog.jsx      Grid de productos
│   ├── AddProduct.jsx   Agregar (Fase 3)
│   └── Search.jsx       Búsqueda en tiempo real
├── services/
│   └── github.js        readInventory, writeInventory, helpers
└── utils/
    └── inventory.js     searchProducts, sortProducts, formatDate, etc.
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
GitHub acepta archivos hasta 100MB en repos (recomendado < 50MB). Para esta escala es perfectamente viable.

## Roadmap de fases

| Fase | Estado | Descripción |
|---|---|---|
| 1 — Setup & estructura | ✅ Completo | React + Vite + GitHub API + layout base |
| 2 — CRUD completo | 🔜 Siguiente | Catálogo, detalle, edición, stock |
| 3 — Agente IA | ⏳ Planificado | Claude Vision + Cloudflare Worker proxy |
| 4 — Notificaciones | ⏳ Planificado | PWA + Web Push API |
