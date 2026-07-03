'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// The staff login was merged into the single portal at /admin. Redirect any
// old /employee links there so there is only one login screen.
export default function EmployeeLoginRedirect() {
    const router = useRouter()
    useEffect(() => { router.replace('/admin') }, [router])
    return (
        <div className="min-h-screen bg-cream flex items-center justify-center">
            <p className="font-display text-xl text-charcoal animate-pulse">Redirecting to login…</p>
        </div>
    )
}
