"use client"

import { useCallback, useLayoutEffect, useRef } from "react"

/**
 * Returns a function with a stable identity that always calls the latest
 * version of `fn`. Use it when a child reports upward from inside an effect:
 * an inline parent callback would otherwise change every render, re-fire the
 * effect, set parent state, and loop forever.
 */
export function useEventCallback<Args extends unknown[], R>(
  fn: (...args: Args) => R
) {
  const ref = useRef(fn)

  useLayoutEffect(() => {
    ref.current = fn
  })

  return useCallback((...args: Args) => ref.current(...args), [])
}
