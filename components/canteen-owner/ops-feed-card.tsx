import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone } from "lucide-react"

interface OpsFeedCardProps {
  events: {
    id: string
    status: string
    createdAt: string
    customer: string | null
    amount: number | null
  }[]
}

const statusCopy: Record<string, { label: string; color: string }> = {
  pending: { label: "Awaiting confirmation", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700" },
  preparing: { label: "In the kitchen", color: "bg-orange-100 text-orange-700" },
  ready: { label: "Ready to pickup", color: "bg-emerald-100 text-emerald-700" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", color: "bg-rose-100 text-rose-700" },
}

export function OpsFeedCard({ events }: OpsFeedCardProps) {
  return (
    <Card className="border-orange-50 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Ops timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-orange-100 p-4 text-sm text-muted-foreground">
            Orders placed will show up here in realtime.
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const status = statusCopy[event.status] || statusCopy.pending
              return (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {event.customer || "Guest"} · ₹{Number(event.amount || 0).toFixed(0)}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


