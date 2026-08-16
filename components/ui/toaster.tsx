"use client"

import { Toaster as HotToaster } from "react-hot-toast"

/**
 * Toasts sit top-centre and clear the notch, so they never collide with the
 * bottom tab bar or the sticky cart on mobile.
 */
export function Toaster() {
  return (
    <HotToaster
      position="top-center"
      containerStyle={{
        top: "calc(env(safe-area-inset-top) + 0.75rem)",
        left: "1rem",
        right: "1rem",
      }}
      toastOptions={{
        duration: 3500,
        className:
          "!bg-surface !text-foreground !border !border-border !shadow-lift !rounded-2xl !text-sm !px-4 !py-3 !max-w-md",
        success: {
          duration: 2800,
          iconTheme: {
            primary: "hsl(var(--success))",
            secondary: "hsl(var(--success-foreground))",
          },
        },
        error: {
          duration: 4500,
          iconTheme: {
            primary: "hsl(var(--destructive))",
            secondary: "hsl(var(--destructive-foreground))",
          },
        },
        loading: {
          iconTheme: {
            primary: "hsl(var(--primary))",
            secondary: "hsl(var(--primary-foreground))",
          },
        },
      }}
    />
  )
}
