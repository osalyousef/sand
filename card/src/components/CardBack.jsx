function TagGroup({ titleEn, titleAr, items, tagClass, emptyEn }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline gap-1.5">
        <span className="text-[9px] font-bold uppercase tracking-wide text-black/45">{titleEn}</span>
        <span className="arabic text-[9px] font-semibold text-black/40">{titleAr}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 ? (
          <span className="rounded-md bg-black/5 px-2 py-[3px] text-[9.5px] font-medium text-black/40">
            {emptyEn}
          </span>
        ) : (
          items.map((it, i) => (
            <span
              key={i}
              className={`rounded-md px-2 py-[3px] text-[9.5px] font-semibold ${tagClass}`}
            >
              {it.en}
            </span>
          ))
        )}
      </div>
    </div>
  )
}

export default function CardBack({ pilgrim, theme }) {
  return (
    <div
      className="card-shadow flex h-full w-full flex-col overflow-hidden rounded-[18px] bg-white ring-1 ring-black/10"
      style={{ backgroundColor: theme.tint }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-5 py-2.5 text-white"
        style={{
          background: `linear-gradient(100deg, ${theme.header} 0%, ${theme.headerDark} 100%)`,
        }}
      >
        <div className="text-[11px] font-extrabold tracking-tight">Medical Summary</div>
        <div className="arabic text-[11px] font-bold text-white/90">الملخص الطبي</div>
      </div>

      {/* Magnetic stripe accent */}
      <div className="h-5 w-full" style={{ backgroundColor: theme.headerDark }} />

      {/* Body */}
      <div className="guilloche flex flex-1 flex-col gap-2.5 px-5 py-3">
        <TagGroup
          titleEn="Medical Conditions"
          titleAr="الحالات الطبية"
          items={pilgrim.conditions}
          tagClass="bg-slate-200 text-slate-700"
          emptyEn="None recorded"
        />
        <TagGroup
          titleEn="Allergies"
          titleAr="الحساسية"
          items={pilgrim.allergies}
          tagClass="bg-red-100 text-red-700 ring-1 ring-red-200"
          emptyEn="No known allergies"
        />
        <TagGroup
          titleEn="Medications"
          titleAr="الأدوية"
          items={pilgrim.medications}
          tagClass="bg-blue-100 text-blue-700 ring-1 ring-blue-200"
          emptyEn="None"
        />

        {/* Emergency contact */}
        <div
          className="mt-auto flex items-center justify-between rounded-lg px-3 py-2 text-white"
          style={{ backgroundColor: theme.accent }}
        >
          <div className="leading-tight">
            <div className="text-[8px] font-bold uppercase tracking-widest text-white/70">
              Emergency Contact <span className="arabic">جهة الطوارئ</span>
            </div>
            <div className="text-[12px] font-extrabold">{pilgrim.emergency.name.en}</div>
            <div className="arabic text-[10px] font-semibold text-white/85">
              {pilgrim.emergency.name.ar}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[13px] font-extrabold tracking-tight" dir="ltr">
              {pilgrim.emergency.phone}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom note */}
      <div
        className="accent-pattern px-5 py-2 text-center text-white"
        style={{ backgroundColor: theme.headerDark }}
      >
        <span className="arabic text-[9.5px] font-semibold">
          في حالة الطوارئ يرجى التواصل مع الفريق الطبي
        </span>
      </div>
    </div>
  )
}
