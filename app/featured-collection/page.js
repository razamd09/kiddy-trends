import Link from 'next/link'

const SITE_URL = 'https://thekiddytrends.com'

export const metadata = {
  title: 'Featured Collection – Kiddy Trends',
  description: 'Browse all our current featured campaigns at Kiddy Trends.',
}

async function getActiveCampaigns() {
  try {
    const res = await fetch(SITE_URL + '/api/featured-campaigns', { next: { revalidate: 60 } })
    const data = await res.json()
    return data.success ? (data.campaigns || []) : []
  } catch {
    return []
  }
}

export default async function FeaturedCollectionPage() {
  const campaigns = await getActiveCampaigns()

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="section-title mb-3">Featured Collection</h1>
          <p className="text-gray-500 text-lg">Our current campaigns — tap one to explore</p>
        </div>

        {campaigns.length === 0 ? (
          <p className="text-center text-gray-400 py-16">No featured campaigns are live right now — check back soon!</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {campaigns.map((c) => (
              <Link
                key={c.campaignNumber}
                href={c.href}
                className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:border-coral/40 hover:shadow-md transition-all block"
              >
                <div className="relative aspect-square bg-gray-50">
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">No image</div>
                  )}
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-display text-lg text-charcoal group-hover:text-coral transition-colors">{c.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
