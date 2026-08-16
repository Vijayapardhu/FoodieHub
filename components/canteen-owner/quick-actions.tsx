import Link from "next/link"
import { Gift, Plus, QrCode, Utensils } from "@/components/ui/icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const actions = [
  { href: "/canteen/orders/scan", icon: QrCode, label: "Scan token" },
  { href: "/canteen/menu/new", icon: Plus, label: "Add dish" },
  { href: "/canteen/menu", icon: Utensils, label: "Manage menu" },
  { href: "/canteen/offers/new", icon: Gift, label: "New offer" },
]

export function QuickActions({ canteenId }: { canteenId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {actions.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-touch flex-col items-center justify-center gap-2 rounded-xl border border-border p-3 text-center transition-transform active:scale-95"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-semibold text-foreground">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
