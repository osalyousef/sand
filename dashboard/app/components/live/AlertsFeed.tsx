"use client";

import { useState } from "react";
import { Heart, AlertTriangle, Ambulance } from "lucide-react";
import { MOCK_ALERTS } from "@/lib/mock-data";
import { RISK_COLORS } from "@/lib/types";

const RISK_LABEL = { red: "خطر", yellow: "تحذير", green: "آمن" };

export default function AlertsFeed() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="w-72 flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="text-white font-semibold text-sm">التنبيهات الحية</span>
        <span className="flex items-center gap-1.5 text-xs text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {MOCK_ALERTS.filter(a => a.riskLevel === "red").length} حالة حرجة
        </span>
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-800/60">
        {MOCK_ALERTS.map(alert => {
          const isSelected = selected === alert.id;
          return (
            <div
              key={alert.id}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                isSelected ? "bg-gray-800" : "hover:bg-gray-800/50"
              }`}
              onClick={() => setSelected(isSelected ? null : alert.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-xs font-medium truncate max-w-[140px]">{alert.name}</span>
                <RiskBadge level={alert.riskLevel} />
              </div>

              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <span>{alert.id}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" /> {alert.heartRate}</span>
                <span>·</span>
                <span>{alert.temperature}°م</span>
                <span>·</span>
                <span>O₂ {alert.oxygenLevel}%</span>
              </div>

              {alert.condition && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-yellow-400">
                  <AlertTriangle className="w-2.5 h-2.5" /> {alert.condition}
                </div>
              )}

              {isSelected && (
                <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                  <div className="text-[10px] text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>العمر</span><span className="text-gray-200">{alert.age}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الجنسية</span><span className="text-gray-200">{alert.nationality}</span>
                    </div>
                  </div>
                  <button className="w-full mt-2 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5">
                    <Ambulance className="w-3.5 h-3.5" /> إرسال فريق طبي
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-2 border-t border-gray-800 text-xs text-gray-600 text-center">
        عرض {MOCK_ALERTS.length} من أصل ٤٠ حاجًا
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: "red" | "yellow" | "green" }) {
  const styles = {
    red: "bg-red-900/60 text-red-400 border-red-800",
    yellow: "bg-yellow-900/60 text-yellow-400 border-yellow-800",
    green: "bg-emerald-900/60 text-emerald-400 border-emerald-800",
  };
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold tracking-wider ${styles[level]}`}>
      {RISK_LABEL[level]}
    </span>
  );
}
