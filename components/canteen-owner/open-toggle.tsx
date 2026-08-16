"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Power } from "lucide-react"
import toast from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ACTIVE_ORDER_STATUSES } from "@/lib/utils/order-status"
import { cn } from "@/lib/utils/cn"

/**
 * Open and close the canteen from wherever the owner is standing.
 *
 * This is the most frequent action in the whole console — twice a day, every
 * day — and it lived four taps deep in Settings behind a form that had to be
 * saved. A closed canteen still shows its menu but cannot take orders, so
 * being slow to flip it means turning away students you then have to decline.
 */
export function OpenToggle({
  canteenId,
  isOpen: initialOpen,
  className,
}: {
  canteenId: string
  isOpen: boolean
  className?: string
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [saving, setSaving] = useState(false)
  const [liveOrders, setLiveOrders] = useState<number | null>(null)

  const apply = async (next: boolean) => {
    setSaving(true)
    setIsOpen(next)

    try {
      const { error } = await createClient()
        .from("canteens")
        .update({ is_open: next })
        .eq("id", canteenId)
      if (error) throw error

      toast.success(
        next ? "Open — students can order" : "Closed — no new orders"
      )
      router.refresh()
    } catch (error: any) {
      setIsOpen(!next)
      toast.error(error?.message || "Could not change that")
    } finally {
      setSaving(false)
      setLiveOrders(null)
    }
  }

  const toggle = async () => {
    // Reopening is never risky.
    if (!isOpen) {
      await apply(true)
      return
    }

    // Closing with food on the stove is: those students are still coming, and
    // closing does not cancel their orders — it only stops new ones.
    setSaving(true)
    try {
      const { count } = await createClient()
        .from("orders")
        .select("id", { head: true, count: "exact" })
        .eq("canteen_id", canteenId)
        .in("status", ACTIVE_ORDER_STATUSES)

      if (count && count > 0) {
        setLiveOrders(count)
        setSaving(false)
        return
      }
    } catch {
      // If the check itself fails, don't block the owner from closing.
    }

    setSaving(false)
    await apply(false)
  }

  return (
    <>
      <Button
        variant={isOpen ? "outline" : "default"}
        size="sm"
        loading={saving}
        onClick={toggle}
        aria-pressed={isOpen}
        className={cn(
          isOpen && "border-success/40 text-success hover:bg-success-soft",
          className
        )}
      >
        {saving ? null : <Power className="h-4 w-4" />}
        {isOpen ? "Open — tap to close" : "Closed — tap to open"}
      </Button>

      <Dialog
        open={liveOrders !== null}
        onOpenChange={(open) => !open && setLiveOrders(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {liveOrders} order{liveOrders === 1 ? "" : "s"} still in the
              kitchen
            </DialogTitle>
            <DialogDescription>
              Closing stops new orders — it does not cancel these. Those
              students are still expecting food, so finish or decline them
              before you leave.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              block
              onClick={() => setLiveOrders(null)}
              disabled={saving}
            >
              Stay open
            </Button>
            <Button block loading={saving} onClick={() => apply(false)}>
              Close anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
