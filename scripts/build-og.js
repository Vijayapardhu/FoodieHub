/**
 * Renders the 1200x630 link-preview card to public/og.png.
 *
 * Static rather than a Next `opengraph-image.tsx` route: this card never
 * changes per request, and generating it at build time keeps the edge runtime
 * and its font-loading constraints out of the picture entirely.
 *
 * Playwright is not a project dependency — install it only when you need to
 * regenerate these:
 *   npm i -D playwright && node scripts/build-og.js
 */
const path = require("path")
const { chromium } = require("playwright")

const OUT = path.join(__dirname, "..", "public", "og.png")

// Mirrors the Sage & Cream tokens in app/globals.css. Hard-coded because this
// runs outside the app and Tailwind never sees it.
const CREAM = "#FCF9EF"
const SAGE = "#EDF2EA"
const GREEN = "#2E7D5B"
const GREEN_DARK = "#1F5C42"
const INK = "#1B2A22"
const MUTED = "#536159"
const HAIRLINE = "#E7E4DA"

const BOWL = `
  <svg viewBox="70 172 372 174" fill="#FCF9EF" style="width:64%">
    <rect x="76" y="178" width="360" height="42" rx="21"/>
    <path d="M108 220a148 118 0 0 0 296 0z"/>
  </svg>`

const html = `<!doctype html><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    width:1200px;height:630px;background:${CREAM};
    /* Falls back cleanly if the font CDN is unreachable at build time */
    font-family:Manrope,"Segoe UI",system-ui,sans-serif;color:${INK};
    display:flex;flex-direction:column;justify-content:space-between;
    overflow:hidden;position:relative;
  }
  .top{padding:64px 72px 0;position:relative;z-index:1}
  .brand{display:flex;align-items:center;gap:18px;margin-bottom:56px}
  .tile{
    width:76px;height:76px;border-radius:20px;display:flex;
    align-items:center;justify-content:center;
    background:linear-gradient(135deg,${GREEN} 0%,${GREEN_DARK} 100%);
  }
  .wordmark{font-size:34px;font-weight:800;letter-spacing:-.02em}
  .wordmark span{color:${GREEN}}
  h1{
    font-size:76px;line-height:1.06;font-weight:800;letter-spacing:-.035em;
    max-width:940px;
  }
  h1 em{font-style:normal;color:${GREEN}}
  p{font-size:27px;line-height:1.45;color:${MUTED};margin-top:28px;max-width:760px}
  .foot{
    border-top:1px solid ${HAIRLINE};background:${SAGE};
    padding:26px 72px;display:flex;gap:40px;align-items:center;
    position:relative;z-index:1;
  }
  .chip{display:flex;align-items:center;gap:11px;font-size:22px;font-weight:700;color:${INK}}
  .tick{
    width:24px;height:24px;border-radius:999px;background:${GREEN};color:${CREAM};
    display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;
  }
</style>
<div class="top">
  <div class="brand">
    <div class="tile">${BOWL}</div>
    <div class="wordmark">Foodie<span>Hub</span></div>
  </div>
  <h1>Order campus food ahead,<br><em>skip the queue</em></h1>
  <p>Order between lectures, collect with a token, and pay the canteen at the
     counter exactly as you do today.</p>
</div>

<div class="foot">
  <div class="chip"><span class="tick">&check;</span> No service fee</div>
  <div class="chip"><span class="tick">&check;</span> No commission</div>
  <div class="chip"><span class="tick">&check;</span> No online payment</div>
</div>`

;(async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  await page.setContent(html, { waitUntil: "networkidle" })
  // Belt and braces: networkidle can resolve before the webfont has painted.
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: OUT })
  await browser.close()
  console.log("public/og.png  1200x630")
})()
