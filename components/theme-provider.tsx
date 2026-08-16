"use client"

import * as React from "react"

export type Theme = "light" | "dark" | "system"

const STORAGE_KEY = "foodiehub-theme"

/**
 * Browser chrome tint per scheme. These track --background in globals.css:
 * matching the canvas makes the status bar continuous with the page, where a
 * brand-coloured bar would band against it.
 */
const THEME_COLOR = { light: "#FCF9EF", dark: "#101613" } as const

interface ThemeContextValue {
  theme: Theme
  /** The theme actually painted right now, with `system` already resolved. */
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

/**
 * Inlined in <head> so the correct class is on <html> before first paint.
 *
 * Light is the default for anyone who has not chosen: FoodieHub's identity is
 * the cream canvas, and resolving to the device preference meant every
 * dark-mode phone got a near-black app it never asked for. Dark is still
 * available — it just has to be picked.
 */
export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
    var theme = stored === "dark" ? "dark"
      : stored === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : "light";
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", ${JSON.stringify(THEME_COLOR)}[theme]);
  } catch (e) {}
})();
`.trim()

function systemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function apply(resolved: "light" | "dark") {
  const root = document.documentElement
  root.classList.toggle("dark", resolved === "dark")
  root.style.colorScheme = resolved
  // Keeps the browser chrome (iOS status bar, Android nav bar) in step
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute("content", THEME_COLOR[resolved])
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Light unless the user says otherwise — matches the init script above.
  const [theme, setThemeState] = React.useState<Theme>("light")
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(
    "light"
  )

  // Read the persisted choice once mounted; the init script already painted it.
  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null
    // Falls back to light, not system — otherwise hydration would flip a
    // dark-mode device straight back to dark and undo the init script.
    const initial: Theme =
      stored === "light" || stored === "dark" || stored === "system"
        ? stored
        : "light"
    setThemeState(initial)
    setResolvedTheme(initial === "system" ? systemTheme() : initial)
  }, [])

  // Follow the OS while the user is on "system"
  React.useEffect(() => {
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      const next = mq.matches ? "dark" : "light"
      setResolvedTheme(next)
      apply(next)
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [theme])

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
    const resolved = next === "system" ? systemTheme() : next
    setResolvedTheme(resolved)
    apply(resolved)
  }, [])

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider")
  return ctx
}
