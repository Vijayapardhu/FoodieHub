"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import toast from "react-hot-toast"

export default function CanteenRegisterPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error("Canteen name is required")
      return
    }

    try {
      setLoading(true)

      const response = await fetch("/api/canteens/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to register canteen")
      }

      toast.success("Canteen registered successfully!")
      router.push("/canteen")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to register canteen")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30">
      <div className="container mx-auto max-w-2xl p-6">
        <Card className="rounded-3xl border border-slate-200 bg-white/90 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
              Register Your Canteen
            </CardTitle>
            <CardDescription>
              Set up your canteen to start accepting orders
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Canteen Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Central Canteen"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell customers about your canteen..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={loading}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                type="text"
                placeholder="e.g., Building A, Ground Floor"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Registering..." : "Register Canteen"}
              </Button>
            </div>
          </form>
        </CardContent>
        </Card>
      </div>
    </div>
  )
}

