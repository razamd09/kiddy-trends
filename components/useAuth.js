'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function useAdminAuth() {
    const [verified, setVerified] = useState(false)
    const router = useRouter()

    useEffect(() => {
        async function verify() {
            const token = localStorage.getItem('admin_token')
            if (!token) { router.push('/admin'); return }

            try {
                const res  = await fetch('/api/admin/auth', {
                    headers: { 'x-admin-token': token }
                })
                const data = await res.json()
                if (!data.valid) {
                    localStorage.removeItem('admin_token')
                    router.push('/admin')
                } else {
                    setVerified(true)
                }
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

    return { verified, logout }
}

export function useEmployeeAuth() {
    const [employee, setEmployee] = useState(null)
    const router = useRouter()

    useEffect(() => {
        const stored = localStorage.getItem('employee')
        if (!stored) { router.push('/admin'); return }
        try {
            setEmployee(JSON.parse(stored))
        } catch {
            router.push('/admin')
        }
    }, [])

    function logout() {
        localStorage.removeItem('employee')
        router.push('/admin')
    }

    return { employee, logout }
}