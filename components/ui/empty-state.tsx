import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const content = (
    <Card className={cn("rounded-3xl border border-dashed border-slate-200 bg-white/90", className)}>
      <CardContent className="py-12 text-center space-y-4">
        {Icon && (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Icon className="h-6 w-6 text-slate-400" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && (
          <div className="flex justify-center">
            {action.href ? (
              <Link href={action.href}>
                <Button className="rounded-full bg-primary text-white hover:bg-primary/90">
                  {action.label}
                </Button>
              </Link>
            ) : (
              <Button
                onClick={action.onClick}
                className="rounded-full bg-primary text-white hover:bg-primary/90"
              >
                {action.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return content
}

