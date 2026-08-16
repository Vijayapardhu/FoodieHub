"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "@/components/ui/icons"
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
 * The artwork is the whole advert. Nothing is drawn over it and nothing is
 * set beside it, which is how banner inventory works nearly everywhere: the
 * advertiser supplies a finished image with their own wording already in it,
 * and the platform's job is to show it undisturbed at a predictable size.
 *
 * That does mean the headline and subtext no longer appear on screen. They
 * are still carried as the image's alt text and the link's label, so the
 * banner reads properly to a screen reader and is not simply an unlabelled
 * picture — and a banner booked without artwork still has to render as
 * something, so that one case falls back to its headline on a brand panel.
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
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-2xl"
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
              className="group relative aspect-[2/1] w-full shrink-0 snap-center overflow-hidden rounded-2xl bg-muted sm:aspect-[3/1]"
            >
              {slide.imageUrl ? (
                <Image
                  src={slide.imageUrl}
                  // The headline is the description of the artwork, which is
                  // the only place it is still spoken.
                  alt={slide.headline}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 1024px) 100vw, 960px"
                  className="object-cover transition-transform duration-500 md:group-hover:scale-[1.03]"
                />
              ) : (
                // No artwork was uploaded. A blank tile would be worse than a
                // plain one, and the advertiser has paid for the slot either way.
                <span className="flex h-full w-full items-center justify-center bg-brand-gradient p-6">
                  <span className="line-clamp-3 text-center text-lg font-extrabold leading-tight tracking-tight text-white sm:text-2xl">
                    {slide.headline}
                  </span>
                </span>
              )}
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
              className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft backdrop-blur-sm transition-opacity hover:bg-background md:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo((active + 1) % slides.length)}
              aria-label="Next promotion"
              className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft backdrop-blur-sm transition-opacity hover:bg-background md:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      {/* Below the card, not over it: the dots used to sit on top of the
          artwork, which is now where the call to action is. */}
      {multiple ? (
        <div className="mt-2.5 flex justify-center gap-1.5">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Go to promotion ${index + 1}`}
              aria-current={index === active ? "true" : undefined}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === active ? "w-5 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
