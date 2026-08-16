"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Power } from "lucide-react"
import toast from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
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

  const toggle = async () => {
    const next = !isOpen
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
    }
  }

  return (
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
  )
}
