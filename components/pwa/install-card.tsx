"use client"

import { useEffect, useState } from "react"
import { Check, Download, Share, SquarePlus, X } from "lucide-react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useInstallPrompt } from "@/lib/hooks/use-install-prompt"
import { cn } from "@/lib/utils/cn"

const BANNER_DISMISSED_KEY = "foodiehub.install-dismissed"

/**
 * Why install: the honest reasons, not a list of buzzwords.
 *
 * An installed FoodieHub opens from the home screen with no browser chrome,
 * keeps the pickup token reachable offline, and — the one that actually
 * matters — is what makes order notifications arrive reliably on a phone.
 */
const REASONS = [
  "Opens straight from your home screen",
  "Your token stays readable with no signal",
  "Order alerts arrive without the app open",
]

function IosInstructions({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader className="pr-12">
          <SheetTitle>Add FoodieHub to your home screen</SheetTitle>
        </SheetHeader>

        <SheetBody className="space-y-4 pb-8">
          <p className="text-sm text-muted-foreground">
            Safari doesn&apos;t have an install button, so it takes two taps:
          </p>

          <ol className="space-y-3">
            <li className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Share className="h-4 w-4" />
              </span>
              <span className="text-sm text-foreground">
                Tap <strong>Share</strong> in the Safari toolbar
              </span>
            </li>
            <li className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <SquarePlus className="h-4 w-4" />
              </span>
              <span className="text-sm text-foreground">
                Choose <strong>Add to Home Screen</strong>
              </span>
            </li>
          </ol>

          <p className="text-xs text-muted-foreground">
            It behaves like any other app afterwards — no App Store, no
            download, and it updates itself.
          </p>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

/**
 * The full card, for a settings or profile screen where somebody is already
 * looking at options.
 */
export function InstallCard({ className }: { className?: string }) {
  const { state, promptInstall } = useInstallPrompt()
  const [iosOpen, setIosOpen] = useState(false)

  if (state === "unavailable") return null

  if (state === "installed") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border border-border bg-card p-4",
          className
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success">
          <Check className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">App installed</p>
          <p className="text-xs text-muted-foreground">
            You&apos;re running FoodieHub from your home screen.
          </p>
        </div>
      </div>
    )
  }

  const install = async () => {
    if (state === "ios") {
      setIosOpen(true)
      return
    }
    const outcome = await promptInstall()
    if (outcome === "accepted") toast.success("Installing FoodieHub")
  }

  return (
    <>
      <div
        className={cn(
          "space-y-3 rounded-2xl border border-primary/25 bg-primary-soft p-4",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Download className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">
              Install FoodieHub
            </p>
            <p className="text-xs text-muted-foreground">
              Free, and about the size of a photo.
            </p>
          </div>
        </div>

        <ul className="space-y-1.5">
          {REASONS.map((reason) => (
            <li
              key={reason}
              className="flex items-start gap-2 text-xs text-muted-foreground"
            >
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              {reason}
            </li>
          ))}
        </ul>

        <Button size="sm" block onClick={install}>
          {state === "ios" ? "How to add it" : "Install"}
        </Button>
      </div>

      <IosInstructions open={iosOpen} onOpenChange={setIosOpen} />
    </>
  )
}

/**
 * The slim version for the top of the home screen.
 *
 * Dismissible and remembered, because an install nag that reappears on every
 * visit is worse than never asking.
 */
export function InstallBanner() {
  const { state, promptInstall } = useInstallPrompt()
  const [iosOpen, setIosOpen] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  // Read after mount: localStorage is not available during the server render,
  // and starting dismissed avoids the banner flashing in and back out.
  useEffect(() => {
    setDismissed(window.localStorage.getItem(BANNER_DISMISSED_KEY) === "1")
  }, [])

  if (dismissed || state === "installed" || state === "unavailable") return null

  const dismiss = () => {
    window.localStorage.setItem(BANNER_DISMISSED_KEY, "1")
    setDismissed(true)
  }

  const install = async () => {
    if (state === "ios") {
      setIosOpen(true)
      return
    }
    const outcome = await promptInstall()
    if (outcome === "accepted") {
      toast.success("Installing FoodieHub")
      dismiss()
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary-soft p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Download className="h-4 w-4" />
        </span>

        <p className="min-w-0 flex-1 text-sm">
          <span className="block font-semibold text-foreground">
            Add FoodieHub to your home screen
          </span>
          <span className="block text-xs text-muted-foreground">
            Faster to open, and order alerts actually reach you.
          </span>
        </p>

        <Button size="sm" className="shrink-0" onClick={install}>
          {state === "ios" ? "How" : "Install"}
        </Button>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Not now"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-background/60"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <IosInstructions open={iosOpen} onOpenChange={setIosOpen} />
    </>
  )
}
