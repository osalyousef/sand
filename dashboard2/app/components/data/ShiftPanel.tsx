import { Users, Clock, ClipboardList, BatteryLow } from "lucide-react";
import { MOCK_TEAMS } from "@/lib/mock-data";
import { CURRENT_SHIFT, TEAM_HOURS, fatigueColor } from "@/lib/ops-data";

// Shift & team management: who's on duty, fatigue levels, handoff notes.
export default function ShiftPanel() {
  return (
    <div className="w-72 flex flex-col gap-3">
      {/* Current shift */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-white text-xs font-semibold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" /> الوردية الحالية
          </p>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/40 border border-blue-800 text-blue-300">
            {CURRENT_SHIFT.name}
          </span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between">
            <span className="text-gray-500">المشرف</span>
            <span className="text-gray-200">{CURRENT_SHIFT.supervisor}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">الفترة</span>
            <span className="text-gray-200" dir="ltr">{CURRENT_SHIFT.start} → {CURRENT_SHIFT.end}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">الطاقم المناوب</span>
            <span className="text-gray-200">{CURRENT_SHIFT.staffOnDuty} فردًا</span>
          </div>
        </div>

        {/* Shift progress */}
        <div className="mt-3" data-tip="نسبة المنقضي من الوردية">
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${CURRENT_SHIFT.elapsedPct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px]">
            <span className="text-gray-500">{CURRENT_SHIFT.elapsedPct}% من الوردية</span>
            <span className="flex items-center gap-1 text-blue-400 font-semibold">
              <Clock className="w-3 h-3" /> التسليم بعد {CURRENT_SHIFT.nextShiftMin} دقيقة
            </span>
          </div>
        </div>
      </div>

      {/* Team fatigue */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <p className="text-white text-xs font-semibold mb-3 flex items-center gap-1.5">
          <BatteryLow className="w-3.5 h-3.5 text-yellow-400" /> إجهاد الفرق (ساعات العمل)
        </p>
        <div className="space-y-2.5">
          {MOCK_TEAMS.map(t => {
            const hours = TEAM_HOURS[t.id] ?? 0;
            const color = fatigueColor(hours);
            return (
              <div key={t.id}>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-gray-400">{t.name}</span>
                  <span style={{ color }} className="font-semibold">{hours} / ١٢ س</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min((hours / 12) * 100, 100)}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 pt-2 border-t border-gray-800 text-[10px] text-red-400">
          فريق التدخل السريع تجاوز ١١ ساعة — يُنصح باستبداله عند التسليم
        </p>
      </div>

      {/* Handoff notes */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex-1">
        <p className="text-white text-xs font-semibold mb-3 flex items-center gap-1.5">
          <ClipboardList className="w-3.5 h-3.5 text-emerald-400" /> ملاحظات تسليم الوردية
        </p>
        <ul className="space-y-2">
          {CURRENT_SHIFT.handoffNotes.map((note, i) => (
            <li key={i} className="text-[11px] text-gray-300 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 leading-relaxed">
              {note}
            </li>
          ))}
        </ul>
        <button className="w-full mt-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] rounded-lg transition-colors">
          + إضافة ملاحظة تسليم
        </button>
      </div>
    </div>
  );
}
