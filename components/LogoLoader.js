// Presentational Kiddy Trends branded loader — used by the initial splash
// screen and by route-transition loading. Keyframes live in globals.css.
export default function LogoLoader() {
    return (
        <div className="flex flex-col items-center justify-center gap-5">
            <div className="relative w-28 h-28">
                {/* Spinning brand ring */}
                <div className="absolute inset-0 rounded-full border-4 border-coral/20 border-t-coral"
                     style={{ animation: 'kt-ring-spin 0.9s linear infinite' }} />
                {/* Logo pops in */}
                <img src="/logo.jpg" alt="Kiddy Trends"
                     className="absolute inset-[6px] rounded-full object-cover"
                     style={{ width: 'calc(100% - 12px)', height: 'calc(100% - 12px)', animation: 'kt-pop 0.6s ease-out' }} />
            </div>

            <p className="font-display text-2xl text-coral" style={{ animation: 'kt-pop 0.7s ease-out' }}>
                Kiddy Trends
            </p>

            {/* Bouncing dots */}
            <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-coral"   style={{ animation: 'kt-bounce-dot 1s ease-in-out infinite' }} />
                <span className="w-2.5 h-2.5 rounded-full bg-sunny"   style={{ animation: 'kt-bounce-dot 1s ease-in-out 0.15s infinite' }} />
                <span className="w-2.5 h-2.5 rounded-full bg-skyblue" style={{ animation: 'kt-bounce-dot 1s ease-in-out 0.3s infinite' }} />
            </div>
        </div>
    )
}
