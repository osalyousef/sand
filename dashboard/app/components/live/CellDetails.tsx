"use client";

import { Ambulance, ClipboardList } from "lucide-react";
import { densityLabel, cellColor, type SelectedCellInfo } from "@/lib/grid";

export default function CellDetails({
  cell,
  onClose,
}: {
  cell: SelectedCellInfo;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-3 right-3 z-[1000] w-64 bg-gray-950/95 border border-gray-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm" style={{ background: cellColor(cell.t) }} />
          <span className="text-white text-sm font-semibold">تفاصيل الخلية</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white text-lg leading-none transition-colors"
          aria-label="إغلاق"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Big number */}
        <div className="text-center pb-2 border-b border-gray-800">
          <div className="text-3xl font-bold" style={{ color: cellColor(cell.t) }}>
            {cell.value}
          </div>
          <div className="text-gray-500 text-xs mt-0.5">حالة حرجة في هذه الخلية</div>
          <span
            className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full border"
            style={{ color: cellColor(cell.t), borderColor: cellColor(cell.t) }}
          >
            كثافة {densityLabel(cell.t)}
          </span>
        </div>

        {/* Rows */}
        <Row label="الإحداثيات" value={`${cell.lat.toFixed(5)}, ${cell.lng.toFixed(5)}`} mono />
        <Row label="المساحة" value="١٠٠م × ١٠٠م (هكتار واحد)" />
        <Row label="الكثافة" value={`${cell.densityPerKm2.toLocaleString("ar-SA")} / كم²`} />
        <Row label="النسبة من الإجمالي" value={`${(cell.share * 100).toFixed(1)}%`} />
        <Row label="أقرب معلم" value={`${cell.nearestLandmark} · ${cell.nearestDist} م`} />

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5">
            <Ambulance className="w-3.5 h-3.5" /> إرسال فريق
          </button>
          <button className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" /> الحالات
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span
        className={`text-gray-200 ${mono ? "font-mono text-[11px]" : ""}`}
        dir={mono ? "ltr" : "rtl"}
      >
        {value}
      </span>
    </div>
  );
}
