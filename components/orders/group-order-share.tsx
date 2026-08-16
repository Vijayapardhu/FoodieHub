"use client"

import { useState } from "react"
import { Copy, Share2, Users } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

/**
 * Let other people put their food on this order.
 *
 * Only offered while the order is still pending: once the kitchen accepts it,
 * the food is being cooked and the bill is what it is. That constraint is
 * enforced in the database too — this just avoids showing a button that
 * would fail.
 */
export function GroupOrderShare({
  orderId,
  existingCode,
}: {
  orderId: string
  existingCode: string | null
}) {
  const [code, setCode] = useState<string | null>(existingCode)
  const [opening, setOpening] = useState(false)

  const link = code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/join/${code}`
    : null

  const open = async () => {
    setOpening(true)
    try {
      const { data, error } = await createClient().rpc("open_group_order", {
        target: orderId,
      })
      if (error) throw error
      setCode(data as string)
    } catch (error: any) {
      toast.error(error?.message || "Could not open this order to others")
    } finally {
      setOpening(false)
    }
  }

  const share = async () => {
    if (!link) return
    const text = `Add what you want to my FoodieHub order: ${link}`

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Order with me", text, url: link })
        return
      } catch {
        // Sheet dismissed — fall through to the clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(link)
      toast.success("Link copied")
    } catch {
      toast.error("Could not copy the link")
    }
  }

  if (!code) {
    return (
      <Button variant="outline" className="col-span-2" loading={opening} onClick={open}>
        <Users className="h-4 w-4" />
        Let friends add to this order
      </Button>
    )
  }

  return (
    <section className="col-span-2 space-y-3 rounded-2xl border border-primary/25 bg-primary-soft p-4">
      <div>
        <p className="text-sm font-bold text-foreground">
          Friends can add to this order
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Share the link. Anything they add appears on your bill, and you
          collect it all with your token. It closes when the kitchen accepts.
        </p>
      </div>

      <p className="rounded-xl bg-background/70 px-3 py-2 text-center font-mono text-2xl font-black tracking-[0.2em] text-primary">
        {code}
      </p>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={share}>
          <Share2 className="h-4 w-4" />
          Share link
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Copy the code"
          onClick={async () => {
            await navigator.clipboard.writeText(code)
            toast.success("Code copied")
          }}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </section>
  )
}
