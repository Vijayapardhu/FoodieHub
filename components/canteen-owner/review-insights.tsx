"use client"

import { useMemo } from "react"
import { Minus, TrendingDown, TrendingUp } from "@/components/ui/icons"
import { StarRating } from "@/components/ui/star-rating"
import { cn } from "@/lib/utils/cn"

export interface InsightReview {
  rating: number
  created_at: string
  owner_response: string | null
  dishes: string[]
}

/**
 * What the score is made of, and what is dragging it down.
 *
 * An average on its own is not actionable: 3.8 from a steady stream of 4s is
 * a different business problem from 3.8 with a cluster of 1s, and only one of
 * them can be fixed. The distribution shows which, the trend shows whether it
 * is getting better, and the dish list points at where to look.
 */
export function ReviewInsights({ reviews }: { reviews: InsightReview[] }) {
  const insight = useMemo(() => {
    const total = reviews.length
    const average = total
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
      : 0

    // 5 down to 1, because that is how people read a rating breakdown.
    const distribution = [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((r) => Math.round(r.rating) === star).length
      return { star, count, share: total ? (count / total) * 100 : 0 }
    })

    const now = Date.now()
    const day = 86_400_000
    const recent = reviews.filter(
      (r) => now - new Date(r.created_at).getTime() <= 30 * day
    )
    const previous = reviews.filter((r) => {
      const age = now - new Date(r.created_at).getTime()
      return age > 30 * day && age <= 60 * day
    })

    const mean = (list: InsightReview[]) =>
      list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : null

    const recentAvg = mean(recent)
    const previousAvg = mean(previous)

    /**
     * Dishes that appear in poorly-rated orders.
     *
     * Students rate the order, not the dish, so this cannot say "this dish is
     * bad" — it says "these dishes keep showing up when people are unhappy",
     * which is where to start looking. Two mentions minimum, so one bad day
     * doesn't indict a dish.
     */
    const suspects = new Map<string, { low: number; total: number }>()
    for (const review of reviews) {
      for (const dish of review.dishes) {
        const entry = suspects.get(dish) ?? { low: 0, total: 0 }
        entry.total += 1
        if (review.rating <= 3) entry.low += 1
        suspects.set(dish, entry)
      }
    }

    const flagged = Array.from(suspects, ([name, counts]) => ({
      name,
      ...counts,
      share: counts.total ? (counts.low / counts.total) * 100 : 0,
    }))
      .filter((dish) => dish.low >= 2)
      .sort((a, b) => b.low - a.low || b.share - a.share)
      .slice(0, 5)

    return {
      total,
      average,
      distribution,
      recentAvg,
      previousAvg,
      unanswered: reviews.filter((r) => !r.owner_response).length,
      flagged,
    }
  }, [reviews])

  if (insight.total === 0) return null

  const delta =
    insight.recentAvg !== null && insight.previousAvg !== null
      ? insight.recentAvg - insight.previousAvg
      : null

  const TrendIcon =
    delta === null || Math.abs(delta) < 0.05
      ? Minus
      : delta > 0
        ? TrendingUp
        : TrendingDown

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start gap-4">
          <div className="text-center">
            <p className="text-4xl font-black tabular-nums leading-none text-foreground">
              {insight.average.toFixed(1)}
            </p>
            <div className="mt-1.5 flex justify-center">
              <StarRating value={insight.average} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {insight.total} review{insight.total === 1 ? "" : "s"}
            </p>
          </div>

          <ul className="min-w-0 flex-1 space-y-1">
            {insight.distribution.map((row) => (
              <li key={row.star} className="flex items-center gap-2">
                <span className="w-3 text-right text-xs tabular-nums text-muted-foreground">
                  {row.star}
                </span>
                <span
                  className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={`${row.count} reviews at ${row.star} stars`}
                >
                  <span
                    className={cn(
                      "block h-full rounded-full",
                      row.star >= 4
                        ? "bg-success"
                        : row.star === 3
                          ? "bg-warning"
                          : "bg-destructive"
                    )}
                    style={{ width: `${row.share}%` }}
                  />
                </span>
                <span className="w-6 text-right text-xs tabular-nums text-muted-foreground">
                  {row.count}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <TrendIcon
            className={cn(
              "h-4 w-4 shrink-0",
              delta === null || Math.abs(delta) < 0.05
                ? "text-muted-foreground"
                : delta > 0
                  ? "text-success"
                  : "text-destructive"
            )}
          />
          <p className="text-xs text-muted-foreground">
            {delta === null ? (
              insight.recentAvg !== null ? (
                <>
                  Averaging{" "}
                  <strong className="text-foreground">
                    {insight.recentAvg.toFixed(1)}
                  </strong>{" "}
                  over the last 30 days — not enough history to compare yet
                </>
              ) : (
                "No reviews in the last 30 days"
              )
            ) : (
              <>
                Last 30 days:{" "}
                <strong className="text-foreground">
                  {insight.recentAvg?.toFixed(1)}
                </strong>{" "}
                vs {insight.previousAvg?.toFixed(1)} before —{" "}
                {Math.abs(delta) < 0.05
                  ? "holding steady"
                  : delta > 0
                    ? `up ${delta.toFixed(1)}`
                    : `down ${Math.abs(delta).toFixed(1)}`}
              </>
            )}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">
          Where to look first
        </h2>

        {insight.flagged.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No dish shows up repeatedly in unhappy orders. When one does,
            it&apos;ll be listed here.
          </p>
        ) : (
          <>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Dishes that keep appearing in orders rated 3 stars or below.
              Students rate the whole order, so treat this as a place to start,
              not a verdict.
            </p>
            <ul className="mt-3 space-y-2">
              {insight.flagged.map((dish) => (
                <li
                  key={dish.name}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {dish.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {dish.low} of {dish.total} orders
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-2 py-0.5 text-xs font-bold tabular-nums",
                      dish.share >= 60
                        ? "bg-destructive-soft text-destructive"
                        : "bg-warning-soft text-warning"
                    )}
                  >
                    {Math.round(dish.share)}%
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {insight.unanswered > 0 ? (
          <p className="mt-3 rounded-xl bg-info-soft px-3 py-2 text-xs text-info">
            {insight.unanswered} review{insight.unanswered === 1 ? "" : "s"}{" "}
            still waiting on a reply. A public answer is read by everyone who
            looks at your page afterwards, not just the person who wrote it.
          </p>
        ) : null}
      </section>
    </div>
  )
}
