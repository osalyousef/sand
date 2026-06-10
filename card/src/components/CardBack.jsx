import { NusukWordmark } from './Brand'
import Field from './Field'

function TagCell({ labelEn, labelAr, items, tagClass, emptyEn, className = '', style }) {
  const center = style?.textAlign === 'center'
  return (
    <div className={`px-3 py-2 ${className}`} style={style}>
      <p className="mb-1 text-[8px] font-semibold uppercase tracking-wide text-slate-500">
        {labelEn} / <span className="arabic normal-case font-medium text-slate-400">{labelAr}</span>
      </p>
      <div className={`flex flex-wrap gap-1 ${center ? 'justify-center' : ''}`}>
        {items.length === 0 ? (
          <span className="rounded-md bg-slate-100 px-1.5 py-[2px] text-[8.5px] font-medium text-slate-400">
            {emptyEn}
          </span>
        ) : (
          items.map((it, i) => (
            <span key={i} className={`rounded-md px-1.5 py-[2px] text-[8.5px] font-semibold ${tagClass}`}>
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
    <div className="card-shadow flex h-full w-full flex-col overflow-hidden rounded-[18px] bg-white ring-1 ring-black/10">
      {/* Header — clean white, like the real Nusuk card */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <div className="leading-tight">
          <div className="text-[10.5px] font-extrabold tracking-tight text-slate-800">Medical Summary</div>
          <div className="arabic text-[9px] font-semibold text-slate-500">الملخص الطبي</div>
        </div>
        <NusukWordmark onGradient={false} />
      </div>

      {/* Risk band */}
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

      {/* Body */}
      <div className="guilloche flex flex-1 flex-col gap-3 px-4 py-3">
        {/* Block 1 — Campaign */}
        <div
          className="grid divide-x divide-slate-100 border border-slate-100"
          style={{ gridTemplateColumns: '50% 50%' }}
        >
          <Field
            labelEn="CAMPAIGN"
            labelAr="اسم الحملة"
            value={pilgrim.campaign.name.en}
            valueClassName="text-[11px]"
          />
          <Field
            labelEn="PHONE"
            labelAr="رقم التواصل"
            value={pilgrim.campaign.phone}
            valueClassName="text-[11px]"
            style={{ textAlign: 'center' }}
          />
        </div>

        <hr className="border-t border-slate-200" />

        {/* Block 2 — Medical */}
        <div
          className="grid divide-x divide-slate-100 border border-slate-100"
          style={{ gridTemplateColumns: '50% 50%' }}
        >
          <TagCell
            labelEn="CONDITIONS"
            labelAr="الحالات الطبية"
            items={pilgrim.conditions}
            tagClass="bg-slate-200 text-slate-700"
            emptyEn="None"
            className="border-b border-slate-100"
          />
          <TagCell
            labelEn="ALLERGIES"
            labelAr="الحساسية"
            items={pilgrim.allergies}
            tagClass="bg-red-100 text-red-700 ring-1 ring-red-200"
            emptyEn="None"
            className="border-b border-slate-100"
            style={{ textAlign: 'center' }}
          />
          <TagCell
            labelEn="MEDICATIONS"
            labelAr="الأدوية"
            items={pilgrim.medications}
            tagClass="bg-blue-100 text-blue-700 ring-1 ring-blue-200"
            emptyEn="None"
          />
          <div />
        </div>

        {/* Block 3 — Emergency contact */}
        <div
          className="mt-auto flex flex-col gap-0.5 rounded-lg px-2 py-1 text-white"
          style={{ backgroundColor: theme.accent }}
        >
          <div className="text-[6px] font-bold uppercase tracking-widest text-white/75">
            Emergency Contact <span className="arabic">جهة الطوارئ</span>
          </div>
          <div className="text-[9px] font-extrabold leading-tight">
            {pilgrim.emergency.name.en}
          </div>
          <div className="text-[10.5px] font-extrabold tracking-tight" dir="ltr">
            {pilgrim.emergency.phone}
          </div>
        </div>
      </div>
    </div>
  )
}
