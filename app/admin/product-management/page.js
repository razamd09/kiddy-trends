'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const modules = [
    {
        title: 'Manage Products',
        description: 'Create, edit, duplicate, import, and publish product records.',
        href: '/admin/products',
        accent: 'bg-charcoal text-white',
    },
    {
        title: 'Product Category',
        description: 'Add, edit, and delete category values used by products.',
        href: '/admin/product-categories',
        accent: 'bg-coral text-white',
    },
    {
        title: 'Product Version',
        description: 'Add and edit product version values such as arrivals or packs.',
        href: '/admin/product-versions',
        accent: 'bg-mint text-charcoal',
    },
    {
        title: 'Product Fabric',
        description: 'Add, edit, and delete fabric values used by products.',
        href: '/admin/product-fabrics',
        accent: 'bg-skyblue text-charcoal',
    },
    {
        title: 'Product Type',
        description: 'Add, edit, and delete product type values used by products.',
        href: '/admin/product-types',
        accent: 'bg-sunny text-charcoal',
    },
]

export default function ProductManagementDashboard() {
    const [verified, setVerified] = useState(false)
    const router = useRouter()

    useEffect(() => {
        async function verify() {
            const token = localStorage.getItem('admin_token')
            if (!token) { router.push('/admin'); return }
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
    }, [])

    function logout() {
        localStorage.removeItem('admin_token')
        router.push('/admin')
    }

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
                    <div className="w-10 h-10 bg-coral rounded-2xl flex items-center justify-center text-white font-display text-lg">P</div>
                    <div>
                        <p className="font-display text-lg text-charcoal">Product Management</p>
                        <p className="text-xs text-gray-400">Products and product metadata</p>
                    </div>
                </div>
                <button onClick={logout} className="text-sm text-gray-400 hover:text-coral transition-colors">
                    Logout
                </button>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="font-display text-3xl text-charcoal">Product Management Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Maintain product records and the metadata used to classify them.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {modules.map((module) => (
                        <Link
                            key={module.href}
                            href={module.href}
                            className="bg-white rounded-3xl shadow-sm p-6 hover:-translate-y-0.5 hover:shadow-md transition-all"
                        >
                            <div className={'w-12 h-12 rounded-2xl flex items-center justify-center font-display text-lg mb-5 ' + module.accent}>
                                {module.title.slice(0, 1)}
                            </div>
                            <h2 className="font-display text-xl text-charcoal mb-2">{module.title}</h2>
                            <p className="text-sm text-gray-500 leading-6">{module.description}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}