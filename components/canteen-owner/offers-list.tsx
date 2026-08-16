"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { TicketPercent, Trash2 } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Offer = Database["public"]["Tables"]["offers"]["Row"]

export function OffersList({ offers: initialOffers }: { offers: Offer[] }) {
  const router = useRouter()
  const [offers, setOffers] = useState(initialOffers)
  const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null)
  const [working, setWorking] = useState(false)

  const toggleActive = async (offer: Offer, value: boolean) => {
    const previous = offers
    setOffers((list) =>
      list.map((entry) =>
        entry.id === offer.id ? { ...entry, is_active: value } : entry
      )
    )

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("offers")
        .update({ is_active: value })
        .eq("id", offer.id)
      if (error) throw error

      toast.success(value ? "Offer is running" : "Offer paused")
      router.refresh()
    } catch (error: any) {
      setOffers(previous)
      toast.error(error?.message || "Could not update that offer")
    }
  }

  const deleteOffer = async () => {
    if (!deleteTarget) return
    setWorking(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("offers")
        .delete()
        .eq("id", deleteTarget.id)
      if (error) throw error

      setOffers((list) => list.filter((entry) => entry.id !== deleteTarget.id))
      setDeleteTarget(null)
      toast.success("Offer deleted")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not delete that offer")
    } finally {
      setWorking(false)
    }
  }

  if (offers.length === 0) {
    return (
      <EmptyState
        icon={TicketPercent}
        title="No offers yet"
        description="Discounts bring students back. Create one and an admin will review it."
        action={{ label: "Create an offer", href: "/canteen/offers/new" }}
      />
    )
  }

  const now = new Date()

  return (
    <>
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {offers.map((offer) => {
          const from = new Date(offer.valid_from)
          const until = new Date(offer.valid_until)
          const expired = until < now
          const upcoming = from > now
          const live = offer.is_active && offer.is_approved && !expired && !upcoming

          return (
            <li
              key={offer.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-foreground">
                    {offer.title}
                  </h3>
                  <p className="text-2xl font-black text-primary">
                    {offer.discount_type === "percentage"
                      ? `${offer.discount_value}%`
                      : `₹${offer.discount_value}`}
                    <span className="ml-1 text-xs font-semibold text-muted-foreground">
                      off
                    </span>
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {!offer.is_approved ? (
                    <Badge variant="warning" size="sm">
                      Awaiting approval
                    </Badge>
                  ) : expired ? (
                    <Badge variant="muted" size="sm">
                      Expired
                    </Badge>
                  ) : upcoming ? (
                    <Badge variant="info" size="sm">
                      Scheduled
                    </Badge>
                  ) : live ? (
                    <Badge variant="success" size="sm">
                      Live
                    </Badge>
                  ) : (
                    <Badge variant="muted" size="sm">
                      Paused
                    </Badge>
                  )}
                </div>
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
                    {format(from, "d MMM")} – {format(until, "d MMM")}
                  </dd>
                </div>
              </dl>

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Switch
                    checked={offer.is_active}
                    onCheckedChange={(value) => toggleActive(offer, value)}
                    disabled={!offer.is_approved || expired}
                    aria-label={`${offer.title} active`}
                  />
                  {offer.is_active ? "Running" : "Paused"}
                </label>

                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setDeleteTarget(offer)}
                  aria-label={`Delete ${offer.title}`}
                  className="text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{deleteTarget?.title}”?</DialogTitle>
            <DialogDescription>
              Students will no longer see this discount. To stop it temporarily,
              switch it to paused instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              block
              onClick={() => setDeleteTarget(null)}
              disabled={working}
            >
              Keep it
            </Button>
            <Button
              variant="destructive"
              block
              loading={working}
              onClick={deleteOffer}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
