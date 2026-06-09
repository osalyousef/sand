"use client";

import { useState } from "react";
import { Activity, Phone, Search, BarChart3 } from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import LiveTab from "@/app/components/tabs/LiveTab";
import HotlineTab from "@/app/components/tabs/HotlineTab";
import DataTab from "@/app/components/tabs/DataTab";
import SearchTab from "@/app/components/tabs/SearchTab";

const TABS = [
  { id: "live", label: "مباشر", description: "القيادة الجغرافية", Icon: Activity },
  { id: "hotline", label: "الخط الساخن", description: "إدارة الأزمات", Icon: Phone },
  { id: "search", label: "البحث", description: "سجل الحاج الصحي", Icon: Search },
  { id: "data", label: "البيانات", description: "التحليلات والإحصاءات", Icon: BarChart3 },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("live");

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      <Header />

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-gray-800">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all ${
              activeTab === tab.id
                ? "border-emerald-500 text-white bg-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-900/40"
            }`}
          >
            <tab.Icon className="w-4 h-4" />
            {tab.label}
            <span
              className={`text-[10px] hidden sm:inline transition-colors ${
                activeTab === tab.id ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {tab.description}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <main className="flex-1 overflow-hidden p-3">
        {activeTab === "live" && <LiveTab />}
        {activeTab === "hotline" && <HotlineTab />}
        {activeTab === "search" && <SearchTab />}
        {activeTab === "data" && <DataTab />}
      </main>

      <Footer />
    </div>
  );
}
