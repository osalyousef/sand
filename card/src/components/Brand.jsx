// Shared Nusuk-style brand marks used on both card faces.

// Simplified Saudi national emblem: a palm tree above two crossed swords.
export function SaudiEmblem({ className = '', color = '#ffffff' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      {/* crossed swords */}
      <g stroke={color} strokeWidth="2.4" strokeLinecap="round">
        <path d="M10 44c8 4 18 6 22 6s14-2 22-6" />
        <path d="M12 40c7 3.4 15 5.2 20 5.2S46 43.4 52 40" />
      </g>
      <g fill={color}>
        <path d="M14 41l3.4-1.8 1.7 3-3.3 1.8z" />
        <path d="M50 41l-3.4-1.8-1.7 3 3.3 1.8z" />
      </g>
      {/* palm tree */}
      <g stroke={color} strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M32 38V20" />
        <path d="M32 22c-3-5-9-7-14-6 4 1 7 3 9 6" />
        <path d="M32 22c3-5 9-7 14-6-4 1-7 3-9 6" />
        <path d="M32 19c-2-5-7-8-12-8 4 2 6 5 8 9" />
        <path d="M32 19c2-5 7-8 12-8-4 2-6 5-8 9" />
        <path d="M32 18c0-5-2-9-2-12 0 3-2 7-2 12" />
        <path d="M32 18c0-5 2-9 2-12 0 3 2 7 2 12" />
      </g>
    </svg>
  )
}

// Wordmark: Arabic "سند" with Latin "sanad", in the brand gradient.
export function NusukWordmark({ onGradient = true }) {
  // onGradient = sits on the colored header (use white); else use gradient text.
  if (onGradient) {
    return (
      <div className="flex flex-col items-end leading-none text-white">
        <span className="arabic text-[17px] font-extrabold tracking-tight">سند</span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.32em] text-white/85">
          sanad
        </span>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-end leading-none">
      <span className="arabic nusuk-text-gradient text-[17px] font-extrabold tracking-tight">
        سند
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-[0.32em] text-slate-400">
        sanad
      </span>
    </div>
  )
}
