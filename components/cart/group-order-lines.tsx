"use client"

import { Check, Lock, Trash2 } from "@/components/ui/icons"
import { QuantityStepper } from "@/components/ui/quantity-stepper"
import { cn } from "@/lib/utils/cn"

export interface GroupLine {
  line_id: string
  item_id: string
  item_name: string
  quantity: number
  price: number
  added_by: string | null
  added_by_name: string
  locked: boolean
}

/**
 * Who put what on the order.
 *
 * A group order was a single anonymous list, which is fine for the kitchen
 * and useless for the six people it belongs to: nobody could tell whether
 * their own dish had gone on, whether a friend had added theirs yet, or who
 * the extra biryani belonged to. Grouping by person answers all three at a
 * glance, and a person who has finished is marked as such so the host knows
 * whether anyone is still deciding.
 */
export function GroupOrderLines({
  lines,
  currentUserId,
  onQuantityChange,
  onRemove,
  busyLineId,
}: {
  lines: GroupLine[]
  currentUserId: string | null
  onQuantityChange?: (line: GroupLine, quantity: number) => void
  onRemove?: (line: GroupLine) => void
  busyLineId?: string | null
}) {
  if (lines.length === 0) return null

  // Group by contributor, with whoever is looking at this first — your own
  // food is the thing you came to check.
  const byPerson = new Map<string, { name: string; mine: boolean; lines: GroupLine[] }>()
  for (const line of lines) {
    const key = line.added_by ?? "unknown"
    const mine = Boolean(currentUserId) && line.added_by === currentUserId
    const existing = byPerson.get(key)
    if (existing) existing.lines.push(line)
    else
      byPerson.set(key, {
        name: mine ? "You" : line.added_by_name,
        mine,
        lines: [line],
      })
  }

  const people = Array.from(byPerson.values()).sort((a, b) => Number(b.mine) - Number(a.mine))

  return (
    <div className="space-y-3">
      {people.map((person) => {
        const total = person.lines.reduce(
          (sum, line) => sum + Number(line.price) * line.quantity,
          0
        )
        const done = person.lines.every((line) => line.locked)

        return (
          <section
            key={person.name + String(person.mine)}
            className={cn(
              "overflow-hidden rounded-2xl border bg-card",
              person.mine ? "border-primary/40" : "border-border"
            )}
          >
            <header className="flex items-center gap-2 border-b border-border px-3.5 py-2.5">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-2xs font-bold",
                  person.mine
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {person.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">
                {person.name}
              </span>

              {done ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-2xs font-bold text-success">
                  <Check className="h-3 w-3" />
                  Done
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-2xs font-semibold text-muted-foreground">
                  Still choosing
                </span>
              )}

              <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                ₹{total.toFixed(0)}
              </span>
            </header>

            <ul className="divide-y divide-border">
              {person.lines.map((line) => {
                const editable = person.mine && !line.locked && onQuantityChange

                return (
                  <li key={line.line_id} className="flex items-center gap-3 px-3.5 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {line.item_name}
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        ₹{Number(line.price).toFixed(0)} × {line.quantity}
                      </span>
                    </span>

                    {editable ? (
                      <span className="flex shrink-0 items-center gap-1.5">
                        <QuantityStepper
                          size="sm"
                          quantity={line.quantity}
                          onIncrement={() => onQuantityChange?.(line, line.quantity + 1)}
                          onDecrement={() => onQuantityChange?.(line, line.quantity - 1)}
                          disabled={busyLineId === line.line_id}
                          label={line.item_name}
                        />
                        <button
                          type="button"
                          onClick={() => onRemove?.(line)}
                          disabled={busyLineId === line.line_id}
                          aria-label={`Remove ${line.item_name}`}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-destructive active:scale-95"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </span>
                    ) : (
                      <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold tabular-nums text-muted-foreground">
                        {line.locked ? <Lock className="h-3.5 w-3.5" /> : null}×{line.quantity}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
