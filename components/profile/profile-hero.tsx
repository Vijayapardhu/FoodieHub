import Image from "next/image"
import Link from "next/link"
import { Database } from "@/types/database.types"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Edit3, Share2, Phone } from "lucide-react"

type Profile = Database["public"]["Tables"]["users"]["Row"]

interface ProfileHeroProps {
  profile: Profile
  user: User
  activeOrders: number
  totalSpend: number
}

export function ProfileHero({
  profile,
  user,
  activeOrders,
  totalSpend,
}: ProfileHeroProps) {
  const initials =
    profile.full_name?.[0]?.toUpperCase() ||
    user.email?.[0]?.toUpperCase() ||
    "U"

  return (
    <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-[#FF8A3C] to-[#FFB347] p-6 text-white shadow-lg">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-2 border-white/40">
              <Image
                src={profile.avatar_url}
                alt={profile.full_name || "Profile"}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-3xl font-bold">
              {initials}
            </div>
          )}
          <div>
            <p className="text-sm uppercase tracking-wide text-white/70">
              Foodie Member
            </p>
            <h1 className="text-3xl font-bold">
              {profile.full_name ?? "Not provided"}
            </h1>
            <p className="text-sm text-white/80">
              {user.email ?? "Email not set"}
            </p>
            <p className="text-xs text-white/70">
              {profile.role ? profile.role.replace("_", " ") : "Role not set"}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-white/80">
              <Phone className="h-3 w-3" />
              {profile.phone_number || "Add your phone for quicker support"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/profile/settings">
            <Button
              variant="secondary"
              className="gap-2 rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <Edit3 className="h-4 w-4" />
              Edit profile
            </Button>
          </Link>
          <Button
            variant="secondary"
            className="gap-2 rounded-full bg-white text-primary hover:bg-orange-50"
          >
            <Share2 className="h-4 w-4" />
            Share profile
          </Button>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
          <p className="text-sm text-white/80">Active orders</p>
          <p className="text-3xl font-semibold">{activeOrders}</p>
          <p className="text-xs text-white/70">
            Track token status in real time
          </p>
        </div>
        <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
          <p className="text-sm text-white/80">Total spend</p>
          <p className="text-3xl font-semibold">
            ₹{Number(totalSpend).toFixed(0)}
          </p>
          <p className="text-xs text-white/70">
            Keep earning reward points on every order
          </p>
        </div>
      </div>
    </div>
  )
}

