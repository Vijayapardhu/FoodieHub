import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatTime } from "@/lib/utils/format"

interface OpsFeedCardProps {
  events: {
    id: string
    status: string
    createdAt: string
    customer: string | null
    amount: number | null
  }[]
}

export function OpsFeedCard({ events }: OpsFeedCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>

      <CardContent>
        {events.length === 0 ? (
          <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
            New orders will appear here as they come in.
          </p>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li key={event.id} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {event.customer || "Guest"}
                      <span className="ml-1.5 font-normal tabular-nums text-muted-foreground">
                        ₹{Number(event.amount || 0).toFixed(0)}
                      </span>
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatTime(event.createdAt)}
                    </span>
                  </div>
                  <StatusBadge
                    status={event.status}
                    size="sm"
                    className="mt-1"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
