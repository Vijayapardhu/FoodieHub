"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import Image from "next/image"

interface ImageUploadProps {
  currentImageUrl?: string | null
  onUploadComplete: (url: string) => void
  bucket: string
  folder?: string
  maxSizeMB?: number
  aspectRatio?: "square" | "banner" | "logo"
  mode?: "instant" | "manual"
  onManualFileChange?: (file: File | null) => void
  className?: string
}

export function ImageUpload({
  currentImageUrl,
  onUploadComplete,
  bucket,
  folder = "",
  maxSizeMB = 5,
  aspectRatio = "square",
  mode = "instant",
  onManualFileChange,
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const [manualFileSelected, setManualFileSelected] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const isManual = mode === "manual"

  useEffect(() => {
    if (!isManual || !manualFileSelected) {
      setPreview(currentImageUrl || null)
    }
  }, [currentImageUrl, isManual, manualFileSelected])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Image size must be less than ${maxSizeMB}MB`)
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setPreview(result)
      if (isManual) {
        setManualFileSelected(true)
        onManualFileChange?.(file)
      }
    }
    reader.readAsDataURL(file)

    if (!isManual) {
      await uploadImage(file)
    }
  }

  const uploadImage = async (file: File) => {
    try {
      setUploading(true)

      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = folder ? `${folder}/${fileName}` : fileName

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath)

      onUploadComplete(publicUrl)
      toast.success("Image uploaded successfully")
    } catch (error: any) {
      console.error("Error uploading image:", error)
      toast.error(error.message || "Failed to upload image")
      setPreview(currentImageUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    if (isManual) {
      setManualFileSelected(false)
      onManualFileChange?.(null)
    }
    onUploadComplete("")
  }

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "banner":
        return "aspect-[3/1]"
      case "logo":
        return "aspect-square"
      default:
        return "aspect-square"
    }
  }

  return (
    <div className="space-y-4">
      {preview ? (
        <div className={`relative ${className ?? ""}`}>
          <div className={`relative overflow-hidden rounded-lg border ${getAspectRatioClass()}`}>
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-primary ${getAspectRatioClass()}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Click to upload image
            </p>
            <p className="text-xs text-gray-500">
              Max {maxSizeMB}MB
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {!preview && (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Uploading..." : "Select Image"}
        </Button>
      )}
    </div>
  )
}

