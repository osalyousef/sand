"use client";

import { TrendingDown, TrendingUp, Users, Clock } from "lucide-react";
import { AI_KPIS } from "@/lib/mock-data";
import { OPS_SUMMARY } from "@/lib/ops-data";

export default function Footer() {
  const resolvedDelta = OPS_SUMMARY.resolvedToday - OPS_SUMMARY.resolvedYesterday;

  return (
    <footer className="flex items-center justify-between px-6 py-2 bg-gray-950 border-t border-gray-800 text-xs text-gray-500">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>وزارة الحج والعمرة · سند v1.0</span>
      </div>

      <div className="flex items-center gap-5">
        <Metric label="الحجاج" value={String(AI_KPIS.totalPilgrims)} />
        <Metric label="تنبيهات نشطة" value={String(AI_KPIS.activeAlerts)} tone="danger" />

        {/* Response time + trend */}
        <div
          className="flex items-center gap-1.5"
          data-tip={OPS_SUMMARY.responseImproving ? "زمن الاستجابة يتحسن مقارنة بالأمس" : "زمن الاستجابة يتباطأ"}
        >
          <span className="text-gray-600">الاستجابة:</span>
          <span className="text-gray-300 font-mono" dir="ltr">{OPS_SUMMARY.avgResponse}</span>
          {OPS_SUMMARY.responseImproving ? (
            <span className="flex items-center gap-0.5 text-emerald-400">
              <TrendingDown className="w-3 h-3" /> {OPS_SUMMARY.responseDelta}
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-red-400">
              <TrendingUp className="w-3 h-3" /> {OPS_SUMMARY.responseDelta}
            </span>
          )}
        </div>

        {/* Resolved today vs yesterday */}
        <div className="flex items-center gap-1.5" data-tip={`أمس: ${OPS_SUMMARY.resolvedYesterday} حالة`}>
          <span className="text-gray-600">حالات محلولة اليوم:</span>
          <span className="text-emerald-400 font-semibold">{OPS_SUMMARY.resolvedToday}</span>
          <span className={resolvedDelta >= 0 ? "text-emerald-400" : "text-red-400"}>
            ({resolvedDelta >= 0 ? "+" : ""}{resolvedDelta})
          </span>
        </div>

        {/* Team availability */}
        <div className="flex items-center gap-1.5" data-tip="نسبة الفرق الميدانية الجاهزة للإرسال">
          <Users className="w-3 h-3 text-gray-600" />
          <span className="text-gray-600">جاهزية الفرق:</span>
          <span className={OPS_SUMMARY.teamAvailabilityPct < 30 ? "text-red-400 font-semibold" : "text-gray-300 font-semibold"}>
            {OPS_SUMMARY.teamAvailabilityPct}%
          </span>
        </div>

        {/* Next shift */}
        <div className="flex items-center gap-1.5" data-tip="موعد تسليم الوردية القادمة">
          <Clock className="w-3 h-3 text-gray-600" />
          <span className="text-gray-600">الوردية القادمة:</span>
          <span className="text-blue-400 font-semibold">بعد {OPS_SUMMARY.nextShiftMin} دقيقة</span>
        </div>
      </div>
    </footer>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "danger" }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-gray-600">{label}:</span>
      <span className={tone === "danger" ? "text-red-400 font-semibold" : "text-gray-300"}>{value}</span>
    </div>
  );
}
