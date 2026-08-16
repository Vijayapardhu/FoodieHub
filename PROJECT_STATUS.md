# FoodieHub — project status

Last reviewed: 16 August 2026

A mobile-first PWA for college canteen ordering. Students browse menus, order,
and collect with a QR token, paying at the counter. Canteen owners run a live
kitchen queue; admins govern the platform.

---

## Architecture

| Layer      | Choice                                                     |
| ---------- | ---------------------------------------------------------- |
| Framework  | Next.js 14 (App Router, server components by default)      |
| Data       | Supabase — Postgres, Auth, Storage, Realtime               |
| Styling    | Tailwind + a token-driven design system (`app/globals.css`) |
| Client state | Zustand (cart, persisted to localStorage)                |
| Server state | React Query                                              |

Three route groups map to the three roles:

- `app/(public)` — the student app, wrapped in `AppShell`
- `app/(owner)` — the canteen console, wrapped in `ConsoleShell`
- `app/(admin)` — the admin console, also `ConsoleShell`

---

## Design system

Everything visual derives from CSS custom properties defined once in
`app/globals.css` and surfaced to Tailwind in `tailwind.config.ts`. Nothing
hard-codes a hex value or a raw grey.

- **Tokens** — `--primary`, `--surface`, `--success`, `--veg` … each with a dark
  counterpart under `.dark`.
- **Dark mode** — `components/theme-provider.tsx`, with an inline script in
  `app/layout.tsx` that sets the class before first paint so there's no flash.
  Light / dark / system, chosen in profile settings.
- **Mobile ergonomics** — 44px minimum touch targets, 16px inputs (stops iOS
  zooming on focus), `env(safe-area-inset-*)` on all fixed chrome,
  `overscroll-behavior` to kill rubber-banding, `100dvh` instead of `100vh`.
- **Primitives** — `components/ui/`: button, card, input, textarea, badge, chip,
  sheet (bottom sheet), dialog (docks to the bottom on mobile), switch, avatar,
  quantity stepper, sticky bar, stat tile, star rating, status badge, skeleton,
  disclosure, theme toggle.

### Navigation

| Surface  | Mobile                                   | Desktop            |
| -------- | ---------------------------------------- | ------------------ |
| Student  | 5-tab bottom bar + sticky app bar        | app bar with links |
| Owner    | 4 tabs + "More" drawer + top bar         | fixed sidebar      |
| Admin    | 4 tabs + "More" drawer + top bar         | fixed sidebar      |

---

## Implemented

### Student
Auth (email + Google), cross-canteen dish search with filters (category, price,
rating, veg, open-now, sort), canteen menus with sticky category navigation,
item detail with gallery, cart split per canteen, offers, scheduled pickup,
dietary notes and special instructions, order placement, live token tracking
with a vertical status timeline, order cancellation, reorder, invoice
print/download, reviews with photos (create, edit, delete), favourites,
profile with dietary preferences, dark mode, PWA install with shortcuts.

### Canteen owner
Dashboard (revenue, queue, best sellers, hidden items, activity), live order
queue with one-tap status advance, order detail with cash/change calculation,
QR token scanner with manual fallback, menu management with multi-select bulk
show/hide/delete, shared create/edit dish form, offers with pause/resume,
review replies, analytics with date ranges and CSV export, canteen settings
including per-day opening hours.

### Admin
Platform dashboard with an actions-needed banner, canteen approval and
rejection with reasons, user role management, category CRUD, featured-item
curation, offer approval, review moderation, broadcast notifications,
platform analytics with CSV export, and platform settings (feature switches,
ordering rules, maintenance banner) with an audit log.

---

## Database

Migrations `001`–`018` were pre-existing. Added in this pass:

- **`019_platform_settings.sql`** — a singleton settings row plus
  `settings_audit_log`, with a trigger that records the diff of every change.
- **`020_order_notifications.sql`** — triggers that write to `notifications` on
  new orders, status changes, new reviews and owner replies, and that add
  `orders` / `notifications` / `items` to the `supabase_realtime` publication.

> Both must be applied for notifications and platform settings to work. The app
> degrades gracefully without them: settings fall back to built-in defaults and
> the notification centre simply stays empty.

`types/database.types.ts` now matches the schema — it was missing every column
from `012_add_booking_features` and `015_add_canteen_approval_system`, plus
four whole tables.

---

## Fixed in this pass

| Problem | Effect |
| ------- | ------ |
| Duplicate `/profile` route (`app/profile` and `app/(public)/profile`) | Build failed outright |
| `public/manifest.webmanifest` collided with `app/manifest.ts` | Manifest 500'd; PWA install was broken |
| Static manifest referenced `icon-192.png` / `icon-512.png` | Neither file exists |
| `createClient()` returned a new browser client per render | Realtime channels torn down and rebuilt continuously |
| `useRealtimeOrders` took an inline `onUpdate` in its effect deps | Refetch loop |
| `useRealtimeOrderList` defaulted `statuses` to a fresh array | Re-subscribed every render |
| Cart badge read persisted state during SSR | Hydration mismatch |
| Nothing ever inserted order notifications | The notification centre could never populate |
| Service worker `addAll` precached authenticated routes | Install failed on one 404; offline page never served |
| Global `* { transition: … }` rule | Every property on every element animated |
| Scanner navigated to `/canteen/orders?token=…` | That query parameter was never read |
| `offers-list` linked to `/canteen/offers/[id]/edit` | Route does not exist |

---

## Not implemented

- **Email notifications** — needs an SMTP or transactional-email provider and
  credentials. In-app and browser push are wired up.
- **PNG app icons** — only `icons/icon.svg` exists. Some older Android builds
  want raster icons for the install prompt; generating them needs an image
  toolchain the project doesn't currently carry.
- Multi-language, in-app support chat, gift cards, subscriptions.

---

## Running it

```bash
npm install
# .env.local
#   NEXT_PUBLIC_SUPABASE_URL=…
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=…
npm run dev
```

Apply `supabase/migrations/*.sql` in order, then create the `avatars`,
`canteens`, `items` and `reviews` storage buckets (see `SETUP_GUIDE.md`).

```bash
npm run type-check   # tsc --noEmit
npm run build        # production build
```
