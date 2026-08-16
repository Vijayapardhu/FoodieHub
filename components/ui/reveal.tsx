"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils/cn"

interface RevealProps {
  children: React.ReactNode
  /** Stagger within a group, in ms. */
  delay?: number
  variant?: "rise" | "blur"
  className?: string
  as?: "div" | "section" | "li" | "span"
}

/**
 * Reveals its children the first time they scroll into view.
 *
 * IntersectionObserver rather than a scroll listener so it costs nothing while
 * idle, and it unobserves after firing — these are one-shot entrances, not
 * something to replay every time the user scrolls back up.
 */
export function Reveal({
  children,
  delay = 0,
  variant = "rise",
  className,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Anyone who asked for reduced motion gets the end state immediately.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      // @ts-expect-error — one ref type across the allowed tags
      ref={ref}
      className={cn(
        shown
          ? variant === "blur"
            ? "animate-blur-in"
            : "animate-rise-in"
          : "opacity-0",
        className
      )}
      style={shown && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
