"use client"

import { useRouter } from "next/navigation"
import { QRScanner } from "./qr-scanner"

interface QRScannerPageProps {
  canteenId: string
}

export function QRScannerPage({ canteenId }: QRScannerPageProps) {
  const router = useRouter()

  const handleScanSuccess = (token: string) => {
    // Navigate to order detail page
    router.push(`/canteen/orders?token=${token}`)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Scan Order Token</h1>
        <p className="text-muted-foreground">
          Scan QR code or enter token manually
        </p>
      </div>

      <QRScanner onScanSuccess={handleScanSuccess} canteenId={canteenId} />
    </div>
  )
}

