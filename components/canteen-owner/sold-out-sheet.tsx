"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { PackageX, Search, Undo2, X } from "lucide-react"
import toast from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils/cn"

interface Dish {
  id: string
  name: string
  price: number
  image_url: string | null
  is_available: boolean
}

/**
 * Take a dish off the menu in one tap, from wherever the owner already is.
 *
 * Running out is the most time-critical thing that happens in a canteen: every
 * minute a sold-out dish stays listed is another order that has to be declined
 * and another student disappointed. Fixing it used to mean leaving the queue,
 * going to Menu, finding the dish and flipping a switch — four screens deep,
 * during the exact moment the kitchen is busiest.
 */
export function SoldOutSheet({
  canteenId,
  trigger,
}: {
  canteenId: string
  trigger?: (open: () => void) => React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [dishes, setDishes] = useState<Dish[] | null>(null)
  const [query, setQuery] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await createClient()
      .from("items")
      .select("id, name, price, image_url, is_available")
      .eq("canteen_id", canteenId)
      .order("is_available", { ascending: false })
      .order("name")

    if (error) {
      toast.error("Could not load your menu")
      return
    }
    setDishes(data ?? [])
  }, [canteenId])

  useEffect(() => {
    if (open && dishes === null) load()
  }, [open, dishes, load])

  const setAvailability = async (dish: Dish, available: boolean) => {
    setBusyId(dish.id)
    // Optimistic: the tap must feel instant behind a counter.
    setDishes(
      (list) =>
        list?.map((entry) =>
          entry.id === dish.id ? { ...entry, is_available: available } : entry
        ) ?? null
    )

    try {
      const { error } = await createClient()
        .from("items")
        .update({ is_available: available })
        .eq("id", dish.id)
        .eq("canteen_id", canteenId)
      if (error) throw error

      toast.success(
        available ? `${dish.name} is back on` : `${dish.name} is off the menu`
      )
      router.refresh()
    } catch (error: any) {
      setDishes(
        (list) =>
          list?.map((entry) =>
            entry.id === dish.id
              ? { ...entry, is_available: !available }
              : entry
          ) ?? null
      )
      toast.error(error?.message || "Could not update that dish")
    } finally {
      setBusyId(null)
    }
  }

  const needle = query.trim().toLowerCase()
  const visible = (dishes ?? []).filter((dish) =>
    needle ? dish.name.toLowerCase().includes(needle) : true
  )
  const soldOut = (dishes ?? []).filter((dish) => !dish.is_available)

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <PackageX className="h-4 w-4" />
          Sold out
        </Button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[85dvh]">
          <SheetHeader className="pr-12">
            <SheetTitle>What&apos;s run out?</SheetTitle>
          </SheetHeader>

          <SheetBody className="space-y-3 pb-6">
            <p className="text-sm text-muted-foreground">
              Tap a dish to take it off the menu. Students stop seeing it
              immediately — nobody can order what you can&apos;t cook.
            </p>

            <Input
              type="search"
              inputMode="search"
              placeholder="Search your menu"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search dishes"
              startAdornment={<Search />}
              endAdornment={
                query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
                  >
                    <X />
                  </button>
                ) : undefined
              }
            />

            {soldOut.length > 0 ? (
              <p className="rounded-xl bg-warning-soft px-3 py-2 text-xs text-warning">
                {soldOut.length} dish{soldOut.length === 1 ? "" : "es"} currently
                off the menu. Remember to put them back tomorrow.
              </p>
            ) : null}

            {dishes === null ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-2xl" />
                ))}
              </div>
            ) : (
              <ul className="space-y-2">
                {visible.map((dish) => (
                  <li key={dish.id}>
                    <button
                      type="button"
                      disabled={busyId === dish.id}
                      onClick={() => setAvailability(dish, !dish.is_available)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-colors active:scale-[0.99]",
                        dish.is_available
                          ? "border-border bg-card"
                          : "border-destructive/30 bg-destructive-soft"
                      )}
                    >
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {dish.image_url ? (
                          <Image
                            src={dish.image_url}
                            alt=""
                            fill
                            sizes="48px"
                            className={cn(
                              "object-cover",
                              !dish.is_available && "grayscale"
                            )}
                          />
                        ) : (
                          <ImagePlaceholder type="item" size="sm" />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-sm font-semibold",
                            dish.is_available
                              ? "text-foreground"
                              : "text-destructive line-through"
                          )}
                        >
                          {dish.name}
                        </span>
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          ₹{Number(dish.price)}
                        </span>
                      </span>

                      <span
                        className={cn(
                          "shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold",
                          dish.is_available
                            ? "bg-muted text-muted-foreground"
                            : "bg-success text-success-foreground"
                        )}
                      >
                        {dish.is_available ? (
                          "Sold out"
                        ) : (
                          <span className="flex items-center gap-1">
                            <Undo2 className="h-3 w-3" />
                            Put back
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}

                {visible.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nothing matches “{query}”.
                  </p>
                ) : null}
              </ul>
            )}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  )
}
