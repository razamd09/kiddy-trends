'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminRewardsPage() {
    const [verified, setVerified] = useState(false)
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState([])
    const [historyOpen, setHistoryOpen] = useState(false)
    const [historyLoading, setHistoryLoading] = useState(false)
    const [historyUser, setHistoryUser] = useState(null)
    const [historyRows, setHistoryRows] = useState([])
    const [promotingUserId, setPromotingUserId] = useState('')
    const [promotionStatus, setPromotionStatus] = useState({})
    const [selectedIds, setSelectedIds] = useState([])
    const [bulkPromoting, setBulkPromoting] = useState(false)
    const router = useRouter()

    const PROMOTE_COOLDOWN_MS = 24 * 60 * 60 * 1000

    function cooldownHoursLeft(user) {
        if (!user?.last_promoted_at) return 0
        const remaining = PROMOTE_COOLDOWN_MS - (Date.now() - new Date(user.last_promoted_at).getTime())
        return remaining > 0 ? Math.ceil(remaining / (60 * 60 * 1000)) : 0
    }

    function toggleSelect(userId) {
        setSelectedIds((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId])
    }

    function toggleSelectAll() {
        if (selectedIds.length === users.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(users.map((u) => u.user_id))
        }
    }

    useEffect(() => {
        async function verifyAndLoad() {
            const token = localStorage.getItem('admin_token')
            if (!token) { router.push('/admin'); return }
            try {
                const authRes = await fetch('/api/admin/auth', { headers: { 'x-admin-token': token } })
                const authData = await authRes.json()
                if (!authData.valid) {
                    localStorage.removeItem('admin_token')
                    router.push('/admin')
                    return
                }
                setVerified(true)

                const rewardsRes = await fetch('/api/admin/rewards', { headers: { 'x-admin-token': token } })
                const rewardsData = await rewardsRes.json()
                setUsers(rewardsData.users || [])
            } catch {
                router.push('/admin')
                return
            }
            setLoading(false)
        }
        verifyAndLoad()
    }, [])

    function logout() {
        localStorage.removeItem('admin_token')
        router.push('/admin')
    }

    async function openHistory(user) {
        const token = localStorage.getItem('admin_token')
        if (!token) return
        setHistoryOpen(true)
        setHistoryLoading(true)
        setHistoryUser(user)
        setHistoryRows([])
        try {
            const res = await fetch('/api/admin/rewards/history?userId=' + encodeURIComponent(user.user_id), {
                headers: { 'x-admin-token': token }
            })
            const data = await res.json()
            setHistoryRows(data.history || [])
        } catch {
            setHistoryRows([])
        }
        setHistoryLoading(false)
    }

    async function sendPromotion(user) {
        const userId = String(user.user_id || '').toLowerCase().trim()
        if (!userId) return

        const token = localStorage.getItem('admin_token')
        try {
            setPromotingUserId(userId)
            setPromotionStatus((prev) => ({ ...prev, [userId]: '' }))

            const res = await fetch('/api/admin/rewards/promote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-token': token || '' },
                body: JSON.stringify({ userId: user.user_id }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to send promotion')
            }

            setPromotionStatus((prev) => ({
                ...prev,
                [userId]: 'Sent to ' + data.sentTo,
            }))
            setUsers((prev) => prev.map((u) => u.user_id === user.user_id ? { ...u, last_promoted_at: new Date().toISOString() } : u))
        } catch (error) {
            setPromotionStatus((prev) => ({
                ...prev,
                [userId]: error.message || 'Failed to send promotion',
            }))
        } finally {
            setPromotingUserId('')
        }
    }

    async function sendBulkPromotion() {
        if (selectedIds.length === 0) return
        const token = localStorage.getItem('admin_token')
        setBulkPromoting(true)
        try {
            const res = await fetch('/api/admin/rewards/promote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-token': token || '' },
                body: JSON.stringify({ userIds: selectedIds }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to send promotions')
            }

            const sentAt = new Date().toISOString()
            const nextStatus = {}
            const sentUserIds = new Set()
            for (const result of data.results || []) {
                const key = String(result.userId || '').toLowerCase().trim()
                nextStatus[key] = result.success ? 'Sent to ' + result.sentTo : result.error
                if (result.success) sentUserIds.add(result.userId)
            }
            setPromotionStatus((prev) => ({ ...prev, ...nextStatus }))
            setUsers((prev) => prev.map((u) => sentUserIds.has(u.user_id) ? { ...u, last_promoted_at: sentAt } : u))
            setSelectedIds([])
        } catch (error) {
            alert(error.message || 'Failed to send promotions')
        } finally {
            setBulkPromoting(false)
        }
    }

    if (!verified) return (
        <div className="min-h-screen bg-cream flex items-center justify-center">
            <p className="font-display text-2xl text-charcoal animate-pulse">Verifying...</p>
        </div>
    )

    const totalAvailable = users.reduce((sum, u) => sum + (u.available_points || 0), 0)
    const totalRedeemed = users.reduce((sum, u) => sum + (u.redeemed_points || 0), 0)
    const totalEarned = users.reduce((sum, u) => sum + (u.total_earned_points || 0), 0)

    return (
        <div className="min-h-screen bg-cream">
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/admin/dashboard" className="text-gray-400 hover:text-coral text-sm">← Back</Link>
                    <h1 className="font-display text-xl text-charcoal">Rewards Points</h1>
                    <span className="bg-coral/10 text-coral text-xs px-2 py-1 rounded-full font-bold">{users.length}</span>
                </div>
                <button onClick={logout} className="text-sm text-gray-400 hover:text-coral">Logout →</button>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-4">
                        <p className="text-xs text-gray-400 mb-1">Members</p>
                        <p className="font-display text-2xl text-charcoal">{users.length}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4">
                        <p className="text-xs text-gray-400 mb-1">Total Earned</p>
                        <p className="font-display text-2xl text-charcoal">{totalEarned} pts</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4">
                        <p className="text-xs text-gray-400 mb-1">Total Redeemed</p>
                        <p className="font-display text-2xl text-coral">{totalRedeemed} pts</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4">
                        <p className="text-xs text-gray-400 mb-1">Total Available</p>
                        <p className="font-display text-2xl text-green-600">{totalAvailable} pts</p>
                    </div>
                </div>

                {selectedIds.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 flex items-center justify-between gap-3 border-2 border-coral/20">
                        <p className="text-sm font-semibold text-charcoal">{selectedIds.length} selected</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSelectedIds([])}
                                className="px-3 py-1.5 rounded-xl bg-cream text-charcoal text-xs font-semibold hover:bg-gray-200"
                            >
                                Clear
                            </button>
                            <button
                                onClick={sendBulkPromotion}
                                disabled={bulkPromoting}
                                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500"
                            >
                                {bulkPromoting ? 'Sending...' : 'Promote Selected (' + selectedIds.length + ')'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="p-6 text-gray-400">Loading rewards data...</div>
                    ) : users.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">
                            <p className="text-4xl mb-2">⭐</p>
                            <p>No rewards users found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-cream text-gray-500">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-semibold">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.length === users.length && users.length > 0}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 cursor-pointer accent-coral"
                                            />
                                        </th>
                                        <th className="text-left px-4 py-3 font-semibold">User</th>
                                        <th className="text-left px-4 py-3 font-semibold">WhatsApp</th>
                                        <th className="text-left px-4 py-3 font-semibold">Email</th>
                                        <th className="text-left px-4 py-3 font-semibold">Total Points</th>
                                        <th className="text-left px-4 py-3 font-semibold">Redeemed</th>
                                        <th className="text-left px-4 py-3 font-semibold">Available</th>
                                        <th className="text-left px-4 py-3 font-semibold">Date</th>
                                        <th className="text-left px-4 py-3 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => {
                                        const rowUserId = String(u.user_id || '').toLowerCase().trim()
                                        const hoursLeft = cooldownHoursLeft(u)
                                        return (
                                        <tr key={u.user_id} className="border-t border-gray-100">
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(u.user_id)}
                                                    onChange={() => toggleSelect(u.user_id)}
                                                    className="w-4 h-4 cursor-pointer accent-coral"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-charcoal">{u.name || u.user_id}</p>
                                                <p className="text-xs text-gray-400">{u.user_id}</p>
                                            </td>
                                            <td className="px-4 py-3 text-charcoal font-medium">{u.whatsapp || u.phone || '-'}</td>
                                            <td className="px-4 py-3 text-gray-500">{u.email || '-'}</td>
                                            <td className="px-4 py-3 font-semibold text-charcoal">{u.total_earned_points || 0} pts</td>
                                            <td className="px-4 py-3 font-semibold text-coral">{u.redeemed_points || 0} pts</td>
                                            <td className="px-4 py-3 font-semibold text-green-600">{u.available_points || 0} pts</td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {u.last_activity_at ? new Date(u.last_activity_at).toLocaleString('en-PK') : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <button
                                                        onClick={() => openHistory(u)}
                                                        className="px-3 py-1.5 rounded-xl bg-cream text-charcoal text-xs font-semibold hover:bg-sunny/40"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => sendPromotion(u)}
                                                        disabled={promotingUserId === rowUserId || (u.available_points || 0) <= 0 || hoursLeft > 0}
                                                        title={hoursLeft > 0 ? 'Already emailed within the last 24 hours' : ''}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500"
                                                    >
                                                        {promotingUserId === rowUserId ? 'Sending...' : hoursLeft > 0 ? 'Cooldown ' + hoursLeft + 'h' : 'Promote'}
                                                    </button>
                                                </div>
                                                {promotionStatus[rowUserId] && (
                                                    <p className={"text-[11px] mt-1 " + (promotionStatus[rowUserId].startsWith('Sent') ? 'text-green-600' : 'text-coral')}>
                                                        {promotionStatus[rowUserId]}
                                                    </p>
                                                )}
                                            </td>
                                        </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {historyOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="font-display text-lg text-charcoal">Rewards History</p>
                                <p className="text-xs text-gray-400">{historyUser?.name || historyUser?.user_id} ({historyUser?.user_id})</p>
                            </div>
                            <button onClick={() => setHistoryOpen(false)} className="text-gray-400 hover:text-coral text-xl">✕</button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[70vh]">
                            {historyLoading ? (
                                <p className="text-gray-400">Loading...</p>
                            ) : historyRows.length === 0 ? (
                                <p className="text-gray-400 text-sm">No rewards activity found for this user.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-cream text-gray-500">
                                            <tr>
                                                <th className="text-left px-3 py-2 font-semibold">Date/Time</th>
                                                <th className="text-left px-3 py-2 font-semibold">Order Id</th>
                                                <th className="text-left px-3 py-2 font-semibold">Reward Points Availed</th>
                                                <th className="text-left px-3 py-2 font-semibold">Redeemed</th>
                                                <th className="text-left px-3 py-2 font-semibold">Total Points</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {historyRows.map((r) => (
                                                <tr key={r.id} className="border-t border-gray-100">
                                                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{new Date(r.created_at).toLocaleString('en-PK')}</td>
                                                    <td className="px-3 py-2 font-semibold text-charcoal">{r.order_number}</td>
                                                    <td className="px-3 py-2 font-semibold text-green-600">{r.earned_points} pts</td>
                                                    <td className="px-3 py-2 font-semibold text-coral">{r.redeemed_points} pts</td>
                                                    <td className="px-3 py-2 font-semibold text-charcoal">{r.balance_points ?? '-'} pts</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
