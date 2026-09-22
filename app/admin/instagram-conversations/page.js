'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminPortalNav from '@/components/AdminPortalNav'

export default function AdminInstagramConversationsPage() {
    const [verified, setVerified] = useState(false)
    const router = useRouter()

    const [conversations, setConversations] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    const [activeId, setActiveId] = useState(null)
    const [messages, setMessages] = useState([])
    const [messagesLoading, setMessagesLoading] = useState(false)

    const [debugInfo, setDebugInfo] = useState(null)
    const [debugLoading, setDebugLoading] = useState(false)
    const [showDebug, setShowDebug] = useState(false)

    useEffect(() => {
        async function verify() {
            const token = localStorage.getItem('admin_token')
            if (!token) { router.push('/admin'); return }
            try {
                const res = await fetch('/api/admin/auth', { headers: { 'x-admin-token': token } })
                const data = await res.json()
                if (!data.valid) { localStorage.removeItem('admin_token'); router.push('/admin'); return }
                setVerified(true)
                loadConversations('')
            } catch {
                router.push('/admin')
            }
        }
        verify()
    }, [])

    async function loadConversations(searchText) {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/instagram-conversations?search=' + encodeURIComponent(searchText || ''))
            const data = await res.json()
            setConversations(data.success ? (data.conversations || []) : [])
        } catch {
            setConversations([])
        }
        setLoading(false)
    }

    async function loadDebugInfo() {
        setDebugLoading(true)
        try {
            const res = await fetch('/api/admin/instagram-conversations/debug')
            const data = await res.json()
            setDebugInfo(data)
        } catch {
            setDebugInfo(null)
        }
        setDebugLoading(false)
    }

    function toggleDebug() {
        const next = !showDebug
        setShowDebug(next)
        if (next) loadDebugInfo()
    }

    async function openConversation(conversation) {
        setActiveId(conversation.id)
        setMessagesLoading(true)
        try {
            const res = await fetch('/api/admin/instagram-conversations/messages?conversationId=' + conversation.id)
            const data = await res.json()
            setMessages(data.success ? (data.messages || []) : [])
        } catch {
            setMessages([])
        }
        setMessagesLoading(false)
    }

    if (!verified) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <p className="font-display text-2xl text-charcoal animate-pulse">Verifying...</p>
            </div>
        )
    }

    const activeConversation = conversations.find((c) => c.id === activeId)

    return (
        <div className="min-h-screen bg-cream">
            <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/admin/dashboard" className="text-gray-400 hover:text-coral text-sm">← Back</Link>
                    <h1 className="font-display text-xl text-charcoal">Instagram Conversations</h1>
                </div>
                <div className="flex items-center gap-3">
                    <p className="text-xs text-gray-400">Captured automatically from Instagram DMs — new messages only, from setup onward</p>
                    <button onClick={toggleDebug} className="text-xs text-coral hover:underline flex-shrink-0">
                        {showDebug ? 'Hide troubleshooting' : 'Troubleshoot'}
                    </button>
                </div>
            </div>
            <AdminPortalNav />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {showDebug && (
                    <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 text-sm">
                        <div className="flex items-center justify-between mb-3">
                            <p className="font-display text-base text-charcoal">Troubleshooting</p>
                            <button onClick={loadDebugInfo} disabled={debugLoading} className="text-xs text-coral hover:underline disabled:opacity-40">↻ Refresh</button>
                        </div>
                        {debugLoading && <p className="text-gray-400">Loading...</p>}
                        {!debugLoading && debugInfo && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div className="bg-cream rounded-xl p-3">
                                        <p className="text-2xl font-display text-charcoal">{debugInfo.totalWebhookDeliveries}</p>
                                        <p className="text-xs text-gray-400">webhook deliveries ever received</p>
                                    </div>
                                    <div className="bg-cream rounded-xl p-3">
                                        <p className="text-2xl font-display text-charcoal">{debugInfo.totalConversations}</p>
                                        <p className="text-xs text-gray-400">conversations captured</p>
                                    </div>
                                    <div className="bg-cream rounded-xl p-3">
                                        <p className="text-2xl font-display text-charcoal">{debugInfo.totalMessages}</p>
                                        <p className="text-xs text-gray-400">messages captured</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 text-xs">
                                    {Object.entries(debugInfo.configured || {}).map(([key, ok]) => (
                                        <span key={key} className={ok ? 'text-green-600' : 'text-red-500'}>
                                            {ok ? '✓' : '✕'} {key}
                                        </span>
                                    ))}
                                </div>

                                {debugInfo.totalWebhookDeliveries === 0 ? (
                                    <p className="text-orange-500 text-xs bg-orange-50 rounded-xl p-3">
                                        Zero deliveries ever recorded — Meta has not attempted to reach our webhook at all.
                                        This points to something on Meta's side (subscription/tester access), not a bug in
                                        our code — if it were rejecting a bad signature, it would still show up here.
                                    </p>
                                ) : (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-2">Most recent deliveries:</p>
                                        <div className="space-y-1.5">
                                            {debugInfo.recentDeliveries.map((d) => (
                                                <div key={d.id} className="bg-cream rounded-lg p-2 text-xs">
                                                    <span className={d.signatureValid ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                                                        {d.signatureValid ? 'valid signature' : 'INVALID signature'}
                                                    </span>
                                                    <span className="text-gray-400 ml-2">{new Date(d.receivedAt).toLocaleString()}</span>
                                                    <p className="text-gray-500 mt-1 break-all">{d.preview}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">

                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <input value={search} onChange={(e) => setSearch(e.target.value)}
                                   onKeyDown={(e) => { if (e.key === 'Enter') loadConversations(search) }}
                                   placeholder="Search by username or name"
                                   className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <div className="max-h-[70vh] overflow-y-auto">
                            {loading && <p className="text-sm text-gray-400 p-4">Loading...</p>}
                            {!loading && conversations.length === 0 && (
                                <p className="text-sm text-gray-400 p-4">No conversations captured yet — they'll appear here as customers message you, once the Instagram webhook is live.</p>
                            )}
                            {!loading && conversations.map((c) => (
                                <button key={c.id} onClick={() => openConversation(c)}
                                        className={'w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-cream transition-colors ' + (activeId === c.id ? 'bg-cream' : '')}>
                                    <p className="text-sm font-semibold text-charcoal truncate">{c.display_name || c.username || c.igsid}</p>
                                    {c.username && <p className="text-xs text-gray-400">@{c.username}</p>}
                                    <p className="text-xs text-gray-400 truncate mt-0.5">{c.last_message_preview}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-4">
                        {!activeConversation && <p className="text-sm text-gray-400">Select a conversation to view its messages.</p>}
                        {activeConversation && (
                            <>
                                <p className="font-display text-lg text-charcoal mb-3">
                                    {activeConversation.display_name || activeConversation.username || activeConversation.igsid}
                                    {activeConversation.username && <span className="text-sm text-gray-400 ml-2">@{activeConversation.username}</span>}
                                </p>
                                {messagesLoading && <p className="text-sm text-gray-400">Loading...</p>}
                                {!messagesLoading && (
                                    <div className="space-y-2 max-h-[65vh] overflow-y-auto">
                                        {messages.map((m) => (
                                            <div key={m.id} className={'max-w-[75%] rounded-2xl px-4 py-2 text-sm ' + (m.direction === 'outbound' ? 'ml-auto bg-coral text-white' : 'bg-cream text-charcoal')}>
                                                {m.message_text}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
