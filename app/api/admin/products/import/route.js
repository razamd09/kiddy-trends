import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

function parseCsv(text) {
    const rows = []
    let row = []
    let value = ''
    let inQuotes = false

    for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        const next = text[i + 1]

        if (ch === '"') {
            if (inQuotes && next === '"') {
                value += '"'
                i++
            } else {
                inQuotes = !inQuotes
            }
            continue
        }

        if (ch === ',' && !inQuotes) {
            row.push(value)
            value = ''
            continue
        }

        if ((ch === '\n' || ch === '\r') && !inQuotes) {
            if (ch === '\r' && next === '\n') i++
            row.push(value)
            rows.push(row)
            row = []
            value = ''
            continue
        }

        value += ch
    }

    if (value.length > 0 || row.length > 0) {
        row.push(value)
        rows.push(row)
    }

    if (rows.length === 0) return []

    const headers = rows[0].map(h => String(h || '').trim())
    const dataRows = rows.slice(1).filter(r => r.some(c => String(c || '').trim() !== ''))

    return dataRows.map(r => {
        const obj = {}
        for (let i = 0; i < headers.length; i++) {
            obj[headers[i]] = r[i] ?? ''
        }
        return obj
    })
}

function toNumber(value, fallback = 0) {
    const n = Number(String(value || '').trim())
    return Number.isFinite(n) ? n : fallback
}

function parseBoolean(value) {
    return String(value || '').trim().toLowerCase() === 'true'
}

function cleanText(value) {
    return String(value || '')
        .replace(/^\uFEFF/, '')
        .replace(/Â/g, '')
        .trim()
}

function parseTags(value) {
    return String(value || '')
        .split(',')
        .map(v => v.trim())
        .filter(Boolean)
}

function mapShopifyRow(row) {
    const handle = cleanText(row['Handle'])
    if (!handle) return null

    const title = cleanText(row['Title'])
    const image = cleanText(row['Image Src'])
    const variantImage = cleanText(row['Variant Image'])
    const price = toNumber(row['Variant Price'], 0)
    const comparePrice = toNumber(row['Variant Compare At Price'], 0)
    const stock = toNumber(row['Variant Inventory Qty'], 0)
    const published = parseBoolean(row['Published'])
    const status = cleanText(row['Status']).toLowerCase()
    const isActive = status ? status === 'active' : published

    const description = cleanText(row['Body (HTML)'])
    const category = cleanText(row['Product Category']) || cleanText(row['Type']) || 'Uncategorized'
    const productType = cleanText(row['Type']) || cleanText(row['Product Category']) || ''

    const variants = [{
        sku: cleanText(row['Variant SKU']),
        barcode: cleanText(row['Variant Barcode']),
        inventory_tracker: cleanText(row['Variant Inventory Tracker']),
        inventory_qty: stock,
        inventory_policy: cleanText(row['Variant Inventory Policy']),
        option1_name: cleanText(row['Option1 Name']),
        option1_value: cleanText(row['Option1 Value']),
        option2_name: cleanText(row['Option2 Name']),
        option2_value: cleanText(row['Option2 Value']),
        option3_name: cleanText(row['Option3 Name']),
        option3_value: cleanText(row['Option3 Value']),
        grams: toNumber(row['Variant Grams'], 0),
    }]

    return {
        handle,
        title,
        description,
        price,
        compare_price: comparePrice > 0 ? comparePrice : null,
        images: [image, variantImage].filter(Boolean),
        category,
        product_type: productType,
        tags: parseTags(row['Tags']),
        variants,
        stock,
        is_active: isActive,
        source: 'shopify_csv'
    }
}

