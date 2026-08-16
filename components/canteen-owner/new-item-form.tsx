"use client"

import { Database } from "@/types/database.types"
import { ItemForm } from "./item-form"

type Category = Database["public"]["Tables"]["categories"]["Row"]

/** Create mode of the shared item form. */
export function NewItemForm({
  canteenId,
  categories,
}: {
  canteenId: string
  categories: Category[]
}) {
  return <ItemForm canteenId={canteenId} categories={categories} />
}
