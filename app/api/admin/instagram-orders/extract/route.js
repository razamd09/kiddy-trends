const EXTRACTION_MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM_PROMPT = `You extract structured order information from a pasted Instagram DM conversation between a kids clothing shop (Kiddy Trends) and a customer. Read the conversation and pull out: the customer's name, phone number, city, full delivery address, a brief description of what they ordered, how many pieces total, and the total COD (cash on delivery) amount in PKR.

Respond with ONLY a JSON object, no other text before or after, in exactly this shape:
{"customerName": "", "customerPhone": "", "cityName": "", "deliveryAddress": "", "orderDetail": "", "items": 1, "invoicePayment": 0}

If something isn't clearly stated in the conversation, leave it as an empty string (or 0 for invoicePayment, 1 for items) rather than guessing.`

export async function POST(request) {
    if (!process.env.ANTHROPIC_API_KEY) {
        return Response.json({ success: false, error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 })
    }

    try {
        const { chatText } = await request.json()
        if (!chatText || !chatText.trim()) {
            return Response.json({ success: false, error: 'chatText is required' }, { status: 400 })
        }

        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: EXTRACTION_MODEL,
                max_tokens: 500,
                system: SYSTEM_PROMPT,
                messages: [{ role: 'user', content: chatText.trim().slice(0, 8000) }],
            }),
        })

        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            return Response.json({ success: false, error: data?.error?.message || ('Extraction failed (' + res.status + ')') }, { status: 502 })
        }

        const rawText = data?.content?.[0]?.text || ''
        let extracted
        try {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/)
            extracted = JSON.parse(jsonMatch ? jsonMatch[0] : rawText)
        } catch {
            return Response.json({ success: false, error: 'Could not parse extraction result', raw: rawText }, { status: 502 })
        }

        return Response.json({
            success: true,
            extracted: {
                customerName: String(extracted.customerName || ''),
                customerPhone: String(extracted.customerPhone || ''),
                cityName: String(extracted.cityName || ''),
                deliveryAddress: String(extracted.deliveryAddress || ''),
                orderDetail: String(extracted.orderDetail || ''),
                items: Number(extracted.items) || 1,
                invoicePayment: Number(extracted.invoicePayment) || 0,
            },
        })
    } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 500 })
    }
}
