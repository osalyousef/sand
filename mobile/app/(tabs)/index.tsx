import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, Thermometer, Droplets, Users, TrendingUp, X, ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import type { RiskLevel } from "@/types";
import { RISK_COLORS } from "@/types";

I18nManager.forceRTL(true);

// ─── mock data (replace with Supabase queries later) ───────────────────────

const ENV = {
  temp: 44,
  humidity: 62,
  crowding: "عالٍ",
  season: "ذروة الموسم",
};

const STATS: { label: string; value: string; level: RiskLevel | "low" }[] = [
  { label: "منخفض", value: "18.4k", level: "low" },
  { label: "متوسط", value: "2.3k", level: "yellow" },
  { label: "عالٍ", value: "847", level: "yellow" },
  { label: "حرج", value: "124", level: "red" },
];

interface CriticalCase {
  id: string;
  name: string;
  meta: string;
  complaint: string;
  level: RiskLevel;
}

const CRITICAL_CASES: CriticalCase[] = [
  {
    id: "1",
    name: "محمد أحمد الفارسي",
    meta: "إيران · 68 سنة · منى — B4",
    complaint: "نبض 108 · حرارة 38.9°م · ضغط مرتفع",
    level: "red",
  },
  {
    id: "2",
    name: "فاطمة عبدالله سيدي",
    meta: "نيجيريا · 74 سنة · المسجد الحرام",
    complaint: "ضغط 180/110 · دوخة شديدة",
    level: "red",
  },
  {
    id: "3",
    name: "أحمد رضا محمودي",
    meta: "باكستان · 71 سنة · عرفات — مشاة",
    complaint: "حرارة 39.2° · إرهاق حاد",
    level: "yellow",
  },
];

// ─── components ────────────────────────────────────────────────────────────

function AlertBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <View style={styles.alertBanner}>
      <TouchableOpacity onPress={onDismiss} style={styles.alertDismiss}>
        <X color="#fff" size={16} />
      </TouchableOpacity>
      <View style={styles.alertTextGroup}>
        <Text style={styles.alertTitle}>تنبيه حراري — منطقة منى</Text>
        <Text style={styles.alertSub}>
          °44م · رطوبة 62% · 72 حالة في خطر فوري
        </Text>
      </View>
    </View>
  );
}

function StatCard({
  label,
  value,
  level,
}: {
  label: string;
  value: string;
  level: RiskLevel | "low";
}) {
  const color =
    level === "low" ? "#9ca3af" : RISK_COLORS[level as RiskLevel];
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EnvRow() {
  return (
    <View style={styles.envRow}>
      <View style={styles.envItem}>
        <Thermometer color="#f97316" size={16} />
        <Text style={styles.envValue}>{ENV.temp}°م</Text>
        <Text style={styles.envLabel}>الحرارة</Text>
      </View>
      <View style={styles.envDivider} />
      <View style={styles.envItem}>
        <Droplets color="#f97316" size={16} />
        <Text style={styles.envValue}>{ENV.humidity}%</Text>
        <Text style={styles.envLabel}>الرطوبة</Text>
      </View>
      <View style={styles.envDivider} />
      <View style={styles.envItem}>
        <Users color="#f97316" size={16} />
        <Text style={styles.envValue}>{ENV.crowding}</Text>
        <Text style={styles.envLabel}>الازدحام</Text>
      </View>
      <View style={styles.envDivider} />
      <View style={styles.envItem}>
        <TrendingUp color="#f97316" size={16} />
        <Text style={styles.envValue}>ذروة</Text>
        <Text style={styles.envLabel}>الموسم</Text>
      </View>
    </View>
  );
}

function CaseCard({ item }: { item: CriticalCase }) {
  const color = RISK_COLORS[item.level];
  const levelLabel = item.level === "red" ? "حرج" : "عالٍ";
  return (
    <TouchableOpacity style={styles.caseCard} activeOpacity={0.7}>
      <View style={styles.caseContent}>
        <Text style={styles.caseName}>{item.name}</Text>
        <Text style={styles.caseMeta}>{item.meta}</Text>
        <Text style={styles.caseComplaint}>{item.complaint}</Text>
      </View>
      <View style={[styles.caseBadge, { borderColor: color }]}>
        <Text style={[styles.caseBadgeText, { color }]}>{levelLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── screen ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [alertVisible, setAlertVisible] = useState(true);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>م.ص</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>سند</Text>
        <Bell color="#9ca3af" size={22} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {alertVisible && (
          <AlertBanner onDismiss={() => setAlertVisible(false)} />
        )}

        {/* stats */}
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </View>

        <EnvRow />

        {/* critical cases */}
        <View style={styles.sectionHeader}>
          <TouchableOpacity style={styles.seeAll}>
            <ChevronLeft color="#f97316" size={16} />
            <Text style={styles.seeAllText}>عرض الكل</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>الحالات الحرجة</Text>
        </View>

        {CRITICAL_CASES.map((item) => (
          <CaseCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0d0d0d",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textDecorationLine: "underline",
    textDecorationColor: "#f97316",
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  // alert
  alertBanner: {
    margin: 12,
    backgroundColor: "#7c2d12",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  alertDismiss: { paddingTop: 2 },
  alertTextGroup: { flex: 1, alignItems: "flex-end" },
  alertTitle: {
    color: "#fed7aa",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "right",
  },
  alertSub: { color: "#fdba74", fontSize: 12, marginTop: 2, textAlign: "right" },

  // stats
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 8,
    marginTop: 4,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { color: "#6b7280", fontSize: 11, marginTop: 2 },

  // env
  envRow: {
    flexDirection: "row",
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: "#111",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
    paddingVertical: 10,
  },
  envItem: { flex: 1, alignItems: "center", gap: 2 },
  envDivider: { width: 1, backgroundColor: "#1f2937" },
  envValue: { color: "#fff", fontSize: 13, fontWeight: "700" },
  envLabel: { color: "#6b7280", fontSize: 10 },

  // section
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { color: "#f97316", fontSize: 13 },

  // case card
  caseCard: {
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: "#111",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  caseContent: { flex: 1, alignItems: "flex-end" },
  caseName: { color: "#fff", fontWeight: "700", fontSize: 15, textAlign: "right" },
  caseMeta: { color: "#6b7280", fontSize: 12, marginTop: 2, textAlign: "right" },
  caseComplaint: { color: "#9ca3af", fontSize: 12, marginTop: 4, textAlign: "right" },
  caseBadge: {
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  caseBadgeText: { fontSize: 12, fontWeight: "700" },
});
