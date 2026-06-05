# Ajustes Realizados - Funko Inventory

## Resumen General

Este documento resume los ajustes recientes realizados en Funko Inventory para cerrar la Fase 4, estabilizar errores de consola/build, mejorar busqueda e historial, agregar reportes, registrar ventas para depuracion fotografica y reforzar el flujo de fotos con IA.

## Fase 4 / PWA

- Se estabilizaron los ajustes de PWA, manifest y service worker.
- Se conservaron notificaciones locales con boton de prueba.
- Se actualizaron textos en Configuracion para no prometer recordatorios confiables en segundo plano.
- Se documento la limitacion actual: los recordatorios dependen de que la app/PWA conserve una sesion activa.
- Web Push con backend queda fuera del alcance actual.

## Buscador

- Se corrigio la busqueda para operar sobre el array real de productos.
- La busqueda ahora es tolerante a mayusculas, acentos y espacios.
- Campos considerados:
  - Nombre
  - Linea
  - Serie
  - Numero
  - Barcode
  - Exclusiva

## Exclusividad

- `ProductEdit.jsx`: el campo "Exclusiva de" queda siempre visible.
- `AddProduct.jsx`: la exclusividad queda editable en flujo IA y flujo manual.
- Si el usuario escribe una exclusividad, se marca `is_exclusive=true`.
- Si el usuario borra la exclusividad, se limpia el dato y queda como no exclusivo.

## Historial Editable

- Se agrego la ruta `/product/:id/history`.
- `ProductHistory.jsx` muestra el historial completo del producto.
- Se agrego popup para editar:
  - Descripcion / nota del movimiento.
  - Fecha y hora del movimiento.
- `InventoryContext.jsx` y `drive.js` exponen el helper `editHistoryEntry`.
- La edicion del historial no cambia accion, unidades ni stock.

## Reportes

- Se agrego la ruta `/reports`.
- Reportes muestra:
  - Total de productos.
  - Total de unidades.
  - Total de exclusivos.
  - Productos sin stock.
  - Valor total estimado.
  - Desglose por linea.
  - Listado de productos con precio, stock y valor.
- Se agrego exportacion CSV con columnas:

```text
barcode,name,number,line,series,exclusive,stock,price,total_value
```

## Depuracion De Vendidos

- Se agrego la coleccion `sold_cleanup` dentro del JSON del inventario.
- Se agrego la ruta `/sold-cleanup`.
- Al presionar `-` en el detalle de producto:
  - Se reduce el stock.
  - Se registra movimiento de historial.
  - Se agrega entrada en la lista de depuracion.
- La lista permite seleccionar uno o varios registros y eliminarlos.
- Eliminar registros de depuracion no modifica stock ni historial.
- La imagen frontal se muestra por referencia al producto usando `barcode`, sin duplicar base64 dentro de `sold_cleanup`.
- Notas por defecto:
  - Al presionar `+`: `Se agrega pieza`
  - Al presionar `-`: `Venta`

## Fotos / IA

- `CameraCapture.jsx` ahora acepta la prop `quality`.
- En foto frontal de `AddProduct.jsx` se usa:
  - `maxPx={1200}`
  - `quality={0.85}`
- Se agrego una guia mas clara para tomar foto frontal:
  - Centrar caja o figura completa.
  - Procurar que nombre y numero se lean.
  - Usar buena luz.
  - Evitar reflejos.
  - Evitar cortar esquinas.
- Pendiente recomendado: hacer el flujo tolerante a fallos de IA para que conserve la foto y permita continuar manualmente si el analisis falla.

## Archivos Modificados Relevantes

- `src/services/drive.js`
- `src/context/InventoryContext.jsx`
- `src/pages/AddProduct.jsx`
- `src/pages/ProductEdit.jsx`
- `src/pages/ProductHistory.jsx`
- `src/pages/SoldCleanup.jsx`
- `src/pages/Reports.jsx`
- `src/pages/Search.jsx`
- `src/pages/Home.jsx`
- `src/pages/Settings.jsx`
- `src/components/Camera/CameraCapture.jsx`
- `src/App.jsx`
- `README.md`

## Validaciones Registradas

- `npm.cmd run lint` paso limpio.
- `npm.cmd run build` paso correctamente fuera del sandbox.
- Warning conocido pendiente: chunk grande de Vite, no bloqueante.

## Pendientes Sugeridos

- Mejorar flujo de IA para que, si falla el analisis, conserve la foto y permita continuar manualmente.
- Revisar o copiar al repo el `proxy/Code.gs` real para auditar y mejorar el prompt de Claude.
- Evaluar recorte o preview guiado si las fotos siguen fallando.
