"use client"

import type { LottiePalette, Rgba } from "@/lib/lottie/palette"

/**
 * Hand-built Lottie animations for the empty screens.
 *
 * They are composed here in code rather than exported from a design tool for
 * two reasons: they take their colours from the running theme (see palette.ts),
 * and a few hundred lines of shape primitives is a great deal less to ship
 * than a folder of JSON exports for what are, in the end, five simple loops.
 *
 * Everything is drawn on a 200×200 canvas at 30fps. Motion is kept slow and
 * small on purpose — this plays behind a sentence somebody is trying to read,
 * and an empty screen is already a mild disappointment without something
 * bouncing at them.
 */

type Keyframe = [frame: number, value: number | number[]]

const val = <T,>(k: T) => ({ a: 0 as const, k })

/** Keyframed property. Eased in and out; nothing here should move linearly. */
function anim(keys: Keyframe[]) {
  return {
    a: 1 as const,
    k: keys.map(([t, s], index) => {
      const value = Array.isArray(s) ? s : [s]
      if (index === keys.length - 1) return { t, s: value }
      return {
        t,
        s: value,
        i: { x: [0.42], y: [1] },
        o: { x: [0.58], y: [0] },
      }
    }),
  }
}

const fill = (c: Rgba) => ({
  ty: "fl",
  c: val(c),
  o: val(100),
  r: 1,
  bm: 0,
  nm: "fill",
})

const stroke = (c: Rgba, w: number) => ({
  ty: "st",
  c: val(c),
  o: val(100),
  w: val(w),
  lc: 2,
  lj: 2,
  bm: 0,
  nm: "stroke",
})

const ellipse = (size: [number, number], p: [number, number] = [0, 0]) => ({
  ty: "el",
  s: val(size),
  p: val(p),
  d: 1,
  nm: "ellipse",
})

const rect = (
  size: [number, number],
  p: [number, number] = [0, 0],
  radius = 0
) => ({
  ty: "rc",
  s: val(size),
  p: val(p),
  r: val(radius),
  d: 1,
  nm: "rect",
})

interface Transform {
  p?: [number, number]
  a?: [number, number]
  s?: [number, number]
  r?: number
  o?: number
}

const tr = (t: Transform = {}) => ({
  ty: "tr",
  p: val(t.p ?? [0, 0]),
  a: val(t.a ?? [0, 0]),
  s: val(t.s ?? [100, 100]),
  r: val(t.r ?? 0),
  o: val(t.o ?? 100),
  sk: val(0),
  sa: val(0),
  nm: "transform",
})

const group = (items: unknown[]) => ({ ty: "gr", it: items, nm: "group" })

interface LayerTransform {
  p?: ReturnType<typeof val> | ReturnType<typeof anim>
  a?: ReturnType<typeof val> | ReturnType<typeof anim>
  s?: ReturnType<typeof val> | ReturnType<typeof anim>
  r?: ReturnType<typeof val> | ReturnType<typeof anim>
  o?: ReturnType<typeof val> | ReturnType<typeof anim>
}

function layer(
  ind: number,
  nm: string,
  shapes: unknown[],
  ks: LayerTransform,
  op: number
) {
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm,
    sr: 1,
    ks: {
      o: ks.o ?? val(100),
      r: ks.r ?? val(0),
      p: ks.p ?? val([100, 100, 0]),
      a: ks.a ?? val([0, 0, 0]),
      s: ks.s ?? val([100, 100, 100]),
    },
    ao: 0,
    shapes,
    ip: 0,
    op,
    st: 0,
    bm: 0,
  }
}

function root(nm: string, op: number, layers: unknown[]) {
  return {
    v: "5.7.4",
    fr: 30,
    ip: 0,
    op,
    w: 200,
    h: 200,
    nm,
    ddd: 0,
    assets: [],
    layers,
  }
}

export type AnimationName =
  | "cart"
  | "orders"
  | "search"
  | "saved"
  | "inbox"

/** An empty bag, waiting. Two crumbs drop in and vanish; the bag breathes. */
function cart(p: LottiePalette) {
  const OP = 120

  const bag = group([
    rect([76, 66], [0, 8], 14),
    fill(p.primarySoft),
    stroke(p.primary, 5),
    tr(),
  ])

  // Behind the bag, so only the arc above the rim is visible.
  const handle = group([
    ellipse([44, 44], [0, -22]),
    stroke(p.primary, 5),
    tr(),
  ])

  const crumb = (dx: number, delay: number) =>
    layer(
      1,
      `crumb${dx}`,
      [group([ellipse([13, 13]), fill(p.primary), tr()])],
      {
        p: anim([
          [delay, [100 + dx, 34, 0]],
          [delay + 26, [100 + dx, 96, 0]],
          [OP, [100 + dx, 96, 0]],
        ]),
        o: anim([
          [delay, [0]],
          [delay + 8, [100]],
          [delay + 22, [100]],
          [delay + 28, [0]],
          [OP, [0]],
        ]),
      },
      OP
    )

  return root("cart", OP, [
    crumb(-16, 6),
    crumb(14, 40),
    layer(
      3,
      "bag",
      [bag],
      {
        p: anim([
          [0, [100, 116, 0]],
          [45, [100, 110, 0]],
          [90, [100, 116, 0]],
          [OP, [100, 116, 0]],
        ]),
      },
      OP
    ),
    layer(4, "handle", [handle], { p: val([100, 116, 0]) }, OP),
  ])
}

/**
 * An order slip, waiting to be written.
 *
 * The first attempt at this was a plate with steam, which at a glance read as
 * a floating lens rather than food — the shapes were right and the idea was
 * not legible. A docket is unambiguous.
 */
