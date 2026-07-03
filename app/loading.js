import LogoLoader from '../components/LogoLoader'

// Branded loader shown during route-segment loading (Suspense/navigation).
export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-cream">
            <LogoLoader />
        </div>
    )
}
