# Funko Inventory App — Briefing Fase 2
**Para:** agente `architect-fase2`  
**Proyecto:** Funko Inventory — Web App personal  
**Fase:** 2 de 4 — Módulo CRUD Completo  
**Duración estimada:** Semana 2  
**Prerequisito:** Fase 1 completada (app desplegada en GitHub Pages, `readInventory`/`writeInventory` funcionando)

---

## Contexto heredado de Fase 1

La Fase 1 entregó:
- App React + Vite con Tailwind CSS desplegada en GitHub Pages.
- `src/services/github.js` con `readInventory`, `writeInventory`, `findByBarcode`, `addUnit`, `addProduct`.
- `src/hooks/useInventory.js` con `handleBarcode`, stats derivados, y `refresh`.
- Páginas shell: `Home`, `Catalog` (grid vacío), `AddProduct` (placeholder), `Search` (búsqueda funcional).
- `public/data/inventory.json` con schema v1.0 y 1 producto de ejemplo.

---

## Objetivo de Fase 2

Construir el **módulo CRUD completo** para que el usuario pueda:
1. **Ver** todos sus Funkos en una cuadrícula visual.
2. **Ver detalle** de un producto (foto, historial, stock).
3. **Editar manualmente** cualquier campo de un producto.
4. **Eliminar** un producto del inventario.
5. **Ajustar stock** manualmente (+1 / -1 / valor directo).
6. **Filtrar y ordenar** el catálogo.

> ⚠️ El flujo de agregar por foto (scan + IA) llega en Fase 3. En Fase 2 solo se agrega de forma manual.

---

## Tareas de Fase 2

### Tarea 2.1 — Página Catalog completa

**Archivo:** `src/pages/Catalog.jsx`

Funcionalidades:
- Grid de `ProductCard` componentes, 2 columnas en móvil.
- Barra de filtros encima del grid:
  - Filtro por línea (`line`): dropdown o chips horizontales.
  - Filtro exclusivos: toggle `is_exclusive`.
  - Orden: nombre A-Z, stock mayor-menor, más reciente.
- Pull-to-refresh (swipe hacia abajo recarga desde GitHub).
- Contador de resultados visibles.

**ProductCard mejorada** (`src/components/Inventory/ProductCard.jsx`):
- Mostrar imagen thumbnail (base64) si existe, placeholder si no.
- Nombre, línea, número.
- Badge de exclusividad (nombre de tienda).
- Badge de stock con color semántico (verde ≥2, amarillo =1, rojo =0).
- Al tocar → navega a `/product/:id`.

---

### Tarea 2.2 — Página de detalle de producto

**Archivo nuevo:** `src/pages/ProductDetail.jsx`  
**Ruta:** `/product/:id`

Secciones:
- Imagen frontal grande (o placeholder).
- Datos principales: nombre, número, línea, serie, exclusividad.
- Imagen de la base (thumbnail pequeño).
- Panel de stock con botones +/- y campo numérico directo.
- Historial de movimientos (tabla o lista compacta).
- Botón "Editar" → navega a `/product/:id/edit`.
- Botón "Eliminar" → modal de confirmación → elimina y regresa a catálogo.

---

### Tarea 2.3 — Formulario de edición

**Archivo nuevo:** `src/pages/ProductEdit.jsx`  
**Ruta:** `/product/:id/edit`

Campos editables:
- `name` (texto)
- `number` (texto corto)
- `line` (texto)
- `series` (texto)
- `exclusive` (texto, vacío si no es exclusivo)
- `is_exclusive` (checkbox/toggle, sincronizado con `exclusive`)
- `price` (número decimal, opcional)
- `notes` (textarea)
- `image_front` (input file → convierte a base64 thumbnail 200px)
- `image_base` (input file → convierte a base64 thumbnail 200px)

Comportamiento:
- Botón "Guardar" → llama `writeInventory` → muestra spinner → toast de éxito/error.
- Botón "Cancelar" → regresa a `/product/:id` sin guardar.
- Validación: `name` requerido, `stock` no editable aquí (se maneja en detalle).

---

### Tarea 2.4 — Flujo de agregar manual

**Archivo actualizado:** `src/pages/AddProduct.jsx`

