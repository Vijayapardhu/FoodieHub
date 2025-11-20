import { requireRole } from "@/lib/auth/require-role"

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(["student", "canteen_owner", "admin"])

  return <>{children}</>
}

