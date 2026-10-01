import Link from 'next/link'

const SITE_URL = 'https://thekiddytrends.com'

// This page and the APIs it fetches from were created in the same deploy —
// without force-dynamic, Next pre-renders this page once at BUILD time, and
// that build-time self-fetch to its own sibling API routes can fail (the
// new routes aren't actually live yet during the build that's creating
// them), getting permanently cached as an empty result. Rendering fresh
// per request avoids that trap entirely.
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Featured Collection – Kiddy Trends',
  description: 'Browse all our current featured campaigns and character collections at Kiddy Trends.',
}

async function getActiveCampaigns() {
  try {
    const res = await fetch(SITE_URL + '/api/featured-campaigns', { cache: 'no-store' })
    const data = await res.json()
    return data.success ? (data.campaigns || []) : []
  } catch {
    return []
  }
}

async function getActiveCharacters() {
  try {
    const res = await fetch(SITE_URL + '/api/featured-characters', { cache: 'no-store' })
    const data = await res.json()
    return data.success ? (data.characters || []) : []
  } catch {
    return []
  }
}

function TileGrid({ items }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:border-coral/40 hover:shadow-md transition-all block"
        >
          <div className="relative aspect-square bg-gray-50">
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">No image</div>
            )}
          </div>
          <div className="p-4 text-center">
            <h3 className="font-display text-lg text-charcoal group-hover:text-coral transition-colors">{item.name}</h3>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default async function FeaturedCollectionPage() {
  const [campaigns, characters] = await Promise.all([getActiveCampaigns(), getActiveCharacters()])

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

        <div>
          <div className="text-center mb-10">
            <h1 className="section-title mb-3">Featured Collection</h1>
            <p className="text-gray-500 text-lg">Our current campaigns — tap one to explore</p>
          </div>

          {campaigns.length === 0 ? (
            <p className="text-center text-gray-400 py-16">No featured campaigns are live right now — check back soon!</p>
          ) : (
            <TileGrid items={campaigns.map((c) => ({ href: c.href, name: c.name, image: c.image }))} />
          )}
        </div>

        {characters.length > 0 && (
          <div>
            <div className="text-center mb-10">
              <h2 className="section-title mb-3">Shop by Character</h2>
              <p className="text-gray-500 text-lg">Their favorite characters, all in one place</p>
            </div>
            <TileGrid items={characters.map((c) => ({ href: c.href, name: c.name, image: c.image }))} />
          </div>
        )}

      </div>
    </div>
  )
}
