import { useState } from 'react'
import HealthCard from './components/HealthCard'
import { mockPilgrims, RISK_THEMES } from './data/mockPilgrims'

export default function App() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const pilgrim = mockPilgrims[activeIndex]
  const theme = RISK_THEMES[pilgrim.risk]

  const selectPilgrim = (i) => {
    setActiveIndex(i)
    setFlipped(false)
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-100 to-slate-200 px-4 py-10">
      <div className="mx-auto flex max-w-3xl flex-col items-center">
        {/* Title */}
        <div className="no-print mb-6 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
            Hajj Health Card
          </h1>
          <p className="arabic mt-0.5 text-base font-semibold text-slate-500">
            بطاقة صحة الحاج
          </p>
        </div>

        {/* Pilgrim selector */}
        <div className="no-print mb-6 flex flex-wrap items-center justify-center gap-2">
          {mockPilgrims.map((p, i) => {
            const t = RISK_THEMES[p.risk]
            const active = i === activeIndex
            return (
              <button
                key={p.id}
                onClick={() => selectPilgrim(i)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'border-transparent text-white shadow-md'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                }`}
                style={active ? { backgroundColor: t.header } : undefined}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: active ? '#ffffff' : t.header }}
                />
                {p.name.en}
                <span className="text-xs opacity-70">· {t.labelEn}</span>
              </button>
            )
          })}
        </div>

        {/* Card */}
        <div id="print-area" className="mx-auto w-full max-w-[340px]">
          <HealthCard
            pilgrim={pilgrim}
            theme={theme}
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
          />
        </div>

        {/* Controls */}
        <div className="no-print mt-7 flex items-center gap-3">
          <button
            onClick={() => setFlipped((f) => !f)}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 12a9 9 0 0 1-15 6.7L3 16" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Flip Card
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Print Card
          </button>
        </div>

        <p className="no-print mt-5 text-center text-xs text-slate-400">
          Click the card to flip · Front shows identity & QR, back shows medical summary
        </p>
      </div>
    </div>
  )
}
