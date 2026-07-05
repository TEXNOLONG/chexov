/**
 * Fuzzy search using Levenshtein distance + substring scoring.
 * Fast enough for 200-300 menu items on mobile.
 */

/** Levenshtein edit distance between two strings (capped at maxDist) */
function levenshtein(a: string, b: string, maxDist = 6): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1
  const m = a.length, n = b.length
  // Use two-row approach to save memory
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  for (let i = 1; i <= m; i++) {
    const curr = [i]
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    prev = curr
  }
  return prev[n]
}

/**
 * Score a query token against a target string.
 * Returns 0-1:
 *  1.0 = exact word match / substring at start
 *  0.8 = substring anywhere
 *  0.3-0.7 = fuzzy match via levenshtein
 *  0   = no match
 */
function scoreToken(token: string, target: string): number {
  if (!token) return 1
  if (target === token) return 1
  if (target.startsWith(token)) return 0.95
  if (target.includes(token)) return 0.8

  // Try every n-gram of target with same length as token
  const tLen = token.length
  if (tLen >= 2) {
    let bestDist = tLen
    for (let i = 0; i <= target.length - tLen; i++) {
      const slice = target.slice(i, i + tLen)
      const d = levenshtein(token, slice, 2)
      if (d < bestDist) bestDist = d
      if (bestDist === 0) break
    }
    if (bestDist <= 1 && tLen >= 3) return 0.75
    if (bestDist === 2 && tLen >= 5) return 0.5
  }
  return 0
}

/** Score query against a single field */
function scoreField(query: string, field: string): number {
  const target = field.toLowerCase()
  const tokens = query.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return 0
  // Check if entire query matches as substring first (catches multi-word phrases)
  if (target.includes(query)) return 1
  // Average best-match score for each token
  const scores = tokens.map((t) => scoreToken(t, target))
  return scores.reduce((s, v) => s + v, 0) / scores.length
}

export interface FuzzyItem {
  name: string
  category: string
  description: string
  composition: string
  allergens: string
}

/** Weights for different fields */
const WEIGHTS = {
  name: 3,
  category: 1.5,
  description: 1,
  composition: 1,
  allergens: 1.2,
}

const THRESHOLD = 0.35

/**
 * Score an item against a query.
 * Returns a number 0-3+ (weighted sum).
 */
export function fuzzyScore(query: string, item: FuzzyItem): number {
  const q = query.trim().toLowerCase()
  if (!q) return 1
  const fields: Array<[keyof typeof WEIGHTS, string]> = [
    ['name', item.name],
    ['category', item.category],
    ['description', item.description],
    ['composition', item.composition],
    ['allergens', item.allergens],
  ]
  let best = 0
  for (const [field, value] of fields) {
    if (!value) continue
    const s = scoreField(q, value) * WEIGHTS[field]
    if (s > best) best = s
  }
  return best
}

/**
 * Filter and sort items by fuzzy query.
 * Items below threshold are excluded; results are sorted best-first.
 */
export function fuzzyFilter<T extends FuzzyItem>(query: string, items: T[]): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  const scored = items
    .map((item) => ({ item, score: fuzzyScore(q, item) }))
    .filter(({ score }) => score >= THRESHOLD)
    .sort((a, b) => b.score - a.score)
  return scored.map(({ item }) => item)
}
