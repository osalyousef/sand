import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Brain,
  Timer,
  CheckCircle2,
  Users,
  Cloud,
} from "lucide-react-native";
import { RISK_COLORS, type RiskLevel } from "@/types";
import {
  AI_KPIS,
  RISK_DISTRIBUTION,
  CHRONIC_CONDITIONS,
  HOURLY_ALERTS,
  CURRENT_SHIFT,
  FIELD_TEAMS,
  TEAM_STATUS_META,
  fatigueColor,
  RECOVERY_STATS,
} from "@/lib/ops-data";
import { fetchStats, type PilgrimStats } from "@/lib/health-platform";

// Chronic-condition keys → Arabic label + color (presentation stays client-side;
// the backend returns raw counts keyed the same way).
const CONDITION_META: Record<string, { name: string; color: string }> = {
  hypertension: { name: "ارتفاع الضغط", color: "#6366f1" },
  diabetes: { name: "السكري", color: "#f59e0b" },
  heart: { name: "أمراض القلب", color: "#ef4444" },
  respiratory: { name: "الجهاز التنفسي", color: "#3b82f6" },
  kidney: { name: "أمراض الكلى", color: "#14b8a6" },
  none: { name: "لا يوجد", color: "#22c55e" },
};

I18nManager.forceRTL(true);

const SN = {
  bg: "#f7f0e1",
  raised: "#fdf8ec",
  rule: "#e6dcc8",
  gold: "#b07d12",
  fg1: "#3d3424",
  fg2: "#6b6457",
  fg3: "#9a917f",
};

const RISK_LABEL: Record<RiskLevel, string> = {
  red: "حرج",
  yellow: "متوسط",
  green: "مستقر",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function KpiCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof Brain;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.kpiCard}>
      <Icon color={color} size={18} />
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

