"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { canteenPath } from "@/lib/utils/public-id"
import { cn } from "@/lib/utils/cn"
import type { PromoSlide } from "@/lib/utils/promo-banners"

/**
 * The compact advertising format: one row, one message, clearly marked.
 *
 * Used for every slot except the home carousel. It deliberately looks like a
 * card and not like a menu item — advertising that disguises itself as
 * content is what makes a food app feel untrustworthy, and a student who
 * taps something they thought was a dish does not come back to the slot.
 *
 * When several banners are sold for the same slot, one is picked per page
 * load rather than rotating in place: a strip this small animating under
 * somebody's thumb is a mis-tap waiting to happen.
 */
export function PromoStrip({
  slides,
  className,
}: {
  slides: PromoSlide[]
  className?: string
}) {
  const slide = useMemo(() => {
    if (slides.length <= 1) return slides[0]
    return slides[Math.floor(Math.random() * slides.length)]
  }, [slides])

  const [seen, setSeen] = useState(false)

  useEffect(() => {
    if (!slide || seen) return
    const timer = window.setTimeout(() => {
      setSeen(true)
      createClient()
        .rpc("track_promo_banner", { banner_id: slide.id, event: "impression" })
        .then(
          () => {},
          () => {}
        )
    }, 900)
    return () => window.clearTimeout(timer)
  }, [slide, seen])

  if (!slide) return null

  const trackClick = () => {
    createClient()
      .rpc("track_promo_banner", { banner_id: slide.id, event: "click" })
      .then(
        () => {},
        () => {}
      )
  }

  return (
    <Link
      href={canteenPath({ id: slide.canteenId, slug: slide.canteenSlug })}
      onClick={trackClick}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-transform active:scale-[0.99]",
        className
      )}
    >
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-gradient">
        {slide.imageUrl ? (
          <Image
            src={slide.imageUrl}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : null}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="rounded bg-muted px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-muted-foreground">
            Ad
          </span>
          {slide.offerLabel ? (
            <span className="rounded bg-warning-soft px-1.5 py-0.5 text-2xs font-bold text-warning">
              {slide.offerLabel}
            </span>
          ) : null}
        </span>
        <span className="mt-1 line-clamp-1 block text-sm font-semibold text-foreground">
          {slide.headline}
        </span>
        <span className="line-clamp-1 block text-xs text-muted-foreground">
          {slide.subtext || slide.canteenName}
        </span>
      </span>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}
