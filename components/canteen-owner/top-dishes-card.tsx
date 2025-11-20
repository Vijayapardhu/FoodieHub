import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TopDishesCardProps {
  dishes: { id: string; name: string; imageUrl: string | null; count: number }[]
}

export function TopDishesCard({ dishes }: TopDishesCardProps) {
  return (
    <Card className="border-orange-50 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Top movers this week</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {dishes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-orange-100 bg-orange-50/40 p-4 text-sm text-muted-foreground">
            Serve a few more orders to unlock your bestseller insights.
          </div>
        ) : (
          dishes.map((dish, index) => (
            <div key={dish.id} className="flex items-center gap-3">
              <div className="text-lg font-semibold text-muted-foreground">
                #{index + 1}
              </div>
              <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-orange-50">
                {dish.imageUrl ? (
                  <Image
                    src={dish.imageUrl}
                    alt={dish.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl">🍲</div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{dish.name}</p>
                <p className="text-sm text-muted-foreground">
                  {dish.count} servings · keep ingredients ready
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}


