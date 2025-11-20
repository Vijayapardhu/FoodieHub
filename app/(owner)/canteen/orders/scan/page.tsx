import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { QRScannerPage } from "@/components/canteen-owner/qr-scanner-page"

export default async function ScanOrderPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: canteen } = await supabase
    .from("canteens")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!canteen) {
    redirect("/canteen")
  }

  return <QRScannerPage canteenId={canteen.id} />
}

