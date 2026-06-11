"use client";

import { useState, useEffect } from "react";
import { Phone, MessageSquare, Check, Clock, Bot } from "lucide-react";
import { MOCK_CONTACTS } from "@/lib/mock-data";
import type { MockContact } from "@/lib/mock-data";
import { WAIT_SECONDS } from "@/lib/ops-data";

const RISK_STYLE = {
  red: "bg-red-900/50 border-red-700 text-red-400",
  yellow: "bg-yellow-900/50 border-yellow-700 text-yellow-400",
  green: "bg-emerald-900/50 border-emerald-700 text-emerald-400",
};

const PRIORITY_LABEL = { red: "حرج", yellow: "عاجل", green: "عادي" };

// Past this, the wait timer turns red — SLA breach for a crisis line.
const SLA_SECONDS = 120;

function fmt(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ContactsQueue({
  activeId,
  onAnswer,
}: {
  activeId: string | null;
  onAnswer: (contact: MockContact) => void;
}) {
  // Seconds elapsed since the queue mounted — each contact shows base + elapsed.
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const calls = MOCK_CONTACTS.filter(c => c.type === "call").length;
  const chats = MOCK_CONTACTS.filter(c => c.type === "chat").length;
  const breaching = MOCK_CONTACTS.filter(
    c => c.id !== activeId && (WAIT_SECONDS[c.id] ?? 0) + elapsed >= SLA_SECONDS
  ).length;

  return (
    <div className="w-72 flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="text-white font-semibold text-sm">طابور الانتظار</span>
        {breaching > 0 ? (
          <span className="flex items-center gap-1.5 text-xs text-red-400" data-tip="حالات تجاوزت دقيقتي انتظار">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            {breaching} تجاوز المهلة
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            {MOCK_CONTACTS.length} في الانتظار
          </span>
        )}
      </div>

      {/* Type summary */}
      <div className="grid grid-cols-2 divide-x divide-gray-800 border-b border-gray-800 text-center">
        <div className="py-2">
          <span className="flex items-center justify-center gap-1.5 text-white font-semibold text-sm">
            <Phone className="w-3.5 h-3.5" /> {calls}
          </span>
          <span className="text-gray-500 text-[10px] block">مكالمات</span>
        </div>
        <div className="py-2">
          <span className="flex items-center justify-center gap-1.5 text-white font-semibold text-sm">
            <MessageSquare className="w-3.5 h-3.5" /> {chats}
          </span>
          <span className="text-gray-500 text-[10px] block">محادثات</span>
        </div>
      </div>

      {/* Triage Agent attribution */}
      <div
        className="flex items-center justify-center gap-1.5 px-4 py-1.5 border-b border-gray-800 bg-gray-950/50 text-[9px] text-gray-500"
        data-tip="الترتيب يجمع خطورة الحالة الصحية مع زمن الانتظار"
      >
        <Bot className="w-3 h-3 text-emerald-500" />
        رتّبه «فارز» وكيل الفرز — الأخطر والأطول انتظاراً أولاً
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-800/60">
        {MOCK_CONTACTS.map(contact => {
          const isActive = activeId === contact.id;
          const waited = (WAIT_SECONDS[contact.id] ?? 0) + (isActive ? 0 : elapsed);
          const overSla = !isActive && waited >= SLA_SECONDS;

          return (
            <div
              key={contact.id}
              onClick={() => onAnswer(contact)}
              className={`px-4 py-3 cursor-pointer transition-colors group ${
                isActive ? "bg-gray-800" : "hover:bg-gray-800/40"
              }`}
            >
              {/* Top row */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  {contact.type === "call"
                    ? <Phone className="w-4 h-4 text-gray-300" />
                    : <MessageSquare className="w-4 h-4 text-gray-300" />}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${RISK_STYLE[contact.riskLevel]}`}>
                    {PRIORITY_LABEL[contact.riskLevel]}
                  </span>
                </div>
                {/* Live wait timer — turns red after 2 minutes */}
                <span
                  className={`flex items-center gap-1 text-[10px] font-mono transition-colors ${
                    overSla ? "text-red-400 font-bold" : "text-gray-500"
                  }`}
                  dir="ltr"
                  data-tip={overSla ? "تجاوز مهلة الدقيقتين!" : "مدة الانتظار"}
                >
                  <Clock className={`w-2.5 h-2.5 ${overSla ? "badge-pulse" : ""}`} />
                  {isActive ? "—" : fmt(waited)}
                </span>
              </div>

              {/* Pilgrim */}
              <div className="flex items-center gap-1.5">
                <span className="text-base leading-none">{contact.flag}</span>
                <div className="min-w-0">
                  <p className="text-white text-xs font-medium truncate">{contact.pilgrimName}</p>
                  <p className="text-gray-500 text-[10px] truncate">{contact.language} · {contact.issue}</p>
                </div>
              </div>

              {/* Answer hint */}
              <div className={`mt-2 flex items-center justify-center gap-1 text-[10px] rounded-md py-1 transition-colors ${
                isActive
                  ? "bg-emerald-700 text-white"
                  : overSla
                    ? "bg-red-900/60 text-red-200 group-hover:bg-red-800"
                    : "bg-gray-800 text-gray-400 group-hover:bg-emerald-800 group-hover:text-emerald-200"
              }`}>
                {isActive && <Check className="w-3 h-3" />}
                {isActive ? "جارٍ الرد" : contact.type === "call" ? "الرد على المكالمة" : "فتح المحادثة"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
