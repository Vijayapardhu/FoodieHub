"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/store/cart-store"
import { createClient } from "@/lib/supabase/client"
import { Clock, Star, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

interface OrderTemplate {
  id: string
  name: string
  description: string | null
  items: Array<{ item_id: string; quantity: number; item_name?: string; item_price?: number }>
  canteen_id: string
  canteen_name?: string
  created_at: string
}

interface OrderTemplatesProps {
  canteenId: string | null
  onTemplateSelect?: () => void
}

export function OrderTemplates({ canteenId, onTemplateSelect }: OrderTemplatesProps) {
  const [templates, setTemplates] = useState<OrderTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [showSaveForm, setShowSaveForm] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { items, getItemsByCanteen, addItem, clearCart } = useCartStore()

  const cartItems = canteenId ? getItemsByCanteen(canteenId) : []

  useEffect(() => {
    if (canteenId) {
      fetchTemplates()
    }
  }, [canteenId])

  const fetchTemplates = async () => {
    if (!canteenId) return

    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("order_templates")
        .select("*")
        .eq("user_id", user.id)
        .eq("canteen_id", canteenId)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setTemplates((data as OrderTemplate[]) || [])
    } catch (error: any) {
      console.error("Error fetching templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !canteenId || cartItems.length === 0) {
      toast.error("Please provide a template name and add items to cart")
      return
    }

    try {
      setSaving(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Please login")
        return
      }

      const templateItems = cartItems.map((item) => ({
        item_id: item.itemId,
        quantity: item.quantity,
        item_name: item.name,
        item_price: item.price,
      }))

      const { error } = await supabase.from("order_templates").insert({
        user_id: user.id,
        canteen_id: canteenId,
        name: templateName.trim(),
        items: templateItems,
      })

      if (error) throw error

      toast.success("Template saved successfully!")
      setTemplateName("")
      setShowSaveForm(false)
      fetchTemplates()
    } catch (error: any) {
      toast.error(error.message || "Failed to save template")
    } finally {
      setSaving(false)
    }
  }

  const handleLoadTemplate = async (template: OrderTemplate) => {
    if (!canteenId) return

    try {
      // Clear current cart items for this canteen
      cartItems.forEach((item) => {
        useCartStore.getState().removeItem(item.itemId)
      })

      // Fetch item details and add to cart
      const { data: itemsData, error } = await supabase
        .from("items")
        .select("id, name, price, image_url")
        .in(
          "id",
          template.items.map((i) => i.item_id)
        )
        .eq("canteen_id", canteenId)

      if (error) throw error

      // Add items to cart
      template.items.forEach((templateItem) => {
        const itemDetails = itemsData?.find((i) => i.id === templateItem.item_id)
        if (itemDetails) {
          for (let i = 0; i < templateItem.quantity; i++) {
            addItem({
              itemId: itemDetails.id,
              name: itemDetails.name,
              price: Number(itemDetails.price),
              imageUrl: itemDetails.image_url,
              canteenId: canteenId,
              canteenName: template.canteen_name || "Canteen",
            })
          }
        }
      })

      toast.success(`Template "${template.name}" loaded!`)
      onTemplateSelect?.()
    } catch (error: any) {
      toast.error(error.message || "Failed to load template")
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return

    try {
      const { error } = await supabase
        .from("order_templates")
        .delete()
        .eq("id", templateId)

      if (error) throw error

      toast.success("Template deleted")
      fetchTemplates()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete template")
    }
  }

  if (!canteenId || (templates.length === 0 && !showSaveForm && cartItems.length === 0)) {
    return null
  }

  if (loading) {
    return (
      <Card className="border-2 border-orange-100">
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          Loading templates...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-orange-100">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Saved Orders
          </div>
          {cartItems.length > 0 && !showSaveForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveForm(true)}
              className="rounded-full text-xs"
            >
              Save Current
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showSaveForm && (
          <div className="rounded-lg bg-orange-50/50 p-4 space-y-3">
            <input
              type="text"
              placeholder="Template name (e.g., 'My Usual Order')"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              maxLength={50}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSaveTemplate}
                disabled={saving || !templateName.trim()}
                size="sm"
                className="flex-1 rounded-full bg-primary text-white"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                onClick={() => {
                  setShowSaveForm(false)
                  setTemplateName("")
                }}
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {templates.length === 0 && !showSaveForm ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <p>No saved orders yet.</p>
            {cartItems.length > 0 && (
              <p className="mt-2">Save your current cart as a template for quick reordering!</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between rounded-lg border border-orange-100 bg-white p-3 hover:bg-orange-50/50 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{template.name}</h4>
                  {template.description && (
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {template.items.length} item(s) • Saved{" "}
                    {new Date(template.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleLoadTemplate(template)}
                    size="sm"
                    variant="outline"
                    className="rounded-full text-xs"
                  >
                    Load
                  </Button>
                  <Button
                    onClick={() => handleDeleteTemplate(template.id)}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

