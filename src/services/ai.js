// ============================================================
// Funko Inventory — Servicio de IA
// ============================================================
// Envía una imagen al proxy de Claude (Apps Script) y retorna
// los metadatos extraídos del Funko Pop.
// ============================================================

const PROXY_URL = import.meta.env.VITE_CLAUDE_PROXY_URL
const TIMEOUT_MS = 30_000

/**
 * Extrae los metadatos de un Funko Pop a partir de una foto frontal.
 *
 * @param {string} imageBase64 - Data URL completa (data:image/jpeg;base64,...)
 * @returns {Promise<{ name, number, line, series, exclusive, is_exclusive }>}
 * @throws {Error} con mensaje descriptivo para mostrar en toast
 */
export async function extractFunkoMetadata(imageBase64) {
  if (!PROXY_URL) {
    throw new Error('VITE_CLAUDE_PROXY_URL no está configurada.')
  }

  // --- Separar prefijo del base64 puro ---
  const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) {
    throw new Error('Formato de imagen inválido. Se esperaba un Data URL en base64.')
  }
  const mediaType   = match[1] // ej. "image/jpeg"
  const base64Clean = match[2] // base64 sin el prefijo data:...

  // --- Llamar al proxy con timeout ---
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response
  try {
    response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: base64Clean, media_type: mediaType }),
      signal: controller.signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('La IA tardó demasiado. Intenta de nuevo.')
    }
    throw new Error('No se pudo conectar al proxy de Claude. Verifica tu conexión.')
  } finally {
    clearTimeout(timer)
  }

  // --- Parsear respuesta ---
  let data
  try {
    data = await response.json()
  } catch {
    throw new Error(`Error inesperado del proxy (HTTP ${response.status}).`)
  }

  if (!data.ok) {
    throw new Error(data.error || 'Error desconocido al extraer metadatos.')
  }

  return data.metadata
}
