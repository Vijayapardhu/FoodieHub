# Ecommerce UX Audit

## Owner Experience

### Dashboard
- **Current:** `app/(owner)/canteen/page.tsx` renders revenue + pending count only.
- **Gaps:** No trend line, stock alerts, or quick filters. No contextual tips for peak windows.

### Orders List
- **Current:** `components/canteen-owner/order-management.tsx` shows simple cards.
- **Gaps:** Missing payment badge, ETA hints, bulk actions, search/sort, or escalation states.

### Order Detail
- **Current:** `components/canteen-owner/order-detail-view.tsx` recently gained cancel + customer phone.
- **Gaps:** No status timeline, change log, note fields, or quick-call CTA cluster. Needs item thumbnails grid + refund reason modal.

### Analytics
- **Current:** `app/(owner)/canteen/analytics/page.tsx` is static cards.
- **Gaps:** No charts, peak hours, top sellers, or comparison toggles.

### Settings
- **Current:** `app/(owner)/canteen/settings/page.tsx` is a basic form.
- **Gaps:** Should preview logo/banner, map embed, service switches (delivery / pickup), contact verification status, working hours matrix.

## Student Experience

### Orders List
- **Current:** `app/(public)/orders/page.tsx` plain cards.
- **Gaps:** Need canteen avatar, ETA badge, status pill, quick call / reorder button, coupon indicator.

### Order Detail
- **Current:** `components/orders/token-tracking.tsx` shows token + list.
- **Gaps:** Add hero summary, timeline tracker, price breakdown (subtotal / discount / total), reorder + support CTAs, receipt download.

### Cart
- **Current:** `components/cart/cart-page-content.tsx` lists items + summary.
- **Gaps:** No cross-sell carousel, no special instructions, no coupon chips, no progress tracker for offers.

### Profile
- **Current:** `components/profile/profile-lists.tsx` surfaces orders/favorites/feedback but lacks loyalty info.
- **Gaps:** Add loyalty progress ring, saved addresses, support shortcuts, recently uploaded feedback photos.

## Skeletons & Empty States
- Many sections (owner analytics, student order detail) lack skeleton placeholders.
- Need ecommerce-style shimmers, dashed empty cards with iconography, and actionable CTAs.

## Data & Hooks
- Need Supabase selects to include:
  - Status timestamps (order timeline).
  - Item thumbnails + category tags.
  - Phone + address metadata on orders (just added).
  - Offer progress metrics for cart upsells.
- Hooks (`useRealtimeOrders`) already refetched relations; extend to cover new fields as they appear.

