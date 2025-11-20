"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database } from "@/types/database.types"
import { format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"

type Offer = Database["public"]["Tables"]["offers"]["Row"] & {
  canteens: { name: string } | null
}

interface PromotionsManagementProps {
  pendingPromotions: Offer[]
  approvedPromotions: Offer[]
}

export function PromotionsManagement({
  pendingPromotions: initialPending,
  approvedPromotions: initialApproved,
}: PromotionsManagementProps) {
  const [pendingPromotions, setPendingPromotions] = useState(initialPending)
  const [approvedPromotions, setApprovedPromotions] = useState(initialApproved)
  const supabase = createClient()

  const handleApproval = async (offerId: string, approve: boolean) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase
        .from("offers")
        .update({
          is_approved: approve,
          approved_by: approve ? user?.id : null,
          approved_at: approve ? new Date().toISOString() : null,
        })
        .eq("id", offerId)

      if (error) throw error

      if (approve) {
        const approved = pendingPromotions.find((p) => p.id === offerId)
        if (approved) {
          setPendingPromotions((prev) => prev.filter((p) => p.id !== offerId))
          setApprovedPromotions((prev) => [approved, ...prev])
        }
      } else {
        setPendingPromotions((prev) => prev.filter((p) => p.id !== offerId))
      }

      toast.success(approve ? "Promotion approved" : "Promotion rejected")
    } catch (error: any) {
      toast.error(error.message || "Failed to update promotion")
    }
  }

  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList>
        <TabsTrigger value="pending">
          Pending ({pendingPromotions.length})
        </TabsTrigger>
        <TabsTrigger value="approved">
          Approved ({approvedPromotions.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="pending" className="mt-6">
        {pendingPromotions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No pending promotions</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingPromotions.map((offer) => (
              <Card key={offer.id}>
                <CardHeader>
                  <CardTitle>{offer.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {offer.canteens?.name || "Unknown Canteen"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {offer.description && (
                    <p className="text-sm">{offer.description}</p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-semibold">
                        {offer.discount_type === "percentage"
                          ? `${offer.discount_value}%`
                          : `₹${offer.discount_value}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valid From</span>
                      <span>{format(new Date(offer.valid_from), "MMM dd")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valid Until</span>
                      <span>{format(new Date(offer.valid_until), "MMM dd")}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApproval(offer.id, true)}
                      className="flex-1"
                      size="sm"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleApproval(offer.id, false)}
                      variant="destructive"
                      size="sm"
                    >
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
      <TabsContent value="approved" className="mt-6">
        {approvedPromotions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No approved promotions</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {approvedPromotions.map((offer) => (
              <Card key={offer.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle>{offer.title}</CardTitle>
                    <Badge className="bg-success">Approved</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {offer.canteens?.name || "Unknown Canteen"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-semibold">
                      {offer.discount_type === "percentage"
                        ? `${offer.discount_value}%`
                        : `₹${offer.discount_value}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valid Until</span>
                    <span>{format(new Date(offer.valid_until), "MMM dd, yyyy")}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}