function mergeRowsByHandle(rows) {
    const byHandle = new Map()

    for (const row of rows) {
        const mapped = mapShopifyRow(row)
        if (!mapped) continue

        const existing = byHandle.get(mapped.handle)
        if (!existing) {
            byHandle.set(mapped.handle, {
                title: mapped.title || mapped.handle,
                description: mapped.description || '',
                price: mapped.price || 0,
                compare_price: mapped.compare_price || null,
                images: [...mapped.images],
                category: mapped.category || 'Uncategorized',
                product_type: mapped.product_type || '',
                tags: [...mapped.tags],
                variants: [...mapped.variants],
                stock: mapped.stock || 0,
                is_active: mapped.is_active,
                source: 'shopify_csv',
                shopify_handle: mapped.handle,
            })
            continue
        }

        if (!existing.title && mapped.title) existing.title = mapped.title
        if (!existing.description && mapped.description) existing.description = mapped.description
        if (!existing.category && mapped.category) existing.category = mapped.category
        if (!existing.product_type && mapped.product_type) existing.product_type = mapped.product_type

        if (existing.price === 0 && mapped.price > 0) existing.price = mapped.price
        if (!existing.compare_price && mapped.compare_price) existing.compare_price = mapped.compare_price

        if (mapped.images.length > 0) {
            existing.images = Array.from(new Set([...existing.images, ...mapped.images]))
        }
        if (mapped.tags.length > 0) {
            existing.tags = Array.from(new Set([...existing.tags, ...mapped.tags]))
        }
        if (mapped.variants.length > 0) {
            existing.variants.push(...mapped.variants)
        }

        existing.stock = (existing.stock || 0) + (mapped.stock || 0)
        existing.is_active = existing.is_active || mapped.is_active
    }

    return Array.from(byHandle.values()).filter(p => p.shopify_handle && p.title)
}

function chunkArray(values, chunkSize) {
    const chunks = []
    for (let i = 0; i < values.length; i += chunkSize) {
        chunks.push(values.slice(i, i + chunkSize))
    }
    return chunks
}

async function fetchExistingProductsByHandles(handles) {
    const uniqueHandles = Array.from(new Set(handles.filter(Boolean)))
    if (uniqueHandles.length === 0) return []

    const results = []
    const chunks = chunkArray(uniqueHandles, 100)

    for (const chunk of chunks) {
        const { data, error } = await supabase
            .from('products')
            .select('id, shopify_handle, images')
            .in('shopify_handle', chunk)

        if (error) {
            throw new Error(error.message)
        }

        if (data?.length) results.push(...data)
    }

    return results
}

export async function POST(request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file')

        if (!file) {
            return Response.json({ success: false, error: 'CSV file is required' }, { status: 400 })
        }

        const csvText = await file.text()
        const rows = parseCsv(csvText)
        if (rows.length === 0) {
            return Response.json({ success: false, error: 'CSV is empty or invalid' }, { status: 400 })
        }

        const mapped = mergeRowsByHandle(rows)

        if (mapped.length === 0) {
            return Response.json({ success: false, error: 'No valid product rows found' }, { status: 400 })
        }

        const handles = mapped.map(p => p.shopify_handle)
        const existing = await fetchExistingProductsByHandles(handles)

        const existingMap = new Map((existing || []).map(p => [p.shopify_handle, p]))
        const errors = []
        let inserted = 0
        let updated = 0

        for (const product of mapped) {
            const existingRecord = existingMap.get(product.shopify_handle)
            if (existingRecord) {
                const safeImages = (product.images && product.images.length > 0)
                    ? product.images
                    : (Array.isArray(existingRecord.images) ? existingRecord.images : [])

                const { error } = await supabase
                    .from('products')
                    .update({ ...product, images: safeImages, updated_at: new Date().toISOString() })
                    .eq('id', existingRecord.id)
                if (error) {
                    errors.push({ handle: product.shopify_handle, error: error.message })
                } else {
                    updated++
                }
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([product])
                if (error) {
                    errors.push({ handle: product.shopify_handle, error: error.message })
                } else {
                    inserted++
                }
            }
        }

        const summary = {
            totalRows: rows.length,
            validProducts: mapped.length,
            inserted,
            updated,
            failed: errors.length,
            errors: errors.slice(0, 20),
        }

        if (inserted === 0 && updated === 0 && errors.length > 0) {
            return Response.json({
                success: false,
                error: 'Import failed for all rows',
                summary,
            }, { status: 500 })
        }

        return Response.json({ success: true, summary })
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
