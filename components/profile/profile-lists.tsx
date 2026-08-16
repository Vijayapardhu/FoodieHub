import Link from "next/link"
import Image from "next/image"
import { Heart, Receipt, Star } from "lucide-react"
import { format } from "date-fns"
import { Database } from "@/types/database.types"
import { StatusBadge } from "@/components/ui/status-badge"
import { StarRating } from "@/components/ui/star-rating"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"
import { EmptyState } from "@/components/ui/empty-state"
import { Section, SectionHeader } from "@/components/ui/section-header"
import { orderPath, reviewPath } from "@/lib/utils/public-id"

type OrderSummary = Database["public"]["Tables"]["orders"]["Row"] & {
  canteens: { name: string } | null
}

interface FavoriteHighlight {
  id: string
  type: "item" | "canteen"
  name: string
  subtitle?: string
  imageUrl?: string | null
}

type FeedbackSummary = Database["public"]["Tables"]["reviews"]["Row"] & {
  items: { name: string } | null
  canteens: { name: string } | null
}

interface ProfileListsProps {
  recentOrders: OrderSummary[]
  favorites: FavoriteHighlight[]
  feedbacks: FeedbackSummary[]
}

export function ProfileLists({
  recentOrders,
  favorites,
  feedbacks,
}: ProfileListsProps) {
  return (
    <div className="space-y-6">
      <Section>
        <SectionHeader
          title="Recent orders"
          action={{ label: "All orders", href: "/orders" }}
        />

        {recentOrders.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No orders yet"
            description="Your first order will show up here."
            action={{ label: "Browse canteens", href: "/home" }}
            compact
          />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {recentOrders.slice(0, 4).map((order) => (
              <li key={order.id}>
                <Link
                  href={orderPath(order)}
                  className="flex items-center gap-3 p-3.5 transition-colors active:bg-muted"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {order.canteens?.name || "Canteen"}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      #{order.token} ·{" "}
                      {format(new Date(order.created_at), "d MMM, h:mm a")}
                    </span>
                  </span>

                  <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                    ₹{Number(order.total_amount).toFixed(0)}
                  </span>
                  <StatusBadge status={order.status} size="sm" showIcon={false} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section>
        <SectionHeader
          title="Saved"
          action={{ label: "See all", href: "/favorites" }}
        />

        {favorites.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nothing saved"
            description="Tap the heart on a dish to keep it handy."
            compact
          />
        ) : (
          <div className="rail">
            {favorites.slice(0, 8).map((favorite) => (
              <div
                key={favorite.id}
                className="w-36 shrink-0 overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="relative aspect-square w-full bg-muted">
                  {favorite.imageUrl ? (
                    <Image
                      src={favorite.imageUrl}
                      alt=""
                      fill
                      sizes="144px"
                      className="object-cover"
                    />
                  ) : (
                    <ImagePlaceholder
                      type={favorite.type === "item" ? "item" : "canteen"}
                      size="md"
                    />
                  )}
                </div>
                <div className="p-2.5">
                  <p className="line-clamp-1 text-xs font-semibold text-foreground">
                    {favorite.name}
                  </p>
                  {favorite.subtitle ? (
                    <p className="line-clamp-1 text-2xs text-muted-foreground">
                      {favorite.subtitle}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section>
        <SectionHeader
          title="Your reviews"
          action={{ label: "Manage", href: "/profile/feedback" }}
        />

        {feedbacks.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No reviews yet"
            description="Rate a completed order to help other students choose."
            compact
          />
        ) : (
          <ul className="space-y-2">
            {feedbacks.slice(0, 3).map((feedback) => (
              <li key={feedback.id}>
                <Link
                  href={reviewPath(feedback)}
                  className="block rounded-2xl border border-border bg-card p-3.5 transition-transform active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {feedback.items?.name ||
                          feedback.canteens?.name ||
                          "Order"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {feedback.canteens?.name || "Canteen"}
                      </p>
                    </div>
                    <StarRating value={feedback.rating} />
                  </div>

                  {feedback.comment ? (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {feedback.comment}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}
