// ============================================================
// Funko Inventory — Servicio de IA
// ============================================================
// Envía una imagen al proxy de Gemini (Apps Script) y retorna
// los metadatos extraídos del Funko Pop.
// ============================================================

const PROXY_URL  = import.meta.env.VITE_CLAUDE_PROXY_URL
const TIMEOUT_MS = 30_000

// Límite estimado del free tier de Gemini por día
const DAILY_LIMIT   = 20
// Avisar cuando queden este número de requests
const WARN_AT       = 5
const LS_COUNT_KEY  = 'gemini_daily_count'
const LS_DATE_KEY   = 'gemini_daily_date'

// ── Contador diario ────────────────────────────────────────────────────────

function getTodayStr() {
  return new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"
}

function getCounter() {
  const savedDate  = localStorage.getItem(LS_DATE_KEY)
  const today      = getTodayStr()

  // Si es un día nuevo, resetear el contador
  if (savedDate !== today) {
    localStorage.setItem(LS_DATE_KEY, today)
    localStorage.setItem(LS_COUNT_KEY, '0')
    return 0
  }

  return parseInt(localStorage.getItem(LS_COUNT_KEY) || '0', 10)
}

function incrementCounter() {
  const current = getCounter()
  localStorage.setItem(LS_COUNT_KEY, String(current + 1))
  return current + 1
}

/**
 * Retorna cuántos requests de IA quedan hoy según el contador local.
 * Útil para mostrar en UI si se desea.
 */
export function getRemainingRequests() {
  return Math.max(0, DAILY_LIMIT - getCounter())
}

// ── Extracción de metadatos ────────────────────────────────────────────────

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
  const mediaType   = match[1]
  const base64Clean = match[2]

  // --- Llamar al proxy con timeout ---
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response
  try {
    response = await fetch(PROXY_URL, {
      method: 'POST',
      // text/plain evita el preflight CORS que Apps Script no maneja
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ image_base64: base64Clean, media_type: mediaType }),
      signal: controller.signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('La IA tardó demasiado. Intenta de nuevo.')
    }
    throw new Error('No se pudo conectar al proxy de Gemini. Verifica tu conexión.')
  } finally {
    clearTimeout(timer)
  }

  // --- Parsear respuesta ---
  let data
  try {
    data = await response.json()
    console.log('[AI] Respuesta completa:', JSON.stringify(data)) // ← agregar
  } catch {
    throw new Error(`Error inesperado del proxy (HTTP ${response.status}).`)
  }

  if (!data.ok) {
    throw new Error(data.error || 'Error desconocido al extraer metadatos.')
  }

  // --- Actualizar contador y calcular restantes ---
  const usedToday  = incrementCounter()
  const remaining  = DAILY_LIMIT - usedToday
  
  // Lanzar advertencia como propiedad adjunta al resultado
  // AddProduct.jsx la leerá para mostrar el toast
  const result = { ...data.metadata }
  if (remaining <= WARN_AT && remaining > 0) {
    result._warning = `Te quedan ${remaining} foto${remaining !== 1 ? 's' : ''} disponible${remaining !== 1 ? 's' : ''} con IA para hoy.`
  } else if (remaining === 0) {
    result._warning = 'Usaste todas las fotos con IA de hoy. Se renueva mañana.'
  }

  return result
}