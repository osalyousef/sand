import { AI_KPIS } from "@/lib/mock-data";

export default function Footer() {
  return (
    <footer className="flex items-center justify-between px-6 py-2 bg-gray-950 border-t border-gray-800 text-xs text-gray-500">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>وزارة الحج والعمرة · سند v0.1.0</span>
      </div>
      <div className="flex items-center gap-6">
        <Metric label="إجمالي الحجاج" value={String(AI_KPIS.totalPilgrims)} />
        <Metric label="التنبيهات النشطة" value={String(AI_KPIS.activeAlerts)} highlight />
        <Metric label="الفرق الميدانية" value={String(AI_KPIS.fieldTeams)} />
        <Metric label="دقة التنبؤ" value={`${AI_KPIS.predictionAccuracy}%`} />
      </div>
    </footer>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-gray-600">{label}:</span>
      <span className={highlight ? "text-red-400 font-semibold" : "text-gray-300"}>{value}</span>
    </div>
  );
}
