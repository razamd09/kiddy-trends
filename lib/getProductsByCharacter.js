import { supabaseAdmin } from './supabaseAdmin'
import { isValidCharacterSlug } from './characters'

// Use this from your collections page wherever it reads `?character=` from
// the URL — e.g. in app/collections/page.js:
//
//   export default async function CollectionsPage({ searchParams }) {
//     const { character } = await searchParams
//     const products = character
//       ? await getProductsByCharacter(character)
//       : await getAllProducts()   // whatever you already use for the
//                                  // unfiltered case
//     return <ProductGrid products={products} />
//   }
//
// This only returns products that have been auto-tagged OR
// human-confirmed — a product still sitting in the AI's "needs_review"
// queue won't show up here until someone confirms it, so nothing
// unreviewed reaches a customer.
export async function getProductsByCharacter(slug) {
  if (!isValidCharacterSlug(slug)) {
    return []
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .contains('characters', [slug])
    .in('character_review_status', ['auto_tagged', 'confirmed'])

  if (error) {
    throw new Error(error.message)
  }
  return data
}
