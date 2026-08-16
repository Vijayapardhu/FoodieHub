"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils/cn"
import { canteenPath } from "@/lib/utils/public-id"
import type { PromoSlide } from "@/lib/utils/promo-banners"

interface PromoCarouselProps {
  slides: PromoSlide[]
}

/** How long a slide sits before the carousel moves on by itself. */
const AUTOPLAY_MS = 6000

/**
 * A slide has to hold still for this long before it counts as seen. Swiping
 * through four banners to reach the fifth should not bill four impressions.
 */
const IMPRESSION_DWELL_MS = 900

/**
 * Paid banner slots on the home screen.
 *
 * Native scroll-snap rather than a transform-based slider: it gets momentum,
 * rubber-banding and accessible focus scrolling from the platform for free,
 * and it degrades to a plain horizontal scroller if JavaScript is slow to
 * arrive. Auto-advance is a nicety layered on top, and it yields the moment
 * the reader touches the strip.
 */
export function PromoCarousel({ slides }: PromoCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const seen = useRef<Set<string>>(new Set())

  const multiple = slides.length > 1

  const track = useCallback(async (bannerId: string, event: "impression" | "click") => {
    try {
      await createClient().rpc("track_promo_banner", {
        banner_id: bannerId,
        event,
      })
    } catch {
      // Advertising metrics are not worth interrupting a meal for.
    }
  }, [])

  // Which slide is in view, read back from the scroller rather than tracked in
  // state, so a manual swipe and a programmatic scroll stay in agreement.
  const handleScroll = useCallback(() => {
    const node = trackRef.current
    if (!node) return
    const index = Math.round(node.scrollLeft / node.clientWidth)
    setActive((current) => (current === index ? current : index))
  }, [])

  const goTo = useCallback((index: number) => {
    const node = trackRef.current
    if (!node) return
    node.scrollTo({ left: index * node.clientWidth, behavior: "smooth" })
  }, [])

  // Auto-advance. Held back while the reader is interacting, while the tab is
  // hidden, and entirely for anyone who asked for reduced motion.
  useEffect(() => {
    if (!multiple || paused) return
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return
    }

    const timer = window.setInterval(() => {
      if (document.hidden) return
      goTo((active + 1) % slides.length)
    }, AUTOPLAY_MS)

    return () => window.clearInterval(timer)
  }, [active, goTo, multiple, paused, slides.length])

  // Bill an impression once the slide has actually been dwelled on.
  useEffect(() => {
    const slide = slides[active]
    if (!slide || seen.current.has(slide.id)) return

    const timer = window.setTimeout(() => {
      seen.current.add(slide.id)
      void track(slide.id, "impression")
    }, IMPRESSION_DWELL_MS)

    return () => window.clearTimeout(timer)
  }, [active, slides, track])

  if (slides.length === 0) return null

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Promotions"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-2xl scrollbar-hide"
      >
        {slides.map((slide, index) => (
          <Link
            key={slide.id}
            href={canteenPath({ id: slide.canteenId, slug: slide.canteenSlug })}
            onClick={() => track(slide.id, "click")}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${slides.length}: ${slide.headline}`}
            aria-hidden={index !== active ? true : undefined}
            tabIndex={index !== active ? -1 : undefined}
            className="group relative aspect-[2/1] w-full shrink-0 snap-center overflow-hidden rounded-2xl bg-brand-gradient sm:aspect-[3/1]"
          >
            {slide.imageUrl ? (
              <Image
                src={slide.imageUrl}
                alt=""
                fill
                priority={index === 0}
                sizes="(max-width: 1024px) 100vw, 960px"
                className="object-cover transition-transform duration-500 md:group-hover:scale-[1.03]"
              />
            ) : null}

            {/* Readability floor for whatever artwork the canteen uploaded. */}
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent"
            />

            <span className="absolute inset-0 flex flex-col justify-end gap-1.5 p-4 sm:p-6">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                  Promoted
                </span>
                {slide.offerLabel ? (
                  <span className="rounded-full bg-warning px-2 py-0.5 text-2xs font-bold text-warning-foreground">
                    {slide.offerLabel}
                  </span>
                ) : null}
                {!slide.canteenOpen ? (
                  <span className="rounded-full bg-black/50 px-2 py-0.5 text-2xs font-bold text-white/90 backdrop-blur-sm">
                    Closed now
                  </span>
                ) : null}
              </span>

              <span className="line-clamp-2 max-w-[85%] text-lg font-extrabold leading-tight tracking-tight text-white sm:text-2xl">
                {slide.headline}
              </span>

              {slide.subtext ? (
                <span className="line-clamp-1 max-w-[80%] text-xs text-white/80 sm:text-sm">
                  {slide.subtext}
                </span>
              ) : null}

              <span className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-bold text-neutral-900 sm:text-sm">
                  {slide.ctaLabel}
                </span>
                <span className="truncate text-xs font-medium text-white/75">
                  {slide.canteenName}
                </span>
              </span>
            </span>
          </Link>
        ))}
      </div>

      {multiple ? (
        <>
          {/* Pointer-only affordances; touch users swipe. */}
          <button
            type="button"
            onClick={() => goTo((active - 1 + slides.length) % slides.length)}
            aria-label="Previous promotion"
            className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground shadow-soft backdrop-blur-sm transition-opacity hover:bg-background md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => goTo((active + 1) % slides.length)}
            aria-label="Next promotion"
            className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground shadow-soft backdrop-blur-sm transition-opacity hover:bg-background md:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Go to promotion ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === active
                    ? "w-5 bg-white"
                    : "w-1.5 bg-white/50 hover:bg-white/75"
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}
