"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ImageUpload } from "@/components/ui/image-upload"
import { Database } from "@/types/database.types"
import { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

type Profile = Database["public"]["Tables"]["users"]["Row"]

interface ProfileSettingsProps {
  user: User
  profile: Profile
}

export function ProfileSettings({ user, profile }: ProfileSettingsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState(profile.full_name || "")
  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number || "")
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "")
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
  const [uploadResetKey, setUploadResetKey] = useState(0)

  const sanitizedPhoneNumber = useMemo(
    () => phoneNumber.replace(/[^\d+]/g, ""),
    [phoneNumber]
  )

  const uploadPendingAvatar = async () => {
    if (!pendingAvatarFile) {
      return avatarUrl || null
    }

    const fileExt = pendingAvatarFile.name.split(".").pop()
    const filePath = `profiles/${user.id}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, pendingAvatarFile, {
        cacheControl: "3600",
        upsert: true,
      })

    if (uploadError) {
      throw uploadError
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath)

    setAvatarUrl(publicUrl)
    setPendingAvatarFile(null)
    setUploadResetKey((key) => key + 1)
    return publicUrl
  }

  const handleSave = async () => {
    try {
      setLoading(true)

      let nextAvatarUrl = avatarUrl || null
      if (pendingAvatarFile) {
        nextAvatarUrl = await uploadPendingAvatar()
      }

      const { error } = await supabase.from("users").upsert(
        {
          id: user.id,
          email: user.email ?? "",
          role: profile.role ?? "student",
          full_name: fullName || null,
          phone_number: sanitizedPhoneNumber || null,
          avatar_url: nextAvatarUrl,
        },
        { onConflict: "id" }
      )

      if (error) throw error

      toast.success("Profile updated successfully")
      setPendingAvatarFile(null)
      setUploadResetKey((key) => key + 1)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div>
            <label className="mb-2 block text-sm font-medium">Profile Picture</label>
            <ImageUpload
              key={uploadResetKey}
              currentImageUrl={avatarUrl}
              onUploadComplete={(url) => {
                setAvatarUrl(url)
                if (!url) {
                  setPendingAvatarFile(null)
                }
              }}
              bucket="avatars"
              aspectRatio="logo"
              mode="manual"
              onManualFileChange={setPendingAvatarFile}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              We only upload the new photo when you tap “Save changes”.
            </p>
          </div>

          {/* Full Name */}
          <div>
            <label className="mb-2 block text-sm font-medium">Full Name</label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="mb-2 block text-sm font-medium">Phone number</label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 98765 43210"
              inputMode="tel"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Shared only with canteens to reach you about active orders.
            </p>
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <Input value={user.email || ""} disabled />
            <p className="mt-1 text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          {/* Role (Read-only) */}
          <div>
            <label className="mb-2 block text-sm font-medium">Role</label>
            <Input
              value={profile.role.replace("_", " ").toUpperCase()}
              disabled
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-primary"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Order Updates", description: "Realtime push & SMS alerts" },
            { label: "Promotions", description: "Personalised combos & rewards" },
            { label: "Reviews & Feedback", description: "Reminders to rate dishes" },
          ].map((pref) => (
            <div
              key={pref.label}
              className="flex items-center justify-between rounded-2xl border border-dashed border-orange-100 bg-orange-50/40 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{pref.label}</p>
                <p className="text-xs text-muted-foreground">{pref.description}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-500">
                Coming soon
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

