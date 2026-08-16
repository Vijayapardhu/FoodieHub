"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Pencil, Plus, Tags, Trash2 } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Category = Database["public"]["Tables"]["categories"]["Row"]

export function CategoriesTable({
  categories: initial,
}: {
  categories: Category[]
}) {
  const router = useRouter()
  const [categories, setCategories] = useState(initial)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [working, setWorking] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setName("")
    setDescription("")
    setEditorOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    setName(category.name)
    setDescription(category.description ?? "")
    setEditorOpen(true)
  }

  const save = async () => {
    if (!name.trim()) {
      toast.error("Give the category a name")
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
      }

      if (editing) {
        const { data, error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editing.id)
          .select("*")
          .single()
        if (error) throw error

        setCategories((list) =>
          list.map((entry) =>
            entry.id === editing.id ? (data as Category) : entry
          )
        )
        toast.success("Category updated")
      } else {
        const { data, error } = await supabase
          .from("categories")
          .insert(payload)
          .select("*")
          .single()
        if (error) throw error

        setCategories((list) => [data as Category, ...list])
        toast.success("Category created")
      }

      setEditorOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not save that category")
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!deleteTarget) return
    setWorking(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", deleteTarget.id)
      if (error) throw error

      setCategories((list) =>
        list.filter((entry) => entry.id !== deleteTarget.id)
      )
      setDeleteTarget(null)
      toast.success("Category deleted")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not delete that category")
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground tabular-nums">
          {categories.length}{" "}
          {categories.length === 1 ? "category" : "categories"}
        </p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add category
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No categories yet"
          description="Categories group dishes across every canteen's menu."
          action={{ label: "Add the first one", onClick: openCreate }}
        />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Tags className="h-4 w-4" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {category.name}
                </p>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {category.description || "No description"}
                </p>
                <p className="mt-1 text-2xs text-muted-foreground">
                  Added {format(new Date(category.created_at), "d MMM yyyy")}
                </p>
              </div>

              <div className="flex shrink-0 gap-1">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => openEdit(category)}
                  aria-label={`Edit ${category.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setDeleteTarget(category)}
                  aria-label={`Delete ${category.name}`}
                  className="text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit category" : "New category"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="category-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. South Indian"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What belongs in this category"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              block
              onClick={() => setEditorOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button block loading={saving} onClick={save}>
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{deleteTarget?.name}”?</DialogTitle>
            <DialogDescription>
              Dishes filed under it stay on their menus but lose this grouping.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              block
              onClick={() => setDeleteTarget(null)}
              disabled={working}
            >
              Keep it
            </Button>
            <Button
              variant="destructive"
              block
              loading={working}
              onClick={remove}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
