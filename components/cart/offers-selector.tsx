"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database } from "@/types/database.types"
import { Gift, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { findBestOffer, calculateDiscount } from "@/lib/utils/offers"

type Offer = Database["public"]["Tables"]["offers"]["Row"]

interface OffersSelectorProps {
  canteenId: string
  orderAmount: number
  onOfferSelected: (offer: Offer | null, discount: number) => void
}

export function OffersSelector({
  canteenId,
  orderAmount,
  onOfferSelected,
}: OffersSelectorProps) {
  const [offers, setOffers] = useState<Offer[]>([])
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchOffers()
  }, [canteenId])

  useEffect(() => {
    if (offers.length > 0 && !selectedOffer) {
      const best = findBestOffer(offers, orderAmount)
      if (best) {
        setSelectedOffer(best.offer)
        onOfferSelected(best.offer, best.discount)
      }
    }
  }, [offers, orderAmount])

  const fetchOffers = async () => {
    try {
      setLoading(true)
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("canteen_id", canteenId)
        .eq("is_active", true)
        .eq("is_approved", true)
        .lte("valid_from", now)
        .gte("valid_until", now)
        .order("discount_value", { ascending: false })

      if (error) throw error

      setOffers(data || [])
    } catch (error: any) {
      console.error("Error fetching offers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOfferSelect = (offer: Offer) => {
    if (selectedOffer?.id === offer.id) {
      setSelectedOffer(null)
      onOfferSelected(null, 0)
    } else {
      const discount = calculateDiscount(offer, orderAmount)
      setSelectedOffer(offer)
      onOfferSelected(offer, discount)
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading offers...</div>
  }

  if (offers.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Available Offers</h3>
      {offers.map((offer) => {
        const discount = calculateDiscount(offer, orderAmount)
        const isSelected = selectedOffer?.id === offer.id

        if (discount === 0) return null

        return (
          <Card
            key={offer.id}
            className={`cursor-pointer transition-all ${
              isSelected ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => handleOfferSelect(offer)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">{offer.title}</p>
                    {offer.description && (
                      <p className="text-xs text-muted-foreground">
                        {offer.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={isSelected ? "default" : "outline"}
                    className={isSelected ? "bg-primary" : ""}
                  >
                    Save ₹{discount.toFixed(2)}
                  </Badge>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

