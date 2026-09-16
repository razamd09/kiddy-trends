import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { formatPakistanDate } from '../../lib/dateFormat'

export const metadata = {
  title: 'Blog | Kiddy Trends',
  description: 'Parenting tips, sizing guides, and the latest kids fashion trends from Kiddy Trends.',
  alternates: { canonical: '/blog' },
}

async function getPublishedPosts() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    )
    const { data, error } = await supabase
      .from('blog_posts')
      .select('slug, title, excerpt, cover_image, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })

    return error ? [] : (data || [])
  } catch {
    return []
  }
}

export default async function BlogPage() {
  const posts = await getPublishedPosts()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="text-center mb-12">
        <span className="inline-block bg-sunny text-charcoal font-display text-sm px-4 py-1.5 rounded-full mb-4">
          From Kiddy Trends
        </span>
        <h1 className="section-title mb-4">Our Blog</h1>
        <p className="text-gray-500 text-lg">Parenting tips, sizing guides, and the latest kids fashion trends.</p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">✍️</p>
          <p>No posts yet — check back soon!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link key={post.slug} href={'/blog/' + post.slug}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 card-hover flex flex-col">
              {post.cover_image && (
                <div className="aspect-video bg-cream overflow-hidden">
                  <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <p className="text-xs text-gray-400 mb-2">{formatPakistanDate(post.published_at)}</p>
                <h2 className="font-display text-lg text-charcoal leading-tight mb-2">{post.title}</h2>
                {post.excerpt && (
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{post.excerpt}</p>
                )}
                <span className="text-coral text-sm font-semibold mt-auto pt-3">Read more →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
