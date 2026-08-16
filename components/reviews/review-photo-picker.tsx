"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Camera, ImagePlus, X } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { formatBytes, prepareImageForUpload } from "@/lib/utils/image"

export const MAX_REVIEW_PHOTOS = 4
const REVIEW_BUCKET = "reviews"
/** The bucket's own limit. Checked here so the failure is a sentence, not a 413. */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

/**
 * Photo picker for a review, used both when writing one and when editing it.
 *
 * It lives in one component because the two forms had drifted: writing a
 * review could attach photos and editing it could not, so opening an old
 * review to fix a typo showed no sign the photos existed — and any attempt to
 * manage them had to go through deleting the review.
 */
export function ReviewPhotoPicker({
  photos,
  onChange,
  /** Folder within the bucket, e.g. an order or review id. */
  pathPrefix,
  disabled = false,
}: {
  photos: string[]
  onChange: (photos: string[]) => void
  pathPrefix: string
  disabled?: boolean
}) {
  // Two inputs, because they open two different things: `capture` goes
  // straight to the camera, and its absence goes to the photo library.
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [hasCamera, setHasCamera] = useState(false)
  const [uploading, setUploading] = useState(false)

  // `capture` is ignored on a desktop browser, where the button would just
  // open a file dialog that says "take photo" — so it is only offered on a
  // device that plausibly has a camera to point at the food.
  useEffect(() => {
    setHasCamera(window.matchMedia("(pointer: coarse)").matches)
  }, [])

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files?.length) return

    const slots = MAX_REVIEW_PHOTOS - photos.length
    if (slots <= 0) {
      toast.error(`Up to ${MAX_REVIEW_PHOTOS} photos`)
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const uploaded: string[] = []

      for (const original of Array.from(files).slice(0, slots)) {
        if (!original.type.startsWith("image/")) continue

        // Downscale and re-encode before it leaves the phone: camera files
        // are routinely larger than the 5MB bucket limit, and an iPhone's
        // HEIC would upload fine and then fail to display for everybody else.
        const { file } = await prepareImageForUpload(original)

        if (file.size > MAX_UPLOAD_BYTES) {
          toast.error(
            `That photo is ${formatBytes(file.size)} — too large to upload.`
          )
          continue
        }

        const fileExt = file.name.split(".").pop() ?? "jpg"
        const filePath = `${pathPrefix}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${fileExt}`

        const { error } = await supabase.storage
          .from(REVIEW_BUCKET)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          })
        if (error) throw error

        const {
          data: { publicUrl },
        } = supabase.storage.from(REVIEW_BUCKET).getPublicUrl(filePath)
        uploaded.push(publicUrl)
      }

      if (uploaded.length > 0) onChange([...photos, ...uploaded])
    } catch (error: any) {
      toast.error(
        error?.message?.includes("Bucket not found")
          ? "Photo storage isn't set up yet — your review will still post without photos."
          : error?.message || "Could not upload those photos"
      )
    } finally {
      setUploading(false)
      // Reset both, so picking the same file twice still fires a change.
      if (cameraInputRef.current) cameraInputRef.current.value = ""
      if (galleryInputRef.current) galleryInputRef.current.value = ""
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Photos</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {photos.length}/{MAX_REVIEW_PHOTOS}
        </span>
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo}
              className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
            >
              <Image
                src={photo}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => onChange(photos.filter((p) => p !== photo))}
                aria-label="Remove photo"
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          A photo of the actual plate is the most useful thing in a review.
        </p>
      )}

      {photos.length < MAX_REVIEW_PHOTOS ? (
        <div className="flex gap-2">
          {hasCamera ? (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={disabled}
              loading={uploading}
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
              Take photo
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={disabled}
            loading={uploading && !hasCamera}
            onClick={() => galleryInputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" />
            {hasCamera ? "Gallery" : "Add photos"}
          </Button>
        </div>
      ) : null}

      {/* Rear camera: the food is in front of you, not behind the phone. */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleSelect}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleSelect}
      />
    </section>
  )
}
