import { requireRole } from "@/lib/auth/require-role"
import { ConsoleHeader } from "@/components/layout/console-shell"
import {
  ApplicationsList,
  type CanteenApplication,
} from "@/components/admin/applications-list"

export const metadata = { title: "Applications" }

export default async function ApplicationsPage() {
  const { supabase } = await requireRole(["admin"])

  const { data: applications, error } = await supabase
    .from("canteen_applications")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) console.error("[admin] applications", error)

  return (
    <>
      <ConsoleHeader
        title="Applications"
        description="Canteens asking to join — reach them by phone, they have no account yet"
      />

      <ApplicationsList
        applications={(applications ?? []) as CanteenApplication[]}
      />
    </>
  )
}
