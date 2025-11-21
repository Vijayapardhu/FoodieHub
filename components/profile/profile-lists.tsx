import { Card } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Database } from "@/types/database.types"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/loading-state"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"

type OrderSummary =
  Database["public"]["Tables"]["orders"]["Row"] & {
    canteens: { name: string } | null
  }

interface FavoriteHighlight {
  id: string
  type: "item" | "canteen"
  name: string
  subtitle?: string
  imageUrl?: string | null
}

type FeedbackSummary =
  Database["public"]["Tables"]["reviews"]["Row"] & {
    items: { name: string } | null
    canteens: { name: string } | null
  }

interface ProfileListsProps {
  recentOrders: OrderSummary[]
  favorites: FavoriteHighlight[]
  feedbacks: FeedbackSummary[]
  loadingOrders?: boolean
  loadingFavorites?: boolean
}

export function ProfileLists({
  recentOrders,
  favorites,
  feedbacks,
  loadingOrders,
  loadingFavorites,
}: ProfileListsProps) {
  return (
    <div className="space-y-6">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Recent orders
          </h2>
          <Link href="/orders">
            <Button variant="ghost" size="sm" className="text-primary">
              View all
            </Button>
          </Link>
        </div>
        {loadingOrders ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, idx) => (
              <Skeleton key={idx} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <Card className="rounded-2xl p-6 text-center text-sm text-muted-foreground">
            You haven&apos;t ordered yet. Explore canteens and place your first
            order!
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {recentOrders.slice(0, 4).map((order) => (
              <Card
                key={order.id}
                className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">
                      {order.canteens?.name || "Canteen"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.created_at
                        ? format(new Date(order.created_at), "dd MMM, hh:mm a")
                        : "Just now"}
                    </p>
                  </div>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-primary">
                    {order.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Order total
                    </p>
                    <p className="text-lg font-bold text-primary">
                      ₹{Number(order.total_amount).toFixed(2)}
                    </p>
                  </div>
                  <Link href={`/orders/${order.id}`}>
                    <Button variant="outline" size="sm" className="rounded-full">
                      Track token
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Saved favorites
          </h2>
          <Link href="/favorites">
            <Button variant="ghost" size="sm" className="text-primary">
              View favorites
            </Button>
          </Link>
        </div>
        {loadingFavorites ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, idx) => (
              <Skeleton key={idx} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <Card className="rounded-2xl p-6 text-center text-sm text-muted-foreground">
            Start saving your go-to dishes and canteens for quick access.
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {favorites.slice(0, 4).map((fav) => (
              <Card
                key={fav.id}
                className="relative overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm"
              >
                <div className="flex gap-3 p-4">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-orange-50">
                    {fav.imageUrl ? (
                      <Image
                        src={fav.imageUrl}
                        alt={fav.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <ImagePlaceholder type={fav.type === "item" ? "item" : "canteen"} size="md" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{fav.name}</p>
                    {fav.subtitle && (
                      <p className="text-sm text-muted-foreground">
                        {fav.subtitle}
                      </p>
                    )}
                    <span className="mt-1 inline-flex rounded-full bg-orange-50 px-2 py-0.5 text-xs text-primary">
                      {fav.type === "item" ? "Menu item" : "Canteen"}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            My feedback
          </h2>
          <Link href="/profile/feedback">
            <Button variant="ghost" size="sm" className="text-primary">
              View all
            </Button>
          </Link>
        </div>
        {feedbacks.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-orange-200 bg-white/80 p-6 text-center text-sm text-muted-foreground">
            You haven&apos;t shared any reviews yet. Order something tasty and
            let the canteen know how it was!
          </Card>
        ) : (
          <div className="space-y-3">
            {feedbacks.slice(0, 3).map((feedback) => (
              <Link
                key={feedback.id}
                href={`/profile/feedback/${feedback.id}`}
                className="block rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">
                      {feedback.items?.name || feedback.canteens?.name || "Order"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {feedback.canteens?.name || "Canteen"}
                    </p>
                  </div>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-primary">
                    ⭐ {feedback.rating}
                  </span>
                </div>
                {feedback.comment && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {feedback.comment}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

