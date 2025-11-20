import { Card } from "@/components/ui/card"
import { ShoppingBag, Heart, Ticket, Wallet } from "lucide-react"

const iconMap = {
  bag: ShoppingBag,
  heart: Heart,
  ticket: Ticket,
  wallet: Wallet,
}

type IconKey = keyof typeof iconMap

interface ProfileStatsProps {
  stats: Array<{
    label: string
    value: string | number
    subtext?: string
    icon: IconKey
  }>
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2">
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon]
        return (
          <Card
            key={stat.label}
            className="flex items-center justify-between rounded-2xl border border-orange-100 bg-white p-4 shadow-sm"
          >
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              {stat.subtext && (
                <p className="text-xs text-muted-foreground">{stat.subtext}</p>
              )}
            </div>
            <div className="rounded-2xl bg-orange-50 p-3 text-primary">
              <Icon className="h-6 w-6" />
            </div>
          </Card>
        )
      })}
    </div>
  )
}

