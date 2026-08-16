"use client"

import { useCallback, useEffect, useState } from "react"
import { BookmarkPlus, Trash2 } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { useCartStore } from "@/store/cart-store"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

interface OrderTemplate {
  id: string
  name: string
  description: string | null
  items: Array<{ item_id: string; quantity: number }>
  canteen_id: string
  created_at: string
}

interface OrderTemplatesProps {
  canteenId: string | null
  onTemplateSelect?: () => void
}

export function OrderTemplates({
  canteenId,
  onTemplateSelect,
}: OrderTemplatesProps) {
  const [templates, setTemplates] = useState<OrderTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [supabase] = useState(() => createClient())

  const cartItems = useCartStore((state) =>
    canteenId ? state.items.filter((i) => i.canteenId === canteenId) : []
  )
  const addItem = useCartStore((state) => state.addItem)

  const fetchTemplates = useCallback(async () => {
    if (!canteenId) return
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("order_templates")
        .select("*")
        .eq("user_id", user.id)
        .eq("canteen_id", canteenId)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setTemplates((data as OrderTemplate[]) ?? [])
    } catch (error) {
      console.error("[templates] fetch failed", error)
    } finally {
      setLoading(false)
    }
  }, [supabase, canteenId])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const saveTemplate = async () => {
    if (!name.trim() || !canteenId || cartItems.length === 0) return

    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Please log in")
        return
      }

      const { error } = await supabase.from("order_templates").insert({
        user_id: user.id,
        canteen_id: canteenId,
        name: name.trim(),
        items: cartItems.map((item) => ({
          item_id: item.itemId,
          quantity: item.quantity,
        })),
      })

      if (error) throw error

      toast.success("Saved for next time")
      setName("")
      fetchTemplates()
    } catch (error: any) {
      toast.error(error?.message || "Could not save this order")
    } finally {
      setSaving(false)
    }
  }

  const loadTemplate = async (template: OrderTemplate) => {
    if (!canteenId) return

    try {
      // Replace this canteen's lines rather than stacking onto them.
      cartItems.forEach((item) =>
        useCartStore.getState().removeItem(item.itemId)
      )

      const { data: itemRows, error } = await supabase
        .from("items")
        .select("id, name, price, image_url, is_available")
        .in("id", template.items.map((i) => i.item_id))
        .eq("canteen_id", canteenId)

      if (error) throw error

      let skipped = 0
      for (const line of template.items) {
        const details = itemRows?.find((row) => row.id === line.item_id)
        if (!details || !details.is_available) {
          skipped++
          continue
        }
        for (let i = 0; i < line.quantity; i++) {
          addItem({
            itemId: details.id,
            name: details.name,
            price: Number(details.price),
            imageUrl: details.image_url,
            canteenId,
            canteenName: cartItems[0]?.canteenName ?? "Canteen",
          })
        }
      }

      toast.success(
        skipped > 0
          ? `Loaded “${template.name}” · ${skipped} item${
              skipped === 1 ? "" : "s"
            } unavailable`
          : `Loaded “${template.name}”`
      )
      onTemplateSelect?.()
    } catch (error: any) {
      toast.error(error?.message || "Could not load this order")
    }
  }

  const deleteTemplate = async (templateId: string) => {
    const previous = templates
    setTemplates((list) => list.filter((t) => t.id !== templateId))
    try {
      const { error } = await supabase
        .from("order_templates")
        .delete()
        .eq("id", templateId)
      if (error) throw error
      toast.success("Saved order deleted")
    } catch (error: any) {
      setTemplates(previous)
      toast.error(error?.message || "Could not delete")
    }
  }

  if (!canteenId) return null

  return (
    <div className="space-y-4">
      {cartItems.length > 0 ? (
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <label
              htmlFor="template-name"
              className="text-xs font-medium text-muted-foreground"
            >
              Save this cart as
            </label>
            <Input
              id="template-name"
              placeholder="My usual"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>
          <Button
            onClick={saveTemplate}
            loading={saving}
            disabled={!name.trim()}
            variant="outline"
            className="shrink-0"
          >
            <BookmarkPlus className="h-4 w-4" />
            Save
          </Button>
        </div>
      ) : null}

      {loading ? (
        <Skeleton className="h-14 rounded-xl" />
      ) : templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No saved orders yet. Save a cart to reorder it in one tap.
        </p>
      ) : (
        <ul className="space-y-2">
          {templates.map((template) => (
            <li
              key={template.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {template.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {template.items.length}{" "}
                  {template.items.length === 1 ? "item" : "items"}
                </p>
              </div>
              <Button
                size="sm"
                variant="soft"
                onClick={() => loadTemplate(template)}
              >
                Load
              </Button>
              <button
                type="button"
                onClick={() => deleteTemplate(template.id)}
                aria-label={`Delete ${template.name}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive-soft hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
