import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatPakistanDate } from '../../../lib/dateFormat'

const SITE_URL = 'https://thekiddytrends.com'

function stripHtml(html) {
  return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function getPost(slug) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    )
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()

    return error ? null : data
  } catch {
    return null
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return { title: 'Post Not Found | Kiddy Trends' }
  }

  const description = post.excerpt || stripHtml(post.content).slice(0, 155)

  return {
    title: post.title + ' | Kiddy Trends Blog',
    description,
    alternates: { canonical: '/blog/' + slug },
    openGraph: {
      title: post.title,
      description,
      url: SITE_URL + '/blog/' + slug,
      type: 'article',
      images: post.cover_image ? [{ url: post.cover_image }] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || stripHtml(post.content).slice(0, 300),
    image: post.cover_image || undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { '@type': 'Organization', name: 'Kiddy Trends' },
    publisher: { '@type': 'Organization', name: 'Kiddy Trends', logo: { '@type': 'ImageObject', url: SITE_URL + '/logo.jpg' } },
    mainEntityOfPage: SITE_URL + '/blog/' + slug,
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/" className="hover:text-coral transition-colors">Home</Link>
        <span>›</span>
        <Link href="/blog" className="hover:text-coral transition-colors">Blog</Link>
      </nav>

      {post.cover_image && (
        <div className="aspect-video bg-cream rounded-3xl overflow-hidden mb-8">
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <p className="text-sm text-gray-400 mb-3">{formatPakistanDate(post.published_at)}</p>
      <h1 className="font-display text-3xl md:text-4xl text-charcoal leading-tight mb-8">{post.title}</h1>

      <div
        className="text-gray-600 leading-relaxed [&_p]:mb-4 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-charcoal [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:font-display [&_h3]:text-xl [&_h3]:text-charcoal [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_a]:text-coral [&_a]:underline [&_img]:rounded-2xl [&_img]:my-4"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <div className="mt-12 pt-8 border-t border-gray-100 text-center">
        <Link href="/blog" className="text-coral font-semibold hover:underline">← Back to Blog</Link>
      </div>
    </div>
  )
}
