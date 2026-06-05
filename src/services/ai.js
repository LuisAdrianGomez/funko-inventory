// ============================================================
// Funko Inventory — Gemini Vision Proxy
// ============================================================
// Endpoint único:
//   POST { image_base64: string, media_type: string }
//   → { ok: true,  metadata: { name, number, line, series, exclusive, is_exclusive } }
//   → { ok: false, error: string }
//
// Setup (una sola vez):
//   1. En el editor: Proyecto → Configuración del proyecto →
//      Propiedades del script → Agregar propiedad:
//        Key:   GEMINI_API_KEY
//        Value: tu API key de aistudio.google.com
//   2. Desplegar como Web App:
//        Execute as: Me
//        Who has access: Anyone
//   3. Copiar la URL del Web App a VITE_CLAUDE_PROXY_URL en .env.local
//
// ⚠️  Este es un proyecto SEPARADO del backend de Drive.
// ============================================================

const GEMINI_MODEL   = 'gemini-2.0-flash'
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent'

const PROMPT = `Eres un experto en Funko Pops. Analiza la imagen y extrae los metadatos visibles.
Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin backticks.

Formato exacto requerido:
{
  "name": "nombre del personaje",
  "number": "número en la caja (solo dígitos, sin #)",
  "line": "línea principal (ej: Marvel, DC, Disney, Star Wars)",
  "series": "nombre de la serie o colección específica",
  "exclusive": "nombre de la tienda exclusiva o null si no es exclusivo",
  "is_exclusive": true o false
}

Si no puedes leer un campo con certeza, usa null para ese campo.
Nunca inventes datos que no sean claramente visibles en la imagen.`

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}

function getApiKey() {
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY')
  if (!key) throw new Error('GEMINI_API_KEY no configurada en las propiedades del script.')
  return key
}

// ------------------------------------------------------------
// GET handler — health check
// ------------------------------------------------------------

function doGet() {
  return jsonResponse({ ok: true, message: 'Gemini proxy activo. Modelo: ' + GEMINI_MODEL })
}

// ------------------------------------------------------------
// POST handler — extrae metadatos de una imagen de Funko
// ------------------------------------------------------------

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: 'Request body vacío.' })
    }

    const body = JSON.parse(e.postData.contents)

    if (!body.image_base64) {
      return jsonResponse({ ok: false, error: 'Campo requerido: image_base64' })
    }

    const mediaType = body.media_type || 'image/jpeg'
    const apiKey    = getApiKey()

    // --- Construir request para Gemini ---
    const payload = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mediaType,
                data: body.image_base64,
              },
            },
            {
              text: PROMPT,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 512,
      },
    }

    const response = UrlFetchApp.fetch(GEMINI_API_URL + '?key=' + apiKey, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    })

    const statusCode = response.getResponseCode()
    const rawText    = response.getContentText()

    // --- Manejar errores HTTP ---
    if (statusCode !== 200) {
      let errorMsg = 'Gemini API error ' + statusCode
      try {
        const errorBody = JSON.parse(rawText)
        if (errorBody.error && errorBody.error.message) {
          errorMsg = errorBody.error.message
        }
      } catch (_) {}
      return jsonResponse({ ok: false, error: errorMsg })
    }

    // --- Extraer texto de la respuesta ---
    const geminiResponse = JSON.parse(rawText)
    const text = geminiResponse
      ?.candidates?.[0]
      ?.content
      ?.parts?.[0]
      ?.text

    if (!text) {
      return jsonResponse({ ok: false, error: 'Gemini no devolvió texto en la respuesta.' })
    }

    // --- Parsear JSON de metadatos (robusto ante texto extra) ---
    let metadata
    try {
      const clean = text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim()

      // Extraer el primer objeto JSON aunque Gemini agregue texto alrededor
      const jsonMatch = clean.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No se encontró JSON en la respuesta de Gemini.')
      metadata = JSON.parse(jsonMatch[0])
    } catch (_) {
      return jsonResponse({
        ok: false,
        error: 'No se pudo parsear el JSON de metadatos. Respuesta: ' + text,
      })
    }

    // --- Normalizar campos ---
    const normalized = {
      name:         metadata.name         || null,
      number:       metadata.number != null ? String(metadata.number) : null,
      line:         metadata.line         || null,
      series:       metadata.series       || null,
      exclusive:    metadata.exclusive    || null,
      is_exclusive: metadata.is_exclusive === true,
    }

    return jsonResponse({ ok: true, metadata: normalized })

  } catch (err) {
    return jsonResponse({ ok: false, error: err.message })
  }
}