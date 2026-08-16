"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Mail, Phone, Store } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface CanteenApplication {
  id: string
  canteen_name: string
  contact_name: string
  email: string
  phone: string
  location: string | null
  message: string | null
  status: "new" | "contacted" | "approved" | "declined"
  admin_note: string | null
  created_at: string
}

const STATUS_VARIANT = {
  new: "warning",
  contacted: "info",
  approved: "success",
  declined: "muted",
} as const

const STATUS_LABEL = {
  new: "New",
  contacted: "Contacted",
  approved: "Approved",
  declined: "Declined",
} as const

/**
 * Canteens that have asked to join.
 *
 * These arrive from a public form with no account behind them, so the only
 * way to answer one is to pick up the phone — which is why the contact
 * details are the most prominent thing on each card, as tappable links.
 */
export function ApplicationsList({
  applications: initial,
}: {
  applications: CanteenApplication[]
}) {
  const router = useRouter()
  const [applications, setApplications] = useState(initial)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const [note, setNote] = useState("")

  const update = async (
    application: CanteenApplication,
    changes: Partial<CanteenApplication>
  ) => {
    setBusyId(application.id)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase
        .from("canteen_applications")
        .update({
          ...changes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id ?? null,
        })
        .eq("id", application.id)
      if (error) throw error

      setApplications((list) =>
        list.map((entry) =>
          entry.id === application.id ? { ...entry, ...changes } : entry
        )
      )
      setNoteFor(null)
      setNote("")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not update that application")
    } finally {
      setBusyId(null)
    }
  }

  const open = applications.filter(
    (entry) => entry.status === "new" || entry.status === "contacted"
  )
  const closed = applications.filter(
    (entry) => entry.status === "approved" || entry.status === "declined"
  )

  const Card = ({ application }: { application: CanteenApplication }) => (
    <li className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-foreground">
            {application.canteen_name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {application.contact_name}
            {application.location ? ` · ${application.location}` : ""}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[application.status]} size="sm">
          {STATUS_LABEL[application.status]}
        </Badge>
      </div>

      {/* The whole point of the screen is getting in touch, so make it one tap. */}
      <div className="flex flex-wrap gap-2">
        <a
          href={`tel:${application.phone}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground"
        >
          <Phone className="h-3.5 w-3.5" />
          {application.phone}
        </a>
        <a
          href={`mailto:${application.email}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground"
        >
          <Mail className="h-3.5 w-3.5" />
          {application.email}
        </a>
      </div>

      {application.message ? (
        <p className="rounded-xl bg-surface-muted p-3 text-sm text-muted-foreground">
          {application.message}
        </p>
      ) : null}

      {application.admin_note ? (
        <p className="rounded-xl bg-info-soft p-3 text-xs text-info">
          {application.admin_note}
        </p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Applied {format(new Date(application.created_at), "d MMM yyyy, h:mm a")}
      </p>

      {noteFor === application.id ? (
        <div className="space-y-2 border-t border-border pt-3">
          <Textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What happened when you spoke to them?"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setNoteFor(null)
                setNote("")
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              loading={busyId === application.id}
              onClick={() =>
                update(application, {
                  admin_note: note.trim() || null,
                  status: "contacted",
                })
              }
            >
              Save note
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          {application.status !== "approved" ? (
            <Button
              size="sm"
              variant="success"
              loading={busyId === application.id}
              onClick={() => update(application, { status: "approved" })}
            >
              Approved
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setNoteFor(application.id)
              setNote(application.admin_note ?? "")
            }}
          >
            Add note
          </Button>
          {application.status !== "declined" ? (
            <Button
              size="sm"
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive-soft"
              loading={busyId === application.id}
              onClick={() => update(application, { status: "declined" })}
            >
              Decline
            </Button>
          ) : null}
        </div>
      )}
    </li>
  )

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={Store}
        title="No applications yet"
        description="Canteens that apply through the public form land here, with their contact details."
      />
    )
  }

  return (
    <Tabs defaultValue={open.length > 0 ? "open" : "closed"}>
      <TabsList>
        <TabsTrigger value="open">
          To handle
          {open.length > 0 ? (
            <span className="rounded-full bg-warning px-1.5 py-0.5 text-2xs font-bold text-warning-foreground">
              {open.length}
            </span>
          ) : null}
        </TabsTrigger>
        <TabsTrigger value="closed">Closed ({closed.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="open">
        {open.length === 0 ? (
          <EmptyState
            icon={Store}
            title="Nothing waiting"
            description="Every application has been dealt with."
            compact
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {open.map((application) => (
              <Card key={application.id} application={application} />
            ))}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="closed">
        {closed.length === 0 ? (
          <EmptyState
            icon={Store}
            title="Nothing closed yet"
            description="Approved and declined applications are kept here."
            compact
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {closed.map((application) => (
              <Card key={application.id} application={application} />
            ))}
          </ul>
        )}
      </TabsContent>
    </Tabs>
  )
}
