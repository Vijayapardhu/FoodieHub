"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Camera, ImagePlus, Loader2, X } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils/cn"

interface ImageUploadProps {
  currentImageUrl?: string | null
  onUploadComplete: (url: string) => void
  bucket: string
  folder?: string
  maxSizeMB?: number
  aspectRatio?: "square" | "banner" | "logo"
  /** `manual` defers the upload to the parent's save action. */
  mode?: "instant" | "manual"
  onManualFileChange?: (file: File | null) => void
  label?: string
  className?: string
}

const aspectClass = {
  banner: "aspect-[3/1]",
  logo: "aspect-square max-w-[9rem]",
  square: "aspect-square",
} as const

export function ImageUpload({
  currentImageUrl,
  onUploadComplete,
  bucket,
  folder = "",
  maxSizeMB = 5,
  aspectRatio = "square",
  mode = "instant",
  onManualFileChange,
  label = "Add a photo",
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const [manualFileSelected, setManualFileSelected] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isManual = mode === "manual"

  useEffect(() => {
    if (!isManual || !manualFileSelected) {
      setPreview(currentImageUrl || null)
    }
  }, [currentImageUrl, isManual, manualFileSelected])

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file")
      return
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Images must be under ${maxSizeMB}MB`)
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
      if (isManual) {
        setManualFileSelected(true)
        onManualFileChange?.(file)
      }
    }
    reader.readAsDataURL(file)

    if (!isManual) await uploadImage(file)
  }

  const uploadImage = async (file: File) => {
    setUploading(true)
    try {
      const supabase = createClient()
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}.${fileExt}`
      const filePath = folder ? `${folder}/${fileName}` : fileName

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { cacheControl: "3600", upsert: false })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath)

      onUploadComplete(publicUrl)
      toast.success("Photo uploaded")
    } catch (error: any) {
      console.error("[upload] failed", error)
      toast.error(error?.message || "Could not upload that photo")
      setPreview(currentImageUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (isManual) {
      setManualFileSelected(false)
      onManualFileChange?.(null)
    }
    onUploadComplete("")
  }

  return (
    <div className={cn("space-y-3", className)}>
      {preview ? (
        <div className={cn("relative w-full", aspectClass[aspectRatio])}>
          <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border bg-muted">
            <Image src={preview} alt="Preview" fill className="object-cover" />
            {uploading ? (
              <span className="absolute inset-0 flex items-center justify-center bg-background/70">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </span>
            ) : null}
          </div>

          <div className="absolute right-2 top-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Replace photo"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-soft backdrop-blur-sm transition-transform active:scale-90"
            >
              <Camera className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              aria-label="Remove photo"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-soft transition-transform active:scale-90"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface-muted p-6 text-center transition-colors active:border-primary",
            aspectClass[aspectRatio]
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <ImagePlus className="h-5 w-5" />
            </span>
          )}
          <span className="text-sm font-semibold text-foreground">
            {uploading ? "Uploading…" : label}
          </span>
          <span className="text-xs text-muted-foreground">
            JPG, PNG or WebP · up to {maxSizeMB}MB
          </span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
    </div>
  )
}
