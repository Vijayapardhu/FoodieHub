"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Lock } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { LogoMark } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageLoader } from "@/components/ui/loading-state"
import { createClient } from "@/lib/supabase/client"
import { resolveDestination } from "@/lib/auth/destination"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [verifying, setVerifying] = useState(true)
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  // The reset email lands here with a one-time code — trading it for a
  // session is what actually authorizes changing the password, so it has
  // to happen before the form below is even shown, not on submit.
  useEffect(() => {
    let cancelled = false

    const verify = async () => {
      const code = searchParams.get("code")
      const errorDescription = searchParams.get("error_description")

      if (errorDescription) {
        toast.error(errorDescription)
        router.replace("/login")
        return
      }

      const supabase = createClient()

      if (!code) {
        // No code — either this page was reached directly, or the code was
        // already redeemed (a refresh after the exchange below). A session
        // from that first exchange still means the reset can go ahead.
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (cancelled) return
        if (user) {
          setReady(true)
        } else {
          toast.error("This reset link is invalid or has expired")
          router.replace("/login")
        }
        setVerifying(false)
        return
      }

      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) throw error
        if (!cancelled) setReady(true)
      } catch (error: any) {
        if (!cancelled) {
          toast.error(error?.message || "This reset link is invalid or has expired")
          router.replace("/login")
        }
      } finally {
        if (!cancelled) setVerifying(false)
      }
    }

    verify()
    return () => {
      cancelled = true
    }
  }, [router, searchParams])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (password.length < 6) {
      toast.error("Use at least 6 characters for your password")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Those passwords don't match")
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      const {
        data: { user },
      } = await supabase.auth.getUser()

      toast.success("Password updated")
      router.replace(user ? await resolveDestination(supabase, user.id) : "/login")
    } catch (error: any) {
      toast.error(error?.message || "Could not update your password")
      setSaving(false)
    }
  }

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((value) => !value)}
      aria-label={showPassword ? "Hide password" : "Show password"}
      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
    >
      {showPassword ? <EyeOff /> : <Eye />}
    </button>
  )

  if (verifying) return <PageLoader label="Verifying your reset link" />
  if (!ready) return null

  return (
    <main className="flex min-h-screen flex-col justify-center bg-surface-fade px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-md space-y-6">
        <header className="space-y-3 text-center">
          <LogoMark className="mx-auto h-16 w-16 rounded-2xl" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Set a new password
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Make it one you haven&apos;t used here before.
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card"
        >
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={saving}
              autoFocus
              startAdornment={<Lock />}
              endAdornment={passwordToggle}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-new-password">Confirm password</Label>
            <Input
              id="confirm-new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={saving}
              invalid={confirmPassword.length > 0 && confirmPassword !== password}
              startAdornment={<Lock />}
            />
          </div>

          <Button type="submit" size="lg" block loading={saving}>
            Update password
          </Button>
        </form>
      </div>
    </main>
  )
}
