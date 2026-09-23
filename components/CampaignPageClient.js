'use client'
import { useEffect, useState } from 'react'
import ProductCard from './ProductCard'

const ITEMS_PER_PAGE = 40

function getCreatedAtValue(product) {
    const value = new Date(product?.created_at || 0).getTime()
    return Number.isFinite(value) ? value : 0
}

function isNewArrival(product) {
    return String(product?.product_version || '').trim().toLowerCase().includes('new arrival')
}

// Cache products in module scope so they persist between renders/visits —
// shared across all three campaign pages since it's the same underlying
// catalog, just a different pinned-slot list per campaign.
let cachedProducts = []
let cacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export default function CampaignPageClient({ campaignNumber, initialProducts = [], initialPinnedIds = [] }) {
    const [products, setProducts] = useState(cachedProducts.length > 0 ? cachedProducts : initialProducts)
    const [loading, setLoading] = useState(cachedProducts.length === 0 && initialProducts.length === 0)
    const [pinnedIds, setPinnedIds] = useState(initialPinnedIds)
    const [page, setPage] = useState(1)

    useEffect(() => {
        if (cachedProducts.length > 0 && Date.now() - cacheTime < CACHE_DURATION) {
            setProducts(cachedProducts)
            setLoading(false)
            return
        }
        async function fetchAll() {
            try {
                const first = await fetch('/api/products?limit=400&page=1', { cache: 'no-store' }).then((r) => r.json())
                const totalPages = Math.max(first.pages || 1, 1)
                const restPagePromises = []
                for (let p = 2; p <= totalPages; p++) {
                    restPagePromises.push(fetch('/api/products?limit=400&page=' + p, { cache: 'no-store' }).then((r) => r.json()))
                }
                const restPages = restPagePromises.length > 0 ? await Promise.all(restPagePromises) : []
                const all = [...(first.products || []), ...restPages.flatMap((pageResult) => pageResult.products || [])]
                cachedProducts = all
                cacheTime = Date.now()
                setProducts(all)
                setLoading(false)
            } catch {
                setLoading(false)
            }
        }
        fetchAll()
    }, [])

    useEffect(() => {
        if (initialPinnedIds.length > 0) return
        async function fetchPinned() {
            try {
                const data = await fetch('/api/campaign-slots?campaign=' + campaignNumber).then((r) => r.json())
                setPinnedIds(Array.isArray(data.productIds) ? data.productIds : [])
            } catch {}
        }
        fetchPinned()
    }, [campaignNumber])

    const productByRealId = new Map(products.map((p) => [p._id, p]))
    const pinnedProducts = pinnedIds.map((id) => productByRealId.get(id)).filter(Boolean)
    const pinnedIdSet = new Set(pinnedIds)

    const restNewArrivals = products
        .filter((p) => !pinnedIdSet.has(p._id) && isNewArrival(p))
        .sort((a, b) => getCreatedAtValue(b) - getCreatedAtValue(a))

    const paginatedRest = restNewArrivals.slice(0, page * ITEMS_PER_PAGE)
    const hasMore = paginatedRest.length < restNewArrivals.length

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

            <div className="text-center mb-10">
                <h1 className="section-title mb-3">🎯 Featured Collection</h1>
                <p className="text-gray-500 text-lg">
                    {pinnedProducts.length > 0 ? "As seen in our latest ad — plus everything else we've got" : 'Everything your little one needs'}
                </p>
            </div>

            {loading && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-gray-100 rounded-3xl overflow-hidden animate-pulse">
                            <div className="h-48 bg-gray-200" />
                            <div className="p-4 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-4 bg-gray-200 rounded w-1/2" />
                                <div className="h-8 bg-gray-200 rounded-xl mt-3" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && (
                <>
                    {pinnedProducts.length > 0 && (
                        <div className="mb-14">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                                {pinnedProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                            <div className="flex items-center gap-4 mt-14 mb-2">
                                <div className="flex-1 h-px bg-gray-100" />
                                <p className="font-display text-lg text-charcoal">More From Kiddy Trends</p>
                                <div className="flex-1 h-px bg-gray-100" />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {paginatedRest.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {hasMore && (
                        <div className="text-center mt-10">
                            <button onClick={() => setPage((p) => p + 1)}
                                className="bg-coral text-white font-display text-base px-10 py-3 rounded-full hover:bg-opacity-90 transition-all hover:scale-105 shadow-md">
                                Load More Products ({restNewArrivals.length - paginatedRest.length} remaining)
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
