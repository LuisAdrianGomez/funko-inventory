/**
 * image.js — Image compression utilities
 *
 * Uses the Canvas API to resize and compress images client-side.
 * No external dependencies required.
 */

/**
 * Takes a File from input[type=file] and returns a base64 string
 * with the image resized to max `maxPx` on the longest side,
 * compressed as JPEG with the given quality.
 *
 * @param {File} file       - Image file from <input type="file">
 * @param {number} maxPx    - Max pixels on the longest side (default 200)
 * @param {number} quality  - JPEG quality 0–1 (default 0.75)
 * @returns {Promise<string>} base64 data URL (data:image/jpeg;base64,...)
 */
export async function compressToThumbnail(file, maxPx = 200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('El archivo debe ser una imagen.'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Error al leer el archivo.'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Error al cargar la imagen.'))
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img
        if (width > height) {
          if (width > maxPx) {
            height = Math.round((height * maxPx) / width)
            width = maxPx
          }
        } else {
          if (height > maxPx) {
            width = Math.round((width * maxPx) / height)
            height = maxPx
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}
