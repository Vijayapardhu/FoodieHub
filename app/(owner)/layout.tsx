import { Sidebar } from "@/components/canteen-owner/sidebar"
import { MobileHeader } from "@/components/canteen-owner/mobile-header"
import { MobileNav } from "@/components/canteen-owner/mobile-nav"
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
      <div className="flex flex-1 flex-col">
        <MobileHeader />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <MobileNav />
      </div>
    </div>
  )
}

