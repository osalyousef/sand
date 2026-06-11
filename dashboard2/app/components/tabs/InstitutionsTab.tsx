"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Building2, Hospital, Cross, Truck, Phone, Radio, MapPin, Clock,
  BedDouble, Users, Activity,
} from "lucide-react";
import {
  INSTITUTIONS,
  INSTITUTION_STATUS_META,
  INSTITUTION_TYPE_LABEL,
  occupancyPct,
  occupancyColor,
  type Institution,
  type InstitutionType,
} from "@/lib/ops-data";

const TYPE_ICON: Record<InstitutionType, LucideIcon> = {
  hospital: Hospital,
  center: Building2,
  "first-aid": Cross,
  mobile: Truck,
};

// Sort: distressed facilities first, then by proximity to the worst hotspot.
const STATUS_ORDER = { full: 0, overwhelmed: 1, operational: 2 };
const SORTED = [...INSTITUTIONS].sort(
  (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.distanceKm - b.distanceKm
);

export default function InstitutionsTab() {
  const totalBeds = INSTITUTIONS.reduce((s, i) => s + i.bedsTotal, 0);
  const occupiedBeds = INSTITUTIONS.reduce((s, i) => s + i.bedsOccupied, 0);
  const totalCases = INSTITUTIONS.reduce((s, i) => s + i.casesToday, 0);
  const networkPct = Math.round((occupiedBeds / totalBeds) * 100);

  return (
    <div className="flex gap-3 h-full">
      {/* Facility cards */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {SORTED.map(inst => (
            <InstitutionCard key={inst.id} inst={inst} />
          ))}
        </div>
      </div>

      {/* Network summary */}
      <div className="w-72 flex flex-col gap-3">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 text-center">
          <p className="text-gray-400 text-xs font-medium mb-2">إشغال الشبكة الصحية</p>
          <div className="text-5xl font-bold" style={{ color: occupancyColor(networkPct) }}>
            {networkPct}%
          </div>
          <p className="text-gray-500 text-xs mt-2">
            {occupiedBeds} من أصل {totalBeds} سريرًا
          </p>
          <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${networkPct}%`, background: occupancyColor(networkPct) }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SummaryCard icon={Activity} label="حالات الحج اليوم" value={String(totalCases)} tone="text-blue-400 border-blue-800 bg-blue-900/20" />
          <SummaryCard icon={BedDouble} label="أسرّة متاحة" value={String(totalBeds - occupiedBeds)} tone="text-emerald-400 border-emerald-800 bg-emerald-900/20" />
        </div>

        {/* Status breakdown */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex-1">
          <p className="text-white text-xs font-semibold mb-3">حالة المنشآت</p>
          <div className="space-y-2.5">
            {(Object.keys(INSTITUTION_STATUS_META) as (keyof typeof INSTITUTION_STATUS_META)[]).map(s => {
              const meta = INSTITUTION_STATUS_META[s];
              const list = INSTITUTIONS.filter(i => i.status === s);
              return (
                <div key={s}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 text-gray-300">
                      <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    <span className="text-white font-semibold">{list.length}</span>
                  </div>
                  {list.map(i => (
                    <p key={i.id} className="text-[10px] text-gray-500 pr-4">{i.name}</p>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800 text-[10px] text-yellow-400 flex items-start gap-1.5">
            <Users className="w-3 h-3 mt-0.5 shrink-0" />
            عيادات الجمرات ممتلئة — وجّه الحالات الجديدة إلى المستشفى الميداني بمنى (٦ دقائق)
          </div>
        </div>
      </div>
    </div>
  );
}

function InstitutionCard({ inst }: { inst: Institution }) {
  const [copied, setCopied] = useState(false);
  const pct = occupancyPct(inst);
  const color = occupancyColor(pct);
  const meta = INSTITUTION_STATUS_META[inst.status];
  const Icon = TYPE_ICON[inst.type];

  return (
    <div
      className={`bg-gray-900 rounded-xl border p-4 flex flex-col gap-3 transition-colors ${
        inst.status === "full" ? "border-red-800" : inst.status === "overwhelmed" ? "border-yellow-800" : "border-gray-800 hover:border-gray-700"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center">
            <Icon className="w-4.5 h-4.5 text-blue-400" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">{inst.name}</p>
            <p className="text-gray-500 text-[10px]">{INSTITUTION_TYPE_LABEL[inst.type]} · {inst.id}</p>
          </div>
        </div>
        <span className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border font-semibold ${meta.chip}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      {/* Capacity */}
      <div>
        <div className="flex items-end justify-between mb-1">
          <span className="text-gray-500 text-[10px]">الإشغال</span>
          <span className="text-lg font-bold leading-none" style={{ color }}>
            {inst.bedsOccupied}<span className="text-gray-500 text-xs font-normal">/{inst.bedsTotal} سرير</span>
          </span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>

      {/* Specialties */}
      <div className="flex flex-wrap gap-1">
        {inst.specialties.map(s => (
          <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
            {s}
          </span>
        ))}
      </div>

      {/* Facts */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
        <span className="flex items-center gap-1 text-gray-400">
          <MapPin className="w-3 h-3 text-gray-600" /> {inst.distanceKm} كم من أعلى بؤرة
        </span>
        <span className="flex items-center gap-1 text-gray-400">
          <Clock className="w-3 h-3 text-gray-600" /> وصول ~{inst.etaMin} دقيقة
        </span>
        <span className="flex items-center gap-1 text-gray-400">
          <Activity className="w-3 h-3 text-gray-600" /> {inst.casesToday} حالة حج اليوم
        </span>
        <span className="flex items-center gap-1 text-gray-400">
          <Radio className="w-3 h-3 text-gray-600" /> {inst.radio}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-1">
        <button
          onClick={() => {
            navigator.clipboard?.writeText(inst.contact);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          data-tip={`نسخ الرقم ${inst.contact}`}
          className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <Phone className="w-3.5 h-3.5" /> {copied ? "تم النسخ ✓" : "اتصال"}
        </button>
        <button
          data-tip="عرض موقع المنشأة على خريطة القيادة"
          className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <MapPin className="w-3.5 h-3.5" /> على الخريطة
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, tone }: {
  icon: LucideIcon; label: string; value: string; tone: string;
}) {
  return (
    <div className={`rounded-xl border p-3 ${tone}`}>
      <Icon className="w-4 h-4 mb-1.5" />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[10px] opacity-70 mt-0.5">{label}</div>
    </div>
  );
}
