"use client"

import Image from "next/image"
import { Database } from "@/types/database.types"
import { Avatar } from "@/components/ui/avatar"
import { StarRating } from "@/components/ui/star-rating"
import { Section, SectionHeader } from "@/components/ui/section-header"
import { formatRelativeTime } from "@/lib/utils/format"

type Review = Database["public"]["Tables"]["reviews"]["Row"] & {
  users: { full_name: string | null; avatar_url: string | null } | null
}

export function FeedbackCarousel({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null

  return (
    <Section>
      <SectionHeader
        title="What students say"
        subtitle="Ratings from the pickup counter"
      />

      <div className="rail">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="w-72 shrink-0 space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card"
          >
            <div className="flex items-center gap-3">
              <Avatar
                src={review.users?.avatar_url}
                name={review.users?.full_name}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {review.users?.full_name || "Student"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(review.created_at)}
                </p>
              </div>
            </div>

            <StarRating value={review.rating} />

            {review.comment ? (
              <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                {review.comment}
              </p>
            ) : null}

            {review.photos?.length ? (
              <div className="flex gap-2">
                {review.photos.slice(0, 3).map((photo) => (
                  <span
                    key={photo}
                    className="relative h-16 w-16 overflow-hidden rounded-xl border border-border"
                  >
                    <Image
                      src={photo}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </span>
                ))}
              </div>
            ) : null}

            {review.owner_response ? (
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs font-semibold text-foreground">
                  Canteen replied
                </p>
                <p className="mt-0.5 line-clamp-3 text-xs text-muted-foreground">
                  {review.owner_response}
                </p>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </Section>
  )
}
