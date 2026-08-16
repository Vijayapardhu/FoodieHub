"use client"

import Link from "next/link"
import {
  BookmarkCheck,
  ChevronRight,
  HelpCircle,
  LayoutDashboard,
  LucideIcon,
  MessageSquare,
  Shield,
  Store,
  UserCog,
} from "lucide-react"
import { Database } from "@/types/database.types"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { PushOptIn } from "@/components/notifications/push-opt-in"
import { LogoutButton } from "@/components/profile/logout-button"

type Role = Database["public"]["Enums"]["user_role"]

interface Row {
  href: string
  label: string
  description?: string
  icon: LucideIcon
}

const baseRows: Row[] = [
  {
    href: "/profile/usuals",
    label: "Saved orders",
    description: "Your usuals, ready to reorder in one tap",
    icon: BookmarkCheck,
  },
  {
    href: "/profile/settings",
    label: "Account settings",
    description: "Name, phone, dietary preferences",
    icon: UserCog,
  },
  {
    href: "/profile/feedback",
    label: "Your reviews",
    description: "Edit or remove feedback you've left",
    icon: MessageSquare,
  },
]

const roleRows: Partial<Record<Role, Row>> = {
  canteen_owner: {
    href: "/canteen",
    label: "Canteen dashboard",
    description: "Manage orders, menu and offers",
    icon: Store,
  },
  admin: {
    href: "/admin",
    label: "Admin console",
    description: "Platform-wide management",
    icon: Shield,
  },
}

/** Settings list at the bottom of the profile screen. */
export function ProfileActions({ role }: { role: Role }) {
  const rows = [...baseRows]
  const roleRow = roleRows[role]
  if (roleRow) rows.unshift(roleRow)

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {rows.map(({ href, label, description, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex min-h-touch items-center gap-3 p-3.5 transition-colors active:bg-muted"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  {label}
                </span>
                {description ? (
                  <span className="block truncate text-xs text-muted-foreground">
                    {description}
                  </span>
                ) : null}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">Appearance</p>
        <ThemeToggle />
      </div>

      <PushOptIn />

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Orders are paid at the counter. Show your token to collect — no online
          payment is taken by FoodieHub.
        </p>
      </div>

      <LogoutButton
        variant="outline"
        block
        className="border-destructive/40 text-destructive hover:bg-destructive-soft"
      />
    </div>
  )
}

/** Kept as a named alias for the icon-only dashboard link. */
export { LayoutDashboard as DashboardIcon }
