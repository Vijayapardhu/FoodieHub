"use client"

import { useState } from "react"
import { CheckCircle2 } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface FieldErrors {
  canteenName?: string
  contactName?: string
  email?: string
  phone?: string
}

/**
 * A canteen asking to join.
 *
 * No account required. The person who fills this in is often not the person
 * who will end up running the console — it might be the owner's son, or
 * whoever has the phone — and making them create a student account first, to
 * then discover there is no way to become an owner, is how an invitation goes
 * unanswered.
 */
export function CanteenApplicationForm() {
  const [canteenName, setCanteenName] = useState("")
  const [contactName, setContactName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState("")
  const [message, setMessage] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [sent, setSent] = useState(false)

  const validate = () => {
    const next: FieldErrors = {}
    if (canteenName.trim().length < 2) next.canteenName = "What is it called?"
    if (contactName.trim().length < 2) next.contactName = "Who should we ask for?"
    if (!email.includes("@")) next.email = "We need a working email"
    if (phone.replace(/\D/g, "").length < 6) next.phone = "And a phone number"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) {
      toast.error("Check the highlighted fields")
      return
    }

    setSaving(true)
    try {
      const { error } = await createClient()
        .from("canteen_applications")
        .insert({
          canteen_name: canteenName.trim(),
          contact_name: contactName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          location: location.trim() || null,
          message: message.trim() || null,
        })
      if (error) throw error
      setSent(true)
    } catch (error: any) {
      toast.error(error?.message || "Could not send that — try again in a moment")
    } finally {
      setSaving(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success-soft p-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-success text-success-foreground">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold text-foreground">
          We&apos;ve got it
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Someone will contact {contactName.trim()} on {phone.trim()} to set{" "}
          {canteenName.trim()} up. Nothing to pay, and nothing to install.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="canteen-name">
          Canteen name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="canteen-name"
          value={canteenName}
          onChange={(e) => setCanteenName(e.target.value)}
          placeholder="e.g. Central Canteen"
          invalid={Boolean(errors.canteenName)}
        />
        {errors.canteenName ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.canteenName}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">
            Your name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contact-name"
            autoComplete="name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            invalid={Boolean(errors.contactName)}
          />
          {errors.contactName ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.contactName}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contact-phone">
            Phone <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contact-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            invalid={Boolean(errors.phone)}
          />
          {errors.phone ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.phone}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="contact-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          invalid={Boolean(errors.email)}
        />
        {errors.email ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="canteen-location">Where on campus</Label>
        <Input
          id="canteen-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Block C, ground floor"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="canteen-message">Anything else</Label>
        <Textarea
          id="canteen-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Roughly how many meals a day, what you serve, when you open…"
          maxLength={1000}
        />
      </div>

      <Button type="submit" size="lg" block loading={saving}>
        Send application
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        No account needed, nothing to pay, and no commission on your sales.
      </p>
    </form>
  )
}
