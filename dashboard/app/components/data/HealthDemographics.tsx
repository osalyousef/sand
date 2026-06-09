import { RISK_DISTRIBUTION, CHRONIC_CONDITIONS } from "@/lib/mock-data";
import { RISK_COLORS } from "@/lib/types";

const total = RISK_DISTRIBUTION.green + RISK_DISTRIBUTION.yellow + RISK_DISTRIBUTION.red;

const RISK_LABEL = { green: "آمن", yellow: "تحذير", red: "خطر" };

const CONDITIONS_AR: Record<string, string> = {
  Hypertension: "ضغط الدم",
  Diabetes: "السكري",
  "Heart Condition": "أمراض القلب",
  Respiratory: "أمراض التنفس",
  None: "لا يوجد",
};

export default function HealthDemographics() {
  return (
    <div className="flex flex-col gap-4 flex-1">
      {/* Risk distribution */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <p className="text-white text-sm font-semibold mb-4">توزيع مستوى الخطورة</p>

        <div className="flex rounded-full overflow-hidden h-6 mb-3">
          {(["green", "yellow", "red"] as const).map(r => (
            <div
              key={r}
              className="h-full transition-all"
              style={{ width: `${(RISK_DISTRIBUTION[r] / total) * 100}%`, background: RISK_COLORS[r] }}
              title={`${RISK_LABEL[r]}: ${RISK_DISTRIBUTION[r]}`}
            />
          ))}
        </div>

        <div className="flex justify-around">
          {(["green", "yellow", "red"] as const).map(r => (
            <div key={r} className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold" style={{ color: RISK_COLORS[r] }}>
                {RISK_DISTRIBUTION[r]}
              </span>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: RISK_COLORS[r] }} />
                <span className="text-gray-500 text-xs">{RISK_LABEL[r]}</span>
              </div>
              <span className="text-gray-600 text-[10px]">
                {((RISK_DISTRIBUTION[r] / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chronic conditions */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 flex-1">
        <p className="text-white text-sm font-semibold mb-4">الأمراض المزمنة</p>
        <div className="space-y-3">
          {CHRONIC_CONDITIONS.map(c => (
            <div key={c.name}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{CONDITIONS_AR[c.name] ?? c.name}</span>
                <span className="text-white font-medium">{c.count}</span>
              </div>
              <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(c.count / 34) * 100}%`, background: c.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
