import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  CreditCard,
  Headphones,
  Gift,
  MessageSquare,
  Settings,
} from "lucide-react"

const actions = [
  {
    title: "Manage addresses",
    subtitle: "Saved hostels & classrooms",
    icon: MapPin,
    href: "/profile/settings",
    status: "available" as const,
  },
  {
    title: "Payment methods",
    subtitle: "UPI & campus wallets",
    icon: CreditCard,
    status: "upcoming" as const,
  },
  {
    title: "Help & support",
    subtitle: "Chat with canteen support",
    icon: Headphones,
    status: "upcoming" as const,
  },
  {
    title: "Offers & rewards",
    subtitle: "Seasonal combos & perks",
    icon: Gift,
    status: "upcoming" as const,
  },
  {
    title: "Feedback & reviews",
    subtitle: "Rate your last order",
    icon: MessageSquare,
    href: "/orders",
    status: "available" as const,
  },
  {
    title: "Account settings",
    subtitle: "Profile, privacy & more",
    icon: Settings,
    href: "/profile/settings",
    status: "available" as const,
  },
]

export function ProfileActions() {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Quick actions</h2>
        <Link href="/profile/settings">
          <Button variant="ghost" size="sm" className="text-primary">
            View all
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon
          const card = (
            <Card
              key={action.title}
              className={`group flex items-center gap-4 rounded-2xl border border-orange-100 bg-white/80 p-4 shadow-sm transition ${
                action.status === "available"
                  ? "hover:shadow-lg"
                  : "opacity-70"
              }`}
            >
              <div className="rounded-2xl bg-orange-50 p-3 text-primary transition group-hover:bg-primary group-hover:text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{action.title}</p>
                <p className="text-sm text-muted-foreground">
                  {action.subtitle}
                </p>
              </div>
              {action.status === "upcoming" && (
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-primary">
                  Coming soon
                </span>
              )}
            </Card>
          )

          if (action.status === "available" && action.href) {
            return (
              <Link href={action.href} key={action.title}>
                {card}
              </Link>
            )
          }

          return (
            <div key={action.title} aria-disabled className="cursor-not-allowed">
              {card}
            </div>
          )
        })}
      </div>
    </div>
  )
}