function orders(p: LottiePalette) {
  const OP = 120

  const line = (w: number, y: number) =>
    group([rect([w, 8], [-(88 - w) / 2 + 6, y], 4), fill(p.border), tr()])

  const slip = [
    // Drawn first, so it sits above the paper.
    group([ellipse([26, 26], [22, 34]), fill(p.primary), tr()]),
    line(52, -30),
    line(40, -12),
    line(30, 6),
    group([rect([88, 112], [0, 0], 10), fill(p.card), stroke(p.primary, 5), tr()]),
  ]

  return root("orders", OP, [
    layer(
      1,
      "slip",
      slip,
      {
        p: anim([
          [0, [100, 104, 0]],
          [60, [100, 94, 0]],
          [OP, [100, 104, 0]],
        ]),
        r: anim([
          [0, [-2.5]],
          [60, [2.5]],
          [OP, [-2.5]],
        ]),
      },
      OP
    ),
  ])
}

/** A magnifier sweeping for something that isn't there. */
function search(p: LottiePalette) {
  const OP = 120

  const glass = [
    group([ellipse([74, 74]), stroke(p.primary, 7), tr()]),
    group([ellipse([74, 74]), fill(p.primarySoft), tr()]),
    // Last, so the rim covers where the handle meets it. Rotated about the
    // group's own origin and then moved out along the diagonal — rotating a
    // shape that had already been offset swung it clear of the glass.
    group([rect([10, 40], [0, 0], 5), fill(p.primary), tr({ p: [30, 30], r: -45 })]),
  ]

  return root("search", OP, [
    layer(
      1,
      "glass",
      glass,
      {
        p: val([92, 88, 0]),
        r: anim([
          [0, [-13]],
          [40, [13]],
          [80, [-13]],
          [OP, [-13]],
        ]),
      },
      OP
    ),
    // Three things it is failing to find.
    ...[-30, 0, 30].map((dx, i) =>
      layer(
        i + 2,
        `dot${i}`,
        [group([ellipse([13, 13]), fill(p.border), tr()])],
        {
          p: val([100 + dx, 168, 0]),
          o: anim([
            [i * 12, [35]],
            [i * 12 + 24, [100]],
            [i * 12 + 48, [35]],
            [OP, [35]],
          ]),
        },
        OP
      )
    ),
  ])
}

/**
 * A heart, beating.
 *
 * Built from two circles and a square rather than a bezier path — the classic
 * construction, and far easier to be sure of than hand-written curve data.
 */
function saved(p: LottiePalette) {
  const OP = 120

  // The square is rotated in place and then moved, not offset and then
  // rotated: a group transform turns about its own origin, so a shape placed
  // away from that origin swings sideways instead of spinning, which is what
  // pulled the point of the heart out from under its two lobes.
  //
  // With the square's half-diagonal at 39.6, the midpoints of its two upper
  // edges land on (±19.8, -5.8) — which is where the circles sit, so each
  // lobe exactly spans an edge and the silhouette closes.
  const heart = [
    group([rect([56, 56], [0, 0], 6), fill(p.primary), tr({ p: [0, 14], r: 45 })]),
    group([ellipse([56, 56], [-19.8, -5.8]), fill(p.primary), tr()]),
    group([ellipse([56, 56], [19.8, -5.8]), fill(p.primary), tr()]),
  ]

  return root("saved", OP, [
    layer(
      1,
      "heart",
      heart,
      {
        // The shape spans -33.8 to 53.6 about its own origin, so sitting it at
        // 90 rather than 100 is what actually centres it on the canvas.
        p: val([100, 90, 0]),
        // Two beats and a rest, which is what a heartbeat actually sounds
        // like; an even pulse reads as a loading spinner.
        s: anim([
          [0, [100, 100, 100]],
          [8, [112, 112, 100]],
          [18, [100, 100, 100]],
          [26, [107, 107, 100]],
          [36, [100, 100, 100]],
          [OP, [100, 100, 100]],
        ]),
      },
      OP
    ),
  ])
}

/** A bell with nothing to ring about, tipping gently. */
function inbox(p: LottiePalette) {
  const OP = 120

  // The layer is anchored at the crown, so shapes are placed relative to it
  // and land at shape + (p - a) on the canvas.
  const bell = [
    group([ellipse([22, 22], [0, -30]), fill(p.primary), tr()]),
    group([rect([86, 12], [0, 38], 6), fill(p.primary), tr()]),
    group([rect([70, 62], [0, 6], 24), fill(p.primarySoft), stroke(p.primary, 5), tr()]),
  ]

  const swing = (offset: number) =>
    anim([
      [0, [-9 + offset]],
      [30, [9 + offset]],
      [60, [-9 + offset]],
      [90, [5 + offset]],
      [OP, [-9 + offset]],
    ])

  return root("inbox", OP, [
    layer(
      1,
      "bell",
      bell,
      { p: val([100, 70, 0]), a: val([0, -30, 0]), r: swing(0) },
      OP
    ),
    // Its own layer so it can lag the bell, the way a clapper actually does.
    layer(
      2,
      "clapper",
      [group([ellipse([17, 17]), fill(p.primary), tr()])],
      {
        p: anim([
          [4, [92, 152, 0]],
          [34, [108, 152, 0]],
          [64, [92, 152, 0]],
          [94, [104, 152, 0]],
          [OP, [92, 152, 0]],
        ]),
      },
      OP
    ),
  ])
}


const BUILDERS: Record<AnimationName, (p: LottiePalette) => unknown> = {
  cart,
  orders,
  search,
  saved,
  inbox,
}

export function buildAnimation(name: AnimationName, palette: LottiePalette) {
  return BUILDERS[name](palette)
}
