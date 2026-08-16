import { Heart, Receipt, Ticket, Wallet } from "lucide-react"
import { StatGrid, StatTile } from "@/components/ui/stat-tile"

const iconMap = {
  bag: Receipt,
  heart: Heart,
  ticket: Ticket,
  wallet: Wallet,
} as const

const toneMap = {
  bag: "primary",
  heart: "destructive",
  ticket: "info",
  wallet: "success",
} as const

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
    <StatGrid>
      {stats.map((stat) => (
        <StatTile
          key={stat.label}
          label={stat.label}
          value={stat.value}
          hint={stat.subtext}
          icon={iconMap[stat.icon]}
          tone={toneMap[stat.icon]}
        />
      ))}
    </StatGrid>
  )
}
