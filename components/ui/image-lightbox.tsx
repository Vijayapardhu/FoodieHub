"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "@/components/ui/icons"
import { cn } from "@/lib/utils/cn"

/**
 * Full-screen viewer for a set of photographs.
 *
 * Tapping a dish photo did nothing, which on a phone is a dead end: the
 * thumbnail is the only view of the food there is, and the one thing anybody
 * wants from it is to see it bigger. Everything here is what a viewer is
 * expected to do — swipe, arrow keys, Escape, a counter — because a viewer
 * that only closes by a button is the kind people get stuck in.
 */
export function ImageLightbox({
  images,
  index,
  onIndexChange,
  onClose,
  alt = "",
}: {
  images: string[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
  alt?: string
}) {
  const count = images.length
  const touchStartX = useRef<number | null>(null)
  const [loaded, setLoaded] = useState(false)

  const go = useCallback(
    (delta: number) => {
      if (count < 2) return
      // Wrapping means the last photo is one swipe from the first, rather than
      // a dead end that reads as the viewer having frozen.
      onIndexChange((index + delta + count) % count)
    },
    [count, index, onIndexChange]
  )

  useEffect(() => setLoaded(false), [index])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
      if (event.key === "ArrowLeft") go(-1)
      if (event.key === "ArrowRight") go(1)
    }
    window.addEventListener("keydown", onKey)

    // Stop the page behind from scrolling under the overlay.
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = previous
    }
  }, [go, onClose])

  if (count === 0) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className="fixed inset-0 z-[60] flex flex-col bg-black/95 backdrop-blur-sm"
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current
        touchStartX.current = null
        if (start === null) return
        const delta = (e.changedTouches[0]?.clientX ?? start) - start
        // 48px, so a slightly untidy tap is still a tap.
        if (Math.abs(delta) > 48) go(delta < 0 ? 1 : -1)
      }}
    >
      <div className="flex items-center justify-between p-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold tabular-nums text-white">
          {count > 1 ? `${index + 1} / ${count}` : "Photo"}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close photo viewer"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-transform active:scale-90"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tapping the backdrop closes; tapping the photo itself must not. */}
      <div className="relative flex-1" onClick={onClose}>
        <Image
          key={images[index]}
          src={images[index]}
          alt={alt}
          fill
          sizes="100vw"
          priority
          onLoad={() => setLoaded(true)}
          onClick={(event) => event.stopPropagation()}
          className={cn(
            "object-contain p-2 transition-opacity duration-200",
            loaded ? "opacity-100" : "opacity-0"
          )}
        />
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition-transform active:scale-90"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition-transform active:scale-90"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="flex justify-center gap-1.5 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => onIndexChange(i)}
                aria-label={`Photo ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/40"
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
