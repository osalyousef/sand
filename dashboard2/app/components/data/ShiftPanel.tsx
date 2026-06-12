"use client";

import { useState, useRef, useEffect } from "react";
import { Users, Clock, ClipboardList, BatteryLow, Bot, Check, RefreshCw, Send, Sparkles } from "lucide-react";
import { MOCK_TEAMS } from "@/lib/mock-data";
import { CURRENT_SHIFT, TEAM_HOURS, fatigueColor } from "@/lib/ops-data";
import { AGENTS, buildHandoffReport } from "@/lib/agents";

// Shift & team management: who's on duty, fatigue levels, handoff briefing.
// «مُسلِّم» drafts the handoff report; the supervisor reviews & approves.
export default function ShiftPanel() {
  const [phase, setPhase] = useState<"idle" | "generating" | "review" | "sent">("idle");
  const [draft, setDraft] = useState("");
  const [auto, setAuto] = useState(false);
  const genCount = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (autoTimer.current) clearTimeout(autoTimer.current);
  }, []);

  function generate() {
    setPhase("generating");
    const variant = genCount.current++;
    timer.current = setTimeout(() => {
      setDraft(buildHandoffReport(variant));
      setPhase("review");
    }, 1000);
  }

  // «مُسلِّم» works proactively: as handoff approaches, the draft prepares
  // itself — the supervisor just reviews, edits/adds, and approves.
  useEffect(() => {
    autoTimer.current = setTimeout(() => {
      setAuto(true);
      generate();
    }, 2500);
    return () => { if (autoTimer.current) clearTimeout(autoTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // The column scrolls as a whole so no card ever gets buried or clipped
    <div className="w-72 flex flex-col gap-3 overflow-y-auto pb-1">
      {/* ① Handoff report — «مُسلِّم» front and center */}
      <div className="shrink-0 bg-gray-900 rounded-xl border border-emerald-800/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white text-xs font-semibold flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-900/60 border border-emerald-700 flex items-center justify-center">
              <Bot className="w-3 h-3 text-emerald-400" />
            </span>
            تقرير التسليم — «{AGENTS.handoff.name}»
          </p>
          <span className="flex items-center gap-1 text-[10px] text-blue-400 font-semibold shrink-0">
            <Clock className="w-3 h-3" /> بعد {CURRENT_SHIFT.nextShiftMin} د
          </span>
        </div>

        {phase === "idle" && (
          <>
            <p className="text-[10px] text-gray-500 leading-relaxed mb-2.5">
              اقترب موعد التسليم — «{AGENTS.handoff.name}» سيُعد المسودة تلقائياً الآن من أحداث الوردية:
              الحالات، البؤر، اللوجستيات، إجهاد الفرق.
            </p>
            <button
              onClick={generate}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> توليدها الآن بدون انتظار
            </button>
          </>
        )}

        {phase === "generating" && (
          <div className="space-y-2 fade-in">
            <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <Bot className="w-3 h-3 text-emerald-400 badge-pulse" />
              {auto
                ? `«${AGENTS.handoff.name}» بدأ تلقائياً قبل موعد التسليم — يجمع أحداث الوردية…`
                : "يجمع أحداث الوردية: الحالات، البؤر، اللوجستيات، إجهاد الفرق…"}
            </span>
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-11/12" />
            <div className="skeleton h-3 w-4/5" />
          </div>
        )}

        {phase === "review" && (
          <div className="space-y-2 fade-in">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/40 text-yellow-400 font-semibold">
                <Sparkles className="w-2.5 h-2.5" /> مسودة — بانتظار اعتماد المشرف
              </span>
              {auto && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/40 text-blue-400 font-semibold">
                  وُلدت تلقائياً قبل التسليم
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              صاغها «{AGENTS.handoff.name}» من بيانات الوردية — <span className="text-gray-300 font-semibold">عدّل أو أضف مباشرة في النص</span> ثم اعتمد.
            </p>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={11}
              className="w-full bg-gray-950 border border-emerald-800/60 rounded-lg px-3 py-2 text-[10px] text-gray-200 leading-relaxed focus:outline-none focus:border-emerald-600 resize-none"
              dir="rtl"
            />
            <div className="flex gap-1.5">
              <button
                onClick={() => setPhase("sent")}
                className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Send className="w-3 h-3" /> اعتماد وتسليم للوردية القادمة
              </button>
              <button
                onClick={generate}
                data-tip="صياغة جديدة من نفس بيانات الوردية"
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] rounded-lg transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {phase === "sent" && (
          <div className="fade-in bg-emerald-900/20 border border-emerald-800 rounded-lg p-3 space-y-1.5">
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-semibold">
              <Check className="w-3.5 h-3.5" /> سُلِّم التقرير لمشرف الوردية الليلية أ
            </span>
            <p className="text-[10px] text-emerald-400/70 flex items-center gap-1.5">
              <Bot className="w-3 h-3" />
              صاغه «{AGENTS.handoff.name}» {AGENTS.handoff.role} · اعتمده {CURRENT_SHIFT.supervisor}
            </p>
          </div>
        )}
      </div>

      {/* ② Current shift */}
      <div className="shrink-0 bg-gray-900 rounded-xl border border-gray-800 p-4">
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

        <div className="mt-3" data-tip="نسبة المنقضي من الوردية">
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${CURRENT_SHIFT.elapsedPct}%` }} />
          </div>
          <p className="text-[10px] text-gray-500 mt-1.5">{CURRENT_SHIFT.elapsedPct}% من الوردية</p>
        </div>
      </div>

      {/* ③ Team fatigue */}
      <div className="shrink-0 bg-gray-900 rounded-xl border border-gray-800 p-4">
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

      {/* ④ Manual handoff notes */}
      <div className="shrink-0 bg-gray-900 rounded-xl border border-gray-800 p-4">
        <p className="text-white text-xs font-semibold mb-3 flex items-center gap-1.5">
          <ClipboardList className="w-3.5 h-3.5 text-emerald-400" /> ملاحظات يدوية
        </p>
        <ul className="space-y-2">
          {CURRENT_SHIFT.handoffNotes.map((note, i) => (
            <li key={i} className="text-[11px] text-gray-300 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 leading-relaxed">
              {note}
            </li>
          ))}
        </ul>
        <button className="w-full mt-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] rounded-lg transition-colors">
          + إضافة ملاحظة
        </button>
      </div>
    </div>
  );
}
