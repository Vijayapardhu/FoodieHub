"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Store } from "lucide-react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function CanteenRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [contactPhone, setContactPhone] = useState("")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!name.trim()) {
      toast.error("Your canteen needs a name")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/canteens/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          address: address.trim(),
          contact_phone: contactPhone.trim(),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Could not register your canteen")
      }

      toast.success("Canteen registered — an admin will review it shortly")
      router.push("/canteen")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not register your canteen")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <header className="space-y-3 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Store className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Register your canteen
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add the basics now — you can fill in hours, photos and location
            after an admin approves it.
          </p>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-border bg-card p-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="canteen-name">
            Canteen name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="canteen-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Central Canteen"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="canteen-description">Description</Label>
          <Textarea
            id="canteen-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What you serve and what you're known for"
            rows={3}
            disabled={loading}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="canteen-address">Where you are</Label>
          <Input
            id="canteen-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Block A, ground floor"
            disabled={loading}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="canteen-phone">Contact phone</Label>
          <Input
            id="canteen-phone"
            type="tel"
            inputMode="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+91 98765 43210"
            disabled={loading}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" size="lg" className="flex-1" loading={loading}>
            Register
          </Button>
        </div>
      </form>
    </div>
  )
}
