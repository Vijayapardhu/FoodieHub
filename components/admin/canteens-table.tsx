"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { MapPin, Plus, Search, Star, Store, Trash2, X } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Chip, ChipRail } from "@/components/ui/chip"
import { Switch } from "@/components/ui/switch"
import { EmptyState } from "@/components/ui/empty-state"
import { ImageUpload } from "@/components/ui/image-upload"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useDebounce } from "@/lib/hooks/use-debounce"

type Canteen = Database["public"]["Tables"]["canteens"]["Row"] & {
  users: { email: string; full_name: string | null } | null
}

type Filter = "all" | "pending" | "approved" | "open"

interface FormState {
  name: string
  ownerEmail: string
  description: string
  contactPhone: string
  address: string
  addressReference: string
  mapsUrl: string
  logoUrl: string
  bannerUrl: string
  isOpen: boolean
}

const emptyForm: FormState = {
  name: "",
  ownerEmail: "",
  description: "",
  contactPhone: "",
  address: "",
  addressReference: "",
  mapsUrl: "",
  logoUrl: "",
  bannerUrl: "",
  isOpen: true,
}

export function CanteensTable({
  canteens: initialCanteens,
}: {
  canteens: Canteen[]
}) {
  const router = useRouter()
  const [canteens, setCanteens] = useState(initialCanteens)
  const [rawQuery, setRawQuery] = useState("")
  const [filter, setFilter] = useState<Filter>(
    initialCanteens.some((c) => !c.is_approved) ? "pending" : "all"
  )

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Canteen | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [rejectTarget, setRejectTarget] = useState<Canteen | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Canteen | null>(null)
  const [working, setWorking] = useState(false)

  const query = useDebounce(rawQuery, 180).trim().toLowerCase()

  const counts = useMemo(
    () => ({
      all: canteens.length,
      pending: canteens.filter((c) => !c.is_approved).length,
      approved: canteens.filter((c) => c.is_approved).length,
      open: canteens.filter((c) => c.is_open).length,
    }),
    [canteens]
  )

  const visible = useMemo(
    () =>
      canteens.filter((canteen) => {
        if (filter === "pending" && canteen.is_approved) return false
        if (filter === "approved" && !canteen.is_approved) return false
        if (filter === "open" && !canteen.is_open) return false
        if (!query) return true
        return (
          canteen.name.toLowerCase().includes(query) ||
          canteen.users?.email.toLowerCase().includes(query) ||
          canteen.address?.toLowerCase().includes(query)
        )
      }),
    [canteens, filter, query]
  )

  const setField = (field: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }) as FormState)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setSheetOpen(true)
  }

  const openEdit = (canteen: Canteen) => {
    setEditing(canteen)
    setForm({
      name: canteen.name,
      ownerEmail: canteen.users?.email ?? "",
      description: canteen.description ?? "",
      contactPhone: canteen.contact_phone ?? "",
      address: canteen.address ?? "",
      addressReference: canteen.address_reference ?? "",
      mapsUrl: canteen.google_maps_url ?? "",
      logoUrl: canteen.logo_url ?? "",
      bannerUrl: canteen.banner_url ?? "",
      isOpen: canteen.is_open,
    })
    setSheetOpen(true)
  }

  const toggleOpen = async (canteen: Canteen, value: boolean) => {
    const previous = canteens
    setCanteens((list) =>
      list.map((c) => (c.id === canteen.id ? { ...c, is_open: value } : c))
    )

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("canteens")
        .update({ is_open: value })
        .eq("id", canteen.id)
      if (error) throw error
      toast.success(`${canteen.name} is now ${value ? "open" : "closed"}`)
    } catch (error: any) {
      setCanteens(previous)
      toast.error(error?.message || "Could not update that canteen")
    }
  }

  const setApproval = async (
    canteen: Canteen,
    approve: boolean,
    reason?: string
  ) => {
    setWorking(true)
    try {
      const response = await fetch(`/api/canteens/${canteen.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve, reason }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Could not update approval")
      }

      setCanteens((list) =>
        list.map((c) =>
          c.id === canteen.id
            ? {
                ...c,
                is_approved: approve,
                approved_at: approve ? new Date().toISOString() : null,
                rejection_reason: approve ? null : (reason ?? null),
              }
            : c
        )
      )

      toast.success(approve ? "Canteen approved" : "Canteen rejected")
      setRejectTarget(null)
      setRejectReason("")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not update approval")
    } finally {
      setWorking(false)
    }
  }

  const saveCanteen = async () => {
    if (!form.name.trim()) {
      toast.error("The canteen needs a name")
      return
    }
    if (!editing && !form.ownerEmail.trim()) {
      toast.error("Enter the owner's email so we can link the account")
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        contact_phone: form.contactPhone.trim() || null,
        address: form.address.trim() || null,
        address_reference: form.addressReference.trim() || null,
        google_maps_url: form.mapsUrl.trim() || null,
        logo_url: form.logoUrl || null,
        banner_url: form.bannerUrl || null,
        is_open: form.isOpen,
      }

      if (editing) {
        const { data, error } = await supabase
          .from("canteens")
          .update(payload)
          .eq("id", editing.id)
          .select("*, users:users!canteens_owner_id_fkey(email, full_name)")
          .single()
        if (error) throw error

        setCanteens((list) =>
          list.map((c) => (c.id === editing.id ? (data as Canteen) : c))
        )
        toast.success("Canteen updated")
      } else {
        const { data: owner, error: ownerError } = await supabase
          .from("users")
          .select("id, email, role")
          .eq("email", form.ownerEmail.trim())
          .maybeSingle()
        if (ownerError) throw ownerError

        if (!owner) {
          toast.error("No account found with that email")
          return
        }

        // Creating a canteen implies the account manages one.
        if (owner.role !== "canteen_owner" && owner.role !== "admin") {
          await supabase
            .from("users")
            .update({ role: "canteen_owner" })
            .eq("id", owner.id)
        }

        const { data, error } = await supabase
          .from("canteens")
          .insert({
            ...payload,
            owner_id: owner.id,
            operating_hours: {},
            is_approved: true,
          })
          .select("*, users:users!canteens_owner_id_fkey(email, full_name)")
          .single()
        if (error) throw error

        setCanteens((list) => [data as Canteen, ...list])
        toast.success("Canteen created")
      }

      setSheetOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not save that canteen")
    } finally {
      setSaving(false)
    }
  }

  const deleteCanteen = async () => {
    if (!deleteTarget) return
    setWorking(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("canteens")
        .delete()
        .eq("id", deleteTarget.id)
      if (error) throw error

      setCanteens((list) => list.filter((c) => c.id !== deleteTarget.id))
      setDeleteTarget(null)
      toast.success("Canteen deleted")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not delete that canteen")
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          type="search"
          inputMode="search"
          placeholder="Search canteen, owner or address"
          value={rawQuery}
          onChange={(e) => setRawQuery(e.target.value)}
          aria-label="Search canteens"
          startAdornment={<Search />}
          endAdornment={
            rawQuery ? (
              <button
                type="button"
                onClick={() => setRawQuery("")}
                aria-label="Clear search"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
              >
                <X />
              </button>
            ) : undefined
          }
        />
        <Button size="icon-lg" onClick={openCreate} aria-label="Add canteen">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ChipRail>
        {(
          [
            ["all", "All"],
            ["pending", "Pending"],
            ["approved", "Approved"],
            ["open", "Open now"],
          ] as const
        ).map(([key, label]) => (
          <Chip
            key={key}
            active={filter === key}
            onClick={() => setFilter(key)}
            count={counts[key]}
          >
            {label}
          </Chip>
        ))}
      </ChipRail>

      {visible.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No canteens here"
          description={
            filter === "pending"
              ? "Nothing is waiting for approval right now."
              : "Try a different search term or filter."
          }
          compact
        />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {visible.map((canteen) => (
            <li
              key={canteen.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-primary-soft">
                  {canteen.logo_url ? (
                    <Image
                      src={canteen.logo_url}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-lg font-black text-primary">
                      {canteen.name[0]?.toUpperCase()}
                    </span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">
                    {canteen.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {canteen.users?.full_name || canteen.users?.email || "No owner"}
                  </p>
                  {canteen.address ? (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {canteen.address}
                    </p>
                  ) : null}
                </div>

                <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-foreground">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {Number(canteen.rating).toFixed(1)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={canteen.is_approved ? "success" : "warning"}
                  size="sm"
                >
                  {canteen.is_approved ? "Approved" : "Pending"}
                </Badge>
                <Badge variant={canteen.is_open ? "info" : "muted"} size="sm">
                  {canteen.is_open ? "Open" : "Closed"}
                </Badge>
                <span className="text-2xs text-muted-foreground">
                  Added {format(new Date(canteen.created_at), "d MMM yyyy")}
                </span>
              </div>

              {canteen.rejection_reason ? (
                <p className="rounded-xl bg-destructive-soft p-2.5 text-xs text-destructive">
                  Rejected: {canteen.rejection_reason}
                </p>
              ) : null}

              <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-3">
                {!canteen.is_approved ? (
                  <>
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => setApproval(canteen, true)}
                      disabled={working}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive/40 text-destructive hover:bg-destructive-soft"
                      onClick={() => {
                        setRejectTarget(canteen)
                        setRejectReason(canteen.rejection_reason ?? "")
                      }}
                      disabled={working}
                    >
                      Reject
                    </Button>
                  </>
                ) : (
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Switch
                      checked={canteen.is_open}
                      onCheckedChange={(value) => toggleOpen(canteen, value)}
                      aria-label={`${canteen.name} open`}
                    />
                    {canteen.is_open ? "Serving" : "Closed"}
                  </label>
                )}

                <div className="ml-auto flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(canteen)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setDeleteTarget(canteen)}
                    aria-label={`Delete ${canteen.name}`}
                    className="text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[90dvh]">
          <SheetHeader className="pr-12">
            <SheetTitle>
              {editing ? `Edit ${editing.name}` : "Add a canteen"}
            </SheetTitle>
          </SheetHeader>

          <SheetBody className="space-y-4 pb-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-canteen-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="admin-canteen-name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </div>

            {!editing ? (
              <div className="space-y-1.5">
                <Label htmlFor="admin-owner-email">
                  Owner email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="admin-owner-email"
                  type="email"
                  inputMode="email"
                  value={form.ownerEmail}
                  onChange={(e) => setField("ownerEmail", e.target.value)}
                  placeholder="owner@college.edu"
                />
                <p className="text-xs text-muted-foreground">
                  The account must already exist. It will be promoted to canteen
                  owner automatically.
                </p>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="admin-canteen-description">Description</Label>
              <Textarea
                id="admin-canteen-description"
                rows={3}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-canteen-phone">Contact phone</Label>
              <Input
                id="admin-canteen-phone"
                type="tel"
                inputMode="tel"
                value={form.contactPhone}
                onChange={(e) => setField("contactPhone", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-canteen-address">Address</Label>
              <Input
                id="admin-canteen-address"
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-canteen-landmark">Landmark</Label>
              <Input
                id="admin-canteen-landmark"
                value={form.addressReference}
                onChange={(e) => setField("addressReference", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-canteen-maps">Google Maps link</Label>
              <Input
                id="admin-canteen-maps"
                type="url"
                inputMode="url"
                value={form.mapsUrl}
                onChange={(e) => setField("mapsUrl", e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Logo</Label>
                <ImageUpload
                  bucket="canteens"
                  folder="logos"
                  currentImageUrl={form.logoUrl}
                  onUploadComplete={(url) => setField("logoUrl", url)}
                  aspectRatio="logo"
                  label="Add a logo"
                />
              </div>
              <div className="space-y-2">
                <Label>Banner</Label>
                <ImageUpload
                  bucket="canteens"
                  folder="banners"
                  currentImageUrl={form.bannerUrl}
                  onUploadComplete={(url) => setField("bannerUrl", url)}
                  aspectRatio="banner"
                  label="Add a banner"
                />
              </div>
            </div>

            <label className="flex min-h-touch items-center justify-between gap-4">
              <span className="text-sm font-medium text-foreground">
                Serving right now
              </span>
              <Switch
                checked={form.isOpen}
                onCheckedChange={(value) => setField("isOpen", value)}
              />
            </label>
          </SheetBody>

          <SheetFooter>
            <Button
              variant="outline"
              block
              onClick={() => setSheetOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button block loading={saving} onClick={saveCanteen}>
              {editing ? "Save changes" : "Create canteen"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejectTarget?.name}?</DialogTitle>
            <DialogDescription>
              The owner sees your reason and can fix the issue and resubmit.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Missing FSSAI registration number"
            rows={3}
            maxLength={300}
          />

          <DialogFooter>
            <Button
              variant="outline"
              block
              onClick={() => setRejectTarget(null)}
              disabled={working}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              block
              loading={working}
              onClick={() =>
                rejectTarget &&
                setApproval(rejectTarget, false, rejectReason.trim() || undefined)
              }
            >
              Reject
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
            <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
            <DialogDescription>
              Its menu, offers and order history go with it. This can&apos;t be
              undone — consider rejecting or closing it instead.
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
              onClick={deleteCanteen}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
