import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RevenueTrendCardProps {
  weeklyData: { label: string; value: number }[]
}

export function RevenueTrendCard({ weeklyData }: RevenueTrendCardProps) {
  const maxValue = Math.max(...weeklyData.map((d) => d.value), 1)

  return (
    <Card className="border-orange-50 bg-gradient-to-b from-white to-orange-50/30">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">7-day revenue trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-40 items-end gap-3">
          {weeklyData.map((day) => (
            <div key={day.label} className="flex flex-1 flex-col items-center gap-2">
              <div className="relative flex h-full w-full items-end justify-center">
                <span
                  className="w-3 rounded-full bg-primary/80"
                  style={{
                    height: `${(day.value / maxValue) * 100}%`,
                  }}
                />
              </div>
              <div className="text-center text-xs text-muted-foreground">
                <div className="font-semibold text-foreground">{day.label}</div>
                <div>₹{day.value.toFixed(0)}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Peaks help you decide prep windows, so keep an eye on consistent spikes.
        </p>
      </CardContent>
    </Card>
  )
}


