"use client"

import { useEffect, useState } from "react"

/**
 * True only after the first client render. Use it to gate anything derived from
 * browser-only state (localStorage-backed stores, matchMedia) so the server and
 * client agree on the first paint and React doesn't throw a hydration mismatch.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}
