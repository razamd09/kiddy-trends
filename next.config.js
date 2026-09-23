/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'thekiddytrends.com' },
    ],
    formats: ['image/webp'],
    minimumCacheTTL: 3600,
  },
  compress: true,
  async headers() {
    return [
      {
        source: '/(.*)\\.(jpg|jpeg|png|gif|webp|svg|ico)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=300, stale-while-revalidate=600' }],
      },
      {
        // API routes return live data (orders, customers, stock, etc.) and
        // must never be cached — the catch-all rule above would otherwise
        // also apply its 5-minute cache to every /api/* response. Next.js
        // applies matching header rules in order and the later match wins
        // for a repeated key, so this overrides it for API routes only.
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
    ]
  },
}

module.exports = nextConfig