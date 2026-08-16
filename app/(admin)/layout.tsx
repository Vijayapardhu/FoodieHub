import { ConsoleShell } from "@/components/layout/console-shell"
import { requireRole } from "@/lib/auth/require-role"

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(["admin"])

  // Only a plain string crosses to the client component; the nav config holds
  // icon components, which are not serializable.
  return <ConsoleShell variant="admin">{children}</ConsoleShell>
}
