"use client"

import { useCallback, useEffect, useState } from "react"
import { Heart } from "lucide-react"
import toast from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils/cn"

interface FavoriteButtonProps {
  itemId?: string
  canteenId?: string
  className?: string
  /** `overlay` sits on top of imagery; `plain` inherits the surface behind it. */
  tone?: "overlay" | "plain"
  size?: "sm" | "md"
}

export function FavoriteButton({
  itemId,
  canteenId,
  className,
  tone = "overlay",
  size = "md",
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const [supabase] = useState(() => createClient())

  const column = itemId ? "item_id" : "canteen_id"
  const value = itemId || canteenId

  const checkFavorite = useCallback(async () => {
    if (!value) return
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq(column, value)
        .maybeSingle()

      setIsFavorite(!!data)
    } catch {
      setIsFavorite(false)
    }
  }, [supabase, column, value])

  useEffect(() => {
    checkFavorite()
  }, [checkFavorite])

  const toggleFavorite = async (event: React.MouseEvent) => {
    // These buttons often sit inside a card that is itself a link.
    event.preventDefault()
    event.stopPropagation()

    if (!value || loading) return

    // Optimistic flip: the heart is the whole point of the interaction, so it
    // should never wait on a round trip.
    const next = !isFavorite
    setIsFavorite(next)
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsFavorite(!next)
        toast.error("Please log in to save favourites")
        return
      }

      if (next) {
        const { error } = await supabase.from("favorites").insert({
          user_id: user.id,
          item_id: itemId || null,
          canteen_id: canteenId || null,
        })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq(column, value)
        if (error) throw error
      }
    } catch (error: any) {
      setIsFavorite(!next)
      toast.error(error?.message || "Could not update favourites")
    } finally {
      setLoading(false)
    }
  }

  const box = size === "sm" ? "h-9 w-9" : "h-10 w-10"
  const icon = size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]"

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={loading}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Remove from favourites" : "Add to favourites"}
      className={cn(
        "flex items-center justify-center rounded-full transition-transform active:scale-90 disabled:opacity-70",
        box,
        tone === "overlay"
          ? "bg-surface/85 shadow-soft backdrop-blur-sm"
          : "hover:bg-muted",
        className
      )}
    >
      <Heart
        className={cn(
          icon,
          "transition-colors",
          isFavorite
            ? "fill-destructive text-destructive"
            : "text-muted-foreground"
        )}
      />
    </button>
  )
}
