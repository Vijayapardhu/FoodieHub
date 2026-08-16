"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils/cn"

type Tier = "bronze" | "silver" | "gold" | "platinum"

const TIERS: Record<
  Tier,
  { name: string; multiplier: number; nextAt: number; accent: string }
> = {
  bronze: { name: "Bronze", multiplier: 1, nextAt: 2000, accent: "bg-amber-600" },
  silver: { name: "Silver", multiplier: 1.2, nextAt: 5000, accent: "bg-slate-400" },
  gold: { name: "Gold", multiplier: 1.5, nextAt: 10000, accent: "bg-amber-400" },
  platinum: {
    name: "Platinum",
    multiplier: 2,
    nextAt: Infinity,
    accent: "bg-violet-500",
  },
}

const ORDER: Tier[] = ["bronze", "silver", "gold", "platinum"]

interface LoyaltyPointsDisplayProps {
  canteenId: string | null
  orderAmount: number
}

export function LoyaltyPointsDisplay({
  canteenId,
  orderAmount,
}: LoyaltyPointsDisplayProps) {
  const [data, setData] = useState<{
    points: number
    tier: Tier
    totalEarned: number
  } | null>(null)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    if (!canteenId) return
    let cancelled = false

    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user || cancelled) return

        const { data: row } = await supabase
          .from("loyalty_points")
          .select("points, tier, total_earned")
          .eq("user_id", user.id)
          .eq("canteen_id", canteenId)
          .maybeSingle()

        if (row && !cancelled) {
          setData({
            points: row.points,
            tier: (row.tier as Tier) ?? "bronze",
            totalEarned: row.total_earned,
          })
        }
      } catch (error) {
        console.error("[loyalty] load failed", error)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [supabase, canteenId])

  if (!canteenId || !data) return null

  const tier = TIERS[data.tier]
  const earning = Math.floor((orderAmount / 10) * tier.multiplier)
  const nextTier = ORDER[ORDER.indexOf(data.tier) + 1]
  const progress =
    nextTier === undefined
      ? 100
      : Math.min(100, (data.totalEarned / tier.nextAt) * 100)

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Loyalty
        </span>
        <Badge variant="soft" size="sm">
          {tier.name}
          {tier.multiplier > 1 ? ` · ${tier.multiplier}×` : ""}
        </Badge>
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">Points balance</span>
        <span className="text-xl font-bold tabular-nums text-foreground">
          {data.points}
        </span>
      </div>

      {earning > 0 ? (
        <p className="rounded-xl bg-success-soft px-3 py-2 text-sm text-success">
          You&apos;ll earn <strong className="tabular-nums">+{earning}</strong>{" "}
          points when this order is collected.
        </p>
      ) : null}

      {nextTier ? (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress to {TIERS[nextTier].name}</span>
            <span className="tabular-nums">
              {data.totalEarned} / {tier.nextAt}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress to ${TIERS[nextTier].name}`}
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className={cn("h-full rounded-full transition-all", tier.accent)}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
