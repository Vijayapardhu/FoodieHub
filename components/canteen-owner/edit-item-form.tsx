"use client"

import { Database } from "@/types/database.types"
import { ItemForm } from "./item-form"

type Category = Database["public"]["Tables"]["categories"]["Row"]
type Item = Database["public"]["Tables"]["items"]["Row"]

/** Edit mode of the shared item form. */
export function EditItemForm({
  canteenId,
  item,
  categories,
}: {
  canteenId: string
  item: Item
  categories: Category[]
}) {
  return (
    <ItemForm canteenId={canteenId} categories={categories} item={item} />
  )
}
