"use client";

import { useState, useEffect } from "react";
import { Mic, MicOff, Volume2, Ambulance, PhoneOff, UserRound, MapPin } from "lucide-react";
import type { MockContact } from "@/lib/mock-data";
import HealthSnapshot from "./HealthSnapshot";
import AgentSuggestionCard from "@/app/components/agent/AgentSuggestionCard";
import { useSanadStore } from "@/lib/store";

const RISK_RING = { red: "ring-red-600", yellow: "ring-yellow-600", green: "ring-emerald-600" };

export default function CallScreen({ contact, onViewProfile }: { contact: MockContact; onViewProfile: () => void }) {
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const focusOnMap = useSanadStore(s => s.focusOnMap);

  // Call timer — resets when a new call is answered
  useEffect(() => {
    setSeconds(0);
    setMuted(false);
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [contact.id]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex-1 flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Status bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <span className="flex items-center gap-2 text-sm text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          مكالمة جارية
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => focusOnMap(contact.pilgrimId)}
            data-tip="فتح موقع الحاج على الخريطة الحية"
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-blue-900/50 hover:bg-blue-900/80 border border-blue-800 text-blue-300 rounded-lg transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" /> موقع الحاج
          </button>
          <button
            onClick={onViewProfile}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors"
          >
            <UserRound className="w-3.5 h-3.5" /> الملف الصحي
          </button>
          <span className="font-mono text-white text-sm">{mm}:{ss}</span>
        </div>
      </div>

      {/* Caller — scrollable: snapshot + transcript + agent card can exceed the fold */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center gap-4 p-6">
        <div className={`w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center text-5xl ring-4 ${RISK_RING[contact.riskLevel]} ring-offset-4 ring-offset-gray-900`}>
          {contact.flag}
        </div>
        <div className="text-center">
          <h2 className="text-white text-xl font-semibold">{contact.pilgrimName}</h2>
          <p className="text-gray-500 text-sm mt-1">{contact.language} · {contact.issue}</p>
        </div>

        {/* Live translation of speech */}
        <div className="w-full max-w-md mt-2 space-y-2">
          {/* Quick health snapshot — click for full record */}
          <HealthSnapshot pilgrimId={contact.pilgrimId} onViewProfile={onViewProfile} />

          <div className="bg-gray-950 rounded-xl border border-gray-800 p-3">
            <p className="flex items-center gap-1 text-[10px] text-gray-500 mb-1">
              <Mic className="w-3 h-3" /> كلام الحاج · {contact.language}
            </p>
            <p className="text-white text-sm" dir="rtl">{contact.transcript}</p>
          </div>
          <div className="bg-blue-950/30 rounded-xl border border-blue-900 p-3">
            <p className="text-[10px] text-blue-400 mb-1">الترجمة الفورية · العربية</p>
            <p className="text-blue-200 text-sm" dir="rtl">{contact.translation}</p>
          </div>

          {/* Response Agent — guidance the operator reads + action awaiting approval */}
          <AgentSuggestionCard contact={contact} mode="call" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-5 border-t border-gray-800">
        <CallButton onClick={() => setMuted(m => !m)} active={muted} label={muted ? "إلغاء الكتم" : "كتم"}>
          {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </CallButton>
        <CallButton label="مكبر الصوت"><Volume2 className="w-5 h-5" /></CallButton>
        <CallButton label="إرسال فريق" tone="emerald"><Ambulance className="w-5 h-5" /></CallButton>
        <CallButton label="إنهاء" tone="red"><PhoneOff className="w-5 h-5" /></CallButton>
      </div>
    </div>
  );
}

function CallButton({
  children, label, onClick, active, tone = "gray",
}: {
  children: React.ReactNode; label: string; onClick?: () => void;
  active?: boolean; tone?: "gray" | "red" | "emerald";
}) {
  const tones = {
    gray: active ? "bg-white text-gray-900" : "bg-gray-800 hover:bg-gray-700 text-white",
    red: "bg-red-700 hover:bg-red-600 text-white",
    emerald: "bg-emerald-700 hover:bg-emerald-600 text-white",
  };
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-colors ${tones[tone]}`}
      >
        {children}
      </button>
      <span className="text-[10px] text-gray-500">{label}</span>
    </div>
  );
}
