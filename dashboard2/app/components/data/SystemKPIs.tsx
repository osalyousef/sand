"use client";

import { useState } from "react";
import { HeartPulse } from "lucide-react";
import { AI_KPIS, HOURLY_ALERTS } from "@/lib/mock-data";
import { RECOVERY_STATS } from "@/lib/ops-data";

const AR_HOURS = ["٠٠", "٠١", "٠٢", "٠٣", "٠٤", "٠٥", "٠٦", "٠٧", "٠٨", "٠٩", "١٠", "١١", "١٢", "١٣", "١٤", "١٥", "١٦", "١٧", "١٨", "١٩", "٢٠", "٢١", "٢٢", "٢٣"];

export default function SystemKPIs() {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxAlert = Math.max(...HOURLY_ALERTS);
  const peakHour = HOURLY_ALERTS.indexOf(maxAlert);
  const recoveredDelta = RECOVERY_STATS.today - RECOVERY_STATS.yesterday;

  return (
    <div className="flex-1 flex flex-col gap-3">
      {/* Recovered today — the number that matters most */}
      <div className="flex items-center justify-between bg-emerald-900/20 border border-emerald-800 rounded-xl px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-900/60 border border-emerald-700 flex items-center justify-center">
            <HeartPulse className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-emerald-300 text-sm font-bold">حالات تعافت اليوم</p>
            <p className="text-emerald-400/60 text-[10px]">عاد أصحابها لإكمال مناسك الحج بأمان</p>
          </div>
        </div>
        <div className="flex items-end gap-3">
          <span className="text-5xl font-bold text-emerald-400 leading-none">{RECOVERY_STATS.today}</span>
          <span className={`text-xs mb-1 ${recoveredDelta >= 0 ? "text-emerald-400" : "text-red-400"}`} data-tip={`أمس: ${RECOVERY_STATS.yesterday} حالة`}>
            {recoveredDelta >= 0 ? "▲" : "▼"} {Math.abs(recoveredDelta)} عن الأمس
          </span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="دقة التنبؤ بالمخاطر" value={`${AI_KPIS.predictionAccuracy}%`} sub="نموذج مدرّب على بيانات موسم الحج" color="purple" />
        <KpiCard label="نسبة الحل التلقائي" value={`${AI_KPIS.agentResolutionRate}%`} sub="دون تدخل بشري" color="blue" />
        <KpiCard label="متوسط وقت الاستجابة" value={AI_KPIS.avgResponseTime} sub="من المكالمة حتى الإرسال" color="yellow" />
        <KpiCard label="إجمالي الحجاج" value={String(AI_KPIS.totalPilgrims)} sub="تحت المراقبة الفعلية" color="green" />
      </div>

      {/* Hourly alert chart — interactive */}
      <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white text-sm font-semibold">حجم التنبيهات · آخر ٢٤ ساعة</p>
          <span className="text-xs text-gray-500">
            {hovered !== null
              ? `الساعة ${AR_HOURS[hovered]}:٠٠ — ${HOURLY_ALERTS[hovered]} تنبيه`
              : `الذروة: ${maxAlert} تنبيهًا · الساعة ${AR_HOURS[peakHour]}:٠٠`}
          </span>
        </div>
        <div className="flex items-end gap-1 h-28">
          {HOURLY_ALERTS.map((count, i) => {
            const isHovered = hovered === i;
            return (
              <div
                key={i}
                className="relative flex-1 flex flex-col items-center justify-end h-full cursor-pointer"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* hover tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full mb-1.5 px-2 py-1 bg-gray-950 border border-gray-700 rounded-md text-[10px] text-white whitespace-nowrap z-10 shadow-xl">
                    {AR_HOURS[i]}:٠٠ · <span className="font-bold">{count}</span> تنبيه
                  </div>
                )}
                <div
                  className="w-full rounded-sm transition-all"
                  style={{
                    height: `${(count / maxAlert) * 100}%`,
                    background: count >= 10 ? "#ef4444" : count >= 6 ? "#f59e0b" : "#00d4aa",
                    minHeight: 2,
                    opacity: hovered === null || isHovered ? 1 : 0.35,
                    boxShadow: isHovered ? "0 0 10px rgba(255,255,255,0.25)" : undefined,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1 text-[9px] text-gray-600">
          <span>٠٠:٠٠</span>
          <span>٠٦:٠٠</span>
          <span>١٢:٠٠</span>
          <span>١٨:٠٠</span>
          <span>٢٣:٠٠</span>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color }: {
  label: string; value: string; sub: string;
  color: "purple" | "blue" | "yellow" | "green";
}) {
  const colors = {
    purple: "text-purple-400 border-purple-800 bg-purple-900/20",
    blue: "text-blue-400 border-blue-800 bg-blue-900/20",
    yellow: "text-yellow-400 border-yellow-800 bg-yellow-900/20",
    green: "text-emerald-400 border-emerald-800 bg-emerald-900/20",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs font-medium">{label}</div>
      <div className="text-[10px] opacity-60 mt-0.5">{sub}</div>
    </div>
  );
}
