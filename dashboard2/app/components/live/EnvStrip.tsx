import { Thermometer, Droplets, Sun, Wind, Users } from "lucide-react";
import { ENV_READINGS, CROWD_META } from "@/lib/ops-data";

// Environmental context strip — heat, humidity, UV and crowd density per site.
// These readings correlate directly with pilgrim health-risk spikes.
export default function EnvStrip() {
  return (
    <div className="flex items-stretch gap-3 mb-3 flex-wrap">
      {ENV_READINGS.map(r => {
        const crowd = CROWD_META[r.crowd];
        const heatDanger = r.heatIndex >= 50;
        return (
          <div
            key={r.site}
            className="flex-1 min-w-[300px] flex items-center justify-between gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2"
          >
            {/* Site + temperature */}
            <div className="flex items-center gap-3">
              <div>
                <p className="text-white text-sm font-bold">{r.site}</p>
                <p className="text-gray-500 text-[10px]">بيئة الموقع</p>
              </div>
              <div className="flex items-end gap-1" data-tip="درجة الحرارة الحالية">
                <span className={`text-2xl font-bold leading-none ${heatDanger ? "text-red-400" : "text-yellow-400"}`}>
                  {r.temp}°
                </span>
                <span className={`text-[10px] mb-0.5 ${heatDanger ? "text-red-400/80" : "text-gray-500"}`}>
                  محسوسة {r.heatIndex}°
                </span>
              </div>
            </div>

            {/* Readings */}
            <div className="flex items-center gap-3 text-[10px] text-gray-400">
              <span className="flex items-center gap-1" data-tip="الرطوبة النسبية">
                <Droplets className="w-3 h-3 text-blue-400" /> {r.humidity}%
              </span>
              <span
                className={`flex items-center gap-1 ${r.uv >= 11 ? "text-red-400" : ""}`}
                data-tip="مؤشر الأشعة فوق البنفسجية"
              >
                <Sun className="w-3 h-3 text-yellow-400" /> UV {r.uv}
              </span>
              <span className="flex items-center gap-1" data-tip="سرعة الرياح">
                <Wind className="w-3 h-3 text-gray-500" /> {r.windKmh} كم/س
              </span>
            </div>

            {/* Crowd density */}
            <span
              className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border font-semibold ${crowd.chip}`}
              data-tip="كثافة الحشود الحالية"
            >
              <Users className="w-3 h-3" /> حشود {crowd.label}
            </span>
          </div>
        );
      })}

      {/* Heat warning chip */}
      <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/40 rounded-xl px-4" data-tip="مؤشر الحرارة المحسوسة تجاوز ٥٠° في منى">
        <Thermometer className="w-4 h-4 text-red-400 badge-pulse" />
        <div>
          <p className="text-red-400 text-xs font-bold leading-tight">إنذار حرارة</p>
          <p className="text-red-400/70 text-[10px]">خطر ضربات شمس مرتفع</p>
        </div>
      </div>
    </div>
  );
}
