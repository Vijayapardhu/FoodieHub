import { cn } from "@/lib/utils/cn"

interface ImagePlaceholderProps {
  type?: "item" | "canteen" | "category" | "avatar" | "generic"
  size?: "sm" | "md" | "lg" | "xl"
  /** Used to derive the letter and tint. Falls back to a plain wash. */
  label?: string | null
  className?: string
}

const sizeText = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-6xl",
} as const

/**
 * Stand-in for a missing photo.
 *
 * Deliberately typographic rather than an icon: a grid of identical little
 * fork-and-knife glyphs reads as "broken image" and makes a menu look empty.
 * A large initial on a tinted wash reads as a deliberate style instead, and
 * varying the hue by name stops a list collapsing into one flat colour.
 */
export function ImagePlaceholder({
  size = "md",
  label,
  className,
}: ImagePlaceholderProps) {
  const initial = label?.trim()?.[0]?.toUpperCase() ?? ""

  // Cheap deterministic hash so the same dish always gets the same tint.
  const hue = label
    ? Array.from(label).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 360, 7)
    : 343

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden",
        className
      )}
      style={{
        backgroundImage: `linear-gradient(140deg,
          hsl(${hue} 70% 92%) 0%,
          hsl(${(hue + 28) % 360} 80% 86%) 100%)`,
      }}
    >
      {/* Soft vignette keeps the letter from floating on flat colour */}
      <span
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(120% 90% at 30% 0%, rgba(255,255,255,0.55), transparent 60%)",
        }}
      />

      {initial ? (
        <span
          className={cn(
            "relative font-display font-extrabold leading-none tracking-tight",
            sizeText[size]
          )}
          style={{ color: `hsl(${hue} 60% 32% / 0.32)` }}
        >
          {initial}
        </span>
      ) : null}
    </div>
  )
}
