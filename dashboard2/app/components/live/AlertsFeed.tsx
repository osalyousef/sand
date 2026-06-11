"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Heart, AlertTriangle, Ambulance, Stethoscope, CheckCircle2, Building2,
  ChevronDown, Bot, Flame, TrendingUp, Package, Radar, Check, MapPin,
} from "lucide-react";
import { MOCK_ALERTS } from "@/lib/mock-data";
import {
  INITIAL_ALERT_STATUS,
  ALERT_STATUS_META,
  LIFECYCLE_STEPS,
  RECOVERY_STATS,
  type AlertStatus,
} from "@/lib/ops-data";
import { OPS_INSIGHTS, type InsightType, type InsightSeverity } from "@/lib/agents";

const RISK_LABEL = { red: "خطر", yellow: "تحذير", green: "آمن" };

const INSIGHT_ICON: Record<InsightType, LucideIcon> = {
  surge: Flame,
  prediction: TrendingUp,
  logistics: Package,
  anomaly: Radar,
};

const SEVERITY_STYLE: Record<InsightSeverity, { border: string; icon: string }> = {
  critical: { border: "border-red-800", icon: "text-red-400" },
  warning: { border: "border-yellow-800", icon: "text-yellow-400" },
  info: { border: "border-blue-800", icon: "text-blue-400" },
};

