"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Heart, Thermometer, Wind, AlertTriangle, Pill, Map, Ambulance,
  History, CheckCircle2, Copy, Check, PhoneCall, Stethoscope,
  Building2, FileCheck2, HeartPulse, Bot, RefreshCw, Sparkles,
} from "lucide-react";
import type { MockPilgrim } from "@/lib/mock-data";
import { RISK_COLORS } from "@/lib/types";
import {
  getTimeline, getDischarge, RECOVERED_IDS,
  type MedicalEvent, type MedicalEventType,
} from "@/lib/ops-data";
import { useSanadStore } from "@/lib/store";

const RISK_LABEL = { red: "خطر", yellow: "تحذير", green: "آمن" };

const EVENT_META: Record<MedicalEventType, { icon: LucideIcon; color: string }> = {
  hotline:   { icon: PhoneCall,   color: "#f59e0b" },
  dispatch:  { icon: Ambulance,   color: "#3b82f6" },
  treatment: { icon: Stethoscope, color: "#a855f7" },
  transfer:  { icon: Building2,   color: "#ef4444" },
  discharge: { icon: FileCheck2,  color: "#00d4aa" },
};

// The agent drafts the discharge summary from the record; the doctor reviews,
// edits if needed, and approves. Two phrasings so "إعادة التوليد" visibly works.
function buildAgentDraft(p: MockPilgrim, d: ReturnType<typeof getDischarge>, variant: number): string {
  if (variant % 2 === 0) {
    return `تم التعامل مع الحاج ${p.name} (${p.age} سنة، ${p.nationality}) إثر «${d.condition}». العلاج المقدم: ${d.treatment}. المؤشرات الحيوية عند الإغلاق: نبض ${p.heartRate} ن/د، حرارة ${p.temperature}°م، أكسجين ${p.oxygenLevel}٪ — ضمن نطاق المتابعة الآمن. تعليمات المتابعة: ${d.followUp}. لا مانع طبي من استكمال المناسك.`;
  }
  return `استُقبل الحاج ${p.name} بحالة «${d.condition}» وعولج ميدانياً بواسطة ${d.team}. الإجراء: ${d.treatment}. استقرت العلامات الحيوية (نبض ${p.heartRate}، حرارة ${p.temperature}°م، أكسجين ${p.oxygenLevel}٪) وأصبحت الحالة مستقرة. يُوصى بـ: ${d.followUp}. يُسمح له باستكمال المناسك مع المراقبة الذاتية.`;
}

