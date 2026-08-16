/**
 * Fetches a photo for every seeded dish and canteen from Wikimedia Commons
 * into public/seed/, and records attribution in public/seed/ATTRIBUTION.md.
 *
 * Commons rather than a stock CDN: the search API needs no key, the results
 * are genuinely matched to the query, and the licence is explicit and
 * recorded. Files land in public/ so the app serves its own images — the
 * Supabase storage buckets don't exist on the project yet (creating one needs
 * the service_role key, which is deliberately not in this repo).
 *
 *   node scripts/fetch-seed-images.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "seed")

// slug -> Commons search term. Terms are deliberately specific; a vague one
// ("coffee") pulls back latte art and coffee plants rather than the dish.
const WANTED = {
  "cheese-maggi": "Maggi instant noodles bowl",
  "chicken-biryani": "Chicken biryani",
  "cold-coffee": "Iced coffee glass",
  "dal-tadka": "Tadka dal",
  "egg-puff": "Egg puff pastry Indian",
  "filter-coffee": "Indian filter coffee",
  "fresh-lime-soda": "Nimbu pani",
  "grilled-sandwich": "Grilled sandwich toast",
  "idli-vada-combo": "Idli vada sambar",
  "masala-chai": "Masala chai tea",
  "masala-dosa": "Masala dosa",
  "midnight-chai": "Chai tea glass India",
  "north-thali": "Thali platter",
  "paneer-butter-masala": "Paneer butter masala",
  "samosa": "Samosa",
  "south-combo": "South Indian meal plate",
  "veg-puff": "Vegetable puff pastry",
  "canteen-central": "College canteen cafeteria",
  "canteen-hostel": "Tea stall India",
}

const API = "https://commons.wikimedia.org/w/api.php"

// Commons asks for a descriptive UA with a contact route, and rate-limits
// hard without one. Requests are also serialised below — firing all 19 at
// once earns an immediate 429 for the whole batch.
const UA = "FoodieHub-seed/1.0 (https://github.com/foodiehub; college project) node-fetch"

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getJson(url, attempt = 0) {
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" } })
  if (res.status === 429) {
    if (attempt >= 4) throw new Error("rate limited after 5 attempts")
    const wait = 15000 * 2 ** attempt
    console.log(`   429 — backing off ${wait / 1000}s`)
    await sleep(wait)
    return getJson(url, attempt + 1)
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (json.error) throw new Error(`API: ${json.error.info ?? json.error.code}`)
  return json
}

async function search(term) {
  const url =
    `${API}?action=query&format=json&formatversion=2` +
    `&generator=search&gsrsearch=${encodeURIComponent(`filetype:bitmap ${term}`)}` +
    `&gsrnamespace=6&gsrlimit=6` +
    `&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1000`

  const json = await getJson(url)
  const pages = json.query?.pages ?? []

  // Commons orders by relevance but the index is on the page, so re-sort.
  pages.sort((a, b) => (a.index ?? 99) - (b.index ?? 99))

  // Commons appends ?utm_source=… to image URLs, so the extension is not at
  // the end of the string — test the path only.
  const isPhoto = (u) => /\.(jpe?g|png)$/i.test(new URL(u).pathname)

  return pages
    .map((p) => p.imageinfo?.[0])
    .filter(Boolean)
    .filter((i) => isPhoto(i.url))
}

/**
 * Lower is better. Commons spells these inconsistently, so match loosely;
 * anything unrecognised sorts last rather than being assumed permissive.
 */
function licenceRank(info) {
  const name = (info.extmetadata?.LicenseShortName?.value ?? "").toLowerCase()
  if (/public domain|^pd|pd-/.test(name)) return 0
  if (/cc0/.test(name)) return 1
  if (/cc by-sa/.test(name)) return 3
  if (/cc by/.test(name)) return 2
  return 4
}

const strip = (html) =>
  (html ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120)

