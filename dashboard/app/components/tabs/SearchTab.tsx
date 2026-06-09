"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { MOCK_PILGRIMS } from "@/lib/mock-data";
import type { MockPilgrim } from "@/lib/mock-data";
import { RISK_COLORS } from "@/lib/types";
import PilgrimDetail from "@/app/components/search/PilgrimDetail";

export default function SearchTab() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MockPilgrim | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_PILGRIMS;
    return MOCK_PILGRIMS.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.passportNumber.toLowerCase().includes(q) ||
      p.nationality.toLowerCase().includes(q)
    );
  }, [query]);

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
          <p className="text-gray-500 text-[10px] mt-2">{results.length} نتيجة</p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-800/60">
          {results.length === 0 ? (
            <p className="text-gray-600 text-xs text-center p-6">لا توجد نتائج مطابقة</p>
          ) : (
            results.map(p => {
              const isSelected = selected?.id === p.id;
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
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: RISK_COLORS[p.riskLevel] }}
                    title={p.riskLevel}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detail */}
      {selected ? (
        <PilgrimDetail pilgrim={selected} />
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
