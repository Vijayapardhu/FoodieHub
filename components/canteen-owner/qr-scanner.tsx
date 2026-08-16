"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Camera, CameraOff, Keyboard, ScanLine } from "lucide-react"
import toast from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { isValidToken } from "@/lib/utils/token"

interface QRScannerProps {
  /** Receives the resolved order id, not the raw token. */
  onScanSuccess: (orderId: string, token: string) => void
  canteenId: string
}

const READER_ID = "qr-reader"

export function QRScanner({ onScanSuccess, canteenId }: QRScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [starting, setStarting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [manualToken, setManualToken] = useState("")
  const scannerRef = useRef<Html5Qrcode | null>(null)
  // Guards against the camera firing the same code many times per second.
  const handledRef = useRef(false)

  const stopScanning = useCallback(async () => {
    const scanner = scannerRef.current
    if (!scanner) return
    try {
      await scanner.stop()
      scanner.clear()
    } catch (error) {
      console.error("[scanner] stop failed", error)
    } finally {
      scannerRef.current = null
      setScanning(false)
    }
  }, [])

  const resolveToken = useCallback(
    async (raw: string) => {
      const token = raw.trim().toUpperCase()

      if (!isValidToken(token)) {
        toast.error("That doesn't look like a pickup token")
        return false
      }

      setChecking(true)
      try {
        const supabase = createClient()
        const { data: order, error } = await supabase
          .from("orders")
          .select("id, token, status")
          .eq("token", token)
          .eq("canteen_id", canteenId)
          .maybeSingle()

        if (error) throw error

        if (!order) {
          toast.error(`No order here with token ${token}`)
          return false
        }

        if (order.status === "cancelled") {
          toast.error(`Order ${token} was cancelled`)
          return false
        }

        onScanSuccess(order.id, order.token)
        return true
      } catch (error: any) {
        toast.error(error?.message || "Could not look up that token")
        return false
      } finally {
        setChecking(false)
      }
    },
    [canteenId, onScanSuccess]
  )

  const startScanning = async () => {
    setStarting(true)
    handledRef.current = false
    try {
      const scanner = new Html5Qrcode(READER_ID)
      scannerRef.current = scanner
      setScanning(true)

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (handledRef.current) return
          handledRef.current = true

          const ok = await resolveToken(decodedText)
          if (ok) {
            await stopScanning()
          } else {
            // Let the operator try again with the next frame.
            setTimeout(() => {
              handledRef.current = false
            }, 1500)
          }
        },
        () => {
          // Per-frame decode misses are normal; nothing to report.
        }
      )
    } catch (error) {
      console.error("[scanner] start failed", error)
      toast.error("Could not open the camera. Check browser permissions.")
      scannerRef.current = null
      setScanning(false)
    } finally {
      setStarting(false)
    }
  }

  useEffect(() => {
    return () => {
      // Release the camera when leaving the screen.
      scannerRef.current?.stop().catch(() => undefined)
      scannerRef.current = null
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div
          id={READER_ID}
          className="relative aspect-square w-full bg-foreground/90 [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
        >
          {!scanning ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-background">
              <ScanLine className="h-10 w-10 opacity-70" />
              <p className="max-w-[15rem] text-sm opacity-80">
                Point the camera at the token QR on the student&apos;s phone.
              </p>
            </div>
          ) : null}
        </div>

        <div className="p-3">
          {scanning ? (
            <Button
              variant="outline"
              block
              size="lg"
              onClick={stopScanning}
              loading={checking}
            >
              <CameraOff className="h-4 w-4" />
              Stop camera
            </Button>
          ) : (
            <Button block size="lg" onClick={startScanning} loading={starting}>
              <Camera className="h-4 w-4" />
              Start camera
            </Button>
          )}
        </div>
      </div>

      <form
        onSubmit={async (event) => {
          event.preventDefault()
          const ok = await resolveToken(manualToken)
          if (ok) setManualToken("")
        }}
        className="space-y-3 rounded-2xl border border-border bg-card p-4"
      >
        <label
          htmlFor="manual-token"
          className="flex items-center gap-2 text-sm font-semibold text-foreground"
        >
          <Keyboard className="h-4 w-4" />
          Or type the token
        </label>

        <Input
          id="manual-token"
          value={manualToken}
          onChange={(e) => setManualToken(e.target.value.toUpperCase())}
          placeholder="A1B2C3"
          maxLength={8}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="text-center font-mono text-2xl font-bold tracking-[0.2em]"
        />

        <Button
          type="submit"
          variant="outline"
          block
          loading={checking}
          disabled={manualToken.trim().length < 4}
        >
          Find order
        </Button>
      </form>
    </div>
  )
}
