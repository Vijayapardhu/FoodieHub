"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowUp, Plus, Trash2, Truck } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EmptyState } from "@/components/ui/empty-state"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type DeliveryBlock = Database["public"]["Tables"]["delivery_blocks"]["Row"]

export function DeliveryBlocksTable({
  blocks: initial,
}: {
  blocks: DeliveryBlock[]
}) {
  const router = useRouter()
  const [blocks, setBlocks] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeliveryBlock | null>(null)
  const [working, setWorking] = useState(false)

  const create = async () => {
    if (!name.trim()) {
      toast.error("Give the block a name")
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const nextOrder =
        blocks.reduce((max, b) => Math.max(max, b.sort_order), 0) + 1

      const { data, error } = await supabase
        .from("delivery_blocks")
        .insert({ name: name.trim(), sort_order: nextOrder })
        .select("*")
        .single()
      if (error) throw error

      setBlocks((list) => [...list, data as DeliveryBlock])
      toast.success("Block added")
      setName("")
      setCreating(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not add that block")
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (block: DeliveryBlock) => {
    setBusyId(block.id)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("delivery_blocks")
        .update({ is_active: !block.is_active })
        .eq("id", block.id)
      if (error) throw error

      setBlocks((list) =>
        list.map((entry) =>
          entry.id === block.id ? { ...entry, is_active: !entry.is_active } : entry
        )
      )
      toast.success(block.is_active ? "Block paused" : "Block active")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not update that block")
    } finally {
      setBusyId(null)
    }
  }

  const move = async (block: DeliveryBlock, direction: -1 | 1) => {
    const sorted = [...blocks].sort((a, b) => a.sort_order - b.sort_order)
    const index = sorted.findIndex((entry) => entry.id === block.id)
    const swapWith = sorted[index + direction]
    if (!swapWith) return

    setBusyId(block.id)
    try {
      const supabase = createClient()
      const [a, b] = await Promise.all([
        supabase
          .from("delivery_blocks")
          .update({ sort_order: swapWith.sort_order })
          .eq("id", block.id),
        supabase
          .from("delivery_blocks")
          .update({ sort_order: block.sort_order })
          .eq("id", swapWith.id),
      ])
      if (a.error) throw a.error
      if (b.error) throw b.error

      setBlocks((list) =>
        list.map((entry) => {
          if (entry.id === block.id) return { ...entry, sort_order: swapWith.sort_order }
          if (entry.id === swapWith.id) return { ...entry, sort_order: block.sort_order }
          return entry
        })
      )
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not reorder")
    } finally {
      setBusyId(null)
    }
  }

  const remove = async () => {
    if (!deleteTarget) return
    setWorking(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("delivery_blocks")
        .delete()
        .eq("id", deleteTarget.id)
      if (error) throw error

      setBlocks((list) => list.filter((entry) => entry.id !== deleteTarget.id))
      setDeleteTarget(null)
      toast.success("Block deleted")
      router.refresh()
    } catch (error: any) {
      toast.error(
        error?.code === "23503"
          ? "This block has orders against it — pause it instead of deleting"
          : error?.message || "Could not delete that block"
      )
    } finally {
      setWorking(false)
    }
  }

  const sorted = [...blocks].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground tabular-nums">
          {blocks.length} {blocks.length === 1 ? "block" : "blocks"}
        </p>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Add block
        </Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No delivery blocks yet"
          description="A block is a fixed drop-off point — a hostel building, a library — that a student picks at checkout. Add at least one before turning delivery on."
          action={{ label: "Add the first one", onClick: () => setCreating(true) }}
        />
      ) : (
        <ul className="space-y-2">
          {sorted.map((block, index) => (
            <li
              key={block.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5"
            >
              <div className="flex flex-col">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Move up"
                  disabled={index === 0 || busyId === block.id}
                  onClick={() => move(block, -1)}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Move down"
                  disabled={index === sorted.length - 1 || busyId === block.id}
                  onClick={() => move(block, 1)}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
              </div>

              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Truck className="h-4 w-4" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {block.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {block.is_active ? "Offered at checkout" : "Hidden from checkout"}
                </p>
              </div>

              <Switch
                checked={block.is_active}
                onCheckedChange={() => toggleActive(block)}
                disabled={busyId === block.id}
                aria-label={`${block.name} active`}
              />

              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setDeleteTarget(block)}
                aria-label={`Delete ${block.name}`}
                className="text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New delivery block</DialogTitle>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="block-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="block-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hostel Block A"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              block
              onClick={() => setCreating(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button block loading={saving} onClick={create}>
              Add
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
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Blocks with orders against them can&apos;t be deleted — that would blank
            &quot;delivered to&quot; on past bills. Turn it off instead if you just want
            it gone from checkout.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              block
              onClick={() => setDeleteTarget(null)}
              disabled={working}
            >
              Keep it
            </Button>
            <Button variant="destructive" block loading={working} onClick={remove}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
