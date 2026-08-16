import { cn } from "@/lib/utils/cn"

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-muted",
        // A travelling highlight reads as "loading" more clearly than a pulse,
        // and stays legible in dark mode where opacity changes wash out.
        "after:absolute after:inset-0 after:bg-shimmer after:animate-shimmer after:content-['']",
        className
      )}
      {...props}
    />
  )
}
