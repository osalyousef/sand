import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ChevronRight, Activity, Phone, MapPin, Sparkles } from "lucide-react-native";
import { RISK_COLORS, type RiskLevel } from "@/types";
import type { ScannedPilgrim } from "@/lib/scanned-store";
import { fetchTriage, type TriageResult } from "@/lib/health-platform";

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

  // Real model-driven triage from the platform. Bracelet records have no
  // feature vector (→ insufficient_data) so this simply stays null for them and
  // the local bracelet risk is used unchanged.
  const [triage, setTriage] = useState<TriageResult | null>(null);
  useEffect(() => {
    let active = true;
    fetchTriage(pilgrim.id).then((t) => { if (active) setTriage(t); }).catch(() => {});
    return () => { active = false; };
  }, [pilgrim.id]);

  const effectiveRisk: RiskLevel = triage?.risk_level ?? risk.risk_level;
  const riskColor = RISK_COLORS[effectiveRisk];

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
          <ChevronRight color="#3d3424" size={22} />
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
                {riskLabel(effectiveRisk)}
              </Text>
              <Text style={styles.riskCritical}>
                {triage?.risk_level ? "AI TRIAGE" : "CRITICAL"}
              </Text>
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

        {/* AI triage — real XGBoost classification + SHAP risk factors */}
        {triage?.risk_level && (
          <View style={[styles.section, { borderColor: `${riskColor}55`, borderWidth: 1 }]}>
            <View style={styles.triageHeader}>
              <Text style={styles.sectionTitle}>تصنيف الفرز الآلي · XGBoost</Text>
              <View style={[styles.triagePill, { borderColor: riskColor }]}>
                <Text style={[styles.triagePillText, { color: riskColor }]}>
                  {riskLabel(triage.risk_level)}
                </Text>
              </View>
            </View>
            {triage.primary_risk_factors && triage.primary_risk_factors.length > 0 ? (
              <>
                <View style={styles.shapLabelRow}>
                  <Sparkles color="#d9a441" size={12} />
                  <Text style={styles.shapLabel}>أبرز عوامل الخطورة (SHAP)</Text>
                </View>
                {triage.primary_risk_factors.map((f, i) => (
                  <View key={i} style={styles.shapRow}>
                    <Text style={styles.shapValue}>{String(f.value)}</Text>
                    <Text style={styles.shapFeature}>{f.feature}</Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={styles.listItemText}>لا توجد عوامل خطورة بارزة — ضمن النطاق الآمن.</Text>
            )}
          </View>
        )}

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
          <MapPin color="#3d3424" size={18} />
          <Text style={styles.locationText}>موقع على الخريطة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctaButton} activeOpacity={0.85}>
          <Phone color="#3d3424" size={18} />
          <Text style={styles.ctaText}>اتصال طارئ — الفريق الطبي</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f0e1" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e6dcc8",
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#3d3424", fontSize: 18, fontWeight: "700" },
  scanIndicator: { flexDirection: "row", alignItems: "center", gap: 6 },
  scanDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" },
  scanText: { color: "#22c55e", fontSize: 12 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 24 },

  // identity
  identityCard: {
    backgroundColor: "#fdf8ec",
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
  riskCritical: { color: "#9a917f", fontSize: 11, letterSpacing: 1 },
  name: { color: "#3d3424", fontSize: 22, fontWeight: "800", textAlign: "right" },
  meta: { color: "#9a917f", fontSize: 13, textAlign: "right" },

  vitalsRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  vitalBox: {
    flex: 1,
    backgroundColor: "#f7f0e1",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    gap: 4,
  },
  vitalValue: { color: "#3d3424", fontSize: 18, fontWeight: "800" },
  vitalHighlight: { color: "#f97316" },
  vitalLabel: { color: "#9a917f", fontSize: 11 },

  // sections
  section: {
    backgroundColor: "#fdf8ec",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6dcc8",
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    color: "#3d3424",
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
  listItemText: { color: "#2f2a22", fontSize: 14, textAlign: "right" },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#cbbfa8",
  },

  // triage
  triageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  triagePill: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  triagePillText: { fontSize: 12, fontWeight: "800" },
  shapLabelRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
  },
  shapLabel: { color: "#9a917f", fontSize: 12, textAlign: "right" },
  shapRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f7f0e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  shapValue: { color: "#b8860b", fontSize: 13, fontWeight: "700", fontVariant: ["tabular-nums"] },
  shapFeature: { color: "#2f2a22", fontSize: 13, textAlign: "right" },

  // cta
  ctaContainer: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#e6dcc8",
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
  ctaText: { color: "#3d3424", fontSize: 16, fontWeight: "700" },
  locationButton: {
    backgroundColor: "#e6dcc8",
    borderWidth: 1,
    borderColor: "#cbbfa8",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  locationText: { color: "#3d3424", fontSize: 15, fontWeight: "700" },
});
