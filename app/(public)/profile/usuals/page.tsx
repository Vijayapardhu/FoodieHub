import { AppShell } from "@/components/layout/app-shell"
import { UsualsList, type Usual } from "@/components/profile/usuals-list"
import { requireRole } from "@/lib/auth/require-role"

export const metadata = { title: "Saved orders" }

export default async function UsualsPage() {
  const { supabase, user } = await requireRole([
    "user",
    "canteen_owner",
    "admin",
  ])

  const { data: templates, error } = await supabase
    .from("order_templates")
    .select("*, canteens(id, slug, name, is_open)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  if (error) console.error("[usuals] templates", error)

  // Every dish across every saved order, resolved in one query rather than
  // one per template.
  const itemIds = Array.from(
    new Set(
      (templates ?? []).flatMap((template) =>
        ((template.items ?? []) as Array<{ item_id: string }>).map(
          (line) => line.item_id
        )
      )
    )
  )

  const { data: itemRows } = itemIds.length
    ? await supabase
        .from("items")
        .select("id, slug, name, price, image_url, is_available")
        .in("id", itemIds)
    : { data: [] as any[] }

  const byId = new Map((itemRows ?? []).map((item) => [item.id, item]))

  const usuals: Usual[] = (templates ?? [])
    .filter((template) => template.canteens)
    .map((template) => {
      const raw = (template.items ?? []) as Array<{
        item_id: string
        quantity: number
      }>

      const lines = raw
        .map((line) => {
          const item = byId.get(line.item_id)
          if (!item) return null
          return {
            itemId: item.id,
            itemSlug: item.slug ?? null,
            name: item.name,
            price: Number(item.price),
            imageUrl: item.image_url,
            quantity: line.quantity,
            available: item.is_available,
          }
        })
        .filter((line): line is NonNullable<typeof line> => line !== null)

      const canteen = template.canteens as any

      return {
        id: template.id,
        name: template.name,
        canteenId: canteen.id,
        canteenSlug: canteen.slug ?? null,
        canteenName: canteen.name,
        canteenOpen: canteen.is_open,
        lines,
        // A dish deleted from the menu leaves no row to resolve at all.
        missingCount: raw.length - lines.length,
      }
    })

  return (
    <AppShell title="Saved orders" showBack backHref="/profile">
      <UsualsList usuals={usuals} />
    </AppShell>
  )
}
