"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database } from "@/types/database.types"
import { format } from "date-fns"
import Image from "next/image"
import { useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
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
import { ImageUpload } from "@/components/ui/image-upload"

type Canteen = Database["public"]["Tables"]["canteens"]["Row"] & {
  users: { email: string; full_name: string | null } | null
  is_approved?: boolean
  approved_by?: string | null
  approved_at?: string | null
  rejection_reason?: string | null
}

interface CanteensTableProps {
  canteens: Canteen[]
}

type FormState = {
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

export function CanteensTable({ canteens: initialCanteens }: CanteensTableProps) {
  const [canteens, setCanteens] = useState(initialCanteens)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Canteen | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>({
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
  })
  const supabase = createClient()

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value } as FormState))
  }

  const openCreate = () => {
    setEditing(null)
    setForm({
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
    })
    setDialogOpen(true)
  }

  const openEdit = (canteen: Canteen) => {
    setEditing(canteen)
    setForm({
      name: canteen.name,
      ownerEmail: canteen.users?.email || "",
      description: canteen.description || "",
      contactPhone: canteen.contact_phone || "",
      address: canteen.address || "",
      addressReference: canteen.address_reference || "",
      mapsUrl: canteen.google_maps_url || "",
      logoUrl: canteen.logo_url || "",
      bannerUrl: canteen.banner_url || "",
      isOpen: canteen.is_open,
    })
    setDialogOpen(true)
  }

  const toggleStatus = async (canteenId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("canteens")
        .update({ is_open: !currentStatus })
        .eq("id", canteenId)

      if (error) throw error

      setCanteens((prev) =>
        prev.map((c) =>
          c.id === canteenId ? { ...c, is_open: !currentStatus } : c,
        ),
      )
      toast.success("Canteen status updated")
    } catch (error: any) {
      toast.error(error.message || "Failed to update status")
    }
  }

  const handleApproval = async (canteenId: string, approve: boolean, reason?: string) => {
    try {
      const response = await fetch(`/api/canteens/${canteenId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approve, reason }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update approval status")
      }

      // Update local state
      setCanteens((prev) =>
        prev.map((c) =>
          c.id === canteenId
            ? {
                ...c,
                is_approved: approve,
                approved_at: approve ? new Date().toISOString() : null,
                rejection_reason: approve ? null : reason || null,
              }
            : c,
        ),
      )

      toast.success(approve ? "Canteen approved" : "Canteen rejected")
    } catch (error: any) {
      toast.error(error.message || "Failed to update approval status")
    }
  }

  const upsertCanteen = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    if (!editing && !form.ownerEmail.trim()) {
      toast.error("Owner email is required")
      return
    }
    try {
      setLoading(true)
      if (editing) {
        const { data, error } = await supabase
          .from("canteens")
          .update({
            name: form.name.trim(),
            description: form.description.trim() || null,
            contact_phone: form.contactPhone.trim() || null,
            address: form.address.trim() || null,
            address_reference: form.addressReference.trim() || null,
            google_maps_url: form.mapsUrl.trim() || null,
            logo_url: form.logoUrl || null,
            banner_url: form.bannerUrl || null,
            is_open: form.isOpen,
          })
          .eq("id", editing.id)
          .select("*, users(email, full_name)")
          .single()

        if (error) throw error

        setCanteens((prev) =>
          prev.map((c) => (c.id === editing.id ? (data as Canteen) : c)),
        )
        toast.success("Canteen updated")
      } else {
        const { data: owner, error: ownerError } = await supabase
          .from("users")
          .select("id, email, full_name, role")
          .eq("email", form.ownerEmail.trim())
          .maybeSingle()

        if (ownerError) throw ownerError
        if (!owner) {
          toast.error("Owner email not found")
          return
        }

        if (owner.role !== "canteen_owner") {
          await supabase.from("users").update({ role: "canteen_owner" }).eq("id", owner.id)
        }

        const { data, error } = await supabase
          .from("canteens")
          .insert({
            owner_id: owner.id,
            name: form.name.trim(),
            description: form.description.trim() || null,
            contact_phone: form.contactPhone.trim() || null,
            address: form.address.trim() || null,
            address_reference: form.addressReference.trim() || null,
            google_maps_url: form.mapsUrl.trim() || null,
            logo_url: form.logoUrl || null,
            banner_url: form.bannerUrl || null,
            is_open: form.isOpen,
          })
          .select("*, users(email, full_name)")
          .single()

        if (error) throw error

        setCanteens((prev) => [data as Canteen, ...prev])
        toast.success("Canteen created")
      }
      setDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to save canteen")
    } finally {
      setLoading(false)
    }
  }

  const deleteCanteen = async (canteenId: string) => {
    if (!confirm("Delete this canteen? This action cannot be undone.")) {
      return
    }
    try {
      const { error } = await supabase
        .from("canteens")
        .delete()
        .eq("id", canteenId)

      if (error) throw error

      setCanteens((prev) => prev.filter((c) => c.id !== canteenId))
      toast.success("Canteen deleted")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete canteen")
    }
  }

  const mobileView = useMemo(
    () => (
      <div className="space-y-4 md:hidden">
        {canteens.map((canteen) => (
          <Card key={canteen.id} className="border border-slate-100">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-3">
                {canteen.logo_url ? (
                  <div className="relative h-12 w-12 overflow-hidden rounded-xl">
                    <Image
                      src={canteen.logo_url}
                      alt={canteen.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
                    {canteen.name[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold">{canteen.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {canteen.users?.full_name || canteen.users?.email || "Owner"}
                  </p>
                  {canteen.address && (
                    <p className="text-xs text-muted-foreground">
                      📍 {canteen.address}
                    </p>
                  )}
                  {canteen.address_reference && (
                    <p className="text-[11px] text-muted-foreground">
                      Ref: {canteen.address_reference}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    canteen.is_approved === false
                      ? "bg-yellow-500"
                      : canteen.is_approved === true
                      ? "bg-green-500"
                      : "bg-gray-500"
                  }
                >
                  {canteen.is_approved === false
                    ? "Pending"
                    : canteen.is_approved === true
                    ? "Approved"
                    : "Unknown"}
                </Badge>
                <Badge className={canteen.is_open ? "bg-success" : "bg-destructive"}>
                  {canteen.is_open ? "Open" : "Closed"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ⭐ {Number(canteen.rating).toFixed(1)} ({canteen.total_reviews})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {canteen.is_approved === false && (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => handleApproval(canteen.id, true)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const reason = prompt("Rejection reason (optional):")
                        if (reason !== null) {
                          handleApproval(canteen.id, false, reason)
                        }
                      }}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {canteen.is_approved === true && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApproval(canteen.id, false)}
                  >
                    Revoke
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleStatus(canteen.id, canteen.is_open)}
                >
                  {canteen.is_open ? "Close" : "Open"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(canteen)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteCanteen(canteen.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    ),
    [canteens],
  )

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {canteens.length} canteens on the platform
          </p>
        </div>
        <Button onClick={openCreate} className="rounded-full">
          Add canteen
        </Button>
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium">Canteen</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Owner</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Rating</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {canteens.map((canteen) => (
                  <tr key={canteen.id} className="border-b">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {canteen.logo_url ? (
                          <div className="relative h-10 w-10 overflow-hidden rounded-full">
                            <Image
                              src={canteen.logo_url}
                              alt={canteen.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                            {canteen.name[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">{canteen.name}</span>
                          {canteen.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {canteen.description}
                            </p>
                          )}
                          {canteen.address && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              📍 {canteen.address}
                            </p>
                          )}
                          {canteen.address_reference && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              Ref: {canteen.address_reference}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {canteen.users?.full_name || canteen.users?.email || "Unknown"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <Badge
                          className={
                            canteen.is_approved === false
                              ? "bg-yellow-500"
                              : canteen.is_approved === true
                              ? "bg-green-500"
                              : "bg-gray-500"
                          }
                        >
                          {canteen.is_approved === false
                            ? "Pending"
                            : canteen.is_approved === true
                            ? "Approved"
                            : "Unknown"}
                        </Badge>
                        <Badge
                          className={canteen.is_open ? "bg-success" : "bg-destructive"}
                        >
                          {canteen.is_open ? "Open" : "Closed"}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">
                          {Number(canteen.rating).toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({canteen.total_reviews})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {format(new Date(canteen.created_at), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {canteen.is_approved === false && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => handleApproval(canteen.id, true)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const reason = prompt("Rejection reason (optional):")
                                if (reason !== null) {
                                  handleApproval(canteen.id, false, reason)
                                }
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {canteen.is_approved === true && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproval(canteen.id, false)}
                          >
                            Revoke
                          </Button>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleStatus(canteen.id, canteen.is_open)}
                          >
                            {canteen.is_open ? "Close" : "Open"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openEdit(canteen)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteCanteen(canteen.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {mobileView}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="space-y-4">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit canteen" : "Add new canteen"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Canteen name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            {!editing && (
              <Input
                type="email"
                placeholder="Owner email"
                value={form.ownerEmail}
                onChange={(e) => handleChange("ownerEmail", e.target.value)}
              />
            )}
            <Textarea
              rows={3}
              placeholder="Description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
            <Input
              placeholder="Contact phone"
              value={form.contactPhone}
              onChange={(e) => handleChange("contactPhone", e.target.value)}
            />
            <Textarea
              rows={3}
              placeholder="Street address"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />
            <Input
              placeholder="Address reference (landmark)"
              value={form.addressReference}
              onChange={(e) => handleChange("addressReference", e.target.value)}
            />
            <Input
              placeholder="Google Maps link"
              value={form.mapsUrl}
              onChange={(e) => handleChange("mapsUrl", e.target.value)}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium">Logo</p>
                <ImageUpload
                  bucket="canteens"
                  folder="logos"
                  currentImageUrl={form.logoUrl}
                  onUploadComplete={(url) => handleChange("logoUrl", url)}
                  aspectRatio="logo"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Cover image</p>
                <ImageUpload
                  bucket="canteens"
                  folder="banners"
                  currentImageUrl={form.bannerUrl}
                  onUploadComplete={(url) => handleChange("bannerUrl", url)}
                  aspectRatio="banner"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isOpen}
                onChange={(e) => handleChange("isOpen", e.target.checked)}
              />
              Mark as open
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={upsertCanteen} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

