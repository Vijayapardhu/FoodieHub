"use client"

/**
 * The theme, in the form Lottie wants it.
 *
 * Lottie bakes colours into the animation data, which is a problem for a UI
 * with two themes: an animation drawn in the light primary green sits wrong on
 * the dark surface, and vice versa. Rather than shipping two copies of every
 * animation, the shapes are built at render time from whatever the CSS
 * variables currently say, so they follow the theme for free — including when
 * somebody toggles it while looking at the screen.
 */

export type Rgba = [number, number, number, number]

export interface LottiePalette {
  primary: Rgba
  primarySoft: Rgba
  muted: Rgba
  border: Rgba
  card: Rgba
  warning: Rgba
}

function hslToRgba(value: string, alpha = 1): Rgba {
  // The variables are stored unwrapped, as "154 46% 34%".
  const [hRaw, sRaw, lRaw] = value.trim().split(/\s+/)
  const h = parseFloat(hRaw)
  const s = parseFloat(sRaw) / 100
  const l = parseFloat(lRaw) / 100

  if (!Number.isFinite(h) || !Number.isFinite(s) || !Number.isFinite(l)) {
    return [0.5, 0.5, 0.5, alpha]
  }

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x]

  return [r + m, g + m, b + m, alpha]
}

const FALLBACK: LottiePalette = {
  primary: [0.18, 0.51, 0.38, 1],
  primarySoft: [0.9, 0.96, 0.93, 1],
  muted: [0.45, 0.5, 0.47, 1],
  border: [0.88, 0.87, 0.83, 1],
  card: [1, 1, 1, 1],
  warning: [0.9, 0.6, 0.2, 1],
}

export function readPalette(): LottiePalette {
  if (typeof window === "undefined") return FALLBACK

  const style = getComputedStyle(document.documentElement)
  const read = (name: string, fallback: Rgba, alpha = 1): Rgba => {
    const raw = style.getPropertyValue(name)
    return raw ? hslToRgba(raw, alpha) : fallback
  }

  return {
    primary: read("--primary", FALLBACK.primary),
    primarySoft: read("--primary-soft", FALLBACK.primarySoft),
    muted: read("--muted-foreground", FALLBACK.muted),
    border: read("--border", FALLBACK.border),
    card: read("--card", FALLBACK.card),
    warning: read("--warning", FALLBACK.warning),
  }
}
