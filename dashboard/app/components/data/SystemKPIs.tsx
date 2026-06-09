import { AI_KPIS, HOURLY_ALERTS } from "@/lib/mock-data";

export default function SystemKPIs() {
  const maxAlert = Math.max(...HOURLY_ALERTS);

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="دقة التنبؤ بالمخاطر" value={`${AI_KPIS.predictionAccuracy}%`} sub="نموذج مدرّب على بيانات موسم الحج" color="purple" />
        <KpiCard label="نسبة الحل التلقائي" value={`${AI_KPIS.agentResolutionRate}%`} sub="دون تدخل بشري" color="blue" />
        <KpiCard label="متوسط وقت الاستجابة" value={AI_KPIS.avgResponseTime} sub="من المكالمة حتى الإرسال" color="yellow" />
        <KpiCard label="إجمالي الحجاج" value={String(AI_KPIS.totalPilgrims)} sub="تحت المراقبة الفعلية" color="green" />
      </div>

      {/* Hourly alert chart */}
      <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white text-sm font-semibold">حجم التنبيهات · آخر ٢٤ ساعة</p>
          <span className="text-xs text-gray-500">الذروة: {maxAlert} تنبيهات · الساعة ١٥:٠٠</span>
        </div>
        <div className="flex items-end gap-1 h-28">
          {HOURLY_ALERTS.map((count, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className="w-full rounded-sm"
                style={{
                  height: `${(count / maxAlert) * 100}%`,
                  background: count >= 10 ? "#ef4444" : count >= 6 ? "#eab308" : "#22c55e",
                  minHeight: 2,
                }}
                title={`${i}:00 — ${count} تنبيه`}
              />
            </div>
          ))}
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
