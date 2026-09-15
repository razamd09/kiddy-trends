import { createClient } from '@supabase/supabase-js'
import { sendEmailWithEmailJs } from '../admin/customers/customer-data'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim().toLowerCase())
}

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}))
        const email = String(body?.email || '').trim().toLowerCase()

        if (!isValidEmail(email)) {
            return Response.json({ success: false, error: 'Please enter a valid email address' }, { status: 400 })
        }

        const { data: existing } = await supabase
            .from('newsletter_subscribers')
            .select('id')
            .eq('email', email)
            .maybeSingle()

        if (!existing) {
            const { error: insertError } = await supabase
                .from('newsletter_subscribers')
                .insert([{ email, source: 'homepage' }])

            if (insertError) {
                return Response.json({ success: false, error: insertError.message }, { status: 500 })
            }

            try {
                await sendEmailWithEmailJs(
                    email,
                    "You're on the list! 🎉",
                    "Thanks for signing up for Kiddy Trends updates! You'll be the first to know about new arrivals, seasonal collections, and exclusive deals. Shop now at thekiddytrends.com"
                )
            } catch {
                // Subscription is saved even if the welcome email fails to send.
            }
        }

        return Response.json({ success: true, alreadySubscribed: Boolean(existing) })
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
