'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EmployeeRewardsPage() {
    const [employee, setEmployee] = useState(null)
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const stored = localStorage.getItem('employee')
        if (!stored) { router.push('/employee'); return }
        const emp = JSON.parse(stored)
        setEmployee(emp)
        fetchRewards()
    }, [])

    async function fetchRewards() {
        setLoading(true)
        const res = await fetch('/api/employee/rewards', { cache: 'no-store' })
        const data = await res.json()
        setUsers(data.users || [])
        setLoading(false)
    }

    if (!employee) return null

    const totalAvailable = users.reduce((sum, u) => sum + (u.available_points || 0), 0)

    return (
        <div className="min-h-screen bg-cream">
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/employee/dashboard" className="text-gray-400 hover:text-coral text-sm">← Back</Link>
                    <h1 className="font-display text-xl text-charcoal">Reward Points</h1>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-4"><p className="text-xs text-gray-400">Members</p><p className="font-display text-2xl">{users.length}</p></div>
                    <div className="bg-white rounded-2xl p-4"><p className="text-xs text-gray-400">Available Points</p><p className="font-display text-2xl text-green-600">{totalAvailable}</p></div>
                    <div className="bg-white rounded-2xl p-4"><p className="text-xs text-gray-400">Updated</p><p className="font-display text-base">{new Date().toLocaleDateString('en-PK')}</p></div>
                </div>

                {loading ? (
                    <div className="text-gray-400">Loading rewards...</div>
                ) : (
                    <div className="bg-white rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-cream text-gray-500">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-semibold">User</th>
                                        <th className="text-left px-4 py-3 font-semibold">Earned</th>
                                        <th className="text-left px-4 py-3 font-semibold">Redeemed</th>
                                        <th className="text-left px-4 py-3 font-semibold">Available</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.user_id} className="border-t border-gray-100">
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-charcoal">{u.name || u.user_id}</p>
                                                <p className="text-xs text-gray-400">{u.user_id}</p>
                                            </td>
                                            <td className="px-4 py-3 font-semibold">{u.total_earned_points || 0}</td>
                                            <td className="px-4 py-3 font-semibold text-coral">{u.redeemed_points || 0}</td>
                                            <td className="px-4 py-3 font-semibold text-green-600">{u.available_points || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
