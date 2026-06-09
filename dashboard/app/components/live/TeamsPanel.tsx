"use client";

import { useState } from "react";
import { MapPin, Route } from "lucide-react";
import { MOCK_TEAMS, MOCK_ALERTS } from "@/lib/mock-data";

const STATUS_STYLES = {
  available: { dot: "bg-emerald-500", text: "text-emerald-400", bg: "bg-emerald-900/30 border-emerald-800", label: "متاح" },
  dispatched: { dot: "bg-yellow-500 animate-pulse", text: "text-yellow-400", bg: "bg-yellow-900/30 border-yellow-800", label: "في الطريق" },
  "on-scene": { dot: "bg-red-500 animate-pulse", text: "text-red-400", bg: "bg-red-900/30 border-red-800", label: "في الموقع" },
};

export default function TeamsPanel() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="w-64 flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="text-white font-semibold text-sm">الفرق الميدانية</span>
        <span className="text-xs text-gray-500">{MOCK_TEAMS.length} فرق</span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-800/60">
        {MOCK_TEAMS.map(team => {
          const style = STATUS_STYLES[team.status];
          const isExpanded = expanded === team.id;
          const assignedAlert = team.assignedAlert
            ? MOCK_ALERTS.find(a => a.id === team.assignedAlert)
            : null;

          return (
            <div
              key={team.id}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                isExpanded ? "bg-gray-800" : "hover:bg-gray-800/40"
              }`}
              onClick={() => setExpanded(isExpanded ? null : team.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                  <span className="text-white text-xs font-medium">{team.name}</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded border ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1 pr-4">
                <MapPin className="w-2.5 h-2.5" /> {team.location} · {team.members} أفراد
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-700 space-y-2 text-[10px]">
                  {assignedAlert ? (
                    <div className="bg-gray-900 rounded-lg p-2 space-y-1">
                      <div className="text-gray-500">مُسند إلى:</div>
                      <div className="text-white font-medium">{assignedAlert.name}</div>
                      <div className="text-gray-400">{assignedAlert.id} · {assignedAlert.condition ?? "لا توجد حالة موثقة"}</div>
                    </div>
                  ) : (
                    <div className="text-gray-600 italic">لا توجد مهمة نشطة</div>
                  )}

                  {team.status === "dispatched" && (
                    <div className="flex items-center gap-1.5 bg-blue-900/40 text-blue-300 rounded-lg p-2 border border-blue-800">
                      <Route className="w-3 h-3" /> تم احتساب أقصر مسار · وقت الوصول ~٤ دقائق
                    </div>
                  )}

                  <div className="flex gap-2 mt-1">
                    <button className="flex-1 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-[10px] transition-colors">
                      تواصل
                    </button>
                    {team.status === "available" && (
                      <button className="flex-1 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] transition-colors">
                        إرسال
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-2 border-t border-gray-800 grid grid-cols-3 text-center text-[10px]">
        <div>
          <div className="text-emerald-400 font-semibold">{MOCK_TEAMS.filter(t => t.status === "available").length}</div>
          <div className="text-gray-600">متاح</div>
        </div>
        <div>
          <div className="text-yellow-400 font-semibold">{MOCK_TEAMS.filter(t => t.status === "dispatched").length}</div>
          <div className="text-gray-600">في الطريق</div>
        </div>
        <div>
          <div className="text-red-400 font-semibold">{MOCK_TEAMS.filter(t => t.status === "on-scene").length}</div>
          <div className="text-gray-600">في الموقع</div>
        </div>
      </div>
    </div>
  );
}
