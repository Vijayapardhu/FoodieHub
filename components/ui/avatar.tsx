import Image from "next/image"
import { cn } from "@/lib/utils/cn"

const sizes = {
  xs: "h-7 w-7 text-2xs",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
} as const

function initialsOf(name?: string | null, fallback = "?") {
  if (!name?.trim()) return fallback
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ""
  return (first + last).toUpperCase() || fallback
}

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: keyof typeof sizes
  className?: string
  ring?: boolean
}

export function Avatar({
  src,
  name,
  size = "md",
  className,
  ring = false,
}: AvatarProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft font-bold text-accent-foreground",
        sizes[size],
        ring && "ring-2 ring-surface",
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name ?? "Profile photo"}
          fill
          sizes="80px"
          className="object-cover"
        />
      ) : (
        <span aria-hidden="true">{initialsOf(name)}</span>
      )}
      {src ? null : <span className="sr-only">{name ?? "Profile"}</span>}
    </span>
  )
}
