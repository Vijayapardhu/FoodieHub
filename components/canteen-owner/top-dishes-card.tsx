import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"

interface TopDishesCardProps {
  dishes: { id: string; name: string; imageUrl: string | null; count: number }[]
}

export function TopDishesCard({ dishes }: TopDishesCardProps) {
  const max = Math.max(...dishes.map((dish) => dish.count), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Best sellers this week</CardTitle>
      </CardHeader>

      <CardContent>
        {dishes.length === 0 ? (
          <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
            Serve a few more orders and your bestsellers will show up here.
          </p>
        ) : (
          <ol className="space-y-3">
            {dishes.map((dish, index) => (
              <li key={dish.id} className="flex items-center gap-3">
                <span className="w-4 shrink-0 text-sm font-bold tabular-nums text-muted-foreground">
                  {index + 1}
                </span>

                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {dish.imageUrl ? (
                    <Image
                      src={dish.imageUrl}
                      alt=""
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : (
                    <ImagePlaceholder type="item" size="sm" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {dish.name}
                  </span>
                  {/* Bar makes the gap between #1 and #4 readable at a glance */}
                  <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${(dish.count / max) * 100}%` }}
                    />
                  </span>
                </span>

                <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                  {dish.count}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