Añadir sección "Agregar manualmente" (además del placeholder de Fase 3):
- Formulario con los mismos campos que el edit form.
- Campo `barcode` (requerido, numérico, validar que no exista ya).
- Al guardar → `addProduct(inventory, {...})` → `writeInventory` → navega al nuevo producto.
- El botón de Fase 3 (foto + IA) queda como placeholder visual separado.

---

### Tarea 2.5 — Ajuste de stock

**Ubicación:** dentro de `ProductDetail.jsx`

Lógica:
- Botón `-1`: llama helper `removeUnit(inventory, barcode)` (nuevo helper a crear en `github.js`).
- Botón `+1`: llama `addUnit(inventory, barcode)`.
- Campo numérico directo: `setStock(inventory, barcode, value)` (nuevo helper a crear).
- Ambos helpers registran en `history` la acción (`add` o `remove`) con fecha y unidades.
- Deshabilitar `-1` si `stock === 0`.

**Nuevos helpers a implementar en `src/services/github.js`:**
```js
export function removeUnit(inventory, barcode)
export function setStock(inventory, barcode, newValue)
```

---

### Tarea 2.6 — Toasts y feedback visual

**Archivo nuevo:** `src/components/UI/Toast.jsx` + `src/hooks/useToast.js`

- Toast apilable (máx 3), aparece abajo al centro, auto-desaparece en 3s.
- Variantes: `success` (verde), `error` (rojo), `info` (azul).
- Usar en: guardar producto, eliminar, error de red, conflicto de escritura.

---

### Tarea 2.7 — Routing actualizado

**Archivo actualizado:** `src/App.jsx`

Nuevas rutas:
```
/product/:id          → ProductDetail
/product/:id/edit     → ProductEdit
/add                  → AddProduct (ya existente, ahora con formulario manual)
```

---

### Tarea 2.8 — Helper de compresión de imágenes

**Archivo nuevo:** `src/utils/image.js`

```js
/**
 * Toma un File de input[type=file] y devuelve un string base64
 * con la imagen redimensionada a máximo 200px (lado mayor),
 * comprimida como JPEG con quality=0.75.
 */
export async function compressToThumbnail(file, maxPx = 200, quality = 0.75)
```

Implementar con `Canvas API` (no se necesita librería externa).

---

## Definición de "Done" para Fase 2

| Criterio | Verificación |
|---|---|
| Catálogo muestra productos con imagen y stock | Grid visible con ≥1 producto real |
| Filtros funcionan | Filtrar por línea y exclusivos produce resultados correctos |
| Detalle de producto accesible | Tap en card navega a `/product/:id` |
| Stock ajustable | +1/-1 actualiza el JSON en GitHub |
| Edición completa | Guardar edición actualiza el producto en GitHub |
| Eliminación funciona | Producto eliminado desaparece del catálogo |
| Agregar manual funciona | Producto nuevo creado aparece en catálogo |
| Imágenes comprimen | Foto de 4MB queda en base64 ≤~15KB |
| Toasts aparecen | Éxito/error visibles tras cada operación de escritura |

---

## Entregables al cerrar Fase 2

1. Código de Fase 2 commiteado en `main` y desplegado en GitHub Pages.
2. Catálogo con filtros, detalle, edición y ajuste de stock funcionando end-to-end.
3. `inventory.json` con ≥3 productos de ejemplo (con imágenes thumbnail reales si es posible).
4. Documento `FASE_3_ARCHITECT_BRIEF.md` con las tareas del agente de IA.

---

## Contexto adicional para el agente

- **No romper la API de `github.js`**: los helpers existentes (`readInventory`, `writeInventory`, `findByBarcode`, `addUnit`, `addProduct`) no deben cambiar su firma.
- **Fase 3 depende del campo `barcode`**: no alterar la lógica de deduplicación por código de barras.
- **Imágenes en base64**: el JSON puede crecer. Con 500 Funkos × 2 fotos × ~15KB ≈ 15MB. Esto es el límite aceptable para el repo de GitHub (recomendado < 50MB). Documentar esto en README.
- **Conflictos de escritura**: si dos tabs abren la app, puede haber conflicto de SHA. El toast de error debe explicar esto y ofrecer botón "Recargar".
