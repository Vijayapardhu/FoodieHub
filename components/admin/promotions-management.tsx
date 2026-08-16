"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { TicketPercent } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Offer = Database["public"]["Tables"]["offers"]["Row"] & {
  canteens: { name: string } | null
}

interface PromotionsManagementProps {
  pendingPromotions: Offer[]
  approvedPromotions: Offer[]
}

function OfferCard({
  offer,
  children,
}: {
  offer: Offer
  children?: React.ReactNode
}) {
  const expired = new Date(offer.valid_until) < new Date()

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-foreground">
            {offer.title}
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            {offer.canteens?.name || "Unknown canteen"}
          </p>
        </div>

        <p className="shrink-0 text-xl font-black text-primary">
          {offer.discount_type === "percentage"
            ? `${offer.discount_value}%`
            : `₹${offer.discount_value}`}
        </p>
      </div>

      {offer.description ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {offer.description}
        </p>
      ) : null}

      <dl className="space-y-1 text-xs">
        {offer.min_order_amount ? (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Minimum order</dt>
            <dd className="font-semibold tabular-nums text-foreground">
              ₹{offer.min_order_amount}
            </dd>
          </div>
        ) : null}
        {offer.max_discount ? (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Capped at</dt>
            <dd className="font-semibold tabular-nums text-foreground">
              ₹{offer.max_discount}
            </dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Runs</dt>
          <dd className="font-semibold text-foreground">
            {format(new Date(offer.valid_from), "d MMM")} –{" "}
            {format(new Date(offer.valid_until), "d MMM yyyy")}
          </dd>
        </div>
      </dl>

      {expired ? (
        <Badge variant="muted" size="sm" className="self-start">
          Window has passed
        </Badge>
      ) : null}

      {children ? (
        <div className="mt-auto border-t border-border pt-3">{children}</div>
      ) : null}
    </li>
  )
}

export function PromotionsManagement({
  pendingPromotions: initialPending,
  approvedPromotions: initialApproved,
}: PromotionsManagementProps) {
  const router = useRouter()
  const [pending, setPending] = useState(initialPending)
  const [approved, setApproved] = useState(initialApproved)
  const [busyId, setBusyId] = useState<string | null>(null)

  const decide = async (offer: Offer, approve: boolean) => {
    setBusyId(offer.id)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase
        .from("offers")
        .update({
          is_approved: approve,
          approved_by: approve ? (user?.id ?? null) : null,
          approved_at: approve ? new Date().toISOString() : null,
          // A rejected offer shouldn't quietly go live if approved later.
          is_active: approve ? offer.is_active : false,
        })
        .eq("id", offer.id)

      if (error) throw error

      if (approve) {
        setPending((list) => list.filter((entry) => entry.id !== offer.id))
        setApproved((list) => [{ ...offer, is_approved: true }, ...list])
      } else {
        setPending((list) => list.filter((entry) => entry.id !== offer.id))
      }

      toast.success(approve ? "Offer approved" : "Offer rejected")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not update that offer")
    } finally {
      setBusyId(null)
    }
  }

  const revoke = async (offer: Offer) => {
    setBusyId(offer.id)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("offers")
        .update({ is_approved: false, approved_at: null, is_active: false })
        .eq("id", offer.id)
      if (error) throw error

      setApproved((list) => list.filter((entry) => entry.id !== offer.id))
      setPending((list) => [{ ...offer, is_approved: false }, ...list])
      toast.success("Approval revoked")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not revoke that offer")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Tabs defaultValue={pending.length > 0 ? "pending" : "approved"}>
      <TabsList>
        <TabsTrigger value="pending">
          Pending
          {pending.length > 0 ? (
            <span className="rounded-full bg-warning px-1.5 py-0.5 text-2xs font-bold text-warning-foreground">
              {pending.length}
            </span>
          ) : null}
        </TabsTrigger>
        <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="pending">
        {pending.length === 0 ? (
          <EmptyState
            icon={TicketPercent}
            title="Nothing waiting"
            description="Every submitted offer has been reviewed."
            compact
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {pending.map((offer) => (
              <OfferCard key={offer.id} offer={offer}>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-destructive/40 text-destructive hover:bg-destructive-soft"
                    onClick={() => decide(offer, false)}
                    disabled={busyId === offer.id}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="success"
                    className="flex-1"
                    loading={busyId === offer.id}
                    onClick={() => decide(offer, true)}
                  >
                    Approve
                  </Button>
                </div>
              </OfferCard>
            ))}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="approved">
        {approved.length === 0 ? (
          <EmptyState
            icon={TicketPercent}
            title="No approved offers"
            description="Approved discounts appear here for the record."
            compact
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {approved.map((offer) => (
              <OfferCard key={offer.id} offer={offer}>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="success" size="sm">
                    Approved
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    loading={busyId === offer.id}
                    onClick={() => revoke(offer)}
                  >
                    Revoke
                  </Button>
                </div>
              </OfferCard>
            ))}
          </ul>
        )}
      </TabsContent>
    </Tabs>
  )
}
