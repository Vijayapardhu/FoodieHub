import Link from "next/link"
import { User } from "@supabase/supabase-js"
import { Phone, Settings } from "@/components/ui/icons"
import { Database } from "@/types/database.types"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

type Profile = Database["public"]["Tables"]["users"]["Row"]

const roleLabel: Record<string, string> = {
  user: "Student",
  canteen_owner: "Canteen owner",
  admin: "Administrator",
}

export function ProfileHero({
  profile,
  user,
}: {
  profile: Profile
  user: User
}) {
  const name = profile.full_name ?? user.email?.split("@")[0] ?? "Foodie"

  return (
    <section className="relative overflow-hidden rounded-2xl bg-brand-gradient p-5 text-primary-foreground shadow-brand">
      <div className="flex items-center gap-4">
        <Avatar
          src={profile.avatar_url}
          name={name}
          size="xl"
          className="bg-white/20 text-primary-foreground ring-2 ring-white/40"
        />

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold tracking-tight">
            {name}
          </h1>
          <p className="truncate text-sm text-primary-foreground/80">
            {user.email}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              size="sm"
              className="border-white/40 text-primary-foreground"
            >
              {roleLabel[profile.role] ?? profile.role}
            </Badge>
            {profile.phone_number ? (
              <span className="inline-flex items-center gap-1 text-xs text-primary-foreground/80">
                <Phone className="h-3 w-3" />
                {profile.phone_number}
              </span>
            ) : (
              <Link
                href="/profile/settings"
                className="text-xs font-semibold text-primary-foreground underline underline-offset-2"
              >
                Add a phone number
              </Link>
            )}
          </div>
        </div>

        <Link
          href="/profile/settings"
          aria-label="Edit profile"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 transition-transform active:scale-90"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
