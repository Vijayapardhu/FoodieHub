import Link from "next/link"
import { IconComponent } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { LottieArt } from "@/components/ui/lottie-art"
import type { AnimationName } from "@/lib/lottie/animations"
import { cn } from "@/lib/utils/cn"

interface EmptyStateProps {
  icon?: IconComponent
  /**
   * An animated drawing instead of the icon tile. Worth it on the screens a
   * customer actually lands on and finds empty — an empty cart or order list
   * is a dead end, and a drawing that moves makes it read as a place that
   * hasn't filled up yet rather than a page that failed to load.
   */
  art?: AnimationName
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  secondaryAction?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
  compact?: boolean
}

export function EmptyState({
  icon: Icon,
  art,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted text-center",
        // A full-page empty state is the only thing on the screen, so it sits
        // in the middle of it rather than pinned under the app bar with a
        // screen of nothing beneath. `compact` ones are inline inside a
        // section and must stay the size of their content.
        compact ? "gap-3 px-5 py-8" : "min-h-[55vh] gap-4 px-6 py-12",
        className
      )}
    >
      {art ? (
        <LottieArt name={art} size={compact ? "sm" : "md"} className="-mb-2" />
      ) : Icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground text-balance">
            {description}
          </p>
        ) : null}
      </div>

      {action || secondaryAction ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          {action ? (
            action.href ? (
              <Button asChild>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : (
              <Button onClick={action.onClick}>{action.label}</Button>
            )
          ) : null}
          {secondaryAction ? (
            secondaryAction.href ? (
              <Button asChild variant="outline">
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            ) : (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
