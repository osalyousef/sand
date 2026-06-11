"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bot, Check, X, Sparkles, CornerUpLeft, Pencil, Volume2,
  Stethoscope, MessageCircleQuestion, ClipboardList, Send,
} from "lucide-react";
import type { MockContact } from "@/lib/mock-data";
import { getContactSuggestion, AGENTS, type DiagnosisSeverity } from "@/lib/agents";

const SEVERITY_STYLE: Record<DiagnosisSeverity, { box: string; title: string; chip: string; label: string }> = {
  critical: { box: "bg-red-500/10 border-red-500/50", title: "text-red-300", chip: "bg-red-500/15 border-red-500/50 text-red-400", label: "حرجة" },
  urgent:   { box: "bg-yellow-500/10 border-yellow-500/40", title: "text-yellow-300", chip: "bg-yellow-500/15 border-yellow-500/50 text-yellow-400", label: "عاجلة" },
  normal:   { box: "bg-blue-500/10 border-blue-500/40", title: "text-blue-300", chip: "bg-blue-500/15 border-blue-500/50 text-blue-400", label: "اعتيادية" },
};

type SendState = "idle" | "sending" | "sent";

// «مُغيث» — the medical Response Agent inside live call/chat sessions.
// Clinical order: diagnosis → IMMEDIATE safety guidance (stabilize first!) →
// triage questions → operational action → field brief.
// In calls, approved text is voice-broadcast to the pilgrim in their language.
export default function AgentSuggestionCard({
  contact,
  mode,
  onUseReply,
}: {
  contact: MockContact;
  mode: "call" | "chat";
  onUseReply?: (text: string) => void;
}) {
  const suggestion = getContactSuggestion(contact);
  const sev = SEVERITY_STYLE[suggestion.diagnosis.severity];

  const [dismissed, setDismissed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(suggestion.guidance);
  const [replyState, setReplyState] = useState<SendState>("idle");
  const [questionStates, setQuestionStates] = useState<Record<number, SendState>>({});
  const [actionDone, setActionDone] = useState(false);
  const [briefSent, setBriefSent] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // New caller → fresh suggestion
  useEffect(() => {
    setDismissed(false);
    setEditing(false);
    setText(getContactSuggestion(contact).guidance);
    setReplyState("idle");
    setQuestionStates({});
    setActionDone(false);
    setBriefSent(false);
  }, [contact.id, contact]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  function approveGuidance() {
    setEditing(false);
    if (mode === "chat") {
      onUseReply?.(text);
      setReplyState("sent");
      return;
    }
    // Call: the live translator voices the approved text in the pilgrim's language
    setReplyState("sending");
    timers.current.push(setTimeout(() => setReplyState("sent"), 1400));
  }

  function askQuestion(q: string, i: number) {
    if (questionStates[i] === "sending" || questionStates[i] === "sent") return;
    if (mode === "chat") {
      onUseReply?.(q); // prefill — operator reviews & sends
      setQuestionStates(prev => ({ ...prev, [i]: "sent" }));
      return;
    }
    // Call: broadcast the question by voice in the pilgrim's language
    setQuestionStates(prev => ({ ...prev, [i]: "sending" }));
    timers.current.push(
      setTimeout(() => setQuestionStates(prev => ({ ...prev, [i]: "sent" })), 1200)
    );
  }

  if (dismissed) {
    return (
      <button
        onClick={() => setDismissed(false)}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] text-gray-500 hover:text-emerald-400 bg-gray-950 border border-gray-800 border-dashed rounded-xl transition-colors"
      >
        <Bot className="w-3 h-3" /> عرض تقييم «{AGENTS.response.name}»
      </button>
    );
  }

  return (
    <div className="fade-in bg-gray-950 border border-emerald-800/50 rounded-xl p-3 space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-900/60 border border-emerald-700 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
          </span>
          <span className="text-emerald-300 text-xs font-semibold">
            {AGENTS.response.name} <span className="text-emerald-400/60 font-normal">· {AGENTS.response.role}</span>
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400">
            يُنفَّذ بعد موافقتك فقط
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          data-tip="إخفاء التقييم"
          className="text-gray-600 hover:text-gray-300 transition-colors"
          aria-label="إخفاء"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ١ — Clinical assessment (for the care provider, not the pilgrim) */}
      <div className={`rounded-lg border p-2.5 ${sev.box}`}>
        <div className="flex items-center justify-between mb-1">
          <p className="flex items-center gap-1.5 text-[9px] text-gray-400">
            <Stethoscope className="w-3 h-3" /> ١ · التشخيص المبدئي — يقرأه مقدم الرعاية
          </p>
          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${sev.chip}`}>
            {sev.label}
          </span>
        </div>
        <p className={`text-xs font-bold ${sev.title}`}>{suggestion.diagnosis.title}</p>
        <p className="text-gray-400 text-[10px] leading-relaxed mt-0.5">{suggestion.diagnosis.detail}</p>
        <div className="mt-1.5 pt-1.5 border-t border-gray-800">
          <p className="text-[9px] text-gray-500 mb-0.5">التعامل الموصى به:</p>
          <p className="text-gray-200 text-[11px] leading-relaxed">{suggestion.treatment}</p>
        </div>
      </div>

      {/* ٢ — IMMEDIATE pilgrim guidance: stabilize FIRST, before any questions */}
      <div className="bg-gray-900 border border-emerald-800/40 rounded-lg p-2.5">
        <p className="flex items-center gap-1.5 text-[9px] text-emerald-400/90 mb-1">
          <Volume2 className="w-3 h-3" />
          ٢ · التوجيه الفوري للحاج — يُقال أولاً لتأمينه قبل الأسئلة
          {mode === "call" && <span className="text-gray-500">· يُبَث بـ{contact.language}</span>}
        </p>

        {editing ? (
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
            autoFocus
            className="w-full bg-gray-950 border border-emerald-800/60 rounded-lg px-2.5 py-1.5 text-xs text-white leading-relaxed focus:outline-none focus:border-emerald-600 resize-none"
            dir="rtl"
          />
        ) : (
          <p className="text-gray-200 text-xs leading-relaxed">{text}</p>
        )}

        <div className="mt-2 flex items-center gap-2">
          {replyState === "sent" ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <Check className="w-3 h-3" />
              {mode === "chat"
                ? "نُقل إلى حقل الكتابة — راجعه ثم أرسل"
                : `تم بثه صوتياً للحاج بـ${contact.language} — تابع الأسئلة الآن`}
            </span>
          ) : replyState === "sending" ? (
            <span className="flex items-center gap-1.5 text-[10px] text-blue-300">
              <Volume2 className="w-3.5 h-3.5 badge-pulse" />
              جارٍ الترجمة والبث الصوتي بـ{contact.language}…
            </span>
          ) : (
            <>
              <button
                onClick={approveGuidance}
                className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-md transition-colors"
              >
                {mode === "chat" ? (
                  <><CornerUpLeft className="w-3 h-3" /> استخدام الرد</>
                ) : (
                  <><Volume2 className="w-3 h-3" /> اعتماد وبث صوتي الآن</>
                )}
              </button>
              <button
                onClick={() => setEditing(e => !e)}
                data-tip={editing ? "إنهاء التعديل" : "تعديل النص قبل الاعتماد"}
                className="flex items-center gap-1 text-[10px] px-2 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-md transition-colors"
              >
                {editing ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                {editing ? "تم" : "تعديل"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ٣ — Triage questions: each one broadcasts by voice (call) or prefills (chat) */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-2.5">
        <p className="flex items-center gap-1.5 text-[9px] text-purple-400/90 mb-1.5">
          <MessageCircleQuestion className="w-3 h-3" />
          ٣ · أسئلة استكمال التقييم —{" "}
          {mode === "chat" ? "اضغط لنقل السؤال إلى حقل الكتابة" : `اضغط لبث السؤال صوتياً بـ${contact.language}`}
        </p>
        <div className="space-y-1">
          {suggestion.questions.map((q, i) => {
            const state = questionStates[i] ?? "idle";
            return (
              <button
                key={i}
                onClick={() => askQuestion(q, i)}
                disabled={state !== "idle"}
                className={`w-full flex items-center justify-between gap-2 text-right text-[10px] px-2 py-1.5 rounded-md border transition-colors ${
                  state === "sent"
                    ? "bg-emerald-900/20 border-emerald-800/50 text-emerald-300"
                    : state === "sending"
                      ? "bg-blue-900/20 border-blue-800/50 text-blue-300"
                      : "bg-gray-950 border-gray-800 text-gray-300 hover:border-purple-700 hover:text-white cursor-pointer"
                }`}
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                    state === "sent" ? "border-emerald-600 bg-emerald-600" : "border-gray-600"
                  }`}>
                    {state === "sent" && <Check className="w-2.5 h-2.5 text-gray-950" strokeWidth={3} />}
                  </span>
                  {q}
                </span>
                <span className="shrink-0">
                  {state === "sending" ? (
                    <span className="flex items-center gap-1 text-blue-300">
                      <Volume2 className="w-3 h-3 badge-pulse" /> جارٍ البث…
                    </span>
                  ) : state === "sent" ? (
                    <span className="text-emerald-400/80">{mode === "call" ? "بُث ✓" : "نُقل ✓"}</span>
                  ) : (
                    mode === "call" && <Volume2 className="w-3 h-3 text-gray-600" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ٤ — Operational action */}
      {suggestion.action && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-2.5">
          <p className="flex items-center gap-1 text-[9px] text-blue-400/90 mb-1">
            <Sparkles className="w-2.5 h-2.5" /> ٤ · الإجراء المقترح:
          </p>
          <p className="text-gray-200 text-xs font-medium">{suggestion.action.label}</p>
          <p className="text-gray-500 text-[10px] mt-0.5">{suggestion.action.detail}</p>
          <div className="mt-2">
            {actionDone ? (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                <Check className="w-3 h-3" /> تمت الموافقة — جارٍ التنفيذ
              </span>
            ) : (
              <button
                onClick={() => setActionDone(true)}
                className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 bg-blue-900/50 hover:bg-blue-900/80 border border-blue-700 text-blue-300 rounded-md transition-colors"
              >
                <Check className="w-3 h-3" /> موافقة وتنفيذ
              </button>
            )}
          </div>
        </div>
      )}

      {/* ٥ — Organized field brief: the team arrives knowing the case */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-2.5">
        <p className="flex items-center gap-1.5 text-[9px] text-yellow-400/90 mb-1.5">
          <ClipboardList className="w-3 h-3" /> ٥ · موجز الحالة للفريق المستجيب — مرتب تلقائياً:
        </p>
        <ul className="space-y-1 mb-2">
          {suggestion.fieldBrief.map((line, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[10px] text-gray-300 leading-relaxed">
              <span className="w-1 h-1 rounded-full bg-yellow-500/70 mt-1.5 shrink-0" />
              {line}
            </li>
          ))}
        </ul>
        {briefSent ? (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400">
            <Check className="w-3 h-3" /> أُرسل الموجز للفريق — سيصلون وهم على علم بالحالة
          </span>
        ) : (
          <button
            onClick={() => setBriefSent(true)}
            data-tip="يصل الموجز لجهاز الفريق قبل وصولهم للموقع"
            className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 bg-yellow-900/40 hover:bg-yellow-900/70 border border-yellow-700 text-yellow-300 rounded-md transition-colors"
          >
            <Send className="w-3 h-3" /> إرسال الموجز للفريق المستجيب
          </button>
        )}
      </div>
    </div>
  );
}
