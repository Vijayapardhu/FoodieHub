import { ConsoleShell } from "@/components/layout/console-shell"
import { requireRole } from "@/lib/auth/require-role"

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(["canteen_owner", "admin"])

  // Only a plain string crosses to the client component; the nav config holds
  // icon components, which are not serializable.
  return <ConsoleShell variant="owner">{children}</ConsoleShell>
}
