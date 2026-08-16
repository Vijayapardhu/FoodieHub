"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  ArrowDown,
  ArrowUp,
  BadgeIndianRupee,
  Megaphone,
  MousePointerClick,
} from "@/components/ui/icons"
import toast from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { StatGrid, StatTile } from "@/components/ui/stat-tile"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { canteenPath } from "@/lib/utils/public-id"
import {
  PROMO_STATUS_LABELS,
  placementMeta,
  clickThroughRate,
  formatRupees,
  hasExpired,
  isLive,
  slotDays,
  type PromoBannerWithCanteen,
} from "@/lib/utils/promo-banners"

interface PromoBannerManagementProps {
  banners: PromoBannerWithCanteen[]
}

const STATUS_VARIANT = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  paused: "muted",
} as const

export function PromoBannerManagement({
  banners: initial,
}: PromoBannerManagementProps) {
  const router = useRouter()
  const [banners, setBanners] = useState(initial)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [collecting, setCollecting] = useState<string | null>(null)
  const [reference, setReference] = useState("")

  const patch = (id: string, changes: Partial<PromoBannerWithCanteen>) =>
    setBanners((list) =>
      list.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry))
    )

  const save = async (
    id: string,
    changes: Record<string, unknown>,
    message: string
  ) => {
    setBusyId(id)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("promo_banners")
        .update(changes)
        .eq("id", id)
      if (error) throw error

      patch(id, changes as Partial<PromoBannerWithCanteen>)
      toast.success(message)
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not update that banner")
    } finally {
      setBusyId(null)
    }
  }

  const decide = async (banner: PromoBannerWithCanteen, approve: boolean) => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await save(
      banner.id,
      {
        status: approve ? "approved" : "rejected",
        review_note: approve ? null : note.trim() || null,
        reviewed_by: user?.id ?? null,
        reviewed_at: new Date().toISOString(),
      },
      approve ? "Banner is live" : "Request rejected"
    )

    setRejecting(null)
    setNote("")
  }

  const collect = async (banner: PromoBannerWithCanteen) => {
    await save(
      banner.id,
      {
        amount_paid: Number(banner.amount_due),
        payment_reference: reference.trim() || null,
      },
      "Payment recorded"
    )
    setCollecting(null)
    setReference("")
  }

  const totals = useMemo(() => {
    let collected = 0
    let outstanding = 0
    let live = 0
    let impressions = 0

    for (const banner of banners) {
      if (banner.status === "rejected") continue
      collected += Number(banner.amount_paid)
      outstanding += Math.max(
        0,
        Number(banner.amount_due) - Number(banner.amount_paid)
      )
      impressions += Number(banner.impressions)
      if (isLive(banner)) live += 1
    }

    return { collected, outstanding, live, impressions }
  }, [banners])

  const requests = banners.filter((banner) => banner.status === "pending")
  const running = banners.filter(
    (banner) =>
      (banner.status === "approved" || banner.status === "paused") &&
      !hasExpired(banner)
  )
  const finished = banners.filter(
    (banner) =>
      banner.status === "rejected" ||
      (banner.status !== "pending" && hasExpired(banner))
  )

  const BannerCard = ({
    banner,
    children,
  }: {
    banner: PromoBannerWithCanteen
    children?: React.ReactNode
  }) => {
    const ctr = clickThroughRate(banner)
    const owed = Number(banner.amount_due) - Number(banner.amount_paid)

    return (
      <li className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex gap-3">
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-gradient">
            {banner.image_url ? (
              <Image
                src={banner.image_url}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-bold text-foreground">
              {banner.headline}
            </p>
            {banner.canteens ? (
              <Link
                href={canteenPath(banner.canteens)}
                className="truncate text-xs font-semibold text-primary"
              >
                {banner.canteens.name}
              </Link>
            ) : (
              <p className="text-xs text-muted-foreground">Unknown canteen</p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">
              {format(new Date(banner.starts_at), "d MMM")} –{" "}
              {format(new Date(banner.ends_at), "d MMM yyyy")} ·{" "}
              {slotDays(banner.starts_at, banner.ends_at)} days
            </p>

            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge variant={STATUS_VARIANT[banner.status]} size="sm">
                {isLive(banner) ? "Live now" : PROMO_STATUS_LABELS[banner.status]}
              </Badge>
              <Badge variant="outline" size="sm">
                {placementMeta(banner.placement).label}
              </Badge>
              {banner.priority > 0 ? (
                <Badge variant="info" size="sm">
                  Priority {banner.priority}
                </Badge>
              ) : null}
              {banner.offers ? (
                <Badge variant="soft" size="sm">
                  {banner.offers.title}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        {banner.subtext ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {banner.subtext}
          </p>
        ) : null}

        <dl className="grid grid-cols-4 gap-2 rounded-xl bg-surface-muted p-3 text-center">
          <div>
            <dt className="text-2xs uppercase tracking-wider text-muted-foreground">
              Shown
            </dt>
            <dd className="text-sm font-bold tabular-nums text-foreground">
              {banner.impressions.toLocaleString("en-IN")}
            </dd>
          </div>
          <div>
            <dt className="text-2xs uppercase tracking-wider text-muted-foreground">
              Taps
            </dt>
            <dd className="text-sm font-bold tabular-nums text-foreground">
              {banner.clicks.toLocaleString("en-IN")}
            </dd>
          </div>
          <div>
            <dt className="text-2xs uppercase tracking-wider text-muted-foreground">
              Tap rate
            </dt>
            <dd className="text-sm font-bold tabular-nums text-foreground">
              {ctr === null ? "—" : `${ctr.toFixed(1)}%`}
            </dd>
          </div>
          <div>
            <dt className="text-2xs uppercase tracking-wider text-muted-foreground">
              Billed
            </dt>
            <dd className="text-sm font-bold tabular-nums text-foreground">
              {formatRupees(Number(banner.amount_due))}
            </dd>
          </div>
        </dl>

        {owed > 0 ? (
          collecting === banner.id ? (
            <div className="space-y-2 rounded-xl border border-border p-3">
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Receipt or UPI reference (optional)"
                aria-label="Payment reference"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setCollecting(null)
                    setReference("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="success"
                  className="flex-1"
                  loading={busyId === banner.id}
                  onClick={() => collect(banner)}
                >
                  Mark {formatRupees(owed)} received
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCollecting(banner.id)}
              className="flex items-center justify-between gap-2 rounded-xl bg-warning-soft px-3 py-2 text-left text-sm text-warning"
            >
              <span className="font-semibold">
                {formatRupees(owed)} outstanding
              </span>
              <span className="text-xs font-semibold underline underline-offset-2">
                Record payment
              </span>
            </button>
          )
        ) : (
          <p className="rounded-xl bg-success-soft px-3 py-2 text-sm font-semibold text-success">
            Paid {formatRupees(Number(banner.amount_paid))}
            {banner.payment_reference ? (
              <span className="ml-1.5 font-normal opacity-80">
                · {banner.payment_reference}
              </span>
            ) : null}
          </p>
        )}

        {banner.review_note ? (
          <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
            {banner.review_note}
          </p>
        ) : null}

        {children ? (
          <div className="mt-auto border-t border-border pt-3">{children}</div>
        ) : null}
      </li>
    )
  }

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatTile
          label="Live now"
          value={totals.live}
          icon={Megaphone}
          tone="primary"
          hint="Showing on the home carousel"
        />
        <StatTile
          label="Collected"
          value={formatRupees(totals.collected)}
          icon={BadgeIndianRupee}
          tone="success"
        />
        <StatTile
          label="Outstanding"
          value={formatRupees(totals.outstanding)}
          icon={BadgeIndianRupee}
          tone={totals.outstanding > 0 ? "warning" : "default"}
        />
        <StatTile
          label="Impressions"
          value={totals.impressions.toLocaleString("en-IN")}
          icon={MousePointerClick}
          hint="Across every slot sold"
        />
      </StatGrid>

      <Tabs defaultValue={requests.length > 0 ? "requests" : "running"}>
        <TabsList>
          <TabsTrigger value="requests">
            Requests
            {requests.length > 0 ? (
              <span className="rounded-full bg-warning px-1.5 py-0.5 text-2xs font-bold text-warning-foreground">
                {requests.length}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="running">Running ({running.length})</TabsTrigger>
          <TabsTrigger value="finished">Finished ({finished.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          {requests.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="Nothing waiting"
              description="Every banner request has been reviewed."
              compact
            />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {requests.map((banner) => (
                <BannerCard key={banner.id} banner={banner}>
                  {rejecting === banner.id ? (
                    <div className="space-y-2">
                      <Textarea
                        rows={2}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Tell the owner what to change"
                        aria-label="Reason for rejection"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setRejecting(null)
                            setNote("")
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          loading={busyId === banner.id}
                          onClick={() => decide(banner, false)}
                        >
                          Send rejection
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-destructive/40 text-destructive hover:bg-destructive-soft"
                        onClick={() => setRejecting(banner.id)}
                        disabled={busyId === banner.id}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="success"
                        className="flex-1"
                        loading={busyId === banner.id}
                        onClick={() => decide(banner, true)}
                      >
                        Approve
                      </Button>
                    </div>
                  )}
                </BannerCard>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="running">
          {running.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No banners running"
              description="Approved slots inside their booked window appear here."
              compact
            />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {running.map((banner) => (
                <BannerCard key={banner.id} banner={banner}>
                  <div className="flex flex-wrap items-center gap-2">
                    {banner.status === "approved" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={busyId === banner.id}
                        onClick={() =>
                          save(banner.id, { status: "paused" }, "Banner paused")
                        }
                      >
                        Pause
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="success"
                        loading={busyId === banner.id}
                        onClick={() =>
                          save(
                            banner.id,
                            { status: "approved" },
                            "Banner resumed"
                          )
                        }
                      >
                        Resume
                      </Button>
                    )}

                    {/* Priority is the premium the platform can charge for:
                        a higher number sorts nearer the front of the rail. */}
                    <div className="ml-auto flex items-center gap-1">
                      <Button
                        size="icon-sm"
                        variant="outline"
                        aria-label="Lower priority"
                        disabled={busyId === banner.id}
                        onClick={() =>
                          save(
                            banner.id,
                            { priority: Math.max(0, banner.priority - 1) },
                            "Priority lowered"
                          )
                        }
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <span className="w-6 text-center text-sm font-bold tabular-nums text-foreground">
                        {banner.priority}
                      </span>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        aria-label="Raise priority"
                        disabled={busyId === banner.id}
                        onClick={() =>
                          save(
                            banner.id,
                            { priority: banner.priority + 1 },
                            "Priority raised"
                          )
                        }
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </BannerCard>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="finished">
          {finished.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="Nothing finished yet"
              description="Expired and rejected slots are kept here for the record."
              compact
            />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {finished.map((banner) => (
                <BannerCard key={banner.id} banner={banner} />
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
