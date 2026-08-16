"use client"

import { useEffect, useState } from "react"
import { UserCheck, UserX } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils/cn"

interface History {
  orders: number
  collected: number
  no_shows: number
  cancelled: number
}

/**
 * What this canteen has seen of this customer.
 *
 * The landing page has always promised that canteens can see a student's
 * order history — it just was not shown anywhere, so a kitchen deciding
 * whether to accept a large order at closing time had nothing to go on.
 *
 * Deliberately scoped to the asking canteen. A kitchen has a legitimate
 * interest in whether somebody turns up; it has no business knowing how they
 * behave at the canteen across campus.
 */
export function CustomerHistory({
  userId,
  canteenId,
}: {
  userId: string
  canteenId: string
}) {
  const [history, setHistory] = useState<History | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    createClient()
      .rpc("customer_history", { p_user_id: userId, p_canteen_id: canteenId })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data?.[0]) {
          setFailed(true)
          return
        }
        setHistory(data[0] as History)
      })

    return () => {
      cancelled = true
    }
  }, [userId, canteenId])

  if (failed) return null

  if (!history) {
    return <Skeleton className="h-12 rounded-xl" />
  }

  // Their first order here: nothing to report, and saying "0 no-shows" about
  // a new customer implies a suspicion that isn't warranted.
  if (history.orders <= 1) {
    return (
      <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
        First order from this customer.
      </p>
    )
  }

  const reliable = history.no_shows === 0

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2 text-xs",
        reliable
          ? "bg-success-soft text-success"
          : "bg-warning-soft text-warning"
      )}
    >
      {reliable ? (
        <UserCheck className="h-4 w-4 shrink-0" />
      ) : (
        <UserX className="h-4 w-4 shrink-0" />
      )}
      <span>
        <strong className="tabular-nums">{history.collected}</strong> of{" "}
        <strong className="tabular-nums">{history.orders}</strong> orders
        collected here
        {history.no_shows > 0 ? (
          <>
            {" · "}
            <strong className="tabular-nums">{history.no_shows}</strong> not
            picked up
          </>
        ) : null}
      </span>
    </div>
  )
}
