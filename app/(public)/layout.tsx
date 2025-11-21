import { requireRole } from "@/lib/auth/require-role"

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(["user", "canteen_owner", "admin"])

  return <>{children}</>
}

