"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"

interface DietaryPreferencesProps {
  cartItems: Array<{ itemId: string; name: string; isVegetarian?: boolean }>
  onNotesChange?: (notes: string) => void
}

const commonAllergens = ["Peanuts", "Tree Nuts", "Dairy", "Eggs", "Gluten", "Soy", "Fish", "Shellfish"]
const dietaryRestrictions = ["Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher", "Keto", "Paleo"]

export function DietaryPreferences({ cartItems, onNotesChange }: DietaryPreferencesProps) {
  const [userPreferences, setUserPreferences] = useState<{
    allergies: string[]
    dietary_restrictions: string[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [dietaryNotes, setDietaryNotes] = useState("")
  const supabase = createClient()

  useEffect(() => {
    fetchUserPreferences()
  }, [])

  useEffect(() => {
    checkDietaryWarnings()
    if (onNotesChange) {
      onNotesChange(dietaryNotes)
    }
  }, [cartItems, userPreferences, dietaryNotes])

  const fetchUserPreferences = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("user_dietary_preferences")
        .select("allergies, dietary_restrictions")
        .eq("user_id", user.id)
        .maybeSingle()

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        console.error("Error fetching preferences:", error)
      }

      if (data) {
        setUserPreferences({
          allergies: data.allergies || [],
          dietary_restrictions: data.dietary_restrictions || [],
        })
      }
    } catch (error: any) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkDietaryWarnings = () => {
    if (!userPreferences || cartItems.length === 0) return

    const warnings: string[] = []

    // Check for non-vegetarian items if user is vegetarian/vegan
    const isVegetarianUser =
      userPreferences.dietary_restrictions.includes("Vegetarian") ||
      userPreferences.dietary_restrictions.includes("Vegan")
    const hasNonVegItems = cartItems.some((item) => !item.isVegetarian)

    if (isVegetarianUser && hasNonVegItems) {
      warnings.push(
        "⚠️ Your cart contains non-vegetarian items, but you have vegetarian preferences"
      )
    }

    // If user has allergies, remind them to check
    if (userPreferences.allergies.length > 0) {
      warnings.push(
        `⚠️ Please verify items are safe for your allergies: ${userPreferences.allergies.join(", ")}`
      )
    }

    if (warnings.length > 0 && dietaryNotes === "") {
      setDietaryNotes(warnings.join("\n"))
    }
  }

  if (loading || (!userPreferences && cartItems.length === 0)) {
    return null
  }

  const hasRestrictions = userPreferences && (userPreferences.allergies.length > 0 || userPreferences.dietary_restrictions.length > 0)

  return (
    <Card className="border-2 border-orange-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Dietary Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasRestrictions && (
          <div className="rounded-lg bg-orange-50/50 p-3 space-y-2">
            {userPreferences.allergies.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Your Allergies:</p>
                <div className="flex flex-wrap gap-1">
                  {userPreferences.allergies.map((allergy) => (
                    <Badge key={allergy} variant="destructive" className="text-xs">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {userPreferences.dietary_restrictions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Your Preferences:</p>
                <div className="flex flex-wrap gap-1">
                  {userPreferences.dietary_restrictions.map((restriction) => (
                    <Badge key={restriction} variant="secondary" className="text-xs">
                      {restriction}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <textarea
          placeholder="Add any dietary restrictions, allergies, or special requests for this order..."
          value={dietaryNotes}
          onChange={(e) => setDietaryNotes(e.target.value)}
          className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm min-h-[80px] resize-none focus:border-primary focus:outline-none"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          {dietaryNotes.length}/500 characters
        </p>
      </CardContent>
    </Card>
  )
}


