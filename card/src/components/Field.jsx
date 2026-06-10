// Shared label+value cell: "ENGLISH LABEL عربي" then a bold value below.
export default function Field({ labelEn, labelAr, value, className = '', valueClassName = 'text-[10px]', style }) {
  return (
    <div className={`min-w-0 px-2.5 py-1.5 ${className}`} style={style}>
      <p className="text-[7.5px] font-semibold uppercase tracking-wide text-slate-500" style={{ textAlign: style?.textAlign }}>
        {labelEn} / <span className="arabic normal-case font-medium text-slate-400">{labelAr}</span>
      </p>
      <p className={`mt-1 break-words font-bold leading-tight text-slate-900 ${valueClassName}`} dir="ltr" style={{ textAlign: style?.textAlign }}>
        {value}
      </p>
    </div>
  )
}
