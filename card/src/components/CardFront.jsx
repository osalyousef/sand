import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { SaudiEmblem, NusukWordmark } from './Brand'
import Field from './Field'

function PilgrimPhoto({ photo, accent }) {
  // Show the real photo when available; fall back to a silhouette if it fails to load.
  const [failed, setFailed] = useState(false)

  if (photo && !failed) {
    return (
      <div
        className="h-[96px] w-[96px] overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-black/10"
        style={{ outline: `3px solid ${accent}` }}
      >
        <img
          src={photo}
          alt="Pilgrim"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    )
  }

  return (
    <div
      className="flex h-[96px] w-[96px] items-center justify-center rounded-full bg-slate-50 shadow-sm ring-1 ring-black/10"
      style={{ outline: `3px solid ${accent}` }}
    >
      <svg viewBox="0 0 24 24" className="h-16 w-16 text-slate-300">
        <circle cx="12" cy="8" r="4" fill="currentColor" />
        <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" fill="currentColor" />
      </svg>
    </div>
  )
}

export default function CardFront({ pilgrim, theme }) {
  return (
    <div className="card-shadow flex h-full w-full flex-col overflow-hidden rounded-[18px] bg-white ring-1 ring-black/10">
      {/* Header — clean white, like the real Nusuk card */}
      <div className="relative flex items-center justify-between border-b border-slate-100 px-4 pb-2.5 pt-3">
        <div className="flex items-center gap-2">
          <SaudiEmblem className="h-7 w-7" color="#0f8f86" />
          <div className="leading-tight">
            <div className="text-[7px] font-semibold uppercase tracking-wider text-slate-400">
              Kingdom of Saudi Arabia
            </div>
            <div className="text-[9.5px] font-extrabold tracking-tight text-slate-800">
              Ministry of Hajj &amp; Umrah
            </div>
            <div className="arabic text-[8.5px] font-semibold text-slate-500">وزارة الحج والعمرة</div>
          </div>
        </div>
        <NusukWordmark onGradient={false} />
      </div>

      {/* Risk / category stripe (Nusuk uses colored stripes per category) */}
      <div
        className="flex items-center justify-center px-4 py-1 text-white"
        style={{ backgroundColor: theme.accent }}
      >
        <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide">
          {theme.warn && <span aria-hidden>⚠</span>}
          <span>RISK: {theme.labelEn.toUpperCase()}</span>
          <span className="arabic">{theme.labelAr}</span>
        </span>
      </div>

      {/* Photo + name */}
      <div className="guilloche flex flex-col items-center gap-1.5 px-3 pb-2 pt-3">
        <PilgrimPhoto photo={pilgrim.photo} accent={theme.accent} />
        <div className="w-full text-center">
          <div className="break-words text-[14px] font-semibold leading-snug text-slate-900">
            {pilgrim.name.en}
          </div>
          <div className="arabic break-words text-[12px] leading-snug text-[#444]">
            {pilgrim.name.ar}
          </div>
          <div className="mt-0.5 text-[9px] font-medium text-slate-400">
            {pilgrim.nationality.en} / <span className="arabic">{pilgrim.nationality.ar}</span>
          </div>
        </div>
      </div>

      {/* Info grid — paired fields, equal columns, centered divider */}
      <div className="guilloche px-3">
        <div
          className="grid divide-x divide-slate-100 border border-slate-100"
          style={{ gridTemplateColumns: '50% 50%' }}
        >
          <Field labelEn="PILGRIM ID" labelAr="رقم الحاج" value={pilgrim.id} className="border-b border-slate-100" />
          <Field labelEn="IDENTITY NO." labelAr="رقم الهوية" value={pilgrim.identityId} className="border-b border-slate-100" style={{ textAlign: 'center' }} />
          <Field labelEn="AGE" labelAr="العمر" value={`${pilgrim.age} yrs`} />
          <Field labelEn="BLOOD TYPE" labelAr="فصيلة الدم" value={pilgrim.bloodType} style={{ textAlign: 'center' }} />
        </div>
      </div>

      {/* QR */}
      <div className="guilloche flex flex-1 flex-col items-center justify-center gap-1 pb-2">
        <div className="rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-black/10">
          <QRCodeSVG value={pilgrim.id} size={108} level="M" fgColor="#1f2937" bgColor="#ffffff" />
        </div>
        <span className="text-[7px] font-semibold uppercase tracking-wider text-slate-400">
          Scan ID
        </span>
      </div>

      {/* Footer — neutral, single accent line */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-1.5">
        <span className="arabic text-[9px] font-bold text-slate-600">سند ضيوف الرحمن</span>
        <span className="text-[7.5px] font-bold uppercase tracking-[0.2em] text-slate-400">
          sanad · Hajj 1446
        </span>
      </div>
    </div>
  )
}
