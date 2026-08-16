# Local development

## Current state

The hosted project `etdgzdtwartfyaduaxyg` (ap-northeast-1) is **provisioned and
seeded**. Migrations 001–022 are applied, and `.env.local` holds the URL
and anon key, so `npm run dev` boots straight into a working app.

> **Pending:** `023_promo_banners.sql` (home-screen banner slots) still has to
> be run in Dashboard → SQL Editor. Until it is, the promo carousel stays
> hidden and the two promotions consoles show empty lists — the app logs the
> missing table and carries on rather than erroring.

Test accounts — password `Test1234!` for all three:

| Email | Role | Lands on |
| ----- | ---- | -------- |
| `student@college.edu` | student | `/home` |
| `owner@college.edu` | canteen owner | `/canteen` |
| `admin@college.edu` | admin | `/admin` |

Seed data: 2 canteens, 5 categories, 17 dishes, 2 offers (one pending
approval), 2 orders (one live, one collected) and 4 favourites.

> The database password and `service_role` key are **not** stored in the repo.
> Both were shared over chat during setup, so rotate them in
> Dashboard → Settings when convenient.

### Troubleshooting

**"Failed to fetch" pointing at an old Supabase URL.** `NEXT_PUBLIC_*` values
are inlined into the client bundle at compile time, so a bundle built with the
wrong URL keeps using it. The service worker made this permanent: it cached
`/_next/static/` cache-first, which is safe in production (filenames are
content-hashed) but not in dev (they're stable across rebuilds).

This is self-healing now, via two changes:

- `components/providers.tsx` registers the worker **only in production**.
- `public/sw.js` detects localhost and **unregisters itself**, deleting every
  cache and reloading open tabs.

The second one matters because the first can't fix an already-broken browser: a
stale worker serves the old bundle, so the new "unregister me" client code never
runs. The worker has to remove itself. Browsers revalidate `sw.js` on
navigation, so one reload is enough.

If a browser is still wedged, clear it by hand:
Chrome DevTools → Application → Storage → **Clear site data**.

**HTTP 400 `invalid_credentials` on sign-in.** The request reached Supabase and
was rejected — the email or password is wrong, or the account doesn't exist.
Supabase returns the same message for all three so it can't be used to probe
which emails are registered. Only the three seeded accounts above exist.

**"Create account" doesn't sign you in.** This project requires email
confirmation, and it uses Supabase's built-in SMTP, which is rate-limited to a
handful of messages per hour. Two consequences in development:

- `@college.edu` addresses are fictional, so nobody can click the link.
- Repeated attempts return HTTP 429 `over_email_send_rate_limit`.

For local work, either use the seeded accounts, or turn confirmation off:
Dashboard → Authentication → Sign In / Providers → Email → uncheck **Confirm
email**. Before going live, wire up a real SMTP provider instead.

**Dev server 404s on its own `/_next/static/css/app/layout.css`.** Something ran
`next build` while `next dev` was running — they share `.next/` and the build
overwrites the dev output. Stop both, `rm -rf .next`, restart `npm run dev`.

### Known fragility

Eleven owner pages look up the canteen with
`.eq("owner_id", user.id).maybeSingle()`. `maybeSingle()` returns **null** when
more than one row matches, so an owner with two canteens sees "No canteen
registered yet" across their entire console rather than an error. The register
API enforces one canteen per owner, so this only bites if rows are created
directly in SQL — which is exactly how it was hit while seeding. If multiple
canteens per owner ever becomes real, switch these to
`.order("created_at").limit(1)`.

---

## The constraint that decides everything

The app talks to Supabase through `@supabase/ssr`, which is an **HTTP client**,
not a Postgres driver. Every call goes to a Supabase *service*:

| Code | Service it calls |
| ---- | ---------------- |
| `supabase.from(...)` | PostgREST — `/rest/v1` |
| `supabase.auth.*` | GoTrue — `/auth/v1` |
| `supabase.storage.*` | Storage API — `/storage/v1` |
| `.channel(...).on('postgres_changes')` | Realtime — WebSocket |

So **a bare local Postgres cannot run this app**. Pointing
`NEXT_PUBLIC_SUPABASE_URL` at `localhost:5432` fails immediately: Postgres
speaks its own binary wire protocol, not HTTP/REST.

There are exactly two ways to develop locally.

---

## Option A — Supabase CLI (recommended)

Runs the whole stack locally in containers: Postgres, PostgREST, GoTrue,
Storage, Realtime, and Studio. The SDK code stays untouched.

**Requires Docker Desktop**, which is not currently installed on this machine.

```bash
# once
winget install Docker.DockerDesktop   # then reboot and launch it

npx supabase init
npx supabase start        # applies supabase/migrations/*.sql automatically
```

`supabase start` prints an API URL and anon key. Put them in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from the CLI output>
```

Then `npm run dev`. Studio runs at `http://127.0.0.1:54323` for seeding data.

To reset: `npx supabase db reset`.

---

## Option B — drop Supabase entirely

Replace the SDK with a direct Postgres driver (`pg`, Drizzle or Prisma) and
build your own session auth, file storage and polling.

This is a **large, one-way change**: roughly 50 files call `supabase.*`, and all
row-level security currently enforced by Postgres policies would have to be
re-implemented in application code. Storage and realtime would need replacing
too. Only worth it if you want off Supabase permanently — not as a way to get a
dev environment.

---

## Migration validation

The migrations were executed against a real PostgreSQL 16.4 instance to confirm
they're sound. Result: **19 of 20 applied cleanly.**

`004_storage_setup.sql` fails on vanilla Postgres because it targets the
`storage` schema that only Supabase creates. That's expected — it succeeds under
Option A. `018_clear_all_data.sql` was skipped (it wipes data by design).

The following behaviour was then verified end to end by inserting real rows:

- placing an order notifies the canteen owner
- each status change notifies the student, with the right copy per status
- a payment-only update creates **no** notification (status-only guard works)
- completing an order awards loyalty points (₹120 → 12 points, bronze tier)
- posting a review notifies the owner and recomputes the canteen rating
- an owner reply notifies the student
- a platform-settings edit records a `{from, to}` diff in `settings_audit_log`
- `orders`, `notifications` and `items` are in the `supabase_realtime` publication

### One caveat found while testing

`created_at` defaults to `NOW()`, which in Postgres is the **transaction**
timestamp, not the statement timestamp. Rows inserted inside a single
transaction therefore share an identical `created_at`, and
`ORDER BY created_at DESC LIMIT 1` between them is arbitrary. This does not
affect production — each order and status change is its own transaction — but
it matters when writing tests or bulk-seeding data. Use `clock_timestamp()` if
you need distinct timestamps within one transaction.

---

## A note on this machine

`C:\Program Files\PostgreSQL\18` contains an initialised `data` cluster but no
`bin` directory — the server binaries are missing, so that install cannot start.
Either repair it with the EnterpriseDB installer or ignore it and use Option A.

## Storage buckets — action required

`022_storage_buckets.sql` creates the `items`, `canteens`, `avatars` and
`reviews` buckets. **It has not been run against the live project.** Until it
is, every image upload in the owner console, the admin console and the review
form fails: the buckets genuinely do not exist (`GET /storage/v1/bucket`
returns `[]`).

It cannot be applied from this repo — inserting into `storage.buckets` needs
the `postgres` role, and neither the anon key nor a signed-in admin can do it.
Run it in **Supabase Dashboard → SQL Editor**, together with
`004_storage_setup.sql` if that has not been applied either (buckets without
policies, or policies without buckets, both leave uploads broken).

Both files are idempotent and were executed against a local PostgreSQL 16.4
with a stubbed `storage.buckets` to confirm they run twice cleanly.

## Demo photography

`public/seed/` holds placeholder dish and canteen photographs from Wikimedia
Commons, fetched by `scripts/fetch-seed-images.mjs` (which prefers the most
permissive licence among the on-topic results). `scripts/apply-seed-images.mjs`
writes their paths into the database; `021_seed_image_urls.sql` does the same
declaratively for a fresh database.

13 of the 19 are CC-BY or CC-BY-SA and require credit, which the app gives at
**`/credits`**, linked from the landing footer. Replace them with the canteens'
own photographs before launch and that page can go.
