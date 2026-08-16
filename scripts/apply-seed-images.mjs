/**
 * Points every seeded dish and canteen at its photo in public/seed/.
 *
 * Runs through PostgREST as a signed-in admin rather than with the
 * service_role key, which is deliberately absent from this repo. Credentials
 * come from the environment so nothing lands in git:
 *
 *   SEED_EMAIL=admin@college.edu SEED_PASSWORD=... node scripts/apply-seed-images.mjs
 *
 * Idempotent — re-running just rewrites the same paths.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const SEED_DIR = path.join(ROOT, "public", "seed")

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.trimStart().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=")
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const EMAIL = process.env.SEED_EMAIL
const PASSWORD = process.env.SEED_PASSWORD

if (!EMAIL || !PASSWORD) {
  console.error("Set SEED_EMAIL and SEED_PASSWORD (an admin account).")
  process.exit(1)
}

// Item name in the database -> file slug in public/seed.
const ITEMS = {
  "Cheese Maggi": "cheese-maggi",
  "Chicken Biryani": "chicken-biryani",
  "Cold Coffee": "cold-coffee",
  "Dal Tadka": "dal-tadka",
  "Egg Puff": "egg-puff",
  "Filter Coffee": "filter-coffee",
  "Fresh Lime Soda": "fresh-lime-soda",
  "Grilled Sandwich": "grilled-sandwich",
  "Idli Vada Combo": "idli-vada-combo",
  "Masala Chai": "masala-chai",
  "Masala Dosa": "masala-dosa",
  "Midnight Chai": "midnight-chai",
  "North Thali": "north-thali",
  "Paneer Butter Masala": "paneer-butter-masala",
  "Samosa (2 pcs)": "samosa",
  "South Combo": "south-combo",
  "Veg Puff": "veg-puff",
}

const CANTEENS = {
  "Central Canteen": "canteen-central",
  "Hostel Night Canteen": "canteen-hostel",
}

/** Resolves a slug to its public path, whatever extension it was saved with. */
function publicPath(slug) {
  for (const ext of ["jpg", "png", "jpeg", "webp"]) {
    if (fs.existsSync(path.join(SEED_DIR, `${slug}.${ext}`))) {
      return `/seed/${slug}.${ext}`
    }
  }
  return null
}

const auth = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: ANON, "content-type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
})
if (!auth.ok) {
  const body = await auth.json().catch(() => ({}))
  console.error("sign-in failed:", body.error_description ?? body.msg ?? auth.status)
  process.exit(1)
}
const { access_token } = await auth.json()

const headers = {
  apikey: ANON,
  authorization: `Bearer ${access_token}`,
  "content-type": "application/json",
  prefer: "return=representation",
}

async function patch(table, column, name, slug, extra = {}) {
  const url_ = publicPath(slug)
  if (!url_) return `skip ${name} — no file for "${slug}"`

  // `name` is matched exactly; eq. needs the value URL-encoded because these
  // contain spaces and parentheses ("Samosa (2 pcs)").
  const res = await fetch(
    `${URL_BASE}/rest/v1/${table}?name=eq.${encodeURIComponent(name)}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ [column]: url_, ...extra }),
    }
  )
  const rows = await res.json()
  if (!res.ok) return `FAIL ${name}: ${rows.message ?? res.status}`
  if (!rows.length) return `MISS ${name} — no such row`
  return `ok   ${name} -> ${url_}`
}

const results = []
for (const [name, slug] of Object.entries(ITEMS)) {
  results.push(await patch("items", "image_url", name, slug))
}
for (const [name, slug] of Object.entries(CANTEENS)) {
  const p = publicPath(slug)
  results.push(await patch("canteens", "logo_url", name, slug, { banner_url: p }))
}

console.log(results.join("\n"))
const bad = results.filter((r) => !r.startsWith("ok")).length
console.log(`\n${results.length - bad} updated, ${bad} problems`)
process.exit(bad ? 1 : 0)
