import { requireRole } from "@/lib/auth/require-role"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { CanteensTable } from "@/components/admin/canteens-table"

export const metadata = { title: "Canteens" }

export default async function CanteensPage() {
  const { supabase } = await requireRole(["admin"])

  const { data: canteens } = await supabase
    .from("canteens")
    .select("*, users(email, full_name)")
    .order("created_at", { ascending: false })
    .limit(200)

  return (
    <>
      <ConsoleHeader
        title="Canteens"
        description="Approve registrations and manage every canteen on campus"
      />

      <CanteensTable canteens={(canteens ?? []) as any} />
    </>
  )
}
