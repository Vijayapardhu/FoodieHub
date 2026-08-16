import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: { label: string; href: string }
  className?: string
  children?: React.ReactNode
}

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
  children,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="section-title">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {children}

      {action ? (
        <Link
          href={action.href}
          className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-primary"
        >
          {action.label}
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  )
}

/** Vertical rhythm wrapper so every home/menu section spaces identically. */
export function Section({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <section className={cn("space-y-3", className)}>{children}</section>
}
