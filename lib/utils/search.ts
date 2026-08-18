/**
 * Word-by-word search, not one big substring.
 *
 * A plain `text.includes(query)` fails the moment a query has more than one
 * word in an order or place the text doesn't happen to repeat — "chicken
 * hostel" never matches an item called "Chicken Biryani" served at "Hostel
 * Night Canteen" even though every word the student typed is right there,
 * because no single field contains that exact phrase. Splitting the query
 * into words and requiring each one to appear *somewhere* across every
 * field being searched fixes that without needing a real search engine.
 */
export function matchesSearch(query: string, ...fields: Array<string | null | undefined>): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const haystack = fields
    .filter((f): f is string => Boolean(f))
    .join(" ")
    .toLowerCase()
  if (!haystack) return false

  const words = q.split(/\s+/).filter(Boolean)
  return words.every((word) => haystack.includes(word))
}