export default function PilgrimDetail({ pilgrim }: { pilgrim: MockPilgrim }) {
  const [copied, setCopied] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [recoveryNote, setRecoveryNote] = useState("");
  const [justRecovered, setJustRecovered] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState("");
  const [sentTeam, setSentTeam] = useState<string | null>(null);
  const genCount = useRef(0);
  const genTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusOnMap = useSanadStore(s => s.focusOnMap);
  const dispatchForPilgrim = useSanadStore(s => s.dispatchForPilgrim);

  useEffect(() => () => { if (genTimer.current) clearTimeout(genTimer.current); }, []);

  const wasRecovered = RECOVERED_IDS.has(pilgrim.id);
  const isRecovered = wasRecovered || justRecovered;
  const discharge = useMemo(() => getDischarge(pilgrim), [pilgrim]);
  const timeline = useMemo(() => getTimeline(pilgrim), [pilgrim]);

  function generateDraft() {
    setGenerating(true);
    const variant = genCount.current++;
    genTimer.current = setTimeout(() => {
      setDraft(buildAgentDraft(pilgrim, discharge, variant));
      setGenerating(false);
    }, 900);
  }

  const conditions = [
    pilgrim.hasDiabetes && "السكري",
    pilgrim.hasHeartCondition && "أمراض القلب",
    pilgrim.hasHypertension && "ارتفاع ضغط الدم",
  ].filter(Boolean) as string[];

  function copyGps() {
    navigator.clipboard?.writeText(`${pilgrim.lat.toFixed(5)}, ${pilgrim.lng.toFixed(5)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className={`flex-1 flex flex-col bg-gray-900 rounded-xl border overflow-y-auto ${
        isRecovered ? "border-emerald-700" : "border-gray-800"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center text-3xl">
            {pilgrim.nationalityFlag}
            {isRecovered && (
              <span className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-emerald-600 border-2 border-gray-900 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-gray-950" strokeWidth={3} />
              </span>
            )}
          </div>
          <div>
            <h2 className="text-white text-lg font-semibold">{pilgrim.name}</h2>
            <p className="text-gray-500 text-xs">
              {pilgrim.id} · {pilgrim.gender === "male" ? "ذكر" : "أنثى"} · {pilgrim.age} سنة · {pilgrim.nationality}
            </p>
          </div>
        </div>
        {isRecovered ? (
          <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-semibold text-emerald-400 border-emerald-600 bg-emerald-900/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> تعافى
          </span>
        ) : (
          <span
            className="text-xs px-3 py-1 rounded-full border font-semibold"
            style={{ color: RISK_COLORS[pilgrim.riskLevel], borderColor: RISK_COLORS[pilgrim.riskLevel] }}
          >
            {RISK_LABEL[pilgrim.riskLevel]}
          </span>
        )}
      </div>

      <div className="p-6 space-y-5">
        {/* Discharge summary — shown once the pilgrim is cured */}
        {isRecovered && (
          <section className="fade-in bg-emerald-900/20 border border-emerald-800 rounded-xl p-4">
            <h3 className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold mb-3">
              <FileCheck2 className="w-4 h-4" /> ملخص الخروج — تم التعافي
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <Info label="الحالة المعالجة" value={discharge.condition} />
              <Info label="العلاج المقدم" value={discharge.treatment} />
              <Info label="الطبيب المعالج" value={discharge.doctor} />
              <Info label="الفريق" value={discharge.team} />
              <Info label="وقت الخروج" value={justRecovered ? "الآن" : discharge.time} />
            </div>
            <div className="mt-3 pt-3 border-t border-emerald-800/60 text-xs text-emerald-200 leading-relaxed">
              <span className="text-emerald-400/80 block text-[10px] mb-0.5">
                {justRecovered && recoveryNote
                  ? "ملخص الخروج (يُرسل بلغة الحاج تلقائياً):"
                  : "تعليمات المتابعة (تُرسل بلغة الحاج تلقائياً):"}
              </span>
              {justRecovered && recoveryNote ? recoveryNote : discharge.followUp}
            </div>
            {/* Agent attribution — drafted by AI, approved by the doctor */}
            <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-emerald-400/70">
              <span className="w-4 h-4 rounded-full bg-emerald-900/60 border border-emerald-700 flex items-center justify-center shrink-0">
                <Bot className="w-2.5 h-2.5 text-emerald-400" />
              </span>
              صاغه «موثِّق» وكيل التوثيق · روجع واعتُمد من {discharge.doctor}
            </div>
          </section>
        )}

        {/* Vitals */}
        <section>
          <h3 className="text-gray-400 text-xs font-medium mb-3">المؤشرات الحيوية · {pilgrim.lastUpdate}</h3>
          <div className="grid grid-cols-3 gap-3">
            <Vital icon={Heart} label="معدل النبض" value={pilgrim.heartRate} unit="ن/د" status={isRecovered ? "normal" : hrStatus(pilgrim.heartRate)} />
            <Vital icon={Thermometer} label="الحرارة" value={pilgrim.temperature} unit="°م" status={isRecovered ? "normal" : tempStatus(pilgrim.temperature)} />
            <Vital icon={Wind} label="الأكسجين" value={pilgrim.oxygenLevel} unit="%" status={isRecovered ? "normal" : o2Status(pilgrim.oxygenLevel)} />
          </div>
          {pilgrim.condition && !isRecovered && (
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

        {/* Location + copy GPS */}
        <InfoBlock title="الموقع الحالي">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-gray-300" dir="ltr">
                {pilgrim.lat.toFixed(5)}, {pilgrim.lng.toFixed(5)}
              </span>
              <button
                onClick={copyGps}
                data-tip="نسخ الإحداثيات لإرسالها للفريق الميداني"
                className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border transition-colors ${
                  copied
                    ? "bg-emerald-900/50 border-emerald-700 text-emerald-300"
                    : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600"
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "تم النسخ" : "نسخ GPS"}
              </button>
            </div>
            <span className="text-[10px] text-gray-500">{pilgrim.lastUpdate}</span>
          </div>
        </InfoBlock>

        {/* Medical event timeline */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
              <History className="w-3.5 h-3.5" /> السجل الطبي الزمني
            </h3>
            <span className="text-[10px] text-gray-600">{timeline.length} حدث</span>
          </div>

          {timeline.length === 0 ? (
            <div className="bg-gray-950 rounded-xl border border-gray-800 px-4 py-5 text-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" strokeWidth={1.5} />
              <p className="text-gray-500 text-xs">لا توجد أحداث طبية مسجلة لهذا الحاج</p>
            </div>
          ) : (
            <ol className="relative space-y-3 pr-4">
              {/* timeline rail */}
              <span className="absolute top-1 bottom-1 right-[9px] w-px bg-gray-800" aria-hidden />
              {timeline.map(ev => (
                <TimelineRow key={ev.id} event={ev} />
              ))}
            </ol>
          )}
        </section>

        {/* Cure / discharge flow — agent drafts, doctor reviews and approves */}
        {!isRecovered && (
          <section className="bg-gray-950 rounded-xl border border-gray-800 p-4">
            <h3 className="flex items-center gap-1.5 text-gray-400 text-xs font-medium mb-3">
              <HeartPulse className="w-3.5 h-3.5" /> إغلاق الحالة
            </h3>

            {recovering ? (
              <div className="space-y-2.5 fade-in">
                {/* Agent header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-900/60 border border-emerald-700 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    </span>
                    <span className="text-emerald-300 text-xs font-semibold">
                      موثِّق <span className="text-emerald-400/60 font-normal">· وكيل التوثيق</span>
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/40 text-yellow-400 font-semibold">
                    <Sparkles className="w-2.5 h-2.5" /> مسودة بانتظار اعتماد الطبيب
                  </span>
                </div>

                {generating ? (
                  <div className="space-y-2 py-1">
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-3 w-11/12" />
                    <div className="skeleton h-3 w-4/5" />
                    <p className="text-[10px] text-gray-500 flex items-center gap-1.5 pt-1">
                      <Bot className="w-3 h-3 badge-pulse text-emerald-500" />
                      جارٍ تحليل السجل الطبي والمؤشرات الحيوية وصياغة ملخص الخروج…
                    </p>
                  </div>
                ) : (
                  <>
                    <textarea
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      rows={5}
                      className="w-full bg-gray-900 border border-emerald-800/60 rounded-lg px-3 py-2 text-xs text-white leading-relaxed focus:outline-none focus:border-emerald-600 resize-none"
                      dir="rtl"
                    />
                    <p className="text-[10px] text-gray-500">
                      راجع المسودة وعدّل ما يلزم — لن يُصدر الملخص إلا باعتمادك.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setRecoveryNote(draft);
                          setJustRecovered(true);
                        }}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-gray-950 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> اعتماد وإصدار ملخص الخروج
                      </button>
                      <button
                        onClick={generateDraft}
                        data-tip="توليد صياغة جديدة من السجل الطبي"
                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> إعادة التوليد
                      </button>
                      <button
                        onClick={() => setRecovering(false)}
                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setRecovering(true);
                  generateDraft();
                }}
                data-tip="الوكيل الذكي يصيغ ملخص الخروج من السجل الطبي ثم يعتمده الطبيب"
                className="w-full py-2 bg-emerald-900/40 hover:bg-emerald-900/70 border border-emerald-700 text-emerald-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Bot className="w-4 h-4" /> تسجيل التعافي — يصيغ «موثِّق» ملخص الخروج
              </button>
            )}
          </section>
        )}

        {/* Actions — wired to the shared ops store */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => focusOnMap(pilgrim.id)}
            data-tip="ينقلك للشاشة المباشرة والخريطة تطير لموقع الحاج"
            className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Map className="w-4 h-4" /> تحديد على الخريطة
          </button>
          {!isRecovered && (
            sentTeam ? (
              <span className="flex-1 py-2 bg-emerald-900/40 border border-emerald-700 text-emerald-300 text-sm rounded-lg flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" /> أُرسل {sentTeam}
              </span>
            ) : (
              <button
                onClick={() => setSentTeam(dispatchForPilgrim(pilgrim.id) ?? "— لا فرق متاحة")}
                data-tip="إسناد أقرب فريق متاح — يظهر فوراً في لوحة الفرق"
                className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Ambulance className="w-4 h-4" /> إرسال فريق
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineRow({ event }: { event: MedicalEvent }) {
  const meta = EVENT_META[event.type];
  const Icon = meta.icon;
  return (
    <li className="relative pr-7">
      {/* node */}
      <span
        className="absolute right-0 top-1 w-5 h-5 rounded-full border-2 border-gray-950 flex items-center justify-center"
        style={{ background: `${meta.color}26`, borderColor: meta.color }}
      >
        <Icon className="w-2.5 h-2.5" style={{ color: meta.color }} />
      </span>
      <div className="bg-gray-950 rounded-xl border border-gray-800 p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white text-xs font-medium">{event.title}</span>
          <span className="text-[10px] text-gray-500">{event.when}</span>
        </div>
        <p className="text-gray-400 text-[11px] leading-relaxed">{event.detail}</p>
        {event.actor && (
          <p className="text-[10px] mt-1.5" style={{ color: meta.color }}>{event.actor}</p>
        )}
      </div>
    </li>
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
