"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Megaphone } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
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

interface PromoBannersListProps {
  banners: PromoBannerWithCanteen[]
}

const STATUS_VARIANT = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  paused: "muted",
} as const

export function PromoBannersList({ banners: initial }: PromoBannersListProps) {
  const router = useRouter()
  const [banners, setBanners] = useState(initial)
  const [busyId, setBusyId] = useState<string | null>(null)

  const setStatus = async (
    banner: PromoBannerWithCanteen,
    status: "approved" | "paused"
  ) => {
    setBusyId(banner.id)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("promo_banners")
        .update({ status })
        .eq("id", banner.id)
      if (error) throw error

      setBanners((list) =>
        list.map((entry) =>
          entry.id === banner.id ? { ...entry, status } : entry
        )
      )
      toast.success(status === "paused" ? "Banner paused" : "Banner resumed")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not update that banner")
    } finally {
      setBusyId(null)
    }
  }

  const withdraw = async (banner: PromoBannerWithCanteen) => {
    setBusyId(banner.id)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("promo_banners")
        .delete()
        .eq("id", banner.id)
      if (error) throw error

      setBanners((list) => list.filter((entry) => entry.id !== banner.id))
      toast.success("Request withdrawn")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not withdraw that request")
    } finally {
      setBusyId(null)
    }
  }

  if (banners.length === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title="No banner slots yet"
        description="A banner puts your canteen at the top of every student's home screen."
        action={{ label: "Promote my canteen", href: "/canteen/promotions/new" }}
      />
    )
  }

  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {banners.map((banner) => {
        const live = isLive(banner)
        const expired = hasExpired(banner)
        const ctr = clickThroughRate(banner)
        const owed = Number(banner.amount_due) - Number(banner.amount_paid)

        return (
          <li
            key={banner.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
          >
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
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {format(new Date(banner.starts_at), "d MMM")} –{" "}
                  {format(new Date(banner.ends_at), "d MMM yyyy")} ·{" "}
                  {slotDays(banner.starts_at, banner.ends_at)} days
                </p>

                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge variant={STATUS_VARIANT[banner.status]} size="sm">
                    {live ? "Live now" : PROMO_STATUS_LABELS[banner.status]}
                  </Badge>
                  <Badge variant="outline" size="sm">
                    {placementMeta(banner.placement).label}
                  </Badge>
                  {expired && banner.status === "approved" ? (
                    <Badge variant="muted" size="sm">
                      Finished
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

            {banner.status === "rejected" && banner.review_note ? (
              <p className="rounded-xl bg-destructive-soft p-3 text-sm text-destructive">
                {banner.review_note}
              </p>
            ) : null}

            <dl className="grid grid-cols-3 gap-2 rounded-xl bg-surface-muted p-3 text-center">
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
            </dl>

            <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">
                {formatRupees(Number(banner.amount_due))}
                {owed > 0 ? (
                  <span className="ml-1.5 font-semibold text-warning">
                    {formatRupees(owed)} due
                  </span>
                ) : (
                  <span className="ml-1.5 font-semibold text-success">Paid</span>
                )}
              </p>

              <div className="flex gap-2">
                {banner.status === "approved" && !expired ? (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={busyId === banner.id}
                    onClick={() => setStatus(banner, "paused")}
                  >
                    Pause
                  </Button>
                ) : null}
                {banner.status === "paused" && !expired ? (
                  <Button
                    size="sm"
                    loading={busyId === banner.id}
                    onClick={() => setStatus(banner, "approved")}
                  >
                    Resume
                  </Button>
                ) : null}
                {banner.status === "pending" || banner.status === "rejected" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive-soft"
                    loading={busyId === banner.id}
                    onClick={() => withdraw(banner)}
                  >
                    Withdraw
                  </Button>
                ) : null}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
