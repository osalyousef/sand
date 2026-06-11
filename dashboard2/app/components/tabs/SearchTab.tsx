"use client";

import { useState, useMemo } from "react";
import { Search, CheckCircle2 } from "lucide-react";
import { MOCK_PILGRIMS } from "@/lib/mock-data";
import type { MockPilgrim } from "@/lib/mock-data";
import { RISK_COLORS, type RiskLevel } from "@/lib/types";
import { RECOVERED_IDS } from "@/lib/ops-data";
import PilgrimDetail from "@/app/components/search/PilgrimDetail";

type Filter = "all" | RiskLevel | "recovered";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "red", label: "خطر" },
  { id: "yellow", label: "تحذير" },
  { id: "green", label: "آمن" },
  { id: "recovered", label: "تعافى ✓" },
];

export default function SearchTab() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<MockPilgrim | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_PILGRIMS.filter(p => {
      if (filter === "recovered" && !RECOVERED_IDS.has(p.id)) return false;
      if ((filter === "red" || filter === "yellow" || filter === "green") && p.riskLevel !== filter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.passportNumber.toLowerCase().includes(q) ||
        p.nationality.toLowerCase().includes(q)
      );
    });
  }, [query, filter]);

  return (
    <div className="flex gap-3 h-full">
      {/* Results list */}
      <div className="w-80 flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {/* Search box */}
        <div className="p-3 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="ابحث بالاسم أو رقم الحاج أو الجواز…"
              className="w-full bg-gray-950 border border-gray-700 rounded-lg pr-9 pl-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-600"
              dir="rtl"
            />
          </div>

          {/* Risk filter chips */}
          <div className="flex gap-1.5 mt-2">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                  filter === f.id
                    ? "bg-emerald-900/60 border-emerald-700 text-emerald-300"
                    : "bg-gray-950 border-gray-700 text-gray-500 hover:text-gray-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="text-gray-500 text-[10px] mt-2">{results.length} نتيجة</p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-800/60">
          {results.length === 0 ? (
            <p className="text-gray-600 text-xs text-center p-6">لا توجد نتائج مطابقة</p>
          ) : (
            results.map(p => {
              const isSelected = selected?.id === p.id;
              const recovered = RECOVERED_IDS.has(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`px-4 py-3 cursor-pointer transition-colors flex items-center gap-3 ${
                    isSelected ? "bg-gray-800" : "hover:bg-gray-800/40"
                  }`}
                >
                  <span className="text-xl">{p.nationalityFlag}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-xs font-medium truncate">{p.name}</p>
                    <p className="text-gray-500 text-[10px]">{p.id} · {p.nationality}</p>
                  </div>
                  {recovered ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" data-tip="تعافى اليوم" />
                  ) : (
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: RISK_COLORS[p.riskLevel] }}
                      title={p.riskLevel}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detail */}
      {selected ? (
        <PilgrimDetail key={selected.id} pilgrim={selected} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 rounded-xl border border-gray-800 border-dashed text-center p-8">
          <Search className="w-12 h-12 text-gray-700 mb-4" strokeWidth={1.5} />
          <p className="text-gray-400 text-sm font-medium">ابحث عن حاج لعرض حالته الصحية</p>
          <p className="text-gray-600 text-xs mt-1.5 max-w-xs">
            اكتب الاسم أو رقم الحاج أو رقم الجواز، ثم اختر من القائمة
          </p>
        </div>
      )}
    </div>
  );
}
