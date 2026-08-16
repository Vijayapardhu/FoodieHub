"use client"

import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { ConsoleHeader } from "@/components/layout/console-shell"
import { QRScanner } from "./qr-scanner"

export function QRScannerPage({ canteenId }: { canteenId: string }) {
  const router = useRouter()

  return (
    <>
      <ConsoleHeader
        title="Scan token"
        description="Pull up an order by scanning its QR, or type the code"
      />

      <div className="mx-auto max-w-md">
        <QRScanner
          canteenId={canteenId}
          onScanSuccess={(orderId, token) => {
            toast.success(`Order #${token} found`)
            // The token is what the console addresses orders by, and it is
            // exactly what was just scanned.
            router.push(`/canteen/orders/${token || orderId}`)
          }}
        />
      </div>
    </>
  )
}
