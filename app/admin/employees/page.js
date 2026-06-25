'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminEmployees() {
    const [employees, setEmployees] = useState([])
    const [loading, setLoading]     = useState(true)
    const [showForm, setShowForm]   = useState(false)
    const [editing, setEditing]     = useState(null)
    const [form, setForm]           = useState({ name: '', employee_id: '', email: '', phone: '', role: 'employee', password: '' })
    const [saving, setSaving]       = useState(false)
    const [error, setError]         = useState('')
    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem('admin_token')
        if (!token) { router.push('/admin'); return }
        fetchEmployees()
    }, [])

    async function fetchEmployees() {
        const token = localStorage.getItem('admin_token')
        const res   = await fetch('/api/admin/employees', { headers: { 'x-admin-token': token } })
        const data  = await res.json()
        setEmployees(data.employees || [])
        setLoading(false)
    }

    async function handleSave() {
        if (!form.name || !form.employee_id || (!editing && !form.password)) {
            setError('Name, Employee ID and Password are required')
            return
        }
        setSaving(true)
        setError('')
        const token = localStorage.getItem('admin_token')
        const method = editing ? 'PUT' : 'POST'
        const body   = editing ? { id: editing.id, ...form } : form

        const res  = await fetch('/api/admin/employees', {
            method,
            headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
            body:    JSON.stringify(body)
        })
        const data = await res.json()
        if (data.error) {
            setError(data.error)
        } else {
            setShowForm(false)
            setEditing(null)
            setForm({ name: '', employee_id: '', email: '', phone: '', role: 'employee', password: '' })
            fetchEmployees()
        }
        setSaving(false)
    }

    async function toggleActive(emp) {
        const token = localStorage.getItem('admin_token')
        await fetch('/api/admin/employees', {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
            body:    JSON.stringify({ id: emp.id, is_active: !emp.is_active })
        })
        fetchEmployees()
    }

    function handleEdit(emp) {
        setEditing(emp)
        setForm({ name: emp.name, employee_id: emp.employee_id, email: emp.email || '', phone: emp.phone || '', role: emp.role, password: '' })
        setShowForm(true)
    }

    return (
        <div className="min-h-screen bg-cream">
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/admin/dashboard" className="text-gray-400 hover:text-coral text-sm">← Back</Link>
                    <h1 className="font-display text-xl text-charcoal">Employees</h1>
                    <span className="bg-coral/10 text-coral text-xs px-2 py-1 rounded-full font-bold">{employees.length}</span>
                </div>
                <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', employee_id: '', email: '', phone: '', role: 'employee', password: '' }) }}
                        className="bg-coral text-white font-display text-sm px-5 py-2 rounded-full hover:bg-opacity-90">
                    + Add Employee
                </button>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Form */}
                {showForm && (
                    <div className="bg-white rounded-2xl p-6 mb-6">
                        <h3 className="font-display text-lg text-charcoal mb-4">{editing ? 'Edit Employee' : 'Add New Employee'}</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-charcoal mb-1">Full Name *</label>
                                <input type="text" placeholder="e.g. Ahmed Ali" value={form.name}
                                       onChange={e => setForm({...form, name: e.target.value})}
                                       className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-charcoal mb-1">Employee ID *</label>
                                <input type="text" placeholder="e.g. EMP001" value={form.employee_id}
                                       onChange={e => setForm({...form, employee_id: e.target.value.toUpperCase()})}
                                       disabled={!!editing}
                                       className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm font-bold disabled:opacity-50" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-charcoal mb-1">Email</label>
                                <input type="email" placeholder="ahmed@kiddytrends.com" value={form.email}
                                       onChange={e => setForm({...form, email: e.target.value})}
                                       className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-charcoal mb-1">Phone</label>
                                <input type="tel" placeholder="03001234567" value={form.phone}
                                       onChange={e => setForm({...form, phone: e.target.value})}
                                       className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-charcoal mb-1">Role</label>
                                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm">
                                    <option value="employee">Employee</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-charcoal mb-1">
                                    Password {editing && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
                                </label>
                                <input type="password" placeholder="Set password" value={form.password}
                                       onChange={e => setForm({...form, password: e.target.value})}
                                       className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-coral focus:outline-none bg-cream text-sm" />
                            </div>
                        </div>
                        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
                        <div className="flex gap-3 mt-4">
                            <button onClick={handleSave} disabled={saving}
                                    className="flex-1 bg-coral text-white font-display py-3 rounded-2xl hover:bg-opacity-90 disabled:opacity-50">
                                {saving ? 'Saving...' : editing ? 'Update Employee' : 'Add Employee'}
                            </button>
                            <button onClick={() => { setShowForm(false); setEditing(null); setError('') }}
                                    className="px-6 py-3 border-2 border-gray-200 rounded-2xl text-charcoal hover:border-coral">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Employee list */}
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />)}
                    </div>
                ) : employees.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 bg-white rounded-2xl">
                        <p className="text-4xl mb-2">👥</p>
                        <p>No employees yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {employees.map(emp => (
                            <div key={emp.id} className="bg-white rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-coral/20 rounded-2xl flex items-center justify-center font-display text-coral text-lg flex-shrink-0">
                                        {emp.name[0]}
                                    </div>
                                    <div>
                                        <p className="font-display text-base text-charcoal">{emp.name}</p>
                                        <p className="text-xs text-gray-400">{emp.employee_id} · {emp.email}</p>
                                        <div className="flex items-center gap-2 mt-1">
                      <span className={'text-xs px-2 py-0.5 rounded-full font-bold ' + (emp.role === 'admin' ? 'bg-coral/10 text-coral' : 'bg-skyblue/20 text-charcoal')}>
                        {emp.role}
                      </span>
                                            <span className={'text-xs px-2 py-0.5 rounded-full font-bold ' + (emp.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500')}>
                        {emp.is_active ? 'Active' : 'Inactive'}
                      </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleEdit(emp)}
                                            className="text-xs px-3 py-1.5 bg-skyblue/20 text-charcoal rounded-xl hover:bg-skyblue/40">
                                        Edit
                                    </button>
                                    <button onClick={() => toggleActive(emp)}
                                            className={'text-xs px-3 py-1.5 rounded-xl ' + (emp.is_active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100')}>
                                        {emp.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}