import type { LucideIcon } from "lucide-react";
import { Heart, Thermometer, Wind, AlertTriangle, Pill, Map, Ambulance } from "lucide-react";
import type { MockPilgrim } from "@/lib/mock-data";
import { RISK_COLORS } from "@/lib/types";

const RISK_LABEL = { red: "خطر", yellow: "تحذير", green: "آمن" };

export default function PilgrimDetail({ pilgrim }: { pilgrim: MockPilgrim }) {
  const conditions = [
    pilgrim.hasDiabetes && "السكري",
    pilgrim.hasHeartCondition && "أمراض القلب",
    pilgrim.hasHypertension && "ارتفاع ضغط الدم",
  ].filter(Boolean) as string[];

  return (
    <div className="flex-1 flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center text-3xl">
            {pilgrim.nationalityFlag}
          </div>
          <div>
            <h2 className="text-white text-lg font-semibold">{pilgrim.name}</h2>
            <p className="text-gray-500 text-xs">
              {pilgrim.id} · {pilgrim.gender === "male" ? "ذكر" : "أنثى"} · {pilgrim.age} سنة · {pilgrim.nationality}
            </p>
          </div>
        </div>
        <span
          className="text-xs px-3 py-1 rounded-full border font-semibold"
          style={{ color: RISK_COLORS[pilgrim.riskLevel], borderColor: RISK_COLORS[pilgrim.riskLevel] }}
        >
          {RISK_LABEL[pilgrim.riskLevel]}
        </span>
      </div>

      <div className="p-6 space-y-5">
        {/* Vitals */}
        <section>
          <h3 className="text-gray-400 text-xs font-medium mb-3">المؤشرات الحيوية · {pilgrim.lastUpdate}</h3>
          <div className="grid grid-cols-3 gap-3">
            <Vital icon={Heart} label="معدل النبض" value={pilgrim.heartRate} unit="ن/د" status={hrStatus(pilgrim.heartRate)} />
            <Vital icon={Thermometer} label="الحرارة" value={pilgrim.temperature} unit="°م" status={tempStatus(pilgrim.temperature)} />
            <Vital icon={Wind} label="الأكسجين" value={pilgrim.oxygenLevel} unit="%" status={o2Status(pilgrim.oxygenLevel)} />
          </div>
          {pilgrim.condition && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-800 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> الحالة الحالية: {pilgrim.condition}
            </div>
          )}
        </section>

        {/* Personal / medical info */}
        <section className="grid grid-cols-2 gap-4">
          <InfoBlock title="المعلومات الشخصية">
            <Info label="رقم الجواز" value={pilgrim.passportNumber} mono />
            <Info label="فصيلة الدم" value={pilgrim.bloodType} mono />
            <Info label="الجنسية" value={pilgrim.nationality} />
            <Info label="العمر" value={`${pilgrim.age} سنة`} />
          </InfoBlock>

          <InfoBlock title="الأمراض المزمنة">
            {conditions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {conditions.map(c => (
                  <span key={c} className="text-[11px] px-2 py-1 rounded-full bg-red-900/40 text-red-300 border border-red-800">
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-xs">لا توجد أمراض مزمنة مسجلة</p>
            )}
          </InfoBlock>
        </section>

        {/* Medications */}
        <InfoBlock title="الأدوية">
          {pilgrim.medications.length > 0 ? (
            <ul className="space-y-1.5">
              {pilgrim.medications.map(m => (
                <li key={m} className="text-xs text-gray-300 flex items-center gap-2">
                  <Pill className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {m}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 text-xs">لا توجد أدوية مسجلة</p>
          )}
        </InfoBlock>

        {/* Location */}
        <InfoBlock title="الموقع الحالي">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-gray-300" dir="ltr">
              {pilgrim.lat.toFixed(5)}, {pilgrim.lng.toFixed(5)}
            </span>
            <span className="text-[10px] text-gray-500">{pilgrim.lastUpdate}</span>
          </div>
        </InfoBlock>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5">
            <Map className="w-4 h-4" /> تحديد على الخريطة
          </button>
          <button className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5">
            <Ambulance className="w-4 h-4" /> إرسال فريق
          </button>
        </div>
      </div>
    </div>
  );
}

type Status = "normal" | "warn" | "danger";
function hrStatus(v: number): Status { return v >= 115 ? "danger" : v >= 100 ? "warn" : "normal"; }
function tempStatus(v: number): Status { return v >= 39.5 ? "danger" : v >= 38.5 ? "warn" : "normal"; }
function o2Status(v: number): Status { return v <= 93 ? "danger" : v <= 96 ? "warn" : "normal"; }

function Vital({ icon: Icon, label, value, unit, status }: {
  icon: LucideIcon; label: string; value: number; unit: string; status: Status;
}) {
  const colors = {
    normal: "text-emerald-400 border-emerald-800 bg-emerald-900/10",
    warn: "text-yellow-400 border-yellow-800 bg-yellow-900/10",
    danger: "text-red-400 border-red-800 bg-red-900/10",
  };
  return (
    <div className={`rounded-xl border p-3 text-center ${colors[status]}`}>
      <Icon className="w-5 h-5 mx-auto" />
      <div className="text-2xl font-bold mt-1">{value}<span className="text-xs font-normal mr-1">{unit}</span></div>
      <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-950 rounded-xl border border-gray-800 p-4">
      <h3 className="text-gray-400 text-xs font-medium mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs mb-2 last:mb-0">
      <span className="text-gray-500">{label}</span>
      <span className={`text-gray-200 ${mono ? "font-mono" : ""}`} dir={mono ? "ltr" : "rtl"}>{value}</span>
    </div>
  );
}
