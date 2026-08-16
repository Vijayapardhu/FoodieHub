import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils/cn"

interface RevenueTrendCardProps {
  weeklyData: { label: string; value: number }[]
}

export function RevenueTrendCard({ weeklyData }: RevenueTrendCardProps) {
  const max = Math.max(...weeklyData.map((day) => day.value), 1)
  const total = weeklyData.reduce((sum, day) => sum + day.value, 0)
  const busiest = weeklyData.reduce(
    (best, day) => (day.value > best.value ? day : best),
    weeklyData[0] ?? { label: "—", value: 0 }
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue, last 7 days</CardTitle>
        <p className="text-sm text-muted-foreground">
          ₹{total.toFixed(0)} total · busiest on {busiest.label}
        </p>
      </CardHeader>

      <CardContent>
        <div className="flex h-36 items-end gap-1.5" role="img" aria-label="Daily revenue bar chart">
          {weeklyData.map((day, index) => {
            const height = (day.value / max) * 100
            const isPeak = day.value === max && day.value > 0
            return (
              <div
                key={`${day.label}-${index}`}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              >
                <span className="text-2xs font-semibold tabular-nums text-muted-foreground">
                  {day.value > 0 ? `₹${day.value.toFixed(0)}` : ""}
                </span>
                <div
                  className={cn(
                    "w-full rounded-t-md transition-[height] duration-500",
                    isPeak ? "bg-primary" : "bg-primary/35"
                  )}
                  // Keeps zero-value days visible as a baseline sliver
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
                <span className="text-2xs font-medium text-muted-foreground">
                  {day.label}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
