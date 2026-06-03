// ============================================================
// Funko Inventory — Lector de Código de Barras
// ============================================================
// Usa @zxing/browser para leer códigos EAN-13 / UPC-A / UPC-E
// desde una imagen estática (File o Data URL en base64).
//
// Instalación: npm install @zxing/browser
// ============================================================

import { BrowserMultiFormatReader } from '@zxing/browser'

/**
 * Lee el código de barras desde una imagen.
 *
 * @param {File|string} imageSource - File del input[type=file] o Data URL base64
 * @returns {Promise<{ success: true, value: string } | { success: false, error: string }>}
 */
export async function readBarcodeFromImage(imageSource) {
  let objectUrl = null

  try {
    // --- Crear URL temporal para que ZXing pueda decodificar ---
    if (imageSource instanceof File) {
      objectUrl = URL.createObjectURL(imageSource)
    } else if (typeof imageSource === 'string') {
      objectUrl = imageSource // ZXing acepta data URLs directamente en img.src
    } else {
      return { success: false, error: 'Tipo de imagen no soportado.' }
    }

    // --- Crear <img> temporal en memoria (fuera del DOM) ---
    const img = new Image()

    await new Promise((resolve, reject) => {
      img.onload  = resolve
      img.onerror = () => reject(new Error('No se pudo cargar la imagen.'))
      img.src = objectUrl
    })

    // --- Decodificar con ZXing (sin hints — soporta todos los formatos) ---
    const reader = new BrowserMultiFormatReader()
    const result = await reader.decodeFromImageElement(img)

    return { success: true, value: result.getText() }

  } catch (err) {
    // ZXing lanza "NotFoundException" cuando no encuentra ningún código
    const isNotFound =
      err?.name === 'NotFoundException' ||
      err?.message?.includes('No MultiFormat Readers') ||
      err?.message?.includes('NotFoundException')

    if (isNotFound) {
      return {
        success: false,
        error: 'No se encontró un código de barras en la imagen. Intenta enfocar mejor la base del Funko.',
      }
    }

    return { success: false, error: err.message || 'Error al leer el código de barras.' }
  } finally {
    // Liberar memoria si creamos un object URL desde un File
    if (objectUrl && imageSource instanceof File) {
      URL.revokeObjectURL(objectUrl)
    }
  }
}