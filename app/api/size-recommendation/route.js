import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

function parseInteger(value) {
    const parsed = Number.parseInt(String(value), 10)
    return Number.isInteger(parsed) ? parsed : null
}

export async function POST(request) {
    try {
        const body = await request.json()
        const years = parseInteger(body.years)
        const months = parseInteger(body.months)

        if (years === null || years < 0 || years > 18) {
            return Response.json({ error: 'years must be an integer between 0 and 18' }, { status: 400 })
        }

        if (months === null || months < 0 || months > 11) {
            return Response.json({ error: 'months must be an integer between 0 and 11' }, { status: 400 })
        }

        const totalMonths = (years * 12) + months

        const { data, error } = await supabase
            .from('kid_size_chart')
            .select('age_label, min_months, max_months, shirt_size, bottom_size, weight_range')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

        if (error) {
            return Response.json({ error: error.message }, { status: 500 })
        }

        if (!data || data.length === 0) {
            return Response.json(
                { error: 'No size chart data found. Please add rows to kid_size_chart first.' },
                { status: 404 }
            )
        }

        const exactMatch = data.find((row) => totalMonths >= row.min_months && totalMonths <= row.max_months)
        const nextSizeUp = data.find((row) => totalMonths < row.min_months)
        const fallbackLast = data[data.length - 1]

        const recommended = exactMatch || nextSizeUp || fallbackLast
        const matchType = exactMatch ? 'exact' : (nextSizeUp ? 'size_up_fallback' : 'max_range_fallback')

        return Response.json({
            input: { years, months, total_months: totalMonths },
            recommendation: recommended,
            match_type: matchType,
        })
    } catch (err) {
        return Response.json({ error: err.message || 'Invalid request' }, { status: 400 })
    }
}
