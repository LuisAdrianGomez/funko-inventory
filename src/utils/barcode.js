// ============================================================
// Funko Inventory — Lector de Código de Barras
// ============================================================
// Usa @zxing/browser para leer códigos EAN-13 / UPC-A / UPC-E
// desde una imagen estática (File o Data URL en base64).
// Intenta múltiples rotaciones si la orientación es incorrecta.
//
// Instalación: npm install @zxing/browser
// ============================================================

import { BrowserMultiFormatReader } from '@zxing/browser'

/**
 * Rota un Data URL de imagen el ángulo indicado (90, 180, 270).
 */
async function rotateImage(dataUrl, degrees) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const swap   = degrees === 90 || degrees === 270
      const canvas = document.createElement('canvas')
      canvas.width  = swap ? img.height : img.width
      canvas.height = swap ? img.width  : img.height

      const ctx = canvas.getContext('2d')
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((degrees * Math.PI) / 180)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)

      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

async function tryDecode(img) {
  const reader = new BrowserMultiFormatReader()
  return reader.decodeFromImageElement(img)
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar la imagen.'))
    img.src = dataUrl
  })
}

/**
 * Lee el código de barras desde una imagen.
 * Intenta la orientación original y luego 180°, 90° y 270° como fallback.
 *
 * @param {File|string} imageSource - File del input[type=file] o Data URL base64
 * @returns {Promise<{ success: true, value: string } | { success: false, error: string }>}
 */
export async function readBarcodeFromImage(imageSource) {
  let objectUrl = null

  try {
    let dataUrl
    if (imageSource instanceof File) {
      objectUrl = URL.createObjectURL(imageSource)
      dataUrl   = objectUrl
    } else if (typeof imageSource === 'string') {
      dataUrl = imageSource
    } else {
      return { success: false, error: 'Tipo de imagen no soportado.' }
    }

    const rotations = [0, 180, 90, 270]

    for (const deg of rotations) {
      try {
        const rotated = deg === 0 ? dataUrl : await rotateImage(dataUrl, deg)
        const img     = await loadImage(rotated)
        const result  = await tryDecode(img)
        return { success: true, value: result.getText() }
      } catch (err) {
        const isNotFound =
          err?.name === 'NotFoundException' ||
          err?.message?.includes('NotFoundException') ||
          err?.message?.includes('No MultiFormat Readers')

        if (!isNotFound) {
          return { success: false, error: err.message || 'Error al leer el código de barras.' }
        }
      }
    }

    return {
      success: false,
      error: 'No se encontró un código de barras en la imagen. Intenta enfocar mejor la base del Funko.',
    }

  } finally {
    if (objectUrl && imageSource instanceof File) {
      URL.revokeObjectURL(objectUrl)
    }
  }
}