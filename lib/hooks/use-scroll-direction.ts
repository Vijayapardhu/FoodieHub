"use client"

import { useEffect, useState } from "react"

/**
 * Which way the page is being scrolled, and whether it is still near the top.
 *
 * Used to decide what a sticky header keeps on screen. Scrolling down is
 * somebody reading, and screen space is worth more to them than the filters;
 * scrolling up is somebody looking for something, which is exactly when the
 * filters are worth the space back.
 *
 * Reads are throttled to one per animation frame — a scroll handler that sets
 * state on every event will fire dozens of renders a second on a phone.
 */
export function useScrollDirection({
  /** Ignore jitter below this many pixels, so a resting finger doesn't flap. */
  threshold = 10,
  /** Below this scroll position everything counts as "at the top". */
  topOffset = 120,
}: { threshold?: number; topOffset?: number } = {}) {
  const [direction, setDirection] = useState<"up" | "down">("up")
  const [atTop, setAtTop] = useState(true)

  useEffect(() => {
    let last = window.scrollY
    let queued = false

    const update = () => {
      queued = false
      // iOS rubber-banding reports negative offsets past the top, which would
      // otherwise register as a scroll up the moment the page settles.
      const y = Math.max(0, window.scrollY)

      setAtTop(y < topOffset)

      if (Math.abs(y - last) < threshold) return
      setDirection(y > last ? "down" : "up")
      last = y
    }

    const onScroll = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(update)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    update()
    return () => window.removeEventListener("scroll", onScroll)
  }, [threshold, topOffset])

  return { direction, atTop }
}
