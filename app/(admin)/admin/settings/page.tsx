import { requireRole } from "@/lib/auth/require-role"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { PlatformSettingsForm } from "@/components/admin/platform-settings-form"
import { PaymentSettingsForm } from "@/components/admin/payment-settings-form"
import { DEFAULT_PLATFORM_SETTINGS } from "@/lib/utils/platform-settings"

export const metadata = { title: "Platform settings" }

export default async function AdminSettingsPage() {
  const { supabase } = await requireRole(["admin"])

  // Both queries fail cleanly if migration 019 hasn't been applied; the form
  // then renders the defaults read-only rather than erroring.
  const [{ data: settings }, { data: auditLog }] = await Promise.all([
    supabase.from("platform_settings").select("*").eq("id", true).maybeSingle(),
    supabase
      .from("settings_audit_log")
      .select("*, users(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  return (
    <>
      <ConsoleHeader
        title="Platform settings"
        description="Ordering rules, feature switches and the maintenance banner"
      />

      <div className="mx-auto max-w-3xl space-y-8">
        <PaymentSettingsForm />

        <PlatformSettingsForm
          settings={settings ?? DEFAULT_PLATFORM_SETTINGS}
          auditLog={(auditLog ?? []) as any}
          persisted={Boolean(settings)}
        />
      </div>
    </>
  )
}
