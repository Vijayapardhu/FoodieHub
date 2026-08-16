"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * Chrome's `beforeinstallprompt`, which is not in the DOM lib because it is
 * not a standard.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export type InstallState =
  | "unavailable" // no prompt, and not a platform we can instruct
  | "installed" // already running from the home screen
  | "available" // we hold a deferred prompt and can install on tap
  | "ios" // Safari: installable, but only by hand through the share sheet

/**
 * Install-to-home-screen state.
 *
 * The event fires once, early, and is lost if nobody listens — so this hook
 * catches it and holds it until the user is somewhere it makes sense to ask.
 * Chrome's own affordance is an icon buried in the address bar that most
 * people never notice, and iOS has no prompt at all: Safari only installs via
 * Share → Add to Home Screen, which has to be explained rather than offered.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [state, setState] = useState<InstallState>("unavailable")

  useEffect(() => {
    if (typeof window === "undefined") return

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari's own flag, which predates the standard media query.
      (window.navigator as { standalone?: boolean }).standalone === true

    if (standalone) {
      setState("installed")
      return
    }

    const ua = window.navigator.userAgent
    const isIosSafari =
      /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)

    if (isIosSafari) setState("ios")

    const onBeforeInstall = (event: Event) => {
      // Suppress the mini-infobar so the app can ask at a better moment.
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
      setState("available")
    }

    const onInstalled = () => {
      setDeferred(null)
      setState("installed")
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    window.addEventListener("appinstalled", onInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferred) return "unavailable" as const

    await deferred.prompt()
    const { outcome } = await deferred.userChoice

    // The event is single-use: once shown, it cannot be replayed.
    setDeferred(null)
    if (outcome === "accepted") setState("installed")

    return outcome
  }, [deferred])

  return { state, promptInstall }
}
