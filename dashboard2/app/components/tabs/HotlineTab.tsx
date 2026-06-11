"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { MOCK_PILGRIMS } from "@/lib/mock-data";
import type { MockContact } from "@/lib/mock-data";
import ContactsQueue from "@/app/components/hotline/ContactsQueue";
import CallScreen from "@/app/components/hotline/CallScreen";
import ChatScreen from "@/app/components/hotline/ChatScreen";
import EmptySession from "@/app/components/hotline/EmptySession";
import MetricsPanel from "@/app/components/hotline/MetricsPanel";
import PilgrimDetail from "@/app/components/search/PilgrimDetail";

export default function HotlineTab() {
  const [active, setActive] = useState<MockContact | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  function answer(contact: MockContact) {
    setActive(contact);
    setShowProfile(false); // new session starts with profile closed
  }

  const pilgrim = active ? MOCK_PILGRIMS.find(p => p.id === active.pilgrimId) ?? null : null;

  return (
    <div className="relative flex gap-3 h-full">
      <MetricsPanel />

      {/* Middle: swaps based on whether a call or chat was answered */}
      {!active ? (
        <EmptySession />
      ) : active.type === "call" ? (
        <CallScreen contact={active} onViewProfile={() => setShowProfile(true)} />
      ) : (
        <ChatScreen contact={active} onViewProfile={() => setShowProfile(true)} />
      )}

      <ContactsQueue activeId={active?.id ?? null} onAnswer={answer} />

      {/* Pilgrim profile slide-over */}
      {showProfile && pilgrim && (
        <>
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/50 z-[1000] rounded-xl"
            onClick={() => setShowProfile(false)}
          />
          {/* drawer (RTL: slides from the left edge) */}
          <div className="absolute top-0 bottom-0 left-0 w-[440px] max-w-[90%] z-[1001] flex flex-col bg-gray-950 border-r border-gray-800 shadow-2xl rounded-l-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 shrink-0">
              <span className="text-white text-sm font-semibold">الملف الصحي للحاج</span>
              <button
                onClick={() => setShowProfile(false)}
                className="text-gray-500 hover:text-white transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 flex overflow-hidden p-2">
              <PilgrimDetail key={pilgrim.id} pilgrim={pilgrim} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