// Re-run just the slugs named on the command line, so replacing one bad
// photo doesn't re-download the other eighteen (and re-earn a rate limit).
const only = process.argv.slice(2)
const targets = only.length
  ? Object.fromEntries(Object.entries(WANTED).filter(([slug]) => only.includes(slug)))
  : WANTED
if (only.length && !Object.keys(targets).length) {
  console.error(`no such slug: ${only.join(", ")}`)
  process.exit(1)
}

// Pick a lower-ranked hit where the top one is unusable — a packet shot, a
// diagram, or an archive photo with a colour-calibration bar in frame.
const PICK = {}

fs.mkdirSync(OUT, { recursive: true })

const credits = []
const failed = []

for (const [slug, term] of Object.entries(targets)) {
  try {
    const hits = await search(term)
    if (!hits.length) {
      failed.push(`${slug}: no results for "${term}"`)
      continue
    }

    // Prefer the most permissive licence among the on-topic results. A CC0 or
    // public-domain photo needs no credit at all; CC-BY-SA does, and the fewer
    // of those there are, the less this project owes at launch.
    const hit =
      PICK[slug] !== undefined
        ? hits[Math.min(PICK[slug], hits.length - 1)]
        : [...hits].sort(
            (a, b) =>
              licenceRank(a) - licenceRank(b) || hits.indexOf(a) - hits.indexOf(b)
          )[0]
    const src = hit.thumburl ?? hit.url
    const img = await fetch(src, { headers: { "user-agent": UA } })
    if (!img.ok) {
      failed.push(`${slug}: download ${img.status}`)
      continue
    }

    const buf = Buffer.from(await img.arrayBuffer())
    const ext = /\.png$/i.test(new URL(src).pathname) ? "png" : "jpg"
    fs.writeFileSync(path.join(OUT, `${slug}.${ext}`), buf)

    const meta = hit.extmetadata ?? {}
    credits.push({
      slug,
      file: `${slug}.${ext}`,
      kb: Math.round(buf.length / 1024),
      page: hit.descriptionurl,
      artist: strip(meta.Artist?.value) || "Unknown",
      licence: strip(meta.LicenseShortName?.value) || "see file page",
      // CC0 and public-domain files need no credit line; everything else does.
      needsCredit: licenceRank(hit) > 1,
    })
    console.log(`ok   ${slug}.${ext}  ${Math.round(buf.length / 1024)}kb`)
  } catch (err) {
    failed.push(`${slug}: ${err.message}`)
  }
  await sleep(1200)
}

const CREDITS_JSON = path.join(OUT, "credits.json")
const previous = fs.existsSync(CREDITS_JSON)
  ? JSON.parse(fs.readFileSync(CREDITS_JSON, "utf8"))
  : []
// Merge over the previous run so a targeted re-fetch keeps the other credits.
const merged = [
  ...previous.filter((c) => !credits.some((n) => n.slug === c.slug)),
  ...credits,
].sort((a, b) => a.slug.localeCompare(b.slug))
fs.writeFileSync(CREDITS_JSON, JSON.stringify(merged, null, 2))

fs.writeFileSync(
  path.join(OUT, "ATTRIBUTION.md"),
  [
    "# Seed image attribution",
    "",
    "Demo photographs for the seeded menu, fetched from Wikimedia Commons by",
    "`scripts/fetch-seed-images.mjs`. Most Commons files are CC-BY-SA and",
    "require credit if this ships publicly — check each file page before",
    "launch, and replace these with the canteens' own photographs when you",
    "have them.",
    "",
    "| File | Author | Licence | Source |",
    "| --- | --- | --- | --- |",
    ...merged.map(
      (c) => `| \`${c.file}\` | ${c.artist} | ${c.licence} | [Commons](${c.page}) |`
    ),
    "",
  ].join("\n")
)

console.log(`\n${credits.length} downloaded, ${failed.length} failed`)
if (failed.length) console.log(failed.join("\n"))
