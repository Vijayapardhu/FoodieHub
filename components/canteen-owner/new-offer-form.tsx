"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

interface NewOfferFormProps {
  canteenId: string
}

export function NewOfferForm({ canteenId }: NewOfferFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minOrderAmount: "",
    maxDiscount: "",
    validFrom: "",
    validUntil: "",
  })

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!form.discountValue) {
      toast.error("Discount value is required")
      return
    }
    if (!form.validFrom || !form.validUntil) {
      toast.error("Valid from & until dates are required")
      return
    }
    try {
      setLoading(true)
      const { error } = await supabase.from("offers").insert({
        canteen_id: canteenId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        discount_type: form.discountType as "percentage" | "flat",
        discount_value: Number(form.discountValue),
        min_order_amount: form.minOrderAmount
          ? Number(form.minOrderAmount)
          : null,
        max_discount: form.maxDiscount ? Number(form.maxDiscount) : null,
        valid_from: new Date(form.validFrom).toISOString(),
        valid_until: new Date(form.validUntil).toISOString(),
        is_active: true,
        is_approved: false,
      })

      if (error) throw error

      toast.success("Offer created, pending approval")
      router.push("/canteen/offers")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to create offer")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Title</label>
          <Input
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Buy 1 Get 1"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Details about the offer..."
          />
        </div>
        <div>
          <label className="text-sm font-medium">Discount Type</label>
          <select
            value={form.discountType}
            onChange={(e) => handleChange("discountType", e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="flat">Flat (₹)</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Discount Value</label>
          <Input
            type="number"
            min="0"
            value={form.discountValue}
            onChange={(e) => handleChange("discountValue", e.target.value)}
            placeholder="e.g. 20"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Min Order Amount</label>
          <Input
            type="number"
            min="0"
            value={form.minOrderAmount}
            onChange={(e) => handleChange("minOrderAmount", e.target.value)}
            placeholder="optional"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Max Discount</label>
          <Input
            type="number"
            min="0"
            value={form.maxDiscount}
            onChange={(e) => handleChange("maxDiscount", e.target.value)}
            placeholder="optional"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Valid From</label>
          <Input
            type="datetime-local"
            value={form.validFrom}
            onChange={(e) => handleChange("validFrom", e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Valid Until</label>
          <Input
            type="datetime-local"
            value={form.validUntil}
            onChange={(e) => handleChange("validUntil", e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="rounded-full">
          {loading ? "Saving..." : "Create offer"}
        </Button>
      </div>
    </form>
  )
}

