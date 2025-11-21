import { ImageIcon, UtensilsCrossed } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImagePlaceholderProps {
  type?: "item" | "canteen" | "category" | "avatar" | "generic"
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const typeConfig = {
  item: {
    icon: UtensilsCrossed,
    gradient: "from-primary/20 via-orange-100/50 to-primary/10",
    iconColor: "text-primary/60",
  },
  canteen: {
    icon: UtensilsCrossed,
    gradient: "from-orange-100/50 via-primary/20 to-orange-50",
    iconColor: "text-orange-500/60",
  },
  category: {
    icon: UtensilsCrossed,
    gradient: "from-primary/10 to-orange-100/30",
    iconColor: "text-primary/50",
  },
  avatar: {
    icon: ImageIcon,
    gradient: "from-gray-200 to-gray-100",
    iconColor: "text-gray-400",
  },
  generic: {
    icon: ImageIcon,
    gradient: "from-gray-100 to-gray-50",
    iconColor: "text-gray-400",
  },
}

const sizeConfig = {
  sm: {
    iconSize: "h-6 w-6",
    container: "p-2",
  },
  md: {
    iconSize: "h-8 w-8",
    container: "p-3",
  },
  lg: {
    iconSize: "h-12 w-12",
    container: "p-4",
  },
  xl: {
    iconSize: "h-16 w-16",
    container: "p-6",
  },
}

export function ImagePlaceholder({
  type = "generic",
  size = "md",
  className,
}: ImagePlaceholderProps) {
  const config = typeConfig[type]
  const sizeStyle = sizeConfig[size]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br",
        config.gradient,
        className
      )}
    >
      <div className={cn("flex items-center justify-center", sizeStyle.container)}>
        <Icon className={cn(sizeStyle.iconSize, config.iconColor)} />
      </div>
    </div>
  )
}

