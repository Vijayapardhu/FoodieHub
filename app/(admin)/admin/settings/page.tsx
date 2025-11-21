import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireRole } from "@/lib/auth/require-role"

export default async function AdminSettingsPage() {
  await requireRole(["admin"])
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Platform configuration and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Platform settings and configuration options will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

