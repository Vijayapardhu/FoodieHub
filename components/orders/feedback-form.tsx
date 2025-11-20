"use client"

import { useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Database } from "@/types/database.types"
import { Star, ArrowLeft, Upload, X } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import Image from "next/image"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  canteens: Database["public"]["Tables"]["canteens"]["Row"]
  order_items: Array<
    Database["public"]["Tables"]["order_items"]["Row"] & {
      items: Database["public"]["Tables"]["items"]["Row"]
    }
  >
}

interface FeedbackFormProps {
  order: Order
  existingReview:
    | {
        id: string
        rating: number
        comment: string | null
        photos: string[] | null
      }
    | null
}

export function FeedbackForm({ order, existingReview }: FeedbackFormProps) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [comment, setComment] = useState(existingReview?.comment ?? "")
  const [photos, setPhotos] = useState<string[]>(existingReview?.photos ?? [])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const MAX_PHOTOS = 4
  const REVIEW_BUCKET = "reviews"

  const uploadPhoto = async (file: File) => {
    const fileExt = file.name.split(".").pop()
    const filePath = `reviews/${order.id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from(REVIEW_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) throw uploadError

    const {
      data: { publicUrl },
    } = supabase.storage.from(REVIEW_BUCKET).getPublicUrl(filePath)

    return publicUrl
  }

  const handlePhotoSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files
    if (!files?.length) return

    const availableSlots = MAX_PHOTOS - photos.length
    if (availableSlots <= 0) {
      toast.error(`You can upload up to ${MAX_PHOTOS} photos`)
      return
    }

    const filesToUpload = Array.from(files).slice(0, availableSlots)

    try {
      setUploadingPhotos(true)
      const uploadedUrls: string[] = []

      for (const file of filesToUpload) {
        if (!file.type.startsWith("image/")) {
          toast.error("Please select image files only")
          continue
        }

        const url = await uploadPhoto(file)
        uploadedUrls.push(url)
      }

      if (uploadedUrls.length > 0) {
        setPhotos((prev) => [...prev, ...uploadedUrls])
        toast.success(
          uploadedUrls.length === 1
            ? "Photo uploaded"
            : `${uploadedUrls.length} photos uploaded`
        )
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload photos")
    } finally {
      setUploadingPhotos(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemovePhoto = (url: string) => {
    setPhotos((prev) => prev.filter((photo) => photo !== url))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }

    try {
      setLoading(true)

      if (existingReview) {
        // Update existing review
        const { error } = await supabase
          .from("reviews")
          .update({
            rating,
            comment: comment || null,
            photos: photos.length ? photos : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingReview.id)

        if (error) throw error
        toast.success("Feedback updated successfully")
      } else {
        // Create new review
        const {
          data: { user },
        } = await supabase.auth.getUser()

        const { error } = await supabase.from("reviews").insert({
          user_id: user?.id!,
          canteen_id: order.canteen_id,
          order_id: order.id,
          rating,
          comment: comment || null,
          photos: photos.length ? photos : null,
        })

        if (error) throw error
        toast.success("Feedback submitted successfully")
      }

      router.push(`/orders/${order.id}`)
    } catch (error: any) {
      toast.error(error.message || "Failed to submit feedback")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/orders/${order.id}`}>
          <button className="rounded-full p-2 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <h1 className="text-2xl font-bold">Feedback</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Rate Your Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Star Rating */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Rating</p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-12 w-12 ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {rating === 5 && "Excellent"}
                {rating === 4 && "Good"}
                {rating === 3 && "Average"}
                {rating === 2 && "Poor"}
                {rating === 1 && "Very Poor"}
              </p>
            </div>

            {/* Comment Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Comment</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                rows={6}
                className="resize-none"
              />
            </div>

            {/* Photo Upload */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Photos (Optional)</label>
              {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photos.map((photo) => (
                    <div
                      key={photo}
                      className="relative aspect-square overflow-hidden rounded-2xl border border-orange-100 bg-muted"
                    >
                      <Image
                        src={photo}
                        alt="Uploaded feedback photo"
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo)}
                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/80"
                        aria-label="Remove photo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadingPhotos || photos.length >= MAX_PHOTOS}
                  className="flex items-center gap-2 rounded-full border-dashed px-6 py-5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {uploadingPhotos
                    ? "Uploading..."
                    : photos.length >= MAX_PHOTOS
                    ? "Photo limit reached"
                    : "Add photos"}
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoSelect}
              />
              <p className="text-center text-xs text-muted-foreground">
                We'll center each photo and show it edge-to-edge so your dish or
                service moment is easy to view. Up to {MAX_PHOTOS} images.
              </p>
            </div>

            {/* Order Summary */}
            <div className="rounded-lg bg-muted p-4">
              <p className="mb-2 text-sm font-medium">Order Summary</p>
              <p className="text-sm text-muted-foreground">
                {order.order_items.length} item(s) • ₹
                {Number(order.total_amount).toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {order.canteens?.name ?? "Canteen"}
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || rating === 0}
              className="w-full bg-primary text-lg font-semibold hover:bg-primary/90"
              size="lg"
            >
              {loading ? "Submitting..." : "Submit Feedback"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

