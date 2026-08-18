"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Check, Lock, Users } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"
import { QuantityStepper } from "@/components/ui/quantity-stepper"
import { VegMark } from "@/components/ui/status-badge"
import { Search } from "@/components/ui/icons"
import { StickyBar, StickyBarSpacer } from "@/components/ui/sticky-bar"
import { GroupOrderLines, type GroupLine } from "@/components/cart/group-order-lines"

interface Dish {
  id: string
  name: string
  price: number
  image_url: string | null
  is_vegetarian: boolean
}

/**
 * Adding your food to somebody else's order.
 *
 * Deliberately not the cart. The cart is a local, private thing that becomes
 * an order at checkout; this is the opposite — the order already exists, and
 * each tap writes a line straight onto it. Routing this through the cart
 * would mean two carts, two totals and a merge step nobody asked for.
 */
export function GroupOrderJoin({
  orderId,
  canteenId,
  canteenName,
  hostName,
  itemCount,
  code,
}: {
  orderId: string
  canteenId: string
  canteenName: string
  canteenSlug: string | null
  hostName: string
  itemCount: number
  code: string
}) {
  const router = useRouter()
  const [dishes, setDishes] = useState<Dish[] | null>(null)
  const [query, setQuery] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  const [lines, setLines] = useState<GroupLine[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [locking, setLocking] = useState(false)

  useEffect(() => {
    createClient()
      .from("items")
      .select("id, name, price, image_url, is_vegetarian")
      .eq("canteen_id", canteenId)
      .eq("is_available", true)
      .order("name")
      .then(({ data }) => setDishes(data ?? []))
  }, [canteenId])

  // Everything on the order, whoever added it. Read through an RPC because a
  // contributor can only see their own rows directly, and the point here is
  // to see everybody's.
  const refreshLines = useCallback(async () => {
    const supabase = createClient()
    const [{ data: auth }, { data }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.rpc("group_order_lines", { p_order: orderId }),
    ])
    setUserId(auth.user?.id ?? null)
    setLines((data ?? []) as GroupLine[])
  }, [orderId])

  useEffect(() => {
    void refreshLines()
  }, [refreshLines])

  const myLines = lines.filter((line) => line.added_by === userId)
  const myTotal = myLines.reduce((sum, line) => sum + Number(line.price) * line.quantity, 0)
  const iAmDone = myLines.length > 0 && myLines.every((line) => line.locked)

  const add = async (dish: Dish) => {
    setBusy(dish.id)
    try {
      const { error } = await createClient().from("order_items").insert({
        order_id: orderId,
        item_id: dish.id,
        quantity: 1,
        // Priced by the database; this is only a placeholder.
        price: dish.price,
      })
      if (error) throw error

      toast.success(`${dish.name} added to ${hostName}'s order`)
      await refreshLines()
      router.refresh()
    } catch (error: any) {
      toast.error(
        error?.message?.includes("sold out")
          ? error.message
          : "Could not add that — the kitchen may have started this order"
      )
    } finally {
      setBusy(null)
    }
  }

  /** How many of this dish the current person has on the order. */
  const countOf = (itemId: string) =>
    myLines.filter((line) => line.item_id === itemId).reduce((sum, line) => sum + line.quantity, 0)

  const changeQuantity = async (line: GroupLine, quantity: number) => {
    setBusy(line.line_id)
    try {
      const supabase = createClient()
      const { error } =
        quantity <= 0
          ? await supabase.from("order_items").delete().eq("id", line.line_id)
          : await supabase.from("order_items").update({ quantity }).eq("id", line.line_id)
      if (error) throw error
      await refreshLines()
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not change that")
    } finally {
      setBusy(null)
    }
  }

  const removeLine = async (line: GroupLine) => {
    await changeQuantity(line, 0)
  }

  const finishUp = async () => {
    setLocking(true)
    try {
      const { error } = await createClient().rpc("lock_my_group_lines", {
        p_order: orderId,
      })
      if (error) throw error
      toast.success(`Sent to ${hostName}'s order`)
      await refreshLines()
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not finish up")
    } finally {
      setLocking(false)
    }
  }

  const needle = query.trim().toLowerCase()
  const visible = (dishes ?? []).filter((dish) =>
    needle ? dish.name.toLowerCase().includes(needle) : true
  )

  return (
    <div className="space-y-4">
      <section className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary-soft p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Users className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">
            {hostName}&apos;s order at {canteenName}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {itemCount} item{itemCount === 1 ? "" : "s"} so far · code {code}. Add yours below —{" "}
            {hostName} collects and pays for everything at the counter.
          </p>
        </div>
      </section>

      {lines.length > 0 ? (
        <GroupOrderLines
          lines={lines}
          currentUserId={userId}
          busyLineId={busy}
          onQuantityChange={changeQuantity}
          onRemove={removeLine}
        />
      ) : null}

      <Input
        type="search"
        inputMode="search"
        placeholder={`Search ${canteenName}`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search the menu"
        startAdornment={<Search />}
      />

      {dishes === null ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((dish) => (
            <li
              key={dish.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
            >
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                {dish.image_url ? (
                  <Image src={dish.image_url} alt="" fill sizes="56px" className="object-cover" />
                ) : (
                  <ImagePlaceholder type="item" size="sm" />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <VegMark vegetarian={dish.is_vegetarian} />
                  <span className="truncate text-sm font-semibold text-foreground">
                    {dish.name}
                  </span>
                </span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  ₹{Number(dish.price)}
                </span>
              </span>

              {countOf(dish.id) > 0 ? (
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-bold tabular-nums text-primary">
                    ×{countOf(dish.id)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    loading={busy === dish.id}
                    onClick={() => add(dish)}
                  >
                    Add more
                  </Button>
                </span>
              ) : (
                <Button
                  size="sm"
                  className="shrink-0"
                  loading={busy === dish.id}
                  onClick={() => add(dish)}
                >
                  Add
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="pb-4 text-center text-xs text-muted-foreground">
        Once {hostName} sends the order to the kitchen, nothing more can be added.
      </p>

      {/* Nothing is final until this is tapped. Up to that point a friend can
          change their mind freely; after it their lines are frozen, and the
          host can see they are done rather than guessing. */}
      {myLines.length > 0 ? <StickyBarSpacer /> : null}
      {myLines.length > 0 ? (
        <StickyBar>
          {iAmDone ? (
            <p className="flex items-center justify-center gap-2 py-1.5 text-sm font-semibold text-success">
              <Lock className="h-4 w-4" />
              Your {myLines.length === 1 ? "item is" : "items are"} in — waiting on {hostName}
            </p>
          ) : (
            <Button
              size="lg"
              block
              loading={locking}
              onClick={finishUp}
              className="justify-between"
            >
              <span className="tabular-nums">₹{myTotal.toFixed(0)}</span>
              <span>That&apos;s everything for me</span>
            </Button>
          )}
        </StickyBar>
      ) : null}
    </div>
  )
}