export default function DataScreen() {
  const router = useRouter();
  const maxHourly = Math.max(...HOURLY_ALERTS);

  // Real roster analytics from the platform; falls back to bundled sample
  // figures when the backend is offline.
  const [stats, setStats] = useState<PilgrimStats | null>(null);
  useEffect(() => {
    let active = true;
    fetchStats()
      .then((s) => { if (active && s) setStats(s); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const riskDist: Record<RiskLevel, number> = stats?.risk_distribution ?? RISK_DISTRIBUTION;
  const conditions = useMemo(() => {
    const src = stats?.chronic_conditions;
    if (!src) return CHRONIC_CONDITIONS;
    return (Object.keys(CONDITION_META) as (keyof typeof src)[])
      .filter((k) => typeof src[k] === "number")
      .map((k) => ({ name: CONDITION_META[k].name, color: CONDITION_META[k].color, count: src[k] }));
  }, [stats]);

  const totalConditions = conditions.reduce((s, c) => s + c.count, 0) || 1;
  const totalRisk = (riskDist.green + riskDist.yellow + riskDist.red) || 1;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <ChevronRight color={SN.fg1} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>البيانات والتحليلات</Text>
        {stats ? (
          <View style={styles.liveChip}>
            <Cloud color="#1f8a80" size={11} />
            <Text style={styles.liveText}>{stats.total_pilgrims}</Text>
          </View>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* AI KPIs */}
        <View style={styles.kpiRow}>
          <KpiCard icon={Brain} value={`${AI_KPIS.predictionAccuracy}٪`} label="دقة التنبؤ" color="#6366f1" />
          <KpiCard icon={CheckCircle2} value={`${AI_KPIS.agentResolutionRate}٪`} label="حل آلي" color="#22c55e" />
          <KpiCard icon={Timer} value={AI_KPIS.avgResponseTime} label="زمن الاستجابة" color={SN.gold} />
        </View>

        {/* risk distribution */}
        <Section title="توزيع الخطورة">
          <View style={styles.distBar}>
            {(["red", "yellow", "green"] as RiskLevel[]).map((lvl) => {
              const pct = (riskDist[lvl] / totalRisk) * 100;
              return (
                <View
                  key={lvl}
                  style={{ width: `${pct}%`, backgroundColor: RISK_COLORS[lvl], height: 14 }}
                />
              );
            })}
          </View>
          <View style={styles.distLegend}>
            {(["red", "yellow", "green"] as RiskLevel[]).map((lvl) => (
              <View key={lvl} style={styles.distItem}>
                <Text style={styles.distCount}>{riskDist[lvl]}</Text>
                <Text style={styles.distLabel}>{RISK_LABEL[lvl]}</Text>
                <View style={[styles.distDot, { backgroundColor: RISK_COLORS[lvl] }]} />
              </View>
            ))}
          </View>
        </Section>

        {/* hourly alerts sparkline */}
        <Section title="البلاغات خلال ٢٤ ساعة">
          <View style={styles.spark}>
            {HOURLY_ALERTS.map((v, i) => (
              <View
                key={i}
                style={[
                  styles.sparkBar,
                  {
                    height: 6 + (v / maxHourly) * 56,
                    backgroundColor: v >= maxHourly * 0.8 ? "#ef4444" : SN.gold,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={styles.sparkCaption}>الذروة {maxHourly} بلاغ/الساعة</Text>
        </Section>

        {/* chronic conditions */}
        <Section title="الأمراض المزمنة">
          {conditions.map((c) => (
            <View key={c.name} style={styles.condRow}>
              <Text style={styles.condCount}>{c.count}</Text>
              <View style={styles.condBarTrack}>
                <View
                  style={[
                    styles.condBarFill,
                    { width: `${(c.count / totalConditions) * 100}%`, backgroundColor: c.color },
                  ]}
                />
              </View>
              <Text style={styles.condName}>{c.name}</Text>
            </View>
          ))}
        </Section>

        {/* resource occupancy */}
        <Section title="إشغال الموارد">
          <ResourceRow label="العناية المركزة" pct={AI_KPIS.icuOccupancy} />
          <ResourceRow label="المستشفى الميداني" pct={AI_KPIS.fieldHospitalOccupancy} />
          <View style={styles.ambRow}>
            <Text style={styles.ambValue}>
              {AI_KPIS.ambulances.available}/{AI_KPIS.ambulances.total}
            </Text>
            <Text style={styles.ambLabel}>سيارات إسعاف متاحة</Text>
          </View>
        </Section>

        {/* shift panel */}
        <Section title="الوردية الحالية">
          <View style={styles.shiftHead}>
            <Text style={styles.shiftPct}>{CURRENT_SHIFT.elapsedPct}٪</Text>
            <View style={styles.shiftInfo}>
              <Text style={styles.shiftName}>{CURRENT_SHIFT.name}</Text>
              <Text style={styles.shiftMeta}>
                {CURRENT_SHIFT.supervisor} · {CURRENT_SHIFT.start}–{CURRENT_SHIFT.end}
              </Text>
            </View>
          </View>
          <View style={styles.shiftStatsRow}>
            <ShiftStat value={String(CURRENT_SHIFT.staffOnDuty)} label="طاقم" />
            <ShiftStat value={`${RECOVERY_STATS.today}`} label="حُلّت اليوم" />
            <ShiftStat value={`${CURRENT_SHIFT.nextShiftMin} د`} label="الوردية القادمة" />
          </View>

          {/* team fatigue */}
          <Text style={styles.subHead}>إجهاد الفرق</Text>
          {FIELD_TEAMS.map((t) => {
            const st = TEAM_STATUS_META[t.status];
            return (
              <View key={t.id} style={styles.teamRow}>
                <View style={[styles.fatigueChip, { borderColor: fatigueColor(t.hours) }]}>
                  <Text style={[styles.fatigueText, { color: fatigueColor(t.hours) }]}>
                    {t.hours} س
                  </Text>
                </View>
                <View style={[styles.teamStatusChip, { borderColor: st.color }]}>
                  <Text style={[styles.teamStatusText, { color: st.color }]}>{st.label}</Text>
                </View>
                <View style={styles.teamInfo}>
                  <View style={styles.teamNameRow}>
                    <Users color={SN.fg3} size={12} />
                    <Text style={styles.teamCount}>{t.members}</Text>
                    <Text style={styles.teamName}>{t.name}</Text>
                  </View>
                  <Text style={styles.teamLoc}>{t.location}</Text>
                </View>
              </View>
            );
          })}

          {/* handoff notes */}
          <Text style={styles.subHead}>ملاحظات التسليم</Text>
          {CURRENT_SHIFT.handoffNotes.map((n) => (
            <View key={n} style={styles.noteRow}>
              <Text style={styles.noteText}>{n}</Text>
              <View style={styles.noteBullet} />
            </View>
          ))}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function ResourceRow({ label, pct }: { label: string; pct: number }) {
  const color = pct >= 85 ? "#ef4444" : pct >= 60 ? "#eab308" : "#22c55e";
  return (
    <View style={styles.resRow}>
      <Text style={[styles.resPct, { color }]}>{pct}٪</Text>
      <View style={styles.resTrack}>
        <View style={[styles.resFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.resLabel}>{label}</Text>
    </View>
  );
}

function ShiftStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.shiftStat}>
      <Text style={styles.shiftStatValue}>{value}</Text>
      <Text style={styles.shiftStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SN.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: SN.rule,
  },
  headerTitle: { color: SN.fg1, fontSize: 18, fontWeight: "800" },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#1f8a80",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  liveText: { color: "#1f8a80", fontSize: 11, fontWeight: "800" },
  scroll: { padding: 12, gap: 12, paddingBottom: 28 },

  kpiRow: { flexDirection: "row", gap: 8 },
  kpiCard: {
    flex: 1,
    backgroundColor: SN.raised,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: SN.rule,
    paddingVertical: 12,
    alignItems: "center",
    gap: 3,
  },
  kpiValue: { fontSize: 17, fontWeight: "800" },
  kpiLabel: { color: SN.fg3, fontSize: 10.5, textAlign: "center" },

  section: {
    backgroundColor: SN.raised,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SN.rule,
    padding: 14,
    gap: 10,
  },
  sectionTitle: { color: SN.fg1, fontSize: 15, fontWeight: "800", textAlign: "right" },

  // risk distribution
  distBar: { flexDirection: "row", borderRadius: 7, overflow: "hidden" },
  distLegend: { flexDirection: "row", justifyContent: "space-around" },
  distItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  distDot: { width: 9, height: 9, borderRadius: 5 },
  distLabel: { color: SN.fg2, fontSize: 12 },
  distCount: { color: SN.fg1, fontSize: 13, fontWeight: "800" },

  // sparkline
  spark: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 64,
    gap: 2,
  },
  sparkBar: { flex: 1, borderRadius: 2 },
  sparkCaption: { color: SN.fg3, fontSize: 11, textAlign: "center" },

  // chronic conditions
  condRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  condCount: { color: SN.fg1, fontSize: 12, fontWeight: "800", width: 26, textAlign: "left" },
  condBarTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: SN.bg, overflow: "hidden" },
  condBarFill: { height: 8, borderRadius: 4 },
  condName: { color: SN.fg2, fontSize: 12.5, width: 92, textAlign: "right" },

  // resources
  resRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  resPct: { fontSize: 12, fontWeight: "800", width: 36, textAlign: "left" },
  resTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: SN.bg, overflow: "hidden" },
  resFill: { height: 8, borderRadius: 4 },
  resLabel: { color: SN.fg2, fontSize: 12.5, width: 120, textAlign: "right" },
  ambRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: SN.rule,
    paddingTop: 8,
  },
  ambValue: { color: "#22c55e", fontSize: 15, fontWeight: "800" },
  ambLabel: { color: SN.fg2, fontSize: 12.5 },

  // shift
  shiftHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  shiftPct: { color: SN.gold, fontSize: 24, fontWeight: "800" },
  shiftInfo: { flex: 1, alignItems: "flex-end" },
  shiftName: { color: SN.fg1, fontSize: 14, fontWeight: "800" },
  shiftMeta: { color: SN.fg3, fontSize: 11.5, marginTop: 1 },
  shiftStatsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: SN.rule,
    paddingTop: 10,
  },
  shiftStat: { flex: 1, alignItems: "center", gap: 2 },
  shiftStatValue: { color: SN.fg1, fontSize: 15, fontWeight: "800" },
  shiftStatLabel: { color: SN.fg3, fontSize: 10.5 },

  subHead: {
    color: SN.fg2,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
    marginTop: 4,
  },
  teamRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  teamInfo: { flex: 1, alignItems: "flex-end" },
  teamNameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  teamName: { color: SN.fg1, fontSize: 13, fontWeight: "700" },
  teamCount: { color: SN.fg3, fontSize: 11 },
  teamLoc: { color: SN.fg3, fontSize: 11, marginTop: 1 },
  teamStatusChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  teamStatusText: { fontSize: 10, fontWeight: "800" },
  fatigueChip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  fatigueText: { fontSize: 11, fontWeight: "800" },

  noteRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "flex-end", gap: 8 },
  noteText: { color: SN.fg2, fontSize: 12.5, lineHeight: 19, flexShrink: 1, textAlign: "right" },
  noteBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: SN.gold, marginTop: 6 },
});
