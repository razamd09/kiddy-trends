import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export function normalizePhone(value) {
    const raw = String(value || '').trim()
    if (!raw) return ''

    const digits = raw.replace(/\D/g, '')
    if (!digits) return ''
    if (digits.startsWith('92')) return '+' + digits
    if (digits.startsWith('0')) return '+92' + digits.slice(1)
    if (digits.length === 10) return '+92' + digits
    return '+' + digits
}

export function normalizeOrderSource(value) {
    const normalizedValue = String(value || '').trim().toLowerCase()
    if (normalizedValue === 'insta' || normalizedValue === 'instagram') return 'Insta'
    if (normalizedValue === 'facebook' || normalizedValue === 'fb') return 'Facebook'
    if (normalizedValue === 'whatsapp' || normalizedValue === 'wa') return 'Whatsapp'
    if (normalizedValue === 'website' || normalizedValue === 'web' || normalizedValue === 'site') return 'Website'
    return 'Website'
}

function splitName(name) {
    const normalized = String(name || '').trim().replace(/\s+/g, ' ')
    if (!normalized) return { first_name: '', last_name: '' }
    const parts = normalized.split(' ')
    const firstName = parts.shift() || ''
    const lastName = parts.join(' ')
    return { first_name: firstName, last_name: lastName }
}

function hasMissingNames(rows) {
    return (rows || []).some((row) => !String(row?.first_name || '').trim() && !String(row?.last_name || '').trim())
}

const ORDER_SOURCE_MISSING_FRAGMENT = 'order_source'
const ON_CONFLICT_CONSTRAINT_FRAGMENT = 'no unique or exclusion constraint matching the on conflict specification'

function isOrderSourceMissingError(error) {
    const message = String(error?.message || '').toLowerCase()
    return message.includes(ORDER_SOURCE_MISSING_FRAGMENT)
}

function isOnConflictConstraintError(error) {
    const message = String(error?.message || '').toLowerCase()
    return message.includes(ON_CONFLICT_CONSTRAINT_FRAGMENT)
}

function removeOrderSource(row) {
    const { order_source, ...rest } = row
    return rest
}

function createInsertPayload(row, includeOrderSource) {
    if (includeOrderSource) return row
    return removeOrderSource(row)
}

function createUpdatePayload(row, includeOrderSource) {
    const insertPayload = createInsertPayload(row, includeOrderSource)
    const { phone, ...updatePayload } = insertPayload
    return updatePayload
}

async function mergeCustomersWithoutPhoneConstraint(rows, includeOrderSource) {
    const phones = [...new Set(rows.map((row) => row.phone).filter(Boolean))]
    const existingPhones = new Set()
    const lookupChunkSize = 200

    for (let i = 0; i < phones.length; i += lookupChunkSize) {
        const chunk = phones.slice(i, i + lookupChunkSize)
        const { data, error } = await supabase
            .from('customers')
            .select('phone')
            .in('phone', chunk)

        if (error) return error
        for (const customer of data || []) {
            existingPhones.add(customer.phone)
        }
    }

    for (const row of rows) {
        if (existingPhones.has(row.phone)) {
            const updatePayload = createUpdatePayload(row, includeOrderSource)
            const { error } = await supabase
                .from('customers')
                .update(updatePayload)
                .eq('phone', row.phone)

            if (error) return error
            continue
        }

        const insertPayload = createInsertPayload(row, includeOrderSource)
        const { error } = await supabase
            .from('customers')
            .insert([insertPayload])

        if (!error) {
            existingPhones.add(row.phone)
            continue
        }

        if (error.code === '23505') {
            const updatePayload = createUpdatePayload(row, includeOrderSource)
            const retryUpdate = await supabase
                .from('customers')
                .update(updatePayload)
                .eq('phone', row.phone)

            if (retryUpdate.error) return retryUpdate.error
            existingPhones.add(row.phone)
            continue
        }

        return error
    }

    return null
}

async function fetchCustomersPage(page, queryText) {
    const limit = 30
    const offset = (page - 1) * limit

    let query = supabase
        .from('customers')
        .select('id, first_name, last_name, phone, created_at, updated_at', { count: 'exact' })
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (queryText) {
        query = query.or('first_name.ilike.%' + queryText + '%,last_name.ilike.%' + queryText + '%,phone.ilike.%' + queryText + '%')
    }

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    return {
        customers: data || [],
        total: count || 0,
        pageSize: limit,
    }
}

export function normalizeCsvRow(row) {
    const firstName = String(row?.first_name || row?.firstName || row?.first || '').trim()
    const lastName = String(row?.last_name || row?.lastName || row?.last || '').trim()
    const phone = normalizePhone(row?.phone || row?.whatsapp || row?.mobile || '')
    if (!phone) return null
    return {
        first_name: firstName,
        last_name: lastName,
        phone,
        order_source: normalizeOrderSource(row?.order_source || row?.orderSource || row?.source),
        updated_at: new Date().toISOString(),
    }
}

export async function upsertCustomers(rows) {
    if (!rows?.length) return null

    const firstAttempt = await supabase
        .from('customers')
        .upsert(rows, { onConflict: 'phone' })

    if (!firstAttempt.error) return null

    if (isOnConflictConstraintError(firstAttempt.error)) {
        return mergeCustomersWithoutPhoneConstraint(rows, true)
    }

    if (!isOrderSourceMissingError(firstAttempt.error)) return firstAttempt.error

    const fallbackRows = rows.map(removeOrderSource)

    const fallback = await supabase
        .from('customers')
        .upsert(fallbackRows, { onConflict: 'phone' })

    if (!fallback.error) return null

    if (isOnConflictConstraintError(fallback.error)) {
        return mergeCustomersWithoutPhoneConstraint(fallbackRows, false)
    }

    return fallback.error
}

async function buildCustomersFromOrders() {
    const pageSize = 1000
    let from = 0
    const byPhone = new Map()

    while (true) {
        const { data, error } = await supabase
            .from('orders')
            .select('customer_name, customer_phone, customer_whatsapp, created_at')
            .order('created_at', { ascending: false })
            .range(from, from + pageSize - 1)

        if (error) throw new Error(error.message)
        if (!data || data.length === 0) break

        data.forEach((order) => {
            const phone = normalizePhone(order.customer_whatsapp || order.customer_phone || '')
            if (!phone || byPhone.has(phone)) return
            const name = splitName(order.customer_name)
            byPhone.set(phone, {
                ...name,
                phone,
                order_source: 'Website',
                updated_at: new Date().toISOString(),
            })
        })

        if (data.length < pageSize) break
        from += pageSize
    }

    return [...byPhone.values()]
}

export async function backfillCustomersFromOrders() {
    const rows = await buildCustomersFromOrders()
    if (rows.length === 0) return 0

    const error = await upsertCustomers(rows)
    if (error) throw new Error(error.message)

    return rows.length
}

export async function getCustomersPage(page, queryText = '') {
    const safePage = Math.max(1, Number(page || 1))
    const search = String(queryText || '').trim()

    let result = await fetchCustomersPage(safePage, search)

    if (!search && safePage === 1 && (result.total === 0 || hasMissingNames(result.customers))) {
        try {
            const imported = await backfillCustomersFromOrders()
            if (imported > 0) {
                result = await fetchCustomersPage(safePage, search)
            }
        } catch {
            // Keep the current response if background backfill fails.
        }
    }

    return {
        customers: result.customers,
        total: result.total,
        page: safePage,
        pageSize: result.pageSize,
    }
}
