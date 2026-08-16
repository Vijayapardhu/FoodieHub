"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookmarkCheck, Check, Pencil, RotateCcw, Trash2, X } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { useCartStore } from "@/store/cart-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"
import { canteenPath, cartPath } from "@/lib/utils/public-id"

export interface UsualLine {
  itemId: string
  itemSlug: string | null
  name: string
  price: number
  imageUrl: string | null
  quantity: number
  available: boolean
}

export interface Usual {
  id: string
  name: string
  canteenId: string
  canteenSlug: string | null
  canteenName: string
  canteenOpen: boolean
  lines: UsualLine[]
  /** Lines whose dish has since been deleted from the menu. */
  missingCount: number
}

/**
 * The saved-orders screen.
 *
 * Saving a cart as a named usual has existed since the booking features went
 * in, but the only way to reach one was to open the cart, expand a
 * disclosure, and already be shopping at the right canteen. A usual is a
 * shortcut to *starting* an order, so it belongs somewhere you can get to
 * before you have a cart at all.
 */
export function UsualsList({ usuals: initial }: { usuals: Usual[] }) {
  const router = useRouter()
  const [usuals, setUsuals] = useState(initial)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [draftName, setDraftName] = useState("")

  const order = (usual: Usual) => {
    const { addItem, items, removeItem } = useCartStore.getState()

    // Replace this canteen's lines so a second tap doesn't double the order.
    items
      .filter((item) => item.canteenId === usual.canteenId)
      .forEach((item) => removeItem(item.itemId))

    const available = usual.lines.filter((line) => line.available)
    if (available.length === 0) {
      toast.error("Nothing in this order is available right now")
      return
    }

    for (const line of available) {
      for (let i = 0; i < line.quantity; i++) {
        addItem({
          itemId: line.itemId,
          name: line.name,
          price: line.price,
          imageUrl: line.imageUrl,
          canteenId: usual.canteenId,
          canteenName: usual.canteenName,
          itemSlug: line.itemSlug,
          canteenSlug: usual.canteenSlug,
        })
      }
    }

    const skipped = usual.lines.length - available.length
    toast.success(
      skipped > 0
        ? `Added · ${skipped} item${skipped === 1 ? "" : "s"} unavailable`
        : `Added “${usual.name}” to your cart`
    )
    router.push(cartPath({ id: usual.canteenId, slug: usual.canteenSlug }))
  }

  const rename = async (usual: Usual) => {
    const next = draftName.trim()
    if (!next) {
      toast.error("Give it a name")
      return
    }

    setBusyId(usual.id)
    try {
      const { error } = await createClient()
        .from("order_templates")
        .update({ name: next, updated_at: new Date().toISOString() })
        .eq("id", usual.id)
      if (error) throw error

      setUsuals((list) =>
        list.map((entry) =>
          entry.id === usual.id ? { ...entry, name: next } : entry
        )
      )
      setRenaming(null)
      toast.success("Renamed")
    } catch (error: any) {
      toast.error(error?.message || "Could not rename that order")
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (usual: Usual) => {
    const previous = usuals
    setUsuals((list) => list.filter((entry) => entry.id !== usual.id))
    setBusyId(usual.id)

    try {
      const { error } = await createClient()
        .from("order_templates")
        .delete()
        .eq("id", usual.id)
      if (error) throw error
      toast.success("Saved order deleted")
      router.refresh()
    } catch (error: any) {
      setUsuals(previous)
      toast.error(error?.message || "Could not delete that order")
    } finally {
      setBusyId(null)
    }
  }

  if (usuals.length === 0) {
    return (
      <EmptyState
        icon={BookmarkCheck}
        title="No saved orders yet"
        description="Build a cart you'd order again, then save it from the cart screen — it'll show up here for one-tap reordering."
        action={{ label: "Browse canteens", href: "/home" }}
      />
    )
  }

  return (
    <ul className="space-y-3">
      {usuals.map((usual) => {
        const total = usual.lines
          .filter((line) => line.available)
          .reduce((sum, line) => sum + line.price * line.quantity, 0)
        const unavailable = usual.lines.filter((line) => !line.available).length

        return (
          <li
            key={usual.id}
            className="space-y-3 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {renaming === usual.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      aria-label="Name for this saved order"
                      autoFocus
                    />
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Save name"
                      loading={busyId === usual.id}
                      onClick={() => rename(usual)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Cancel rename"
                      onClick={() => setRenaming(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="truncate text-sm font-bold text-foreground">
                      {usual.name}
                    </h2>
                    <Link
                      href={canteenPath({
                        id: usual.canteenId,
                        slug: usual.canteenSlug,
                      })}
                      className="text-xs font-semibold text-primary"
                    >
                      {usual.canteenName}
                    </Link>
                  </>
                )}
              </div>

              {renaming !== usual.id ? (
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Rename ${usual.name}`}
                    onClick={() => {
                      setRenaming(usual.id)
                      setDraftName(usual.name)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Delete ${usual.name}`}
                    className="text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                    loading={busyId === usual.id}
                    onClick={() => remove(usual)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>

            <ul className="flex flex-wrap gap-2">
              {usual.lines.map((line) => (
                <li
                  key={line.itemId}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface py-1 pl-1 pr-2.5"
                >
                  <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {line.imageUrl ? (
                      <Image
                        src={line.imageUrl}
                        alt=""
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    ) : (
                      <ImagePlaceholder type="item" size="sm" />
                    )}
                  </span>
                  <span
                    className={
                      line.available
                        ? "text-xs font-medium text-foreground"
                        : "text-xs font-medium text-muted-foreground line-through"
                    }
                  >
                    {line.name}
                    {line.quantity > 1 ? ` ×${line.quantity}` : ""}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
              {!usual.canteenOpen ? (
                <Badge variant="muted" size="sm">
                  Canteen closed
                </Badge>
              ) : null}
              {unavailable > 0 || usual.missingCount > 0 ? (
                <Badge variant="warning" size="sm">
                  {unavailable + usual.missingCount} unavailable
                </Badge>
              ) : null}

              <span className="ml-auto text-sm font-bold tabular-nums text-foreground">
                ₹{total.toFixed(0)}
              </span>
              <Button size="sm" onClick={() => order(usual)}>
                <RotateCcw className="h-4 w-4" />
                Order this
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
