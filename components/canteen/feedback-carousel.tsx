"use client"

import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Database } from "@/types/database.types"
import { Star } from "lucide-react"

type Review = Database["public"]["Tables"]["reviews"]["Row"] & {
  users: { full_name: string | null; avatar_url: string | null } | null
}

interface FeedbackCarouselProps {
  reviews: Review[]
}

const renderStars = (count: number) =>
  Array.from({ length: 5 }).map((_, idx) => (
    <Star
      key={idx}
      className={`h-4 w-4 ${
        idx < count ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
      }`}
    />
  ))

export function FeedbackCarousel({ reviews }: FeedbackCarouselProps) {
  if (reviews.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">What students say</h2>
          <p className="text-sm text-muted-foreground">
            Ratings straight from the pickup counter
          </p>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {reviews.map((review) => (
          <Card
            key={review.id}
            className="w-72 flex-shrink-0 space-y-3 rounded-2xl border border-orange-100 bg-white/90 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-full bg-orange-100">
                {review.users?.avatar_url ? (
                  <Image
                    src={review.users.avatar_url}
                    alt={review.users.full_name || "Student"}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-lg">
                    🙂
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {review.users?.full_name || "Foodie"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex gap-1">{renderStars(Math.round(review.rating))}</div>
            {review.comment && (
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {review.comment}
              </p>
            )}
            {review.photos && review.photos.length > 0 && (
              <div className="flex gap-2">
                {review.photos.slice(0, 2).map((photo) => (
                  <div key={photo} className="relative h-16 w-16 overflow-hidden rounded-lg">
                    <Image src={photo} alt="Feedback photo" fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </section>
  )
}


