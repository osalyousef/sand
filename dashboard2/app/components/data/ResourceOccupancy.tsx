import { AI_KPIS } from "@/lib/mock-data";

const RESOURCES = [
  { label: "أسرة العناية المركزة", used: AI_KPIS.icuOccupancy, total: 100 },
  { label: "المستشفى الميداني", used: AI_KPIS.fieldHospitalOccupancy, total: 100 },
  { label: "سيارات الإسعاف", used: AI_KPIS.ambulances.total - AI_KPIS.ambulances.available, total: AI_KPIS.ambulances.total },
  { label: "الفرق الميدانية", used: 3, total: 5 },
];

export default function ResourceOccupancy() {
  return (
    <div className="w-64 flex flex-col gap-3">
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex-1">
        <p className="text-white text-sm font-semibold mb-4">الموارد الطبية</p>
        <div className="space-y-5">
          {RESOURCES.map(r => {
            const pct = Math.round((r.used / r.total) * 100);
            const statusColor = pct >= 80 ? "text-red-400" : pct >= 50 ? "text-yellow-400" : "text-emerald-400";
            const barColor = pct >= 80 ? "bg-red-500" : pct >= 50 ? "bg-yellow-500" : "bg-emerald-500";

            return (
              <div key={r.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-gray-300 text-xs">{r.label}</span>
                  <span className={`text-xs font-bold ${statusColor}`}>{pct}%</span>
                </div>
                <div className="relative bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-gray-600">
                  <span>{r.used} مستخدم</span>
                  <span>{r.total - r.used} متاح</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary stats */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <p className="text-white text-xs font-semibold mb-3">ملخص الحالة</p>
        <div className="space-y-2 text-[10px]">
          <div className="flex justify-between">
            <span className="text-gray-500">حالات الطوارئ المفتوحة</span>
            <span className="text-red-400 font-semibold">{AI_KPIS.activeAlerts}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">إسعاف متاح</span>
            <span className="text-emerald-400 font-semibold">{AI_KPIS.ambulances.available}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">فرق جاهزة للإرسال</span>
            <span className="text-emerald-400 font-semibold">٢</span>
          </div>
        </div>
      </div>
    </div>
  );
}
