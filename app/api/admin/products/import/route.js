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
    const title = cleanText(row['Title'])
    if (!handle || !title) return null

    const image = cleanText(row['Image Src'])
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
        title,
        description,
        price,
        compare_price: comparePrice > 0 ? comparePrice : null,
        images: image ? [image] : [],
        category,
        product_type: productType,
        tags: parseTags(row['Tags']),
        variants,
        stock,
        is_active: isActive,
        source: 'shopify_csv',
        shopify_handle: handle,
    }
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

        const mapped = rows
            .map(mapShopifyRow)
            .filter(Boolean)

        if (mapped.length === 0) {
            return Response.json({ success: false, error: 'No valid product rows found' }, { status: 400 })
        }

        const handles = mapped.map(p => p.shopify_handle)
        const { data: existing, error: existingError } = await supabase
            .from('products')
            .select('id, shopify_handle')
            .in('shopify_handle', handles)

        if (existingError) {
            return Response.json({ success: false, error: existingError.message }, { status: 500 })
        }

        const existingMap = new Map((existing || []).map(p => [p.shopify_handle, p.id]))
        const errors = []
        let inserted = 0
        let updated = 0

        for (const product of mapped) {
            const existingId = existingMap.get(product.shopify_handle)
            if (existingId) {
                const { error } = await supabase
                    .from('products')
                    .update({ ...product, updated_at: new Date().toISOString() })
                    .eq('id', existingId)
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

        return Response.json({
            success: true,
            summary: {
                totalRows: rows.length,
                validProducts: mapped.length,
                inserted,
                updated,
                failed: errors.length,
                errors: errors.slice(0, 20),
            },
        })
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
