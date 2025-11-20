"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils/cn"

interface FavoriteButtonProps {
  itemId?: string
  canteenId?: string
  className?: string
}

export function FavoriteButton({
  itemId,
  canteenId,
  className,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkFavorite()
  }, [itemId, canteenId])

  const checkFavorite = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq(itemId ? "item_id" : "canteen_id", itemId || canteenId)
        .maybeSingle()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      setIsFavorite(!!data)
    } catch (error) {
      setIsFavorite(false)
    }
  }

  const toggleFavorite = async () => {
    try {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Please login to add favorites")
        return
      }

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq(itemId ? "item_id" : "canteen_id", itemId || canteenId)

        if (error) throw error
        setIsFavorite(false)
        toast.success("Removed from favorites")
      } else {
        // Add to favorites
        const { error } = await supabase.from("favorites").insert({
          user_id: user.id,
          item_id: itemId || null,
          canteen_id: canteenId || null,
        })

        if (error) throw error
        setIsFavorite(true)
        toast.success("Added to favorites")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update favorite")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleFavorite}
      disabled={loading}
      className={cn(className)}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-colors",
          isFavorite
            ? "fill-red-500 text-red-500"
            : "text-gray-400 hover:text-red-500"
        )}
      />
    </Button>
  )
}

