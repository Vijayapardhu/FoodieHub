"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Html5Qrcode } from "html5-qrcode"
import { Scan, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"

interface QRScannerProps {
  onScanSuccess: (token: string) => void
  canteenId: string
}

export function QRScanner({ onScanSuccess, canteenId }: QRScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [manualToken, setManualToken] = useState("")
  const [showManualInput, setShowManualInput] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scanAreaRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const startScanning = async () => {
    try {
      setScanning(true)
      const scanner = new Html5Qrcode("qr-reader")
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleTokenScanned(decodedText)
          stopScanning()
        },
        (errorMessage) => {
          // Ignore scanning errors
        }
      )
    } catch (error: any) {
      console.error("Error starting scanner:", error)
      toast.error("Failed to start camera. Please check permissions.")
      setScanning(false)
    }
  }

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current = null
          setScanning(false)
        })
        .catch((err) => {
          console.error("Error stopping scanner:", err)
        })
    }
  }

  const handleTokenScanned = async (token: string) => {
    // Verify token belongs to this canteen
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("token", token.toUpperCase())
      .eq("canteen_id", canteenId)
      .single()

    if (order) {
      onScanSuccess(token.toUpperCase())
      toast.success("Order found!")
    } else {
      toast.error("Invalid token or order not found")
    }
  }

  const handleManualSubmit = async () => {
    if (!manualToken.trim()) {
      toast.error("Please enter a token")
      return
    }
    await handleTokenScanned(manualToken.trim().toUpperCase())
    setManualToken("")
    setShowManualInput(false)
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        stopScanning()
      }
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan QR Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!scanning && !showManualInput && (
          <div className="space-y-3">
            <Button
              onClick={startScanning}
              className="w-full"
              size="lg"
            >
              <Scan className="mr-2 h-5 w-5" />
              Start Scanning
            </Button>
            <Button
              onClick={() => setShowManualInput(true)}
              variant="outline"
              className="w-full"
            >
              Enter Token Manually
            </Button>
          </div>
        )}

        {scanning && (
          <div className="space-y-4">
            <div
              id="qr-reader"
              ref={scanAreaRef}
              className="mx-auto max-w-sm"
            />
            <Button
              onClick={stopScanning}
              variant="destructive"
              className="w-full"
            >
              <X className="mr-2 h-4 w-4" />
              Stop Scanning
            </Button>
          </div>
        )}

        {showManualInput && !scanning && (
          <div className="space-y-3">
            <Input
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Enter token code"
              className="text-center text-2xl font-mono"
              maxLength={8}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowManualInput(false)
                  setManualToken("")
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleManualSubmit}
                className="flex-1 bg-primary"
              >
                Verify
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

