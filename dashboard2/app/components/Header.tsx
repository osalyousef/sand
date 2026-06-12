"use client";

import { useState, useEffect } from "react";
import { Bell, ShieldAlert, Sun, Moon, ChevronLeft } from "lucide-react";
import { MOCK_ALERTS } from "@/lib/mock-data";
import { ALERT_STATUS_META } from "@/lib/ops-data";
import { useSanadStore } from "@/lib/store";
import { useTheme } from "@/app/hooks/useTheme";

export default function Header() {
  const [time, setTime] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);
  const { light, toggle } = useTheme();
  const alertStatuses = useSanadStore(s => s.alertStatuses);
  const goToAlert = useSanadStore(s => s.goToAlert);

  useEffect(() => {
    setTime(new Date()); // first paint on client only — server has no stable clock
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Live: unhandled criticals only — dispatching anywhere shrinks this badge
  const notifications = MOCK_ALERTS.filter(
    a => a.riskLevel === "red" && alertStatuses[a.id] === "new"
  );
  const count = notifications.length;

  return (
    <header className="relative flex items-center justify-between px-6 py-3 bg-gray-950 border-b border-gray-800">
      {/* Right: brand (RTL) */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-base shadow-[0_0_18px_rgba(0,212,170,0.35)]">
          س
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">سند</p>
          <p className="text-gray-500 text-xs">مركز قيادة صحة الحجاج · وزارة الحج والعمرة</p>
        </div>
      </div>

      {/* Left: theme + notifications + status + clock */}
      <div className="flex items-center gap-4">
        {/* Theme toggle — dark command center ⇄ Nusuk light */}
        <button
          onClick={toggle}
          data-tip={light ? "الوضع الداكن — غرفة القيادة" : "الوضع الفاتح — نمط نسك"}
          className="w-9 h-9 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          aria-label="تبديل المظهر"
        >
          {light ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Global notification bell */}
        <div className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            data-tip="التنبيهات الحرجة غير المعالجة"
            className="relative w-9 h-9 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            aria-label="التنبيهات"
          >
            <Bell className="w-4 h-4" />
            {count > 0 && (
              <span className="badge-pulse absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.7)]">
                {count}
              </span>
            )}
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="fade-in absolute top-11 left-0 z-50 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800 text-sm text-white font-semibold">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  حالات حرجة بانتظار الإسناد
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-800/60">
                  {notifications.length === 0 ? (
                    <p className="text-gray-500 text-xs text-center py-6">لا توجد حالات غير معالجة 🎉</p>
                  ) : (
                    notifications.map(a => {
                      const meta = ALERT_STATUS_META[alertStatuses[a.id]];
                      return (
                        <button
                          key={a.id}
                          onClick={() => {
                            goToAlert(a.id);
                            setOpen(false);
                          }}
                          className="w-full text-right px-4 py-2.5 hover:bg-gray-800/50 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-white text-xs font-medium">{a.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${meta.chip}`}>
                              {meta.label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-gray-500 text-[10px]">
                              {a.id} · {a.condition ?? "مؤشرات حيوية حرجة"} · نبض {a.heartRate}
                            </p>
                            <span className="flex items-center gap-0.5 text-[9px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              فتح على الخريطة <ChevronLeft className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-900/60 text-emerald-400 border border-emerald-800">
          موسم الحج نشط
        </span>

        <div className="text-left min-w-[88px]">
          {time ? (
            <>
              <p className="text-white text-sm font-mono">
                {time.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
              <p className="text-gray-500 text-xs">
                {time.toLocaleDateString("ar-SA", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </>
          ) : (
            <div className="skeleton h-8 w-24" />
          )}
        </div>
      </div>
    </header>
  );
}
