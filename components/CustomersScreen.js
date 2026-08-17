'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function parseCsv(text) {
    const rows = []
    let current = ''
    let row = []
    let inQuotes = false

    for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        const next = text[i + 1]

        if (ch === '"') {
            if (inQuotes && next === '"') {
                current += '"'
                i++
            } else {
                inQuotes = !inQuotes
            }
            continue
        }

        if (ch === ',' && !inQuotes) {
            row.push(current)
            current = ''
            continue
        }

        if ((ch === '\n' || ch === '\r') && !inQuotes) {
            if (ch === '\r' && next === '\n') i++
            row.push(current)
            if (row.some((v) => String(v || '').trim() !== '')) rows.push(row)
            row = []
            current = ''
            continue
        }

        current += ch
    }

    if (current.length > 0 || row.length > 0) {
        row.push(current)
        if (row.some((v) => String(v || '').trim() !== '')) rows.push(row)
    }

    return rows
}

function normalizeHeader(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function looksLikePhone(value) {
    const digits = String(value || '').replace(/\D/g, '')
    return digits.length >= 10 && digits.length <= 14
}

function mapCsvToCustomers(text) {
    const table = parseCsv(text)
    if (!table.length) return []

    const header = table[0].map(normalizeHeader)
    const firstIdx = header.findIndex((h) => h === 'firstname' || h === 'first_name' || h === 'first')
    const lastIdx = header.findIndex((h) => h === 'lastname' || h === 'last_name' || h === 'last')
    const phoneIdx = header.findIndex((h) => h === 'phone' || h === 'phonenumber' || h === 'mobile' || h === 'whatsapp' || h === 'number')

    const hasHeader = firstIdx >= 0 || lastIdx >= 0 || phoneIdx >= 0
    const start = hasHeader ? 1 : 0

    let firstCol = hasHeader ? firstIdx : 0
    let lastCol = hasHeader ? lastIdx : 1
    let phoneCol = hasHeader ? phoneIdx : 2

    if (!hasHeader) {
        const sampleRow = table.find((row) => row.some((cell) => String(cell || '').trim() !== '')) || []
        const samplePhoneIdx = sampleRow.findIndex((cell) => looksLikePhone(cell))

        if (samplePhoneIdx >= 0) {
            phoneCol = samplePhoneIdx
            const remaining = [0, 1, 2].filter((idx) => idx !== phoneCol)
            firstCol = remaining[0] ?? 0
            lastCol = remaining[1] ?? 1
        }
    }

    const rows = []
    for (let i = start; i < table.length; i++) {
        const r = table[i]
        rows.push({
            first_name: firstCol >= 0 ? String(r[firstCol] || '').trim() : '',
            last_name: lastCol >= 0 ? String(r[lastCol] || '').trim() : '',
            phone: phoneCol >= 0 ? String(r[phoneCol] || '').trim() : '',
        })
    }
    return rows
}

export default function CustomersScreen({ mode = 'admin' }) {
    const [verified, setVerified] = useState(false)
    const [loading, setLoading] = useState(true)
    const [customers, setCustomers] = useState([])
    const [query, setQuery] = useState('')
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [statusMessage, setStatusMessage] = useState('')
    const [promotionSubject, setPromotionSubject] = useState('')
    const [whatsappMessage, setWhatsappMessage] = useState('')
    const [localSenderUrl, setLocalSenderUrl] = useState('')
    const [localApiKey, setLocalApiKey] = useState('')
    const [syncingOrders, setSyncingOrders] = useState(false)
    const [importingCsv, setImportingCsv] = useState(false)
    const [sendingPromotion, setSendingPromotion] = useState(false)
    const [sendingWhatsAppPromotion, setSendingWhatsAppPromotion] = useState(false)
    const [campaignProgress, setCampaignProgress] = useState(null) // { total, sent, failed, done }
    const [csvName, setCsvName] = useState('')
    const fileRef = useRef(null)
    const pollRef = useRef(null)
    const router = useRouter()
    const pageSize = 30
    const isAdmin = mode === 'admin'
    const apiPath = isAdmin ? '/api/admin/customers' : '/api/employee/customers'
    const backHref = isAdmin ? '/admin/dashboard' : '/employee/dashboard'

    // Remember the local sender URL + API key in this browser so you don't
    // have to retype them every time you start a new campaign.
    useEffect(() => {
        setLocalSenderUrl(localStorage.getItem('wa_local_sender_url') || '')
        setLocalApiKey(localStorage.getItem('wa_local_api_key') || '')
    }, [])

    useEffect(() => {
        if (localSenderUrl) localStorage.setItem('wa_local_sender_url', localSenderUrl)
    }, [localSenderUrl])

    useEffect(() => {
        if (localApiKey) localStorage.setItem('wa_local_api_key', localApiKey)
    }, [localApiKey])

    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current)
        }
    }, [])

    useEffect(() => {
        async function verify() {
            if (!isAdmin) {
                const employee = localStorage.getItem('employee')
                if (!employee) {
                    router.push('/admin')
                    return
                }
                setVerified(true)
                return
            }

            const token = localStorage.getItem('admin_token')
            if (!token) {
                router.push('/admin')
                return
            }

            try {
                const res = await fetch('/api/admin/auth', { headers: { 'x-admin-token': token } })
                const data = await res.json()
                if (!data.valid) {
                    localStorage.removeItem('admin_token')
                    router.push('/admin')
                    return
                }
                setVerified(true)
            } catch {
                router.push('/admin')
            }
        }

        verify()
    }, [isAdmin, router])

    useEffect(() => {
        if (!verified) return
        loadCustomers()
    }, [verified, page])

    async function loadCustomers(search = query, forcedPage = page) {
        setLoading(true)
        setStatusMessage('')

        const headers = {}
        if (isAdmin) {
            const token = localStorage.getItem('admin_token')
            if (!token) {
                router.push('/admin')
                return
            }
            headers['x-admin-token'] = token
        }

        try {
            const params = new URLSearchParams({ page: String(forcedPage) })
            if (search.trim()) params.set('q', search.trim())

            const res = await fetch(apiPath + '?' + params.toString(), { headers })
            const data = await res.json().catch(() => ({}))

            if (!res.ok) throw new Error(data?.error || 'Failed to load customers')

            setCustomers(data.customers || [])
            setTotal(data.total || 0)
        } catch (error) {
            setCustomers([])
            setTotal(0)
            setStatusMessage(error.message || 'Failed to load customers')
        }
        setLoading(false)
    }

    async function syncFromOrders() {
        const token = localStorage.getItem('admin_token')
        if (!token) return

        setSyncingOrders(true)
        setStatusMessage('')
        try {
            const res = await fetch('/api/admin/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token,
                },
                body: JSON.stringify({ action: 'backfill-orders' }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data?.error || 'Failed to sync customers from orders')

            setStatusMessage('Imported ' + (data.imported || 0) + ' customers from orders')
            await loadCustomers(query, 1)
            setPage(1)
        } catch (error) {
            setStatusMessage(error.message || 'Failed to sync customers from orders')
        }
        setSyncingOrders(false)
    }

    function triggerCsvPicker() {
        fileRef.current?.click()
    }

    async function uploadCsv(e) {
        const file = e.target.files?.[0]
        if (!file) return

        const token = localStorage.getItem('admin_token')
        if (!token) return

        setImportingCsv(true)
        setStatusMessage('')
        setCsvName(file.name)

        try {
            const text = await file.text()
            const rows = mapCsvToCustomers(text)
            if (!rows.length) throw new Error('No rows found in CSV')

            const batchSize = 200
            let importedTotal = 0

            for (let i = 0; i < rows.length; i += batchSize) {
                const chunk = rows.slice(i, i + batchSize)
                const res = await fetch('/api/admin/customers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-admin-token': token,
                    },
                    body: JSON.stringify({ action: 'import-csv', rows: chunk }),
                })
                const data = await res.json().catch(() => ({}))
                if (!res.ok) throw new Error(data?.error || 'CSV import failed')
                importedTotal += Number(data.imported || 0)
            }

            setStatusMessage('CSV import complete. Added/updated ' + importedTotal + ' customers')
            await loadCustomers(query, 1)
            setPage(1)
        } catch (error) {
            setStatusMessage(error.message || 'Failed to import CSV')
        }

        e.target.value = ''
        setImportingCsv(false)
    }

    async function sendPromotionEmails() {
        const subject = promotionSubject.trim()
        if (!subject) {
            setStatusMessage('Subject is required')
            return
        }

        let employeeId = ''
        const headers = { 'Content-Type': 'application/json' }
        if (isAdmin) {
            const token = localStorage.getItem('admin_token')
            if (!token) {
                router.push('/admin')
                return
            }
            headers['x-admin-token'] = token
        } else {
            const employee = JSON.parse(localStorage.getItem('employee') || '{}')
            employeeId = employee.employee_id || ''
            if (!employeeId) {
                router.push('/admin')
                return
            }
        }

        setSendingPromotion(true)
        setStatusMessage('')

        try {
            const payload = {
                action: 'send-promotions-email',
                subject,
            }
            if (!isAdmin) payload.employee_id = employeeId

            const res = await fetch(apiPath, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            })

            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data?.error || 'Failed to send promotion emails')

            setStatusMessage('Promotion emails sent: ' + (data.sent || 0) + ' successful, ' + (data.failed || 0) + ' failed')
        } catch (error) {
            setStatusMessage(error.message || 'Failed to send promotion emails')
        }

        setSendingPromotion(false)
    }

    function stopPolling() {
        if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
        }
    }

    function pollCampaignProgress(cleanedUrl, apiKey) {
        stopPolling()
        pollRef.current = setInterval(async () => {
            try {
                const res = await fetch(cleanedUrl + '/send-campaign/status', {
                    headers: { 'x-api-key': apiKey },
                })
                const data = await res.json().catch(() => ({}))
                if (data?.noJob) return

                setCampaignProgress(data)

                if (data.done) {
                    stopPolling()
                    setSendingWhatsAppPromotion(false)
                    setStatusMessage(
                        'WhatsApp campaign finished: ' + data.sent + ' sent, ' + data.failed + ' failed (of ' + data.total + ')'
                    )
                }
            } catch {
                // local sender may be temporarily unreachable between polls — keep trying
            }
        }, 3000)
    }

    async function sendPromotionWhatsApp() {
        const message = whatsappMessage.trim()
        if (!message) {
            setStatusMessage('WhatsApp message is required')
            return
        }
        if (!localSenderUrl.trim()) {
            setStatusMessage('Local sender URL is required (start local-server.js and ngrok on your PC first)')
            return
        }
        if (!localApiKey.trim()) {
            setStatusMessage('Local sender API key is required')
            return
        }

        let employeeId = ''
        const headers = { 'Content-Type': 'application/json' }
        if (isAdmin) {
            const token = localStorage.getItem('admin_token')
            if (!token) {
                router.push('/admin')
                return
            }
            headers['x-admin-token'] = token
        } else {
            const employee = JSON.parse(localStorage.getItem('employee') || '{}')
            employeeId = employee.employee_id || ''
            if (!employeeId) {
                router.push('/admin')
                return
            }
        }

        setSendingWhatsAppPromotion(true)
        setCampaignProgress(null)
        setStatusMessage('')

        const cleanedUrl = localSenderUrl.trim().replace(/\/$/, '')

        try {
            const payload = {
                action: 'send-promotions-whatsapp',
                message,
                localSenderUrl: cleanedUrl,
                apiKey: localApiKey.trim(),
            }
            if (!isAdmin) payload.employee_id = employeeId

            const res = await fetch(apiPath, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            })

            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data?.error || 'Failed to start WhatsApp campaign')

            if (!data.started) {
                setStatusMessage('No customers with phone numbers found to message')
                setSendingWhatsAppPromotion(false)
                return
            }

            setStatusMessage('Campaign started for ' + data.totalRecipients + ' customers. Tracking progress...')
            pollCampaignProgress(cleanedUrl, localApiKey.trim())
        } catch (error) {
            setStatusMessage(error.message || 'Failed to send WhatsApp promotions')
            setSendingWhatsAppPromotion(false)
        }
    }

    function logout() {
        localStorage.removeItem(isAdmin ? 'admin_token' : 'employee')
        router.push('/admin')
    }

    function submitSearch(e) {
        e.preventDefault()
        setPage(1)
        loadCustomers(query, 1)
    }

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total])
    const headerMessageClass = statusMessage.toLowerCase().includes('failed') || statusMessage.toLowerCase().includes('error')
        ? 'text-coral text-sm'
        : 'text-emerald-600 text-sm'

    if (!verified) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <p className="font-display text-2xl text-charcoal animate-pulse">Verifying...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-cream">
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href={backHref} className="text-gray-400 hover:text-coral text-sm">← Back</Link>
                    <h1 className="font-display text-xl text-charcoal">Customers</h1>
                    <span className="bg-coral/10 text-coral text-xs px-2 py-1 rounded-full font-bold">{total}</span>
                </div>
                <button onClick={logout} className="text-sm text-gray-400 hover:text-coral">Logout →</button>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
                <form onSubmit={submitSearch} className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by first name, last name, or phone"
                        className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-coral"
                    />
                    <button type="submit" className="px-4 py-2 rounded-xl bg-charcoal text-white text-sm font-semibold hover:opacity-90">
                        Search
                    </button>
                </form>

                {isAdmin && (
                    <div className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                        <div>
                            <p className="font-semibold text-charcoal">Import Customers</p>
                            <p className="text-xs text-gray-400">Sync old orders or upload CSV with first name, last name, phone</p>
                            {csvName && <p className="text-xs text-gray-500 mt-1">Selected file: {csvName}</p>}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={syncFromOrders}
                                disabled={syncingOrders || importingCsv}
                                className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50"
                            >
                                {syncingOrders ? 'Syncing...' : 'Sync From Orders'}
                            </button>
                            <button
                                onClick={triggerCsvPicker}
                                disabled={syncingOrders || importingCsv}
                                className="px-4 py-2 rounded-xl bg-coral text-white text-sm font-semibold disabled:opacity-50"
                            >
                                {importingCsv ? 'Uploading...' : 'Upload CSV'}
                            </button>
                            <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={uploadCsv} className="hidden" />
                        </div>
                    </div>
                )}

                {/* EMAIL PROMOTION */}
                <div className="bg-white rounded-2xl p-4 space-y-3">
                    <div>
                        <p className="font-semibold text-charcoal">Send Email Promotion</p>
                        <p className="text-xs text-gray-400">Use Subject, then send by Email to all customer contacts.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            value={promotionSubject}
                            onChange={(e) => setPromotionSubject(e.target.value)}
                            placeholder="Subject"
                            className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-coral"
                        />
                        <button
                            onClick={sendPromotionEmails}
                            disabled={sendingPromotion}
                            className="px-4 py-2 rounded-xl bg-coral text-white text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
                        >
                            {sendingPromotion ? 'Sending Email...' : 'Send Email To All'}
                        </button>
                    </div>
                </div>

                {/* WHATSAPP PROMOTION */}
                <div className="bg-white rounded-2xl p-4 space-y-3">
                    <div>
                        <p className="font-semibold text-charcoal">Send WhatsApp Campaign</p>
                        <p className="text-xs text-gray-400">
                            Sends to every customer with a phone number ({total} total). Use {'{{name}}'} in your message to insert each customer's name.
                        </p>
                    </div>

                    <textarea
                        value={whatsappMessage}
                        onChange={(e) => setWhatsappMessage(e.target.value)}
                        placeholder={'Hi {{name}}! Our sale is live — 19% to 47% off with code 14AUGUST. Shop now: thekiddytrends.com'}
                        rows={3}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-coral"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Local sender URL (from ngrok, e.g. https://xxxx.ngrok-free.app)</label>
                            <input
                                value={localSenderUrl}
                                onChange={(e) => setLocalSenderUrl(e.target.value)}
                                placeholder="https://xxxx.ngrok-free.app"
                                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-coral"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Local sender API key</label>
                            <input
                                value={localApiKey}
                                onChange={(e) => setLocalApiKey(e.target.value)}
                                type="password"
                                placeholder="Same key set as LOCAL_API_KEY on your PC"
                                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-coral"
                            />
                        </div>
                    </div>

                    <button
                        onClick={sendPromotionWhatsApp}
                        disabled={sendingWhatsAppPromotion}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
                    >
                        {sendingWhatsAppPromotion ? 'Sending WhatsApp...' : 'Send WhatsApp To All'}
                    </button>

                    {campaignProgress && (
                        <div className="pt-2">
                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-2.5 rounded-full transition-all"
                                    style={{
                                        width: campaignProgress.total
                                            ? Math.round(((campaignProgress.sent + campaignProgress.failed) / campaignProgress.total) * 100) + '%'
                                            : '0%',
                                    }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {campaignProgress.sent} sent, {campaignProgress.failed} failed, of {campaignProgress.total} total
                                {campaignProgress.done ? ' — done' : ' — sending...'}
                            </p>
                        </div>
                    )}
                </div>

                {statusMessage && (
                    <div className="bg-white rounded-2xl p-3">
                        <p className={headerMessageClass}>{statusMessage}</p>
                    </div>
                )}

                <div className="bg-white rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="p-6 text-gray-400">Loading customers...</div>
                    ) : customers.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">
                            <p className="text-4xl mb-2">👥</p>
                            <p>No customers found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-cream text-gray-500">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-semibold">First Name</th>
                                        <th className="text-left px-4 py-3 font-semibold">Last Name</th>
                                        <th className="text-left px-4 py-3 font-semibold">Phone</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.map((customer) => (
                                        <tr key={customer.id} className="border-t border-gray-100">
                                            <td className="px-4 py-3 font-medium text-charcoal">{customer.first_name || '-'}</td>
                                            <td className="px-4 py-3 text-charcoal">{customer.last_name || '-'}</td>
                                            <td className="px-4 py-3 text-charcoal font-semibold">{customer.phone || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between text-sm">
                    <p className="text-gray-500">Page {page} of {totalPages}</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                            disabled={page <= 1}
                            className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 disabled:opacity-40"
                        >
                            Prev
                        </button>
                        <button
                            onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                            disabled={page >= totalPages}
                            className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
