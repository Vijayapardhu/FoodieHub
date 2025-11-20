import { Sidebar } from "@/components/canteen-owner/sidebar"
import { requireRole } from "@/lib/auth/require-role"

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(["canteen_owner", "admin"])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  )
}

