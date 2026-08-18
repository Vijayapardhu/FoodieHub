import { requireRole } from "@/lib/auth/require-role"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { CanteensTable } from "@/components/admin/canteens-table"

export const metadata = { title: "Canteens" }

export default async function CanteensPage() {
  const { supabase } = await requireRole(["admin"])

  // canteens has two FKs to users (owner_id and approved_by), so the plain
  // `users(...)` embed is ambiguous to PostgREST and errors out — silently,
  // since this just returns null and the page renders an empty list. Naming
  // the FK constraint picks the owner relationship specifically.
  const { data: canteens } = await supabase
    .from("canteens")
    .select("*, users:users!canteens_owner_id_fkey(email, full_name)")
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
