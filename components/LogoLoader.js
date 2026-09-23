// Presentational Kiddy Trends branded loader — used by the initial splash
// screen and by route-transition loading. Keyframes live in globals.css.
// Deliberately has no image (a network fetch has no place in something
// meant to appear instantly on every navigation) and only one animation.
export default function LogoLoader() {
    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-coral/20 border-t-coral"
                 style={{ animation: 'kt-ring-spin 0.7s linear infinite' }} />
            <p className="font-display text-xl text-coral">Kiddy Trends</p>
        </div>
    )
}
