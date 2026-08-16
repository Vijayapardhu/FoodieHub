/**
 * Public URL identifiers.
 *
 * Every customer-visible route is addressed by a readable handle — a canteen
 * or dish slug, an order's pickup token — rather than the row's UUID. These
 * helpers are the single place that decides what goes in a link, and they all
 * fall back to the id, so the app keeps working against a database that
 * hasn't had migration 024 applied yet and old links stay valid forever.
 */

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

/**
 * Which column a route parameter should be matched against. Postgres rejects
 * a malformed uuid outright, so the shape of the value has to pick the column
 * rather than trying one and catching the error.
 */
export function lookupColumn(param: string, slugColumn = "slug") {
  return isUuid(param) ? "id" : slugColumn
}

type Sluggable = { id: string; slug?: string | null }
type Tokenable = { id: string; token?: string | null }

export function canteenPath(canteen: Sluggable): string {
  return `/canteen/${canteen.slug || canteen.id}`
}

export function itemPath(item: Sluggable): string {
  return `/items/${item.slug || item.id}`
}

export function orderPath(order: Tokenable): string {
  return `/orders/${order.token || order.id}`
}

export function orderFeedbackPath(order: Tokenable): string {
  return `${orderPath(order)}/feedback`
}

/** The owner console's queue detail, keyed the same way as the customer's. */
export function ownerOrderPath(order: Tokenable): string {
  return `/canteen/orders/${order.token || order.id}`
}

export function ownerItemEditPath(item: Sluggable): string {
  return `/canteen/menu/${item.slug || item.id}/edit`
}

export function cartPath(canteen: Sluggable): string {
  return `/cart?canteen=${canteen.slug || canteen.id}`
}

export function reviewPath(review: {
  id: string
  public_code?: string | null
}): string {
  return `/profile/feedback/${review.public_code || review.id}`
}
