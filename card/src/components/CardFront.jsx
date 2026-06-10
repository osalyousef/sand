import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

function PilgrimPhoto({ photo, accent }) {
  // Show the real photo when available; fall back to a silhouette if it fails to load.
  const [failed, setFailed] = useState(false)

  if (photo && !failed) {
    return (
      <div
        className="h-[104px] w-[104px] overflow-hidden rounded-2xl bg-white shadow-inner ring-1 ring-black/10"
        style={{ outline: `2px solid ${accent}22` }}
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
      className="flex h-[104px] w-[104px] items-center justify-center rounded-2xl bg-white shadow-inner ring-1 ring-black/10"
      style={{ outline: `2px solid ${accent}22` }}
    >
      <svg viewBox="0 0 24 24" className="h-16 w-16" style={{ color: `${accent}` }}>
        <circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.25" />
        <path
          d="M4 20c0-4 3.6-6 8-6s8 2 8 6"
          fill="currentColor"
          opacity="0.25"
        />
      </svg>
    </div>
  )
}

function InfoCell({ labelEn, labelAr, value }) {
  return (
    <div>
      <div className="flex items-baseline gap-1.5 text-[8.5px] font-semibold uppercase tracking-wide text-black/40">
        <span>{labelEn}</span>
        <span className="arabic text-[8.5px] normal-case tracking-normal">{labelAr}</span>
      </div>
      <div className="text-[13px] font-bold leading-tight text-black/85">{value}</div>
    </div>
  )
}

export default function CardFront({ pilgrim, theme }) {
  return (
    <div
      className="card-shadow flex h-full w-full flex-col overflow-hidden rounded-[18px] bg-white ring-1 ring-black/10"
      style={{ backgroundColor: theme.tint }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-5 py-3 text-white"
        style={{
          background: `linear-gradient(100deg, ${theme.header} 0%, ${theme.headerDark} 100%)`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25">
            {/* Kaaba-ish mark */}
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white">
              <path d="M12 2 3 6.5v11L12 22l9-4.5v-11L12 2Z" fill="currentColor" opacity="0.9" />
              <path d="M3 6.5 12 11l9-4.5M12 11v11" stroke="#ffffff" strokeWidth="0.8" opacity="0.5" fill="none" />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="text-[12.5px] font-extrabold tracking-tight">Hajj Health Platform</div>
            <div className="arabic text-[11px] font-semibold text-white/85">منصة صحة الحاج</div>
          </div>
        </div>
        <div className="text-right leading-tight">
          <div className="text-[8px] font-semibold uppercase tracking-widest text-white/70">Hajj Season</div>
          <div className="text-[15px] font-extrabold tracking-tight">1446</div>
        </div>
      </div>

      {/* Body */}
      <div className="guilloche relative flex flex-1 items-stretch gap-4 px-5 py-4">
        {/* Photo */}
        <div className="flex flex-col items-center gap-2 pt-0.5">
          <PilgrimPhoto photo={pilgrim.photo} accent={theme.accent} />
          <span
            className="rounded-full px-2.5 py-[3px] text-[8px] font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: theme.accent }}
          >
            Pilgrim
          </span>
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-0.5">
            <div className="truncate text-[18px] font-extrabold leading-tight text-black/90">
              {pilgrim.name.en}
            </div>
            <div className="arabic truncate text-[15px] font-bold leading-tight text-black/70">
              {pilgrim.name.ar}
            </div>
          </div>

          {/* Risk badge */}
          <div className="mb-2.5 mt-1">
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm"
              style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
            >
              {theme.warn && <span aria-hidden>⚠</span>}
              <span>Risk: {theme.labelEn}</span>
              <span className="arabic font-bold">{theme.labelAr}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="col-span-2">
              <InfoCell labelEn="Patient ID" labelAr="رقم الحاج" value={pilgrim.id} />
            </div>
            <InfoCell
              labelEn="Nationality"
              labelAr="الجنسية"
              value={pilgrim.nationality.en}
            />
            <InfoCell labelEn="Age" labelAr="العمر" value={`${pilgrim.age} yrs`} />
            <InfoCell labelEn="Blood Type" labelAr="فصيلة الدم" value={pilgrim.bloodType} />
          </div>
        </div>

        {/* QR */}
        <div className="flex flex-col items-center justify-center gap-1.5">
          <div className="rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-black/10">
            <QRCodeSVG
              value={pilgrim.id}
              size={76}
              level="M"
              fgColor={theme.headerDark}
              bgColor="#ffffff"
            />
          </div>
          <span className="text-[7.5px] font-semibold uppercase tracking-wider text-black/40">
            Scan ID
          </span>
        </div>
      </div>

      {/* Bottom strip */}
      <div
        className="accent-pattern flex items-center justify-between px-5 py-2 text-white"
        style={{ backgroundColor: theme.headerDark }}
      >
        <span className="arabic text-[10px] font-bold">سند ضيوف الرحمن</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/85">
          Hajj 1446
        </span>
      </div>
    </div>
  )
}
