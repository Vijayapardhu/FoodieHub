"use client"

/**
 * Gets a phone photo ready to upload.
 *
 * Two problems make raw camera files unusable here:
 *
 *   Size. A modern phone photo is 3–8MB. The storage buckets cap at 5MB, so
 *   a straight upload of a good camera's output is rejected — and even under
 *   the cap, sending 5MB over campus wifi to attach a picture of a dosa is a
 *   poor trade.
 *
 *   Format. iPhones hand over HEIC. Safari can display it; Chrome, Firefox
 *   and every Android browser cannot, so the photo would upload successfully
 *   and then appear broken to everyone else — the worst kind of failure,
 *   because the person who posted it sees it fine.
 *
 * Both are fixed by drawing the image to a canvas and re-encoding as JPEG.
 * Conversion happens on the device that took the photo, which is the one
 * device guaranteed to be able to decode it.
 */

/** Long edge, in pixels. Plenty for a review photo on any screen. */
const MAX_DIMENSION = 1600
const QUALITY = 0.82

export interface PreparedImage {
  file: File
  /** True when the file was re-encoded rather than passed through. */
  converted: boolean
}

export async function prepareImageForUpload(
  file: File
): Promise<PreparedImage> {
  // Anything already small and web-safe is left alone: re-encoding a
  // 200KB JPEG only loses quality.
  const webSafe = /^image\/(jpeg|png|webp)$/.test(file.type)
  if (webSafe && file.size <= 1_200_000) {
    return { file, converted: false }
  }

  try {
    const bitmap = await createImageBitmap(file)

    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height)
    )
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext("2d")
    if (!context) throw new Error("no 2d context")
    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY)
    )
    if (!blob) throw new Error("encode failed")

    const name = file.name.replace(/\.[^.]+$/, "") || "photo"
    return {
      file: new File([blob], `${name}.jpg`, { type: "image/jpeg" }),
      converted: true,
    }
  } catch {
    // A format the browser cannot decode — HEIC outside Safari, say. Upload
    // the original and let the size limit decide; failing here would block a
    // photo that might well have been fine.
    return { file, converted: false }
  }
}

/** Human-readable size, for error messages that need to be actionable. */
export function formatBytes(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)}MB`
  return `${Math.round(bytes / 1024)}KB`
}
