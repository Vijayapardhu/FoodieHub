import { BadgeIndianRupee } from "lucide-react"

interface CashUpCardProps {
  collected: number
  collectedCount: number
  awaiting: number
  awaitingCount: number
}

/**
 * What should be in the drawer at the end of the day.
 *
 * Every other number in the console is a projection or an average; this one is
 * checkable against the cash in hand, which is what makes the rest of the
 * reporting believable. `cash_received` and `change_amount` were already being
 * captured per order and never added up.
 */
export function CashUpCard({
  collected,
  collectedCount,
  awaiting,
  awaitingCount,
}: CashUpCardProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success">
          <BadgeIndianRupee className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">
            Cash to count
          </h2>
          <p className="mt-0.5 text-3xl font-black tabular-nums leading-none text-foreground">
            ₹{collected.toFixed(0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Taken from {collectedCount} collected order
            {collectedCount === 1 ? "" : "s"} today
          </p>
        </div>
      </div>

      {awaitingCount > 0 ? (
        <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
          A further{" "}
          <strong className="tabular-nums text-foreground">
            ₹{awaiting.toFixed(0)}
          </strong>{" "}
          across {awaitingCount} order{awaitingCount === 1 ? "" : "s"} still to
          be collected and paid for.
        </p>
      ) : null}
    </section>
  )
}