export default function AlertsFeed() {
  const [view, setView] = useState<"alerts" | "agent">("alerts");
  const [selected, setSelected] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, AlertStatus>>(INITIAL_ALERT_STATUS);
  const [showResolved, setShowResolved] = useState(true);
  const [executed, setExecuted] = useState<Set<string>>(new Set());

  function advance(id: string, next: AlertStatus) {
    setStatuses(prev => ({ ...prev, [id]: next }));
  }

  const isClosed = (s: AlertStatus) => s === "resolved" || s === "transferred";
  const active = MOCK_ALERTS.filter(a => !isClosed(statuses[a.id]));
  const closed = MOCK_ALERTS.filter(a => isClosed(statuses[a.id]));
  const criticalCount = active.filter(a => a.riskLevel === "red").length;
  const criticalInsights = OPS_INSIGHTS.filter(i => i.severity === "critical" && !executed.has(i.id)).length;

  return (
    <div className="w-80 flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* View tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setView("alerts")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            view === "alerts" ? "border-red-500 text-white bg-gray-950/50" : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          التنبيهات الحية
          <span className="flex items-center gap-1 text-[10px] text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {criticalCount}
          </span>
        </button>
        <button
          onClick={() => setView("agent")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            view === "agent" ? "border-emerald-500 text-white bg-gray-950/50" : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          راصد · العمليات
          {criticalInsights > 0 && (
            <span className="badge-pulse min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              {criticalInsights}
            </span>
          )}
        </button>
      </div>

      {view === "alerts" ? (
        <>
          {/* Active alerts */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {active.map(alert => {
              const status = statuses[alert.id];
              const meta = ALERT_STATUS_META[status];
              const isSelected = selected === alert.id;
              const isCriticalNew = alert.riskLevel === "red" && status === "new";

              return (
                <div
                  key={alert.id}
                  className={`rounded-xl border bg-gray-950 px-3 py-2.5 cursor-pointer transition-colors ${
                    isCriticalNew ? "critical-pulse border-red-500" : isSelected ? "border-gray-600" : "border-gray-800 hover:border-gray-700"
                  }`}
                  onClick={() => setSelected(isSelected ? null : alert.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-xs font-medium truncate max-w-[120px]">{alert.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${meta.chip}`}>
                      {meta.label}
                    </span>
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

                  {/* Lifecycle stepper */}
                  <div className="flex items-center gap-1 mt-2">
                    {LIFECYCLE_STEPS.map((s, i) => {
                      const reached = ALERT_STATUS_META[status].step >= i;
                      return (
                        <span
                          key={s}
                          className="flex-1 h-1 rounded-full transition-colors"
                          style={{ background: reached ? meta.color : "#263457" }}
                          title={ALERT_STATUS_META[s].label}
                        />
                      );
                    })}
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-gray-800 space-y-2" onClick={e => e.stopPropagation()}>
                      <div className="text-[10px] text-gray-400 space-y-1">
                        <div className="flex justify-between">
                          <span>العمر</span><span className="text-gray-200">{alert.age}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>الجنسية</span><span className="text-gray-200">{alert.nationality}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>مستوى الخطورة</span>
                          <span className="text-gray-200">{RISK_LABEL[alert.riskLevel]}</span>
                        </div>
                      </div>

                      {/* Lifecycle actions */}
                      {status === "new" && (
                        <button
                          onClick={() => advance(alert.id, "dispatched")}
                          className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Ambulance className="w-3.5 h-3.5" /> إرسال فريق طبي
                        </button>
                      )}
                      {status === "dispatched" && (
                        <button
                          onClick={() => advance(alert.id, "treating")}
                          className="w-full py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Stethoscope className="w-3.5 h-3.5" /> وصل الفريق — بدء العلاج
                        </button>
                      )}
                      {status === "treating" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => advance(alert.id, "resolved")}
                            className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> تم الحل
                          </button>
                          <button
                            onClick={() => advance(alert.id, "transferred")}
                            className="flex-1 py-1.5 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <Building2 className="w-3.5 h-3.5" /> نقل لمستشفى
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {active.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-gray-400 text-xs">جميع التنبيهات تمت معالجتها</p>
              </div>
            )}

            {/* Resolved today */}
            {closed.length > 0 && (
              <div className="pt-1">
                <button
                  onClick={() => setShowResolved(s => !s)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    حُلّت في هذه الوردية ({closed.length})
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showResolved ? "rotate-180" : ""}`} />
                </button>
                {showResolved && closed.map(alert => {
                  const meta = ALERT_STATUS_META[statuses[alert.id]];
                  return (
                    <div
                      key={alert.id}
                      className="fade-in flex items-center justify-between rounded-lg border border-emerald-800/40 bg-emerald-900/20 px-3 py-2 mb-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-gray-200 text-xs">{alert.name}</p>
                          <p className="text-gray-500 text-[10px]">{alert.id} · {alert.condition ?? "استقرت الحالة"}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${meta.chip}`}>
                        {meta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-800 text-xs text-gray-500 text-center">
            +{RECOVERY_STATS.today} حالة حُلّت منذ منتصف الليل
          </div>
        </>
      ) : (
        <>
          {/* Ops Agent insights — area-level intelligence, actions need approval */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {OPS_INSIGHTS.map(insight => {
              const Icon = INSIGHT_ICON[insight.type];
              const style = SEVERITY_STYLE[insight.severity];
              const done = executed.has(insight.id);

              return (
                <div
                  key={insight.id}
                  className={`fade-in rounded-xl border bg-gray-950 p-3 ${done ? "border-emerald-800/50 opacity-75" : style.border}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${done ? "text-emerald-400" : style.icon}`} />
                      <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-300">
                        <MapPin className="w-2.5 h-2.5" /> {insight.area}
                      </span>
                    </span>
                    <span className="text-[9px] text-gray-500">{insight.timeLabel}</span>
                  </div>

                  <p className="text-white text-xs font-semibold mb-1">{insight.title}</p>
                  <p className="text-gray-400 text-[10px] leading-relaxed mb-2">{insight.detail}</p>

                  {/* Confidence */}
                  <div className="flex items-center gap-2 mb-2" data-tip="ثقة النموذج في هذا التحليل">
                    <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${insight.confidence}%`,
                          background: insight.confidence >= 90 ? "#00d4aa" : insight.confidence >= 80 ? "#3b82f6" : "#f59e0b",
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-gray-500">ثقة {insight.confidence}٪</span>
                  </div>

                  {/* Suggested action */}
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-2">
                    <p className="text-[9px] text-blue-400/90 mb-0.5">الإجراء المقترح:</p>
                    <p className="text-gray-200 text-[10px] leading-relaxed">{insight.action}</p>
                    <div className="mt-1.5">
                      {done ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                          <Check className="w-3 h-3" /> تمت الموافقة — أُسند للتنفيذ
                        </span>
                      ) : (
                        <button
                          onClick={() => setExecuted(prev => new Set(prev).add(insight.id))}
                          className="flex items-center gap-1 text-[10px] px-2.5 py-1 bg-emerald-900/50 hover:bg-emerald-900/80 border border-emerald-700 text-emerald-300 rounded-md transition-colors"
                        >
                          <Check className="w-3 h-3" /> موافقة وتنفيذ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-1.5 px-4 py-2 border-t border-gray-800 text-[10px] text-gray-500">
            <Bot className="w-3 h-3 text-emerald-500" />
            «راصد» وكيل العمليات — يولّد الرؤى من بث المؤشرات والمواقع · تحديث كل ٥ دقائق
          </div>
        </>
      )}
    </div>
  );
}
