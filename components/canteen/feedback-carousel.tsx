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
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">What users say</h2>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Ratings straight from the pickup counter
          </p>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
        {reviews.map((review) => (
          <Card
            key={review.id}
            className="w-80 flex-shrink-0 space-y-4 rounded-3xl border-0 bg-white shadow-lg p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-orange-200 bg-gradient-to-br from-orange-100 to-primary/20 shadow-sm">
                {review.users?.avatar_url ? (
                  <Image
                    src={review.users.avatar_url}
                    alt={review.users.full_name || "User"}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xl">
                    🙂
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  {review.users?.full_name || "Foodie"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex gap-1">{renderStars(Math.round(review.rating))}</div>
            {review.comment && (
              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                "{review.comment}"
              </p>
            )}
            {review.photos && review.photos.length > 0 && (
              <div className="flex gap-2">
                {review.photos.slice(0, 2).map((photo) => (
                  <div
                    key={photo}
                    className="relative h-20 w-20 overflow-hidden rounded-xl border border-orange-100"
                  >
                    <Image
                      src={photo}
                      alt="Feedback photo"
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
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


