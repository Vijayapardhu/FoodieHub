"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { readPalette, type LottiePalette } from "@/lib/lottie/palette"
import { buildAnimation, type AnimationName } from "@/lib/lottie/animations"
import { cn } from "@/lib/utils/cn"

/**
 * The player is a large thing to spend on a screen whose whole job is to say
 * "there's nothing here". Loading it dynamically means only a session that
 * actually lands on an empty screen ever pays for it, and the box is sized up
 * front so nothing jumps when it arrives.
 *
 * LottieLight rather than the full build: these animations are shapes and
 * transforms with no expressions, which is exactly what the smaller engine
 * covers.
 */
const Lottie = dynamic(
  () => import("lottie-react").then((m) => m.LottieLight),
  { ssr: false, loading: () => null }
)

const SIZES = {
  sm: "h-24 w-24",
  md: "h-32 w-32",
  lg: "h-40 w-40",
} as const

export function LottieArt({
  name,
  size = "md",
  className,
}: {
  name: AnimationName
  size?: keyof typeof SIZES
  className?: string
}) {
  const [palette, setPalette] = useState<LottiePalette | null>(null)

  // Read on mount rather than at module scope: the CSS variables only exist
  // once the document has a stylesheet, and they change under us when the
  // theme is toggled.
  useEffect(() => {
    setPalette(readPalette())

    const observer = new MutationObserver(() => setPalette(readPalette()))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    })
    return () => observer.disconnect()
  }, [])

  const data = useMemo(
    () => (palette ? buildAnimation(name, palette) : null),
    [name, palette]
  )

  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(query.matches)
    const onChange = () => setReduced(query.matches)
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [])

  return (
    <div className={cn("shrink-0", SIZES[size], className)} aria-hidden="true">
      {data ? (
        <Lottie
          src={data as object}
          // Somebody who has asked the system for less motion gets the first
          // frame: the drawing still does its job, it just holds still.
          loop={!reduced}
          autoplay={!reduced}
          className="h-full w-full"
        />
      ) : null}
    </div>
  )
}
