"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Phone, User } from "lucide-react"
import toast from "react-hot-toast"
import { LogoMark } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageLoader } from "@/components/ui/loading-state"
import { createClient } from "@/lib/supabase/client"

export default function CompleteProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")

  useEffect(() => {
    let cancelled = false

    const loadUser = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        const { data: profile } = await supabase
          .from("users")
          .select("full_name, phone_number, role")
          .eq("id", user.id)
          .maybeSingle()

        // Already complete — send them to their landing screen.
        if (profile?.phone_number) {
          router.push(
            profile.role === "admin"
              ? "/admin"
              : profile.role === "canteen_owner"
                ? "/canteen"
                : "/home"
          )
          return
        }

        if (cancelled) return
        setEmail(user.email ?? "")
        setFullName(
          profile?.full_name || (user.user_metadata?.full_name as string) || ""
        )
      } catch (error) {
        console.error("[complete-profile] load failed", error)
        toast.error("Could not load your profile")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadUser()
    return () => {
      cancelled = true
    }
  }, [router])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const digits = phoneNumber.replace(/\D/g, "")
    if (digits.length < 10) {
      toast.error("Enter a valid phone number")
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Session expired — please log in again")

      const { error } = await supabase
        .from("users")
        .update({
          full_name: fullName.trim(),
          phone_number: phoneNumber.replace(/[^\d+]/g, ""),
        })
        .eq("id", user.id)

      if (error) throw error

      toast.success("You're all set")
      router.push("/")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not save your details")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader label="Loading your profile" />

  return (
    <main className="flex min-h-screen flex-col justify-center bg-surface-fade px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-md space-y-6">
        <header className="space-y-3 text-center">
          <LogoMark className="mx-auto h-16 w-16 rounded-2xl" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              One last thing
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Canteens need a way to reach you about an active order.
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              disabled
              startAdornment={<Mail />}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              required
              startAdornment={<User />}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 98765 43210"
              required
              startAdornment={<Phone />}
            />
          </div>

          <Button type="submit" size="lg" block loading={saving}>
            Continue
          </Button>
        </form>
      </div>
    </main>
  )
}
