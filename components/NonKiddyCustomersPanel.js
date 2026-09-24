'use client'
import { useEffect, useRef, useState } from 'react'

function parseCsv(text) {
    const rows = []
    let current = ''
    let row = []
    let inQuotes = false

    for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        const next = text[i + 1]

        if (ch === '"') {
            if (inQuotes && next === '"') { current += '"'; i++ } else { inQuotes = !inQuotes }
            continue
        }
        if (ch === ',' && !inQuotes) { row.push(current); current = ''; continue }
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

// Expects a simple name,phone CSV — name column typically pre-filled with
// the group's placeholder convention (CP1, CP2, ...) since real names from
// a WhatsApp member list can't be reliably matched to numbers.
function mapCsvToContacts(text) {
    const table = parseCsv(text)
    if (!table.length) return []

    const header = table[0].map(normalizeHeader)
    const nameIdx = header.findIndex((h) => h === 'name')
    const phoneIdx = header.findIndex((h) => h === 'phone' || h === 'phonenumber' || h === 'mobile' || h === 'whatsapp' || h === 'number')
    const hasHeader = nameIdx >= 0 || phoneIdx >= 0
    const start = hasHeader ? 1 : 0
    const nameCol = hasHeader ? nameIdx : 0
    const phoneCol = hasHeader ? phoneIdx : 1

    const rows = []
    for (let i = start; i < table.length; i++) {
        const r = table[i]
        rows.push({
            name: nameCol >= 0 ? String(r[nameCol] || '').trim() : '',
            phone: phoneCol >= 0 ? String(r[phoneCol] || '').trim() : '',
        })
    }
    return rows
}

function formatDate(value) {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function NonKiddyCustomersPanel({ token }) {
    const [groups, setGroups] = useState([])
    const [groupsLoading, setGroupsLoading] = useState(true)
    const [activeGroupId, setActiveGroupId] = useState('')
    const [newGroupName, setNewGroupName] = useState('')
    const [newGroupPrefix, setNewGroupPrefix] = useState('')
    const [creatingGroup, setCreatingGroup] = useState(false)

    const [contacts, setContacts] = useState([])
    const [contactsLoading, setContactsLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [query, setQuery] = useState('')

    const [importing, setImporting] = useState(false)
    const [statusMessage, setStatusMessage] = useState('')
    const fileRef = useRef(null)
    const pageSize = 30

    useEffect(() => { loadGroups() }, [])
    useEffect(() => { loadContacts() }, [activeGroupId, page])

    async function loadGroups() {
        setGroupsLoading(true)
        try {
            const res = await fetch('/api/admin/non-kiddy/groups', { headers: { 'x-admin-token': token } })
            const data = await res.json()
            setGroups(data.success ? (data.groups || []) : [])
        } catch {
            setGroups([])
        }
        setGroupsLoading(false)
    }

    async function loadContacts() {
        setContactsLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page) })
            if (activeGroupId) params.set('groupId', activeGroupId)
            if (query.trim()) params.set('q', query.trim())
            const res = await fetch('/api/admin/non-kiddy/contacts?' + params.toString(), { headers: { 'x-admin-token': token } })
            const data = await res.json()
            setContacts(data.success ? (data.contacts || []) : [])
            setTotal(data.success ? (data.total || 0) : 0)
        } catch {
            setContacts([])
            setTotal(0)
        }
        setContactsLoading(false)
    }

    function submitSearch(e) {
        e.preventDefault()
        setPage(1)
        loadContacts()
    }

    async function createGroup() {
        const name = newGroupName.trim()
        const prefix = newGroupPrefix.trim().toUpperCase()
        if (!name || !prefix) { setStatusMessage('Group name and prefix are both required'); return }

        setCreatingGroup(true)
        try {
            const res = await fetch('/api/admin/non-kiddy/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
                body: JSON.stringify({ name, prefix }),
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.error || 'Failed to create group')
            setNewGroupName('')
            setNewGroupPrefix('')
            setStatusMessage('Group "' + name + '" created')
            await loadGroups()
        } catch (err) {
            setStatusMessage(err.message)
        }
        setCreatingGroup(false)
    }

    async function deleteGroup(id, name) {
        if (!window.confirm('Delete group "' + name + '" and all its contacts? This cannot be undone.')) return
        try {
            const res = await fetch('/api/admin/non-kiddy/groups?id=' + id, { method: 'DELETE', headers: { 'x-admin-token': token } })
            const data = await res.json()
            if (!data.success) throw new Error(data.error || 'Delete failed')
            if (activeGroupId === String(id)) setActiveGroupId('')
            await loadGroups()
            await loadContacts()
        } catch (err) {
            setStatusMessage(err.message)
        }
    }

    function triggerCsvPicker() {
        if (!activeGroupId) { setStatusMessage('Select a group first, then upload its CSV.'); return }
        fileRef.current?.click()
    }

    async function uploadCsv(e) {
        const file = e.target.files?.[0]
        if (!file) return

        setImporting(true)
        setStatusMessage('')
        try {
            const text = await file.text()
            const rows = mapCsvToContacts(text)
            if (!rows.length) throw new Error('No rows found in CSV')

            const batchSize = 500
            let importedTotal = 0
            for (let i = 0; i < rows.length; i += batchSize) {
                const chunk = rows.slice(i, i + batchSize)
                const res = await fetch('/api/admin/non-kiddy/contacts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
                    body: JSON.stringify({ groupId: activeGroupId, rows: chunk }),
                })
                const data = await res.json()
                if (!data.success) throw new Error(data.error || 'Import failed')
                importedTotal += Number(data.imported || 0)
            }
            setStatusMessage('Imported ' + importedTotal + ' contacts')
            await loadGroups()
            setPage(1)
            await loadContacts()
        } catch (err) {
            setStatusMessage(err.message)
        }
        e.target.value = ''
        setImporting(false)
    }

    async function deleteContact(id) {
        try {
            const res = await fetch('/api/admin/non-kiddy/contacts?id=' + id, { method: 'DELETE', headers: { 'x-admin-token': token } })
            const data = await res.json()
            if (!data.success) throw new Error(data.error || 'Delete failed')
            setContacts((prev) => prev.filter((c) => c.id !== id))
            setTotal((prev) => Math.max(0, prev - 1))
        } catch (err) {
            setStatusMessage(err.message)
        }
    }

    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    return (
        <div className="space-y-4">
            <div className="bg-cream rounded-2xl p-4 text-xs text-gray-600">
                These are community/leads lists (e.g. WhatsApp group members) — kept fully separate from real Kiddy Trends order customers.
                They haven't opted in to Kiddy Trends promotions specifically, so treat outreach here more carefully than the main customer list.
            </div>

            <div className="bg-white rounded-2xl p-4">
                <p className="font-semibold text-charcoal mb-2">Groups</p>
                <div className="flex flex-wrap gap-2 mb-3">
                    <button onClick={() => { setActiveGroupId(''); setPage(1) }}
                            className={'px-3 py-1.5 rounded-full text-xs font-semibold border-2 ' + (!activeGroupId ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-charcoal border-gray-200')}>
                        All Groups
                    </button>
                    {groups.map((g) => (
                        <div key={g.id} className={'flex items-center gap-1 rounded-full border-2 pl-3 pr-1 py-1 text-xs font-semibold ' + (activeGroupId === String(g.id) ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-charcoal border-gray-200')}>
                            <button onClick={() => { setActiveGroupId(String(g.id)); setPage(1) }}>{g.name} ({g.contactCount})</button>
                            <button onClick={() => deleteGroup(g.id, g.name)} className="px-1.5 hover:text-coral">✕</button>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
                           placeholder="New group name (e.g. DHA Society)"
                           className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-coral" />
                    <input value={newGroupPrefix} onChange={(e) => setNewGroupPrefix(e.target.value)}
                           placeholder="Prefix (e.g. DHA)" maxLength={6}
                           className="w-28 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-coral" />
                    <button onClick={createGroup} disabled={creatingGroup}
                            className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50">
                        {creatingGroup ? 'Adding...' : '+ Add Group'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-4">
                <p className="font-semibold text-charcoal">Import Contacts</p>
                <p className="text-xs text-gray-400 mb-3">Select a group above, then upload a CSV (columns: name, phone).</p>
                <button onClick={triggerCsvPicker} disabled={importing}
                        className="px-4 py-2 rounded-xl bg-coral text-white text-sm font-semibold disabled:opacity-50">
                    {importing ? 'Importing...' : 'Upload CSV'}
                </button>
                <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={uploadCsv} className="hidden" />
            </div>

            <form onSubmit={submitSearch} className="bg-white rounded-2xl p-4 flex gap-3">
                <input value={query} onChange={(e) => setQuery(e.target.value)}
                       placeholder="Search by name or phone"
                       className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-coral" />
                <button type="submit" className="px-4 py-2 rounded-xl bg-charcoal text-white text-sm font-semibold hover:opacity-90">Search</button>
            </form>

            {statusMessage && (
                <div className="bg-white rounded-2xl p-3">
                    <p className="text-sm text-charcoal">{statusMessage}</p>
                </div>
            )}

            <div className="bg-white rounded-2xl overflow-hidden">
                {contactsLoading ? (
                    <div className="p-6 text-gray-400">Loading contacts...</div>
                ) : contacts.length === 0 ? (
                    <div className="p-10 text-center text-gray-400">
                        <p className="text-4xl mb-2">👥</p>
                        <p>No contacts found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-cream text-gray-500">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold">Name</th>
                                    <th className="text-left px-4 py-3 font-semibold">Phone</th>
                                    <th className="text-left px-4 py-3 font-semibold">Group</th>
                                    <th className="text-left px-4 py-3 font-semibold">Date Added</th>
                                    <th className="text-left px-4 py-3 font-semibold"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {contacts.map((c) => (
                                    <tr key={c.id} className="border-t border-gray-100">
                                        <td className="px-4 py-3 font-medium text-charcoal">{c.name || '-'}</td>
                                        <td className="px-4 py-3 text-charcoal font-semibold whitespace-nowrap">{c.phone}</td>
                                        <td className="px-4 py-3 text-charcoal">{c.non_kiddy_groups?.name || '-'}</td>
                                        <td className="px-4 py-3 text-charcoal whitespace-nowrap">{formatDate(c.created_at)}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => deleteContact(c.id)} className="text-xs text-gray-300 hover:text-coral">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between text-sm">
                <p className="text-gray-500">Page {page} of {totalPages} · {total} contacts</p>
                <div className="flex gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                            className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 disabled:opacity-40">Prev</button>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                            className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 disabled:opacity-40">Next</button>
                </div>
            </div>
        </div>
    )
}
