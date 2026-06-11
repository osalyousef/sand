"use client";

import { useState, useEffect, useRef } from "react";
import { UserRound } from "lucide-react";
import type { MockContact, ChatMessage } from "@/lib/mock-data";
import HealthSnapshot from "./HealthSnapshot";
import AgentSuggestionCard from "@/app/components/agent/AgentSuggestionCard";

export default function ChatScreen({ contact, onViewProfile }: { contact: MockContact; onViewProfile: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>(contact.messages ?? []);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // Reset thread when switching pilgrims
  useEffect(() => {
    setMessages(contact.messages ?? []);
    setInput("");
  }, [contact.id, contact.messages]);

  // Auto-scroll to newest
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    const text = input.trim();
    if (!text) return;
    const now = new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [
      ...prev,
      {
        id: `s${Date.now()}`,
        sender: "support",
        text,
        translation: `ستُترجم تلقائياً إلى ${contact.language}`,
        time: now,
      },
    ]);
    setInput("");
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{contact.flag}</span>
          <div>
            <p className="text-white font-semibold text-sm">{contact.pilgrimName}</p>
            <p className="text-gray-500 text-xs">{contact.language} · {contact.issue}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onViewProfile}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors"
          >
            <UserRound className="w-3.5 h-3.5" /> الملف الصحي
          </button>
          <span className="flex items-center gap-2 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            محادثة نشطة
          </span>
        </div>
      </div>

      {/* Quick health snapshot — click for full record */}
      <div className="px-4 pt-3">
        <HealthSnapshot pilgrimId={contact.pilgrimId} onViewProfile={onViewProfile} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <Bubble key={msg.id} msg={msg} />
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-800 space-y-2">
        {/* «مُغيث» — capped height so the conversation stays visible; scrolls internally */}
        <div className="max-h-72 overflow-y-auto">
          <AgentSuggestionCard contact={contact} mode="chat" onUseReply={setInput} />
        </div>

        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="اكتب رسالتك بالعربية… (تُترجم تلقائياً)"
            className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-600"
            dir="rtl"
          />
          <button
            onClick={send}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors"
          >
            إرسال
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <QuickReply onClick={setInput} text="المساعدة في الطريق إليك، ابقَ مكانك." />
          <QuickReply onClick={setInput} text="ما هو موقعك الحالي؟" />
        </div>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const isSupport = msg.sender === "support";
  return (
    <div className={`flex ${isSupport ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
          isSupport
            ? "bg-emerald-800/60 border border-emerald-700 rounded-bl-sm"
            : "bg-gray-800 border border-gray-700 rounded-br-sm"
        }`}
      >
        <p className="text-white text-sm leading-relaxed" dir="auto">{msg.text}</p>
        {msg.translation && (
          <p className={`text-xs mt-1 pt-1 border-t ${isSupport ? "border-emerald-700/60 text-emerald-200/80" : "border-gray-700 text-gray-400"}`} dir="rtl">
            {msg.translation}
          </p>
        )}
        <p className="text-[9px] text-gray-500 mt-1 text-left">{msg.time}</p>
      </div>
    </div>
  );
}

function QuickReply({ text, onClick }: { text: string; onClick: (t: string) => void }) {
  return (
    <button
      onClick={() => onClick(text)}
      className="text-[10px] px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full border border-gray-700 transition-colors truncate"
    >
      {text}
    </button>
  );
}
