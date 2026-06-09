import type { LucideIcon } from "lucide-react";
import { Phone, MessageSquare, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { AI_KPIS, MOCK_CONTACTS } from "@/lib/mock-data";

const CALL_ORIGINS = [
  { country: "إندونيسيا", calls: 34 },
  { country: "باكستان", calls: 28 },
  { country: "بنغلاديش", calls: 22 },
  { country: "نيجيريا", calls: 18 },
  { country: "مصر", calls: 15 },
  { country: "المغرب", calls: 12 },
];

export default function MetricsPanel() {
  const maxCalls = Math.max(...CALL_ORIGINS.map(o => o.calls));

  return (
    <div className="w-72 flex flex-col gap-3">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="مكالمات في الانتظار" value={String(MOCK_CONTACTS.filter(c => c.type === "call").length)} color="red" icon={Phone} />
        <MetricCard label="محادثات في الانتظار" value={String(MOCK_CONTACTS.filter(c => c.type === "chat").length)} color="blue" icon={MessageSquare} />
        <MetricCard label="متوسط الانتظار" value={AI_KPIS.avgResponseTime} color="yellow" icon={Clock} />
        <MetricCard label="نسبة الحل" value={`${AI_KPIS.agentResolutionRate}%`} color="green" icon={CheckCircle2} />
      </div>

      {/* Call origins */}
      <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 p-4">
        <p className="text-white text-xs font-semibold mb-3">مصدر المكالمات حسب الجنسية</p>
        <div className="space-y-2">
          {CALL_ORIGINS.map(o => (
            <div key={o.country} className="flex items-center gap-2">
              <span className="text-gray-400 text-[10px] w-20 truncate">{o.country}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(o.calls / maxCalls) * 100}%` }}
                />
              </div>
              <span className="text-gray-400 text-[10px] w-5 text-left">{o.calls}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-800 flex items-start gap-1.5 text-[10px] text-yellow-400">
          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> ارتفاع ملحوظ في مكالمات مخيم منى C3 · محتمل عطل تكييف
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color, icon: Icon }: {
  label: string; value: string; color: "red" | "yellow" | "green" | "blue"; icon: LucideIcon;
}) {
  const colors = {
    red: "text-red-400 bg-red-900/30 border-red-800",
    yellow: "text-yellow-400 bg-yellow-900/30 border-yellow-800",
    green: "text-emerald-400 bg-emerald-900/30 border-emerald-800",
    blue: "text-blue-400 bg-blue-900/30 border-blue-800",
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <Icon className="w-4 h-4 mb-1.5" />
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] opacity-70 mt-0.5">{label}</div>
    </div>
  );
}
