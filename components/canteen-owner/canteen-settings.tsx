"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Database } from "@/types/database.types"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { LogoutButton } from "@/components/profile/logout-button"

type Canteen = Database["public"]["Tables"]["canteens"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]

interface CanteenSettingsProps {
  canteen: Canteen
  categories: Category[]
}

export function CanteenSettings({ canteen, categories }: CanteenSettingsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: canteen.name,
    description: canteen.description || "",
    contact_phone: canteen.contact_phone || "",
    is_open: canteen.is_open,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const { error } = await supabase
        .from("canteens")
        .update({
          name: formData.name,
          description: formData.description || null,
          contact_phone: formData.contact_phone || null,
          is_open: formData.is_open,
        })
        .eq("id", canteen.id)

      if (error) throw error

      toast.success("Settings updated successfully")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Canteen Name</label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="mt-1"
              rows={4}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Contact phone</label>
            <Input
              value={formData.contact_phone}
              onChange={(e) =>
                setFormData({ ...formData, contact_phone: e.target.value })
              }
              className="mt-1"
              placeholder="+91 98765 43210"
            />
            <p className="text-xs text-muted-foreground">
              Shown to students so they can reach the counter quickly.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_open"
              checked={formData.is_open}
              onChange={(e) =>
                setFormData({ ...formData, is_open: e.target.checked })
              }
              className="h-4 w-4"
            />
            <label htmlFor="is_open" className="text-sm font-medium">
              Canteen is currently open
            </label>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6 border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Sign out of your account. You will need to log in again to access
              your canteen dashboard.
            </p>
          </div>
          <LogoutButton variant="destructive" className="w-full md:w-auto" />
        </CardContent>
      </Card>
    </form>
  )
}

