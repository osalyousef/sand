import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight, Activity, Phone, MapPin } from "lucide-react-native";
import { RISK_COLORS, type RiskLevel } from "@/types";
import type { ScannedPilgrim } from "@/lib/scanned-store";

function riskLabel(level: RiskLevel) {
  return level === "red" ? "حرج" : level === "yellow" ? "عالٍ" : "منخفض";
}

function VitalBox({
  value,
  label,
  highlight,
}: {
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.vitalBox}>
      <Text style={[styles.vitalValue, highlight && styles.vitalHighlight]}>
        {value}
      </Text>
      <Text style={styles.vitalLabel}>{label}</Text>
    </View>
  );
}

export default function PilgrimDetail() {
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data: string }>();

  const entry: ScannedPilgrim = JSON.parse(data);
  const { pilgrim, vitals, risk } = entry;
  const riskColor = RISK_COLORS[risk.risk_level];

  const conditions = [
    pilgrim.has_heart_condition ? "قصور قلبي مزمن" : null,
    pilgrim.has_diabetes ? "سكري النوع الثاني" : null,
    pilgrim.has_hypertension ? "ارتفاع ضغط الدم" : null,
  ].filter(Boolean) as string[];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronRight color="#fff" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>بطاقة الحاج</Text>
        <View style={styles.scanIndicator}>
          <View style={styles.scanDot} />
          <Text style={styles.scanText}>تم المسح</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* identity card */}
        <View style={[styles.identityCard, { borderColor: riskColor }]}>
          <View style={styles.identityTop}>
            <View style={[styles.riskBadge, { borderColor: riskColor }]}>
              <Text style={[styles.riskBadgeText, { color: riskColor }]}>
                {riskLabel(risk.risk_level)}
              </Text>
              <Text style={styles.riskCritical}>CRITICAL</Text>
            </View>
            <Activity color={riskColor} size={20} />
          </View>
          <Text style={styles.name}>{pilgrim.full_name}</Text>
          <Text style={styles.meta}>
            {pilgrim.age} سنة · {pilgrim.nationality} · {pilgrim.passport_number}
          </Text>

          {/* vitals */}
          <View style={styles.vitalsRow}>
            <VitalBox
              value={String(vitals.heart_rate)}
              label="نبض"
              highlight={!!vitals.heart_rate && vitals.heart_rate > 100}
            />
            <VitalBox
              value={`${vitals.temperature}°`}
              label="حرارة"
              highlight={!!vitals.temperature && vitals.temperature > 38}
            />
            <VitalBox
              value={`${vitals.oxygen_level}%`}
              label="أكسجين"
              highlight={!!vitals.oxygen_level && vitals.oxygen_level < 95}
            />
            <VitalBox
              value={`${Math.round(risk.score * 100)}%`}
              label="خطورة"
              highlight
            />
          </View>
        </View>

        {/* conditions */}
        {conditions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الأمراض المزمنة</Text>
            {conditions.map((c) => (
              <View key={c} style={styles.listItem}>
                <Text style={styles.listItemText}>{c}</Text>
                <View style={styles.bullet} />
              </View>
            ))}
          </View>
        )}

        {/* medications */}
        {pilgrim.medications && pilgrim.medications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              الأدوية ({pilgrim.medications.length})
            </Text>
            {pilgrim.medications.map((m) => (
              <View key={m} style={styles.listItem}>
                <Text style={styles.listItemText}>{m}</Text>
                <View style={styles.bullet} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* CTAs */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.locationButton}
          activeOpacity={0.85}
          onPress={() =>
            router.push({ pathname: "/(tabs)/map", params: { focus: pilgrim.id } })
          }
        >
          <MapPin color="#fff" size={18} />
          <Text style={styles.locationText}>موقع على الخريطة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctaButton} activeOpacity={0.85}>
          <Phone color="#fff" size={18} />
          <Text style={styles.ctaText}>اتصال طارئ — الفريق الطبي</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0d0d0d" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  scanIndicator: { flexDirection: "row", alignItems: "center", gap: 6 },
  scanDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" },
  scanText: { color: "#22c55e", fontSize: 12 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 24 },

  // identity
  identityCard: {
    backgroundColor: "#111",
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    gap: 6,
  },
  identityTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  riskBadgeText: { fontSize: 13, fontWeight: "700" },
  riskCritical: { color: "#6b7280", fontSize: 11, letterSpacing: 1 },
  name: { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "right" },
  meta: { color: "#6b7280", fontSize: 13, textAlign: "right" },

  vitalsRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  vitalBox: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    gap: 4,
  },
  vitalValue: { color: "#fff", fontSize: 18, fontWeight: "800" },
  vitalHighlight: { color: "#f97316" },
  vitalLabel: { color: "#6b7280", fontSize: 11 },

  // sections
  section: {
    backgroundColor: "#111",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
    marginBottom: 4,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
  },
  listItemText: { color: "#d1d5db", fontSize: 14, textAlign: "right" },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#374151",
  },

  // cta
  ctaContainer: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    gap: 10,
  },
  ctaButton: {
    backgroundColor: "#c2410c",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  locationButton: {
    backgroundColor: "#1f2937",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  locationText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
