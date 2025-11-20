"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database } from "@/types/database.types"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { useState } from "react"

type Offer = Database["public"]["Tables"]["offers"]["Row"]

interface OffersListProps {
  offers: Offer[]
}

export function OffersList({ offers: initialOffers }: OffersListProps) {
  const [offers, setOffers] = useState(initialOffers)
  const supabase = createClient()

  const deleteOffer = async (offerId: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return

    try {
      const { error } = await supabase.from("offers").delete().eq("id", offerId)

      if (error) throw error

      setOffers((prev) => prev.filter((offer) => offer.id !== offerId))
      toast.success("Offer deleted")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete offer")
    }
  }

  if (offers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No offers created yet</p>
          <Link href="/canteen/offers/new">
            <Button className="mt-4">Create Your First Offer</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {offers.map((offer) => {
        const isValid =
          new Date(offer.valid_from) <= new Date() &&
          new Date(offer.valid_until) >= new Date()
        const isActive = offer.is_active && offer.is_approved && isValid

        return (
          <Card key={offer.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle>{offer.title}</CardTitle>
                <div className="flex flex-col gap-1">
                  {offer.is_approved ? (
                    <Badge className="bg-success">Approved</Badge>
                  ) : (
                    <Badge className="bg-yellow-500">Pending</Badge>
                  )}
                  {isActive && <Badge className="bg-green-500">Active</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {offer.description && (
                <p className="text-sm text-muted-foreground">
                  {offer.description}
                </p>
              )}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-semibold">
                    {offer.discount_type === "percentage"
                      ? `${offer.discount_value}%`
                      : `₹${offer.discount_value}`}
                  </span>
                </div>
                {offer.min_order_amount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Min Order</span>
                    <span className="font-semibold">
                      ₹{offer.min_order_amount}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valid From</span>
                  <span className="font-semibold">
                    {format(new Date(offer.valid_from), "MMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valid Until</span>
                  <span className="font-semibold">
                    {format(new Date(offer.valid_until), "MMM dd, yyyy")}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Link href={`/canteen/offers/${offer.id}/edit`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteOffer(offer.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

