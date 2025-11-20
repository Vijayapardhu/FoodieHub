import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Database } from "@/types/database.types"
import { User } from "@supabase/supabase-js"

type Profile = Database["public"]["Tables"]["users"]["Row"]

interface ProfileCardProps {
  user: User
  profile: Profile
}

export function ProfileCard({ user, profile }: ProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <div className="relative h-20 w-20 overflow-hidden rounded-full">
              <Image
                src={profile.avatar_url}
                alt={profile.full_name || "Profile"}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
              {profile.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold">
              {profile.full_name || "User"}
            </h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-sm capitalize text-muted-foreground">
              {profile.role.replace("_", " ")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

