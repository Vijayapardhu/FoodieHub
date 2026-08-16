/**
 * Rasterises the brand SVGs into every file a PWA actually needs.
 *
 * Playwright renders them, which avoids adding sharp/canvas as a permanent
 * dependency (native builds, and sharp in particular is painful on Windows)
 * just to produce a handful of PNGs that change once a year.
 *
 * Playwright is not a project dependency — install it only when you need to
 * regenerate these:
 *   npm i -D playwright && node scripts/build-icons.js
 */
const fs = require("fs")
const path = require("path")
const { chromium } = require("playwright")

const ICONS = path.join(__dirname, "..", "public", "icons")
const PUBLIC = path.join(__dirname, "..", "public")

const read = (name) => fs.readFileSync(path.join(ICONS, name), "utf8")

// [source svg, output path, pixel size, keep transparent corners?]
const TARGETS = [
  ["icon.svg", path.join(ICONS, "icon-192.png"), 192, true],
  ["icon.svg", path.join(ICONS, "icon-512.png"), 512, true],
  ["icon-maskable.svg", path.join(ICONS, "icon-maskable-512.png"), 512, false],
  // iOS masks this itself and renders alpha as black, so it must be opaque
  // and full-bleed — the same artwork as the Android maskable icon.
  ["icon-maskable.svg", path.join(ICONS, "apple-touch-icon.png"), 180, false],
  // Notification assets: Chrome on Android ignores SVG for both of these.
  ["icon-compact.svg", path.join(ICONS, "notification-192.png"), 192, true],
  ["icon-badge.svg", path.join(ICONS, "badge-96.png"), 96, true],
  ["icon-compact.svg", path.join(ICONS, "favicon-16.png"), 16, true],
  ["icon-compact.svg", path.join(ICONS, "favicon-32.png"), 32, true],
  ["icon-compact.svg", path.join(ICONS, "favicon-48.png"), 48, true],
]

/**
 * Wraps a PNG set in an ICO container. ICO has allowed PNG-encoded entries
 * since Vista, so this needs no BMP encoder — just the 6-byte directory
 * header and one 16-byte entry per size.
 */
function buildIco(pngs) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: 1 = icon
  header.writeUInt16LE(pngs.length, 4)

  let offset = 6 + pngs.length * 16
  const entries = []

  for (const { size, data } of pngs) {
    const entry = Buffer.alloc(16)
    // 256px is encoded as 0 in this byte; we never go that large, but the
    // modulo keeps it correct if someone adds a 256 target later.
    entry.writeUInt8(size % 256, 0)
    entry.writeUInt8(size % 256, 1)
    entry.writeUInt8(0, 2) // palette count
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // colour planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    offset += data.length
  }

  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)])
}

;(async () => {
  const browser = await chromium.launch()
  const written = []

  for (const [src, out, size, transparent] of TARGETS) {
    const context = await browser.newContext({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()

    // Inline rather than <img src>: the gradients are referenced by id, and
    // inlining keeps them resolvable without a file server.
    const svg = read(src)
      .replace(/width="512"/, `width="${size}"`)
      .replace(/height="512"/, `height="${size}"`)

    await page.setContent(
      `<!doctype html><meta charset="utf-8">
       <style>html,body{margin:0;padding:0;background:transparent}
              svg{display:block}</style>${svg}`
    )
    await page.screenshot({ path: out, omitBackground: transparent })
    await context.close()
    written.push(`${path.relative(PUBLIC, out)}  ${size}x${size}`)
  }

  // favicon.ico bundles 16/32/48 so Windows shortcuts and older browsers pick
  // a crisp size instead of downscaling one.
  const ico = buildIco(
    [16, 32, 48].map((size) => ({
      size,
      data: fs.readFileSync(path.join(ICONS, `favicon-${size}.png`)),
    }))
  )
  fs.writeFileSync(path.join(PUBLIC, "favicon.ico"), ico)
  written.push(`favicon.ico  16+32+48 (${ico.length} bytes)`)

  await browser.close()
  console.log(written.join("\n"))
})()
