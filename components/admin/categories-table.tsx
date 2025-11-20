"use client"

import { useState } from "react"
import { Database } from "@/types/database.types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"

type Category = Database["public"]["Tables"]["categories"]["Row"]

interface CategoriesTableProps {
  categories: Category[]
}

export function CategoriesTable({ categories: initial }: CategoriesTableProps) {
  const [categories, setCategories] = useState(initial)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: "", description: "" })
  const supabase = createClient()

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ name: "", description: "" })
    setDialogOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    setForm({
      name: category.name,
      description: category.description || "",
    })
    setDialogOpen(true)
  }

  const upsertCategory = async () => {
    if (!form.name.trim()) {
      toast.error("Category name is required")
      return
    }
    try {
      setLoading(true)
      if (editing) {
        const { data, error } = await supabase
          .from("categories")
          .update({
            name: form.name.trim(),
            description: form.description.trim() || null,
          })
          .eq("id", editing.id)
          .select("*")
          .single()

        if (error) throw error

        setCategories((prev) =>
          prev.map((cat) => (cat.id === editing.id ? (data as Category) : cat)),
        )
        toast.success("Category updated")
      } else {
        const { data, error } = await supabase
          .from("categories")
          .insert({
            name: form.name.trim(),
            description: form.description.trim() || null,
          })
          .select("*")
          .single()

        if (error) throw error

        setCategories((prev) => [data as Category, ...prev])
        toast.success("Category created")
      }
      setDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to save category")
    } finally {
      setLoading(false)
    }
  }

  const deleteCategory = async (categoryId: string) => {
    if (
      !confirm(
        "Delete this category? Menu items linked to it will become uncategorized.",
      )
    ) {
      return
    }
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId)

      if (error) throw error

      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId))
      toast.success("Category deleted")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category")
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {categories.length} categories
        </p>
        <Button onClick={openCreate} className="rounded-full">
          Add category
        </Button>
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b">
                  <td className="px-6 py-4 font-medium">{category.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {category.description || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(category.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(category)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteCategory(category.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="space-y-3 md:hidden">
        {categories.map((category) => (
          <Card key={category.id} className="border border-slate-100">
            <CardContent className="space-y-2 p-4">
              <p className="font-semibold">{category.name}</p>
              <p className="text-sm text-muted-foreground">
                {category.description || "No description"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEdit(category)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteCategory(category.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit category" : "Add new category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Category name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            <Textarea
              rows={3}
              placeholder="Description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={upsertCategory} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

