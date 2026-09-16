import { createClient } from '@supabase/supabase-js'

const SITE_URL = 'https://thekiddytrends.com'
const DRAFT_SOURCE = 'draft_workspace'
const MAX_ADDITIONAL_IMAGES = 10

// Mirrors the (minimal) image-normalization logic in app/api/products/route.js.
// Duplicated on purpose rather than imported, so this feed route stays fully
// self-contained and a change here can never affect the main products API.
function collectImageUrls(value, urls) {
    if (Array.isArray(value)) {
        value.forEach((item) => collectImageUrls(item, urls))
        return urls
    }
    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed) return urls
        try {
            const parsed = JSON.parse(trimmed)
            if (parsed && parsed !== value) {
                collectImageUrls(parsed, urls)
                return urls
            }
        } catch {}
        if (trimmed.includes('\n')) {
            trimmed.split('\n').map((entry) => entry.trim()).filter(Boolean).forEach((entry) => urls.push(entry))
            return urls
        }
        urls.push(trimmed)
        return urls
    }
    if (value && typeof value === 'object') {
        const directFields = [value.src, value.url, value.image, value.path, value.publicUrl, value.signedUrl, value.original, value.originalUrl, value.editedUrl]
        const hadDirectField = directFields.some((entry) => typeof entry === 'string' && entry.trim())
        if (hadDirectField) {
            directFields.forEach((entry) => collectImageUrls(entry, urls))
            return urls
        }
        if (Array.isArray(value.images)) collectImageUrls(value.images, urls)
    }
    return urls
}

function normalizeImages(images) {
    return Array.from(new Set(collectImageUrls(images, []).filter(Boolean)))
}

function toImageProxyUrl(src) {
    const trimmed = String(src || '').trim()
    if (!trimmed) return ''
    return SITE_URL + '/api/image?src=' + encodeURIComponent(trimmed)
}

function stripHtml(html) {
    return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function normalizeDisplayTitle(rawTitle) {
    return String(rawTitle || '')
        .replace(/^\s*#?\s*Kids\s+Affordable\s+Collection\s*(?:2026)?\s*[:\-]*\s*/i, '')
        .replace(/^\s*#\s*/, '')
        .replace(/\s+/g, ' ')
        .trim()
}

function escapeXml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function buildItemXml(product) {
    const displayTitle = normalizeDisplayTitle(product.title)
    const images = normalizeImages(product.images)
    if (!displayTitle || images.length === 0) return ''

    const link = SITE_URL + '/products/prd_id=' + product.id
    const imageLink = toImageProxyUrl(images[0])
    const additionalImages = images.slice(1, 1 + MAX_ADDITIONAL_IMAGES)
    const price = Math.round(Number(product.price) || 0)
    if (price <= 0) return ''

    const inStock = Number(product.stock) > 0
    const description = stripHtml(product.description).slice(0, 5000)
        || 'Shop ' + displayTitle + ' at Kiddy Trends — cute, affordable kids clothing with Cash on Delivery across Pakistan.'
    const brand = product?.product_brands?.name || 'Kiddy Trends'
    const productType = product.product_type || product.category || ''

    return [
        '  <item>',
        '    <g:id>' + escapeXml(product.id) + '</g:id>',
        '    <title>' + escapeXml(displayTitle) + '</title>',
        '    <description>' + escapeXml(description) + '</description>',
        '    <link>' + escapeXml(link) + '</link>',
        '    <g:image_link>' + escapeXml(imageLink) + '</g:image_link>',
        ...additionalImages.map((src) => '    <g:additional_image_link>' + escapeXml(toImageProxyUrl(src)) + '</g:additional_image_link>'),
        '    <g:availability>' + (inStock ? 'in stock' : 'out of stock') + '</g:availability>',
        '    <g:price>' + price + '.00 PKR</g:price>',
        '    <g:condition>new</g:condition>',
        '    <g:brand>' + escapeXml(brand) + '</g:brand>',
        productType ? '    <g:product_type>' + escapeXml(productType) + '</g:product_type>' : '',
        '    <g:identifier_exists>no</g:identifier_exists>',
    ].filter(Boolean).join('\n')
}

export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        )

        const { data, error } = await supabase
            .from('products')
            .select('id, title, description, price, stock, images, product_type, category, product_brands(name)')
            .eq('is_active', true)
            .or('source.is.null,source.neq.' + DRAFT_SOURCE)
            .limit(5000)

        if (error) {
            return new Response('Feed generation failed: ' + error.message, { status: 500 })
        }

        const items = (data || [])
            .map(buildItemXml)
            .filter(Boolean)
            .join('\n')

        const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
            + '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n'
            + '<channel>\n'
            + '  <title>Kiddy Trends</title>\n'
            + '  <link>' + SITE_URL + '</link>\n'
            + '  <description>Kids clothing, bedding, bags and accessories in Pakistan</description>\n'
            + items + '\n'
            + '</channel>\n'
            + '</rss>\n'

        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=UTF-8',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            },
        })
    } catch (error) {
        return new Response('Feed generation failed: ' + error.message, { status: 500 })
    }
}
