"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gift, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface LoyaltyPointsDisplayProps {
  canteenId: string | null
  orderAmount: number
}

const TIER_INFO = {
  bronze: { name: "Bronze", color: "bg-amber-500", multiplier: 1 },
  silver: { name: "Silver", color: "bg-gray-400", multiplier: 1.2 },
  gold: { name: "Gold", color: "bg-yellow-500", multiplier: 1.5 },
  platinum: { name: "Platinum", color: "bg-purple-500", multiplier: 2 },
}

export function LoyaltyPointsDisplay({ canteenId, orderAmount }: LoyaltyPointsDisplayProps) {
  const [loyaltyData, setLoyaltyData] = useState<{
    points: number
    tier: keyof typeof TIER_INFO
    total_earned: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (canteenId) {
      fetchLoyaltyPoints()
    }
  }, [canteenId])

  const fetchLoyaltyPoints = async () => {
    if (!canteenId) return

    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("loyalty_points")
        .select("points, tier, total_earned")
        .eq("user_id", user.id)
        .eq("canteen_id", canteenId)
        .maybeSingle()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching loyalty points:", error)
      }

      if (data) {
        setLoyaltyData({
          points: data.points,
          tier: data.tier as keyof typeof TIER_INFO,
          total_earned: data.total_earned,
        })
      }
    } catch (error: any) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!canteenId || loading || !loyaltyData) {
    return null
  }

  const pointsToEarn = Math.floor(orderAmount / 10) * TIER_INFO[loyaltyData.tier].multiplier
  const tierInfo = TIER_INFO[loyaltyData.tier]
  const nextTierPoints = {
    bronze: 2000,
    silver: 5000,
    gold: 10000,
    platinum: Infinity,
  }[loyaltyData.tier]

  const progressToNextTier =
    loyaltyData.tier !== "platinum"
      ? Math.min(100, (loyaltyData.total_earned / nextTierPoints) * 100)
      : 100

  return (
    <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-orange-50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <span className="font-semibold text-sm">Loyalty Points</span>
          </div>
          <Badge className={`${tierInfo.color} text-white`}>{tierInfo.name}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Points</span>
            <span className="text-lg font-bold text-purple-600">{loyaltyData.points}</span>
          </div>

          {pointsToEarn > 0 && (
            <div className="rounded-lg bg-white/80 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Points from this order</span>
                <span className="font-semibold text-purple-600">+{pointsToEarn}</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Gift className="h-3 w-3" />
                <span>
                  {tierInfo.multiplier > 1 && `${tierInfo.name} member: ${tierInfo.multiplier}x points!`}
                </span>
              </div>
            </div>
          )}

          {loyaltyData.tier !== "platinum" && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progress to {Object.keys(TIER_INFO)[Object.keys(TIER_INFO).indexOf(loyaltyData.tier) + 1]}</span>
                <span className="text-muted-foreground">
                  {loyaltyData.total_earned} / {nextTierPoints}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full ${tierInfo.color} transition-all`}
                  style={{ width: `${progressToNextTier}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


