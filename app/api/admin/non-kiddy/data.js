import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

// Mirrors getCampaignRecipients (customer-data.js) for the same picker UX
// on the WhatsApp broadcast page, but reading from non_kiddy_contacts
// instead of customers — a completely separate recipient pool with its own
// cooldown tracking, never mixed with real order-customer data.
export async function getNonKiddyRecipients(page, groupId, queryText = '', sortBy = 'created_at', sortDir = 'desc', tab = 'eligible', cooldownCutoffISO = null) {
    const safePage = Math.max(1, Number(page || 1))
    const search = String(queryText || '').trim()
    const limit = 30
    const offset = (safePage - 1) * limit
    const column = sortBy === 'last_sent' ? 'last_campaign_sent_at' : (sortBy === 'name' ? 'name' : 'created_at')
    const ascending = sortDir === 'asc'

    let query = supabase
        .from('non_kiddy_contacts')
        .select('id, name, phone, group_id, last_campaign_sent_at, non_kiddy_groups(name)', { count: 'exact' })
        .order(column, { ascending, nullsFirst: sortBy === 'last_sent' ? ascending : undefined })
        .range(offset, offset + limit - 1)

    if (groupId) query = query.eq('group_id', groupId)

    if (tab === 'sent') {
        query = query.not('last_campaign_sent_at', 'is', null)
    } else if (cooldownCutoffISO) {
        query = query.or('last_campaign_sent_at.is.null,last_campaign_sent_at.lt.' + cooldownCutoffISO)
    }

    if (search) {
        query = query.or('name.ilike.%' + search + '%,phone.ilike.%' + search + '%')
    }

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    return { contacts: data || [], total: count || 0, page: safePage, pageSize: limit }
}
