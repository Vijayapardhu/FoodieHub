"use client"

import { Share2 } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils/cn"

/**
 * Send a dish to somebody.
 *
 * The realistic use is a group chat at 12:30 — "this, get me this" — so the
 * shared text carries the dish, the canteen and the price, not just a naked
 * link. A link with no context is a link nobody taps.
 *
 * Uses the native share sheet where there is one (every phone) and falls back
 * to the clipboard on a desktop browser.
 */
export function ShareItemButton({
  name,
  canteenName,
  price,
  path,
  className,
}: {
  name: string
  canteenName: string
  price: number
  /** Root-relative path to the dish, e.g. /items/masala-dosa-4f2a */
  path: string
  className?: string
}) {
  const share = async () => {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}${path}` : path
    const text = `${name} — ₹${price} at ${canteenName}`

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: name, text, url })
        return
      } catch {
        // Sheet dismissed, or the browser refused — fall through.
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      toast.success("Link copied")
    } catch {
      toast.error("Could not share that")
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={`Share ${name}`}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-soft backdrop-blur-sm transition-transform active:scale-90",
        className
      )}
    >
      <Share2 className="h-4 w-4" />
    </button>
  )
}
