"use client";

import { useState, useEffect } from "react";

export default function Header() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-gray-950 border-b border-gray-800">
      {/* Right: brand (RTL) */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
          س
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">سند</p>
          <p className="text-gray-500 text-xs">مركز قيادة صحة الحجاج</p>
        </div>
      </div>

      {/* Left: clock + badge */}
      <div className="flex items-center gap-4">
        <span className="text-xs px-2 py-1 rounded-full bg-emerald-900/60 text-emerald-400 border border-emerald-800">
          موسم الحج نشط
        </span>
        <div className="text-left">
          <p className="text-white text-sm font-mono">
            {time.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
          <p className="text-gray-500 text-xs">
            {time.toLocaleDateString("ar-SA", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>
    </header>
  );
}
