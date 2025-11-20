"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database } from "@/types/database.types"
import Image from "next/image"
import { Edit, Trash2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"

type Item = Database["public"]["Tables"]["items"]["Row"] & {
  categories: { name: string } | null
}

interface MenuManagementProps {
  items: Item[]
  categories: Database["public"]["Tables"]["categories"]["Row"][]
  canteenId: string
}

export function MenuManagement({
  items: initialItems,
  categories,
  canteenId,
}: MenuManagementProps) {
  const [items, setItems] = useState(initialItems)
  const supabase = createClient()

  const toggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("items")
        .update({ is_available: !currentStatus })
        .eq("id", itemId)

      if (error) throw error

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, is_available: !currentStatus }
            : item
        )
      )
      toast.success("Item availability updated")
    } catch (error: any) {
      toast.error(error.message || "Failed to update item")
    }
  }

  const deleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      const { error } = await supabase.from("items").delete().eq("id", itemId)

      if (error) throw error

      setItems((prev) => prev.filter((item) => item.id !== itemId))
      toast.success("Item deleted")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete item")
    }
  }

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No items in your menu yet</p>
            <Link href="/canteen/menu/new">
              <Button className="mt-4">Add Your First Item</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="relative h-48 w-full overflow-hidden rounded-lg bg-muted">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
                  )}
                  {!item.is_available && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span className="text-lg font-semibold text-white">
                        Unavailable
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.categories?.name || "Uncategorized"}
                      </p>
                      <p className="mt-1 text-lg font-bold">₹{item.price}</p>
                    </div>
                    <Badge
                      variant={item.is_vegetarian ? "default" : "destructive"}
                      className={
                        item.is_vegetarian
                          ? "bg-green-500"
                          : "bg-red-500"
                      }
                    >
                      {item.is_vegetarian ? "Veg" : "Non-Veg"}
                    </Badge>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link href={`/canteen/menu/${item.id}/edit`}>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        toggleAvailability(item.id, item.is_available)
                      }
                    >
                      {item.is_available ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteItem(item.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

