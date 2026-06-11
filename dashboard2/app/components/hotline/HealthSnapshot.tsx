"use client";

import { Heart, Thermometer, Wind, Pill, Droplet, ChevronLeft } from "lucide-react";
import { MOCK_PILGRIMS } from "@/lib/mock-data";
import { RISK_COLORS } from "@/lib/types";

const RISK_LABEL = { red: "خطر", yellow: "تحذير", green: "آمن" };

// Compact at-a-glance health card shown inside call/chat sessions so the
// agent sees the medical picture without leaving the conversation.
// Clicking anywhere opens the full health record.
export default function HealthSnapshot({
  pilgrimId,
  onViewProfile,
}: {
  pilgrimId: string;
  onViewProfile: () => void;
}) {
  const p = MOCK_PILGRIMS.find(x => x.id === pilgrimId);
  if (!p) return null;

  const conditions = [
    p.hasDiabetes && "السكري",
    p.hasHeartCondition && "قلب",
    p.hasHypertension && "ضغط",
  ].filter(Boolean) as string[];

  const hrDanger = p.heartRate >= 115;
  const tempDanger = p.temperature >= 39.5;
  const o2Danger = p.oxygenLevel <= 93;

  return (
    <button
      onClick={onViewProfile}
      data-tip="اضغط لفتح الملف الصحي الكامل"
      className="w-full text-right bg-gray-950 border border-gray-800 hover:border-emerald-700 rounded-xl px-3.5 py-2.5 transition-colors group"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Risk + vitals */}
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="text-[9px] px-1.5 py-0.5 rounded border font-bold shrink-0"
            style={{ color: RISK_COLORS[p.riskLevel], borderColor: RISK_COLORS[p.riskLevel] }}
          >
            {RISK_LABEL[p.riskLevel]}
          </span>

          <span className={`flex items-center gap-1 text-[11px] font-mono ${hrDanger ? "text-red-400 font-bold" : "text-gray-300"}`}>
            <Heart className={`w-3 h-3 ${hrDanger ? "badge-pulse" : ""}`} /> {p.heartRate}
          </span>
          <span className={`flex items-center gap-1 text-[11px] font-mono ${tempDanger ? "text-red-400 font-bold" : "text-gray-300"}`}>
            <Thermometer className="w-3 h-3" /> {p.temperature}°
          </span>
          <span className={`flex items-center gap-1 text-[11px] font-mono ${o2Danger ? "text-red-400 font-bold" : "text-gray-300"}`}>
            <Wind className="w-3 h-3" /> {p.oxygenLevel}%
          </span>

          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <Droplet className="w-3 h-3 text-red-400" /> {p.bloodType}
          </span>

          {/* Chronic conditions */}
          {conditions.length > 0 ? (
            <span className="flex items-center gap-1">
              {conditions.map(c => (
                <span key={c} className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-900/40 text-red-300 border border-red-800">
                  {c}
                </span>
              ))}
            </span>
          ) : (
            <span className="text-[9px] text-gray-600">لا أمراض مزمنة</span>
          )}

          {p.medications.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-gray-400" data-tip={p.medications.join("، ")}>
              <Pill className="w-3 h-3 text-emerald-500" /> {p.medications.length} دواء
            </span>
          )}
        </div>

        <span className="flex items-center gap-0.5 text-[10px] text-gray-500 group-hover:text-emerald-400 transition-colors shrink-0">
          الملف الكامل
          <ChevronLeft className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}
