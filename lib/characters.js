// Single source of truth for character slugs — imported by:
//   - CharacterShowcase.js (the storefront avatar row)
//   - the AI tagging job (constrains what the model is allowed to answer)
//   - the collections/filter page (validates the ?character= query param)
//
// EDIT ME: replace with your real character list. Keep `slug` values stable
// once products have been tagged with them — renaming a slug orphans every
// product already tagged with the old one.

export const CHARACTERS = [
  { slug: 'spider-man', name: 'Spider-Man', hint: 'Spider-Man / Marvel Spider-Man, red-and-blue web costume or mask' },
  { slug: 'frozen', name: 'Frozen', hint: 'Disney Frozen — Elsa, Anna, Olaf' },
  { slug: 'paw-patrol', name: 'Paw Patrol', hint: 'Paw Patrol rescue pups (Chase, Marshall, Skye, etc.)' },
  { slug: 'mickey-friends', name: 'Mickey & Friends', hint: 'Mickey Mouse, Minnie Mouse, Donald Duck, Goofy' },
  { slug: 'peppa-pig', name: 'Peppa Pig', hint: 'Peppa Pig and family' },
  { slug: 'cocomelon', name: 'Cocomelon', hint: 'Cocomelon / JJ character' },
  { slug: 'marvel', name: 'Marvel', hint: 'Other Marvel superheroes (Iron Man, Hulk, Captain America, Avengers team) — not Spider-Man specifically' },
  { slug: 'princess-collection', name: 'Princess Collection', hint: 'Disney Princesses other than Frozen (Belle, Cinderella, Ariel, Rapunzel, etc.)' },
]

export const CHARACTER_SLUGS = CHARACTERS.map(c => c.slug)

export function isValidCharacterSlug(slug) {
  return CHARACTER_SLUGS.includes(slug)
}

// Suggestions at or above this confidence are auto-applied to the live
// `characters` field. Anything below gets queued for a 1-click human review
// instead of going straight to the storefront. Tune this after watching the
// first run's results — start conservative, loosen once you trust it.
export const AUTO_APPLY_CONFIDENCE_THRESHOLD = 0.85

// How many products one process-batch API call handles before returning.
// Vercel serverless functions have a max execution time (10s on Hobby, up to
// 60s/300s on paid plans unless you raise `maxDuration`), and each vision
// call typically takes a few seconds — keep this small and let the client
// just call the endpoint repeatedly rather than trying to do everything in
// one request.
export const BATCH_SIZE = 3

// How many process-batch calls the admin page fires at once. Keep this
// modest — it's bounded by your Anthropic API rate limit tier, not just
// your own server.
export const CLIENT_CONCURRENCY = 2
