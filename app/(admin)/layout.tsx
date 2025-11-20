import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { requireRole } from "@/lib/auth/require-role"

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(["admin"])

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1">{children}</main>
    </div>
  )
}

