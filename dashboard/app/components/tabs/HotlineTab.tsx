"use client";

import { useState } from "react";
import type { MockContact } from "@/lib/mock-data";
import ContactsQueue from "@/app/components/hotline/ContactsQueue";
import CallScreen from "@/app/components/hotline/CallScreen";
import ChatScreen from "@/app/components/hotline/ChatScreen";
import EmptySession from "@/app/components/hotline/EmptySession";
import MetricsPanel from "@/app/components/hotline/MetricsPanel";

export default function HotlineTab() {
  const [active, setActive] = useState<MockContact | null>(null);

  return (
    <div className="flex gap-3 h-full">
      <MetricsPanel />

      {/* Middle: swaps based on whether a call or chat was answered */}
      {!active ? (
        <EmptySession />
      ) : active.type === "call" ? (
        <CallScreen contact={active} />
      ) : (
        <ChatScreen contact={active} />
      )}

      <ContactsQueue activeId={active?.id ?? null} onAnswer={setActive} />
    </div>
  );
}
