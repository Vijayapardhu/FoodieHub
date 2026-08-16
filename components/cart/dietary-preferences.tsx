"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle } from "@/components/ui/icons"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useEventCallback } from "@/lib/hooks/use-event-callback"

interface DietaryPreferencesProps {
  cartItems: Array<{ itemId: string; name: string; isVegetarian?: boolean }>
  onNotesChange?: (notes: string) => void
}

interface Preferences {
  allergies: string[]
  dietary_restrictions: string[]
}

export function DietaryPreferences({
  cartItems,
  onNotesChange: onNotesChangeProp,
}: DietaryPreferencesProps) {
  const onNotesChange = useEventCallback(onNotesChangeProp ?? (() => {}))
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user || cancelled) return

        const { data } = await supabase
          .from("user_dietary_preferences")
          .select("allergies, dietary_restrictions")
          .eq("user_id", user.id)
          .maybeSingle()

        if (cancelled) return
        if (data) {
          setPreferences({
            allergies: data.allergies ?? [],
            dietary_restrictions: data.dietary_restrictions ?? [],
          })
        }
      } catch (error) {
        console.error("[dietary] load failed", error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [supabase])

  useEffect(() => {
    onNotesChange(notes)
  }, [notes, onNotesChange])

  const vegetarianUser =
    preferences?.dietary_restrictions.some((r) =>
      ["Vegetarian", "Vegan"].includes(r)
    ) ?? false
  const hasNonVeg = cartItems.some((item) => item.isVegetarian === false)

  return (
    <div className="space-y-3">
      {!loading && preferences ? (
        <>
          {vegetarianUser && hasNonVeg ? (
            <p className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-soft p-3 text-sm text-warning">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Your cart has non-vegetarian items but your profile is set to{" "}
              {preferences.dietary_restrictions.join(" / ")}.
            </p>
          ) : null}

          {preferences.allergies.length > 0 ? (
            <div>
              <p className="muted-label mb-1.5">Your allergies</p>
              <div className="flex flex-wrap gap-1.5">
                {preferences.allergies.map((allergy) => (
                  <Badge key={allergy} variant="destructive" size="sm">
                    {allergy}
                  </Badge>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Mention them below so the kitchen can double-check.
              </p>
            </div>
          ) : null}
        </>
      ) : null}

      <div className="space-y-1.5">
        <label
          htmlFor="dietary-notes"
          className="text-sm font-medium text-foreground"
        >
          Dietary notes
        </label>
        <Textarea
          id="dietary-notes"
          placeholder="Allergies, intolerances, or anything the kitchen should avoid"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          className="min-h-[80px]"
        />
        <p className="text-right text-xs text-muted-foreground tabular-nums">
          {notes.length}/500
        </p>
      </div>

      {!loading && !preferences ? (
        <p className="text-xs text-muted-foreground">
          Save allergies once in{" "}
          <Link
            href="/profile/settings"
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            profile settings
          </Link>{" "}
          and we&apos;ll flag risky orders automatically.
        </p>
      ) : null}
    </div>
  )
}
