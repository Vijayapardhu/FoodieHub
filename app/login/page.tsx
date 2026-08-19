"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Lock, Mail, Phone, User } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { LogoMark } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageLoader } from "@/components/ui/loading-state"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { resolveDestination } from "@/lib/auth/destination"

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LoginForm />
    </Suspense>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<"login" | "register">("login")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  const [forgotOpen, setForgotOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [sendingReset, setSendingReset] = useState(false)

  const [registerName, setRegisterName] = useState("")
  const [registerPhone, setRegisterPhone] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    const error = searchParams.get("error")
    const description = searchParams.get("error_description")
    if (error) toast.error(description || "Sign-in failed. Please try again.")
  }, [searchParams])

  // Warm the route almost everybody lands on while they're still typing, so
  // sign-in doesn't also have to wait on a cold bundle.
  useEffect(() => {
    router.prefetch("/home")
  }, [router])

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      })
      if (error) throw error

      // Work out the destination here rather than bouncing through `/`. That
      // round trip cost a whole extra middleware pass and a redirect before
      // the real screen even began loading.
      const destination = data.user
        ? await resolveDestination(supabase, data.user.id)
        : "/home"

      toast.success("Welcome back")
      // `replace`, so Back doesn't land on the login form of a live session.
      router.replace(destination)
    } catch (error: any) {
      toast.error(error?.message || "Could not sign you in")
      setLoading(false)
    }
  }

  const handleEmailRegister = async (event: React.FormEvent) => {
    event.preventDefault()

    if (registerPassword !== confirmPassword) {
      toast.error("Those passwords don't match")
      return
    }
    if (registerPassword.length < 6) {
      toast.error("Use at least 6 characters for your password")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const email = registerEmail.trim()
      const { data, error } = await supabase.auth.signUp({
        email,
        password: registerPassword,
        options: {
          // The row itself is created by the handle_new_user trigger, which
          // reads name and phone straight out of this metadata — nothing
          // client-side has to write it back in afterward, which used to be
          // the one part of this flow with no session to run as yet.
          data: {
            full_name: registerName.trim(),
            phone_number: registerPhone.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error

      setRegisterName("")
      setRegisterPhone("")
      setRegisterPassword("")
      setConfirmPassword("")

      // Whether this is a session yet depends entirely on whether the
      // project requires confirming the email first — signUp() returns one
      // immediately when it doesn't. Telling someone to "check their email"
      // when there was never going to be one to act on is its own kind of
      // broken, so branch on what actually happened rather than assuming.
      if (data.session && data.user) {
        const destination = await resolveDestination(supabase, data.user.id)
        toast.success("Account created — welcome to FoodieHub")
        // Left loading/disabled deliberately: it's about to navigate away,
        // and re-enabling the form for the instant before that happens
        // reads as the tap not having registered.
        router.replace(destination)
        return
      }

      toast.success("Account created — check your email to verify it, then sign in")
      setLoginEmail(email)
      setRegisterEmail("")
      setActiveTab("login")
      setLoading(false)
    } catch (error: any) {
      toast.error(error?.message || "Could not create your account")
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
    } catch (error: any) {
      toast.error(error?.message || "Could not reach Google")
      setLoading(false)
    }
  }

  const openForgotPassword = () => {
    setResetEmail(loginEmail)
    setForgotOpen(true)
  }

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault()
    const email = resetEmail.trim()
    if (!email) {
      toast.error("Enter your email")
      return
    }

    setSendingReset(true)
    try {
      const supabase = createClient()
      // Its own page rather than /auth/callback: a recovery link and an
      // OAuth sign-in both hand back a code, but they mean completely
      // different things — one should end on "you're in", the other must
      // stop at "now set a new password" before it lets you anywhere else.
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error

      // Deliberately the same message whether or not that email actually
      // has an account — confirming which emails are registered is a
      // second, smaller thing to leak on top of the password itself.
      toast.success("If that email has an account, a reset link is on its way")
      setForgotOpen(false)
    } catch (error: any) {
      toast.error(error?.message || "Could not send the reset email")
    } finally {
      setSendingReset(false)
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

  const confirmPasswordToggle = (
    <button
      type="button"
      onClick={() => setShowConfirmPassword((value) => !value)}
      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
    >
      {showConfirmPassword ? <EyeOff /> : <Eye />}
    </button>
  )

  const passwordsMismatched = confirmPassword.length > 0 && confirmPassword !== registerPassword

  return (
    <main className="flex min-h-screen flex-col justify-center bg-surface-fade px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-md space-y-6">
        <header className="space-y-3 text-center">
          <LogoMark className="mx-auto h-16 w-16 rounded-2xl" />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Foodie<span className="text-primary">Hub</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Order from your campus canteen and skip the queue.
            </p>
          </div>
        </header>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
            <TabsList>
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="register">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@college.edu"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={loading}
                    startAdornment={<Mail />}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button
                      type="button"
                      onClick={openForgotPassword}
                      className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={loading}
                    startAdornment={<Lock />}
                    endAdornment={passwordToggle}
                  />
                </div>

                <Button type="submit" size="lg" block loading={loading}>
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleEmailRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="register-name">Full name</Label>
                  <Input
                    id="register-name"
                    autoComplete="name"
                    placeholder="Your name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                    disabled={loading}
                    startAdornment={<User />}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="register-phone">Phone number</Label>
                  <Input
                    id="register-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+91 98765 43210"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    required
                    disabled={loading}
                    startAdornment={<Phone />}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@college.edu"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    disabled={loading}
                    startAdornment={<Mail />}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                    startAdornment={<Lock />}
                    endAdornment={passwordToggle}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    invalid={passwordsMismatched}
                    aria-describedby={passwordsMismatched ? "confirm-password-error" : undefined}
                    startAdornment={<Lock />}
                    endAdornment={confirmPasswordToggle}
                  />
                  {passwordsMismatched ? (
                    <p id="confirm-password-error" role="alert" className="text-sm text-destructive">
                      Those passwords don&apos;t match
                    </p>
                  ) : null}
                </div>

                <Button type="submit" size="lg" block loading={loading}>
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-5">
            <span className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </span>
            <span className="relative flex justify-center">
              <span className="bg-card px-3 text-xs uppercase tracking-wide text-muted-foreground">
                or
              </span>
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            block
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <GoogleIcon />
            Continue with Google
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <form onSubmit={handleForgotPassword}>
            <DialogHeader>
              <DialogTitle>Reset your password</DialogTitle>
              <DialogDescription>
                We&apos;ll email you a link to set a new one.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5 py-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@college.edu"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                disabled={sendingReset}
                autoFocus
                startAdornment={<Mail />}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                block
                onClick={() => setForgotOpen(false)}
                disabled={sendingReset}
              >
                Cancel
              </Button>
              <Button type="submit" block loading={sendingReset}>
                Send reset link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}
