"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Zap, TrendingUp, Building2, Bot } from "lucide-react";
import { MOCK_PILGRIMS } from "@/lib/mock-data";
import type { RiskLevel } from "@/lib/types";
import { RISK_COLORS } from "@/lib/types";
import type { SelectedCellInfo } from "@/lib/grid";
import CellDetails from "./CellDetails";

// Leaflet touches window — never render it on the server.
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 p-4 space-y-3 bg-gray-950">
      <div className="skeleton h-6 w-40" />
      <div className="skeleton h-[calc(100%-3rem)] w-full" />
    </div>
  ),
});

const RISK_LABEL: Record<RiskLevel, string> = {
  red: "خطر",
  yellow: "تحذير",
  green: "آمن",
};

export default function MapPanel() {
  const [mode, setMode] = useState<"now" | "predicted">("now");
  const [showInstitutions, setShowInstitutions] = useState(true);
  const [selectedCell, setSelectedCell] = useState<SelectedCellInfo | null>(null);

  function switchMode(next: "now" | "predicted") {
    setMode(next);
    setSelectedCell(null); // selection from one field doesn't apply to the other
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">الخريطة الحرارية</span>
          <span className="text-xs text-gray-500">· منطقة منى / عرفات</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Institutions layer toggle */}
          <button
            onClick={() => setShowInstitutions(s => !s)}
            data-tip="إظهار/إخفاء المنشآت الصحية على الخريطة"
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-all ${
              showInstitutions
                ? "bg-blue-900/40 border-blue-700 text-blue-300"
                : "bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> المنشآت
          </button>

          {/* Mode toggle */}
          <div className="flex items-center bg-gray-800 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => switchMode("now")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all ${
                mode === "now" ? "bg-emerald-600 text-gray-950 font-semibold" : "text-gray-400 hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> الآن
            </button>
            <button
              onClick={() => switchMode("predicted")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all ${
                mode === "predicted" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> متوقع (+٤ ساعات)
            </button>
          </div>
        </div>
      </div>

      {/* Map surface */}
      <div className="relative flex-1 overflow-hidden">
        <LeafletMap
          mode={mode}
          showInstitutions={showInstitutions}
          selectedKey={selectedCell?.key ?? null}
          onSelectCell={setSelectedCell}
        />

        {/* Selected-cell details */}
        {selectedCell && (
          <CellDetails cell={selectedCell} onClose={() => setSelectedCell(null)} />
        )}

        {/* Mode caption */}
        <div className="absolute top-3 right-3 z-[1000] pointer-events-none">
          <div
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
              mode === "now"
                ? "bg-emerald-900/80 text-emerald-300 border-emerald-700"
                : "bg-purple-900/80 text-purple-300 border-purple-700"
            }`}
          >
            {mode === "now" ? <Zap className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            {mode === "now"
              ? "كثافة الحالات الحرجة الآن"
              : "تنبؤ «بصير» — المناطق الحرجة خلال ٤ ساعات"}
          </div>
        </div>

        {/* Density legend */}
        <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2 bg-gray-950/85 p-2.5 rounded-lg border border-gray-800 text-xs backdrop-blur-sm">
          <span className="text-gray-300 font-medium">كثافة الحالات الحرجة</span>
          <div className="flex items-center gap-1">
            <span className="text-gray-500 text-[10px]">منخفضة</span>
            <div className="flex h-2.5 rounded-sm overflow-hidden">
              {["#fca5a5", "#f87171", "#ef4444", "#b91c1c", "#7f1d1d"].map(c => (
                <span key={c} className="w-5 h-full" style={{ background: c }} />
              ))}
            </div>
            <span className="text-gray-500 text-[10px]">عالية</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-gray-800">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-gray-400">معلم · خلية ١٠٠م × ١٠٠م</span>
          </div>
          {showInstitutions && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: "#00d4aa" }} />
              <span className="text-gray-400">منشأة صحية (اللون = الإشغال)</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom stats bar */}
      <div className="flex items-center justify-around px-4 py-2 border-t border-gray-800 text-xs">
        {(["red", "yellow", "green"] as RiskLevel[]).map(r => {
          const count = MOCK_PILGRIMS.filter(p => p.riskLevel === r).length;
          return (
            <div key={r} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: RISK_COLORS[r] }} />
              <span className="text-gray-400">{RISK_LABEL[r]}:</span>
              <span className="text-white font-semibold">{count}</span>
            </div>
          );
        })}
        <div className="text-gray-500">٤٠ حاجًا قيد المتابعة</div>
      </div>
    </div>
  );
}
