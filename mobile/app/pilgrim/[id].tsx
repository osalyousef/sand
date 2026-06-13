import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Activity,
  Phone,
  MapPin,
  Sparkles,
  Stethoscope,
  Building2,
  Clock,
  HelpCircle,
} from "lucide-react-native";
import { RISK_COLORS, type RiskLevel, type AIPrediction } from "@/types";
import type { ScannedPilgrim } from "@/lib/scanned-store";
import { fetchTriage, type TriageResult } from "@/lib/health-platform";
import { getRiskLevel } from "@/lib/ai";
import { getResponseSuggestion, AGENTS } from "@/lib/agents";
import { nearestWithCapacity } from "@/lib/ops-data";
import HealthCard from "@/components/HealthCard";

function riskLabel(level: RiskLevel) {
  return level === "red" ? "حرج" : level === "yellow" ? "عالٍ" : "منخفض";
}

// Arabic labels for the model's SHAP feature names (backend returns them in
// English). Unknown features fall through to their original string.
const FEATURE_LABELS: Record<string, string> = {
  "Age": "العمر",
  "CVD risk score": "مؤشر خطر القلب والأوعية",
};

function featureLabel(feature: string): string {
  return FEATURE_LABELS[feature] ?? feature;
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

  // AI vitals model — computes a model risk from the bracelet's live vitals.
  // Fills the gap for bracelet records, which carry vitals but have no feature
  // vector, so the platform's XGBoost triage returns insufficient_data. Falls
  // back silently (stays null) when vitals are missing or the endpoint is down.
  const [aiRisk, setAiRisk] = useState<AIPrediction | null>(null);
  useEffect(() => {
    const { heart_rate, temperature, oxygen_level } = vitals;
    if (heart_rate == null || temperature == null || oxygen_level == null) return;
    let active = true;
    getRiskLevel({
      age: pilgrim.age,
      heart_rate,
      temperature,
      oxygen_level,
      has_diabetes: pilgrim.has_diabetes,
      has_heart_condition: pilgrim.has_heart_condition,
      has_hypertension: pilgrim.has_hypertension,
    })
      .then((r) => { if (active) setAiRisk(r); })
      .catch(() => {});
    return () => { active = false; };
  }, [pilgrim.id]);

  // Risk precedence: real XGBoost triage → AI vitals model → static bracelet value.
  const effectiveRisk: RiskLevel =
    triage?.risk_level ?? aiRisk?.risk_level ?? risk.risk_level;
  const effectiveScore: number = aiRisk?.score ?? risk.score;
  const riskColor = RISK_COLORS[effectiveRisk];
  const riskSource = triage?.risk_level
    ? "AI TRIAGE"
    : aiRisk
      ? "AI · VITALS"
      : "CRITICAL";

  // «مُغيث» response agent — clinical copilot derived from vitals + conditions.
  const suggestion = useMemo(() => getResponseSuggestion(entry), [entry]);
  const needsHospital = effectiveRisk === "red";
  const hospital = useMemo(
    () => nearestWithCapacity(needsHospital),
    [needsHospital],
  );

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
        {/* identity — Nusuk health card (ported from the card/ Vite design) */}
        <HealthCard
          name={pilgrim.full_name}
          nationality={pilgrim.nationality}
          risk={effectiveRisk}
          qrValue={JSON.stringify({ id: pilgrim.id })}
          fields={[
            { labelEn: "PILGRIM ID", labelAr: "رقم الحاج", value: pilgrim.id },
            { labelEn: "PASSPORT", labelAr: "رقم الجواز", value: pilgrim.passport_number ?? "—", align: "center" },
            { labelEn: "AGE", labelAr: "العمر", value: `${pilgrim.age} yrs` },
            { labelEn: "NATIONALITY", labelAr: "الجنسية", value: pilgrim.nationality ?? "—", align: "center" },
          ]}
        />

        {/* vitals + triage source */}
        <View style={[styles.identityCard, { borderColor: riskColor }]}>
          <View style={styles.identityTop}>
            <View style={[styles.riskBadge, { borderColor: riskColor }]}>
              <Text style={[styles.riskBadgeText, { color: riskColor }]}>
                {riskLabel(effectiveRisk)}
              </Text>
              <Text style={styles.riskCritical}>{riskSource}</Text>
            </View>
            <Activity color={riskColor} size={20} />
          </View>

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
              value={`${Math.round(effectiveScore * 100)}%`}
              label="خطورة"
              highlight
            />
          </View>
        </View>

        {/* AI triage — real XGBoost classification + SHAP risk factors */}
        {triage?.risk_level && (
          <View style={[styles.section, { borderColor: `${riskColor}55`, borderWidth: 1 }]}>
            <View style={styles.triageHeader}>
              <Text style={styles.sectionTitle}>تصنيف الفرز</Text>
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
                    <Text style={styles.shapFeature}>{featureLabel(f.feature)}</Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={styles.listItemText}>لا توجد عوامل خطورة بارزة — ضمن النطاق الآمن.</Text>
            )}
          </View>
        )}

        {/* «مُغيث» response agent — clinical copilot suggestion */}
        <View style={[styles.section, styles.agentSection]}>
          <View style={styles.agentHeader}>
            <View style={styles.agentBadge}>
              <Sparkles color="#b07d12" size={12} />
              <Text style={styles.agentBadgeText}>
                {AGENTS.response.name} · {AGENTS.response.role}
              </Text>
            </View>
            <Stethoscope color="#b07d12" size={18} />
          </View>

          {/* diagnosis */}
          <Text
            style={[
              styles.diagTitle,
              { color: RISK_COLORS[suggestion.diagnosis.severity] },
            ]}
          >
            {suggestion.diagnosis.title}
          </Text>
          <Text style={styles.diagDetail}>{suggestion.diagnosis.detail}</Text>

          {/* treatment */}
          <Text style={styles.agentLabel}>التدبير الموصى به</Text>
          <Text style={styles.agentBody}>{suggestion.treatment}</Text>

          {/* triage questions */}
          <Text style={styles.agentLabel}>أسئلة الفرز</Text>
          {suggestion.questions.map((q) => (
            <View key={q} style={styles.qRow}>
              <Text style={styles.qText}>{q}</Text>
              <HelpCircle color="#9a917f" size={13} />
            </View>
          ))}

          {/* field brief */}
          <Text style={styles.agentLabel}>موجز للفريق الميداني</Text>
          {suggestion.fieldBrief.map((b) => (
            <View key={b} style={styles.briefRow}>
              <Text style={styles.briefText}>{b}</Text>
              <View style={styles.bullet} />
            </View>
          ))}

          <Text style={styles.agentNote}>
            اقتراح آلي — يعتمده الكادر الطبي قبل التنفيذ
          </Text>
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
        {/* nearest institution with a free bed — routes critical cases to a hospital */}
        <TouchableOpacity
          style={styles.hospitalButton}
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: "/institutions",
              params: { needsHospital: needsHospital ? "1" : "0" },
            })
          }
        >
          <Building2 color="#3d3424" size={16} />
          <Text style={styles.hospitalText}>أقرب منشأة: {hospital.name}</Text>
          <View style={styles.hospitalEta}>
            <Clock color="#6b6457" size={12} />
            <Text style={styles.hospitalEtaText}>~{hospital.etaMin} د</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={styles.locationButton}
            activeOpacity={0.85}
            onPress={() =>
              router.push({ pathname: "/(tabs)/map", params: { focus: pilgrim.id } })
            }
          >
            <MapPin color="#3d3424" size={18} />
            <Text style={styles.locationText}>الخريطة</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ctaButton}
            activeOpacity={0.85}
            onPress={() => Linking.openURL(`tel:${hospital.contact}`)}
          >
            <Phone color="#fff" size={18} />
            <Text style={styles.ctaText}>اتصال طارئ — الفريق الطبي</Text>
          </TouchableOpacity>
        </View>
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

  // «مُغيث» response agent section
  agentSection: { borderColor: "rgba(176,125,18,0.45)", borderWidth: 1 },
  agentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  agentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(176,125,18,0.12)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  agentBadgeText: { color: "#8a6a2e", fontSize: 11, fontWeight: "800" },
  diagTitle: { fontSize: 15, fontWeight: "800", textAlign: "right", marginTop: 2 },
  diagDetail: { color: "#6b6457", fontSize: 13, lineHeight: 20, textAlign: "right" },
  agentLabel: {
    color: "#9a917f",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
    marginTop: 6,
  },
  agentBody: { color: "#2f2a22", fontSize: 13.5, lineHeight: 21, textAlign: "right" },
  qRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  qText: { color: "#2f2a22", fontSize: 13, textAlign: "right", flexShrink: 1 },
  briefRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  briefText: { color: "#2f2a22", fontSize: 13, textAlign: "right", flexShrink: 1 },
  agentNote: {
    color: "#9a917f",
    fontSize: 11,
    textAlign: "center",
    marginTop: 6,
    fontStyle: "italic",
  },

  // cta
  ctaContainer: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#e6dcc8",
    gap: 10,
  },
  ctaRow: { flexDirection: "row", gap: 10 },
  hospitalButton: {
    backgroundColor: "#fdf8ec",
    borderWidth: 1.5,
    borderColor: "#b07d12",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hospitalText: {
    color: "#3d3424",
    fontSize: 13.5,
    fontWeight: "800",
    flex: 1,
    textAlign: "right",
  },
  hospitalEta: { flexDirection: "row", alignItems: "center", gap: 3 },
  hospitalEtaText: { color: "#6b6457", fontSize: 12, fontWeight: "700" },
  ctaButton: {
    flex: 1,
    backgroundColor: "#c2410c",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: { color: "#fff", fontSize: 13.5, fontWeight: "700" },
  locationButton: {
    backgroundColor: "#e6dcc8",
    borderWidth: 1,
    borderColor: "#cbbfa8",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  locationText: { color: "#3d3424", fontSize: 14, fontWeight: "700" },
});
