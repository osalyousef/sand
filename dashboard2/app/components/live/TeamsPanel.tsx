"use client";

import { useState } from "react";
import { MapPin, Route, BatteryLow, RefreshCw } from "lucide-react";
import { MOCK_TEAMS, MOCK_ALERTS } from "@/lib/mock-data";
import { CURRENT_SHIFT, TEAM_HOURS, fatigueColor } from "@/lib/ops-data";
import { useSanadStore, pilgrimById } from "@/lib/store";

const STATUS_STYLES = {
  available: { dot: "bg-emerald-500", text: "text-emerald-400", bg: "bg-emerald-900/30 border-emerald-800", label: "متاح" },
  dispatched: { dot: "bg-yellow-500 animate-pulse", text: "text-yellow-400", bg: "bg-yellow-900/30 border-yellow-800", label: "في الطريق" },
  "on-scene": { dot: "bg-red-500 animate-pulse", text: "text-red-400", bg: "bg-red-900/30 border-red-800", label: "في الموقع" },
};

export default function TeamsPanel() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reassigning, setReassigning] = useState<string | null>(null);

  // Shared state: dispatches from alerts/hotline/search land here live
  const teamStatuses = useSanadStore(s => s.teamStatuses);
  const assignments = useSanadStore(s => s.teamAssignments);
  const reassignTeam = useSanadStore(s => s.reassignTeam);

  return (
    <div className="w-64 flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="text-white font-semibold text-sm">الفرق الميدانية</span>
        <span className="text-xs text-gray-500">{MOCK_TEAMS.length} فرق</span>
      </div>

      {/* Current shift strip */}
      <div className="px-4 py-2 border-b border-gray-800 bg-gray-950/60">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-blue-400 font-semibold">{CURRENT_SHIFT.name}</span>
          <span className="text-gray-500" dir="ltr">{CURRENT_SHIFT.start} → {CURRENT_SHIFT.end}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] mt-0.5">
          <span className="text-gray-500">المشرف: {CURRENT_SHIFT.supervisor}</span>
          <span className="text-gray-400">تسليم بعد {CURRENT_SHIFT.nextShiftMin} د</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-800/60">
        {MOCK_TEAMS.map(team => {
          const status = teamStatuses[team.id] ?? team.status;
          const style = STATUS_STYLES[status];
          const isExpanded = expanded === team.id;
          const hours = TEAM_HOURS[team.id] ?? 0;
          const fatigued = hours >= 9;
          const assignedPilgrim = assignments[team.id] ? pilgrimById(assignments[team.id]!) : null;

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
                  {fatigued && (
                    <BatteryLow className="w-3 h-3 text-red-400" data-tip={`${hours} ساعة على رأس العمل — إجهاد مرتفع`} />
                  )}
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded border ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1 pr-4">
                <MapPin className="w-2.5 h-2.5" /> {team.location} · {team.members} أفراد
              </div>

              {/* Fatigue bar (12h shift) */}
              <div className="flex items-center gap-2 mt-1.5 pr-4" data-tip="ساعات العمل في الوردية الحالية">
                <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min((hours / 12) * 100, 100)}%`, background: fatigueColor(hours) }}
                  />
                </div>
                <span className="text-[9px]" style={{ color: fatigueColor(hours) }}>{hours} س</span>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-700 space-y-2 text-[10px]" onClick={e => e.stopPropagation()}>
                  {assignedPilgrim ? (
                    <div className="bg-gray-900 rounded-lg p-2 space-y-1">
                      <div className="text-gray-500">مُسند إلى:</div>
                      <div className="text-white font-medium">{assignedPilgrim.name}</div>
                      <div className="text-gray-400">
                        {assignedPilgrim.id} · {assignedPilgrim.condition ?? "لا توجد حالة موثقة"}
                      </div>
                    </div>
                  ) : assignments[team.id] ? (
                    // mission to a location (map cell / hotspot) rather than a pilgrim
                    <div className="bg-gray-900 rounded-lg p-2 space-y-1">
                      <div className="text-gray-500">مهمة ميدانية:</div>
                      <div className="text-white font-medium">{assignments[team.id]}</div>
                    </div>
                  ) : (
                    <div className="text-gray-600 italic">لا توجد مهمة نشطة</div>
                  )}

                  {status === "dispatched" && (
                    <div className="flex items-center gap-1.5 bg-blue-900/40 text-blue-300 rounded-lg p-2 border border-blue-800">
                      <Route className="w-3 h-3" /> تم احتساب أقصر مسار · وقت الوصول ~٤ دقائق
                    </div>
                  )}

                  {/* Quick reassign */}
                  {reassigning === team.id ? (
                    <div className="bg-gray-900 rounded-lg p-2 space-y-1">
                      <div className="text-gray-500 mb-1">اختر الحالة الجديدة:</div>
                      {MOCK_ALERTS.slice(0, 4)
                        .filter(a => a.id !== assignments[team.id])
                        .map(a => (
                          <button
                            key={a.id}
                            onClick={() => {
                              reassignTeam(team.id, a.id);
                              setReassigning(null);
                            }}
                            className="w-full text-right px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                          >
                            {a.name} · {a.id}
                          </button>
                        ))}
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-1">
                      <button className="flex-1 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-[10px] transition-colors">
                        تواصل
                      </button>
                      <button
                        onClick={() => setReassigning(team.id)}
                        className="flex-1 py-1 bg-blue-800 hover:bg-blue-700 text-blue-100 rounded text-[10px] transition-colors flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="w-2.5 h-2.5" /> إعادة إسناد
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-2 border-t border-gray-800 grid grid-cols-3 text-center text-[10px]">
        <div>
          <div className="text-emerald-400 font-semibold">
            {MOCK_TEAMS.filter(t => (teamStatuses[t.id] ?? t.status) === "available").length}
          </div>
          <div className="text-gray-600">متاح</div>
        </div>
        <div>
          <div className="text-yellow-400 font-semibold">
            {MOCK_TEAMS.filter(t => (teamStatuses[t.id] ?? t.status) === "dispatched").length}
          </div>
          <div className="text-gray-600">في الطريق</div>
        </div>
        <div>
          <div className="text-red-400 font-semibold">
            {MOCK_TEAMS.filter(t => (teamStatuses[t.id] ?? t.status) === "on-scene").length}
          </div>
          <div className="text-gray-600">في الموقع</div>
        </div>
      </div>
    </div>
  );
}
