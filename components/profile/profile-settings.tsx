"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { User } from "@supabase/supabase-js"
import { Save } from "lucide-react"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Chip } from "@/components/ui/chip"
import { ImageUpload } from "@/components/ui/image-upload"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { PushOptIn } from "@/components/notifications/push-opt-in"
import { StickyBar } from "@/components/ui/sticky-bar"
import { Skeleton } from "@/components/ui/skeleton"

type Profile = Database["public"]["Tables"]["users"]["Row"]

interface ProfileSettingsProps {
  user: User
  profile: Profile
}

const ALLERGENS = [
  "Peanuts",
  "Tree nuts",
  "Dairy",
  "Eggs",
  "Gluten",
  "Soy",
  "Fish",
  "Shellfish",
  "Sesame",
]

const RESTRICTIONS = [
  "Vegetarian",
  "Vegan",
  "Jain",
  "Gluten-free",
  "Halal",
  "Eggetarian",
  "Low spice",
]

function toggle(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((entry) => entry !== value)
    : [...list, value]
}

export function ProfileSettings({ user, profile }: ProfileSettingsProps) {
  const router = useRouter()

  const [fullName, setFullName] = useState(profile.full_name || "")
  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number || "")
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "")
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null)
  const [uploadResetKey, setUploadResetKey] = useState(0)

  const [allergies, setAllergies] = useState<string[]>([])
  const [restrictions, setRestrictions] = useState<string[]>([])
  const [prefsLoading, setPrefsLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const sanitizedPhone = useMemo(
    () => phoneNumber.replace(/[^\d+]/g, ""),
    [phoneNumber]
  )

  useEffect(() => {
    let cancelled = false

    const loadPreferences = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from("user_dietary_preferences")
          .select("allergies, dietary_restrictions")
          .eq("user_id", user.id)
          .maybeSingle()

        if (data && !cancelled) {
          setAllergies(data.allergies ?? [])
          setRestrictions(data.dietary_restrictions ?? [])
        }
      } catch (error) {
        console.error("[settings] preferences", error)
      } finally {
        if (!cancelled) setPrefsLoading(false)
      }
    }

    loadPreferences()
    return () => {
      cancelled = true
    }
  }, [user.id])

  const handleSave = async () => {
    if (sanitizedPhone && sanitizedPhone.replace(/\D/g, "").length < 10) {
      toast.error("Enter a valid phone number, or leave it blank")
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      let nextAvatarUrl = avatarUrl || null

      if (pendingAvatar) {
        const fileExt = pendingAvatar.name.split(".").pop()
        const filePath = `profiles/${user.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, pendingAvatar, {
            cacheControl: "3600",
            upsert: true,
          })
        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath)

        nextAvatarUrl = publicUrl
        setAvatarUrl(publicUrl)
        setPendingAvatar(null)
        setUploadResetKey((key) => key + 1)
      }

      const { error: profileError } = await supabase.from("users").upsert(
        {
          id: user.id,
          email: user.email ?? "",
          role: profile.role ?? "user",
          full_name: fullName.trim() || null,
          phone_number: sanitizedPhone || null,
          avatar_url: nextAvatarUrl,
        },
        { onConflict: "id" }
      )
      if (profileError) throw profileError

      const { error: prefsError } = await supabase
        .from("user_dietary_preferences")
        .upsert(
          {
            user_id: user.id,
            allergies,
            dietary_restrictions: restrictions,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
      if (prefsError) throw prefsError

      toast.success("Settings saved")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not save your settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">
            Personal details
          </h2>

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">
              Profile photo
            </span>
            <ImageUpload
              key={uploadResetKey}
              currentImageUrl={avatarUrl}
              onUploadComplete={(url) => {
                setAvatarUrl(url)
                if (!url) setPendingAvatar(null)
              }}
              bucket="avatars"
              aspectRatio="logo"
              mode="manual"
              onManualFileChange={setPendingAvatar}
              label="Add a photo"
            />
            <p className="text-xs text-muted-foreground">
              Uploaded when you save.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="full-name"
              className="text-xs font-medium text-muted-foreground"
            >
              Full name
            </label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="phone"
              className="text-xs font-medium text-muted-foreground"
            >
              Phone number
            </label>
            <Input
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 98765 43210"
              inputMode="tel"
              autoComplete="tel"
            />
            <p className="text-xs text-muted-foreground">
              Shared with canteens only, to reach you about an active order.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium text-muted-foreground"
            >
              Email
            </label>
            <Input id="email" value={user.email || ""} disabled />
            <p className="text-xs text-muted-foreground">
              Your sign-in email can&apos;t be changed here.
            </p>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Dietary preferences
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              We&apos;ll warn you at checkout when an order clashes with these.
            </p>
          </div>

          {prefsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-9 rounded-xl" />
              <Skeleton className="h-9 rounded-xl" />
            </div>
          ) : (
            <>
              <fieldset>
                <legend className="muted-label mb-2">Allergies</legend>
                <div className="flex flex-wrap gap-2">
                  {ALLERGENS.map((allergen) => (
                    <Chip
                      key={allergen}
                      showCheck
                      active={allergies.includes(allergen)}
                      onClick={() =>
                        setAllergies((list) => toggle(list, allergen))
                      }
                    >
                      {allergen}
                    </Chip>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="muted-label mb-2">Diet</legend>
                <div className="flex flex-wrap gap-2">
                  {RESTRICTIONS.map((restriction) => (
                    <Chip
                      key={restriction}
                      showCheck
                      active={restrictions.includes(restriction)}
                      onClick={() =>
                        setRestrictions((list) => toggle(list, restriction))
                      }
                    >
                      {restriction}
                    </Chip>
                  ))}
                </div>
              </fieldset>
            </>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
          <ThemeToggle />
        </section>

        <PushOptIn />
      </div>

      <StickyBar>
        <Button size="lg" block loading={saving} onClick={handleSave}>
          {saving ? null : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </StickyBar>
    </>
  )
}
