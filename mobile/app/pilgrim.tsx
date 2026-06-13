import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Bell,
  Phone,
  MessageSquare,
  Check,
  Repeat,
  X,
  ChevronLeft,
  MapPin,
  PlusCircle,
  Sun,
  HeartPulse,
  Sparkles,
  Stethoscope,
} from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import { RISK_COLORS, type RiskLevel } from "@/types";
import HealthCard from "@/components/HealthCard";
import { getResponseSuggestion, AGENTS } from "@/lib/agents";
import type { ScannedPilgrim } from "@/lib/scanned-store";

I18nManager.forceRTL(true);

// ─── design tokens (Sannad — neo-kinpaku, warm-paper / Nusuk light) ─────────
const SN = {
  bg: "#f7f0e1",
  bgDeep: "#f1ead9",
  bgRaised: "#fdf8ec",
  graphite: "#e6dcc8",
  graphite2: "#d8ccb2",
  gold: "#b07d12",
  goldDeep: "#8a6a2e",
  goldInk: "#3a2c08", // dark ink for text on gold fills
  teal: "#1f8a80",
  red: "#b5432b",
  fg1: "#3d3424",
  fg: "#2a2620",
  fg2: "#6b6457",
  fg3: "#9a917f",
  rule: "rgba(60,50,30,0.14)",
  ruleG: "rgba(176,125,18,0.45)",
  redFill: "rgba(181,67,43,0.08)",
  redRule: "rgba(181,67,43,0.28)",
  goldFill: "rgba(176,125,18,0.10)",
  goldSoft: "rgba(176,125,18,0.08)",
  tealFill: "rgba(31,138,128,0.12)",
  tealRule: "rgba(31,138,128,0.30)",
};

// ─── mock data (replace with Supabase queries later) ───────────────────────
type MedStatus = "taken" | "now" | "upcoming";
interface Med {
  time: string;
  name: string;
  dose: string;
  status: MedStatus;
}

const INITIAL_MEDS: Med[] = [
  { time: "٠٨:٠٠", name: "ميتفورمين", dose: "1000mg", status: "taken" },
  { time: "١٤:٠٠", name: "ميتوبرولول", dose: "50mg", status: "now" },
  { time: "٢٠:٠٠", name: "ليسينوبريل", dose: "10mg", status: "upcoming" },
];

const VITALS = [
  { label: "النبض", value: "72", unit: "bpm" },
  { label: "الضغط", value: "128/82", unit: "mmHg" },
  { label: "الحرارة", value: "37.0", unit: "°م" },
];

// The signed-in pilgrim. Matches a bracelet record so the medical team's
// scanner resolves this exact QR to the full health profile.
const ME = {
  id: "3C27343B9F43",
  initials: "RS",
  name: "Rachel Smith",
  identityId: "2419875036",
  age: 85,
  nationality: "Solomon Islands",
  bloodType: "O+",
  risk: "red" as RiskLevel,
  conditions: ["السكري", "ارتفاع ضغط الدم", "مرض تنفسي مزمن"],
};

// QR carries just the ID, exactly the shape the scanner's parsePayloadId reads.
const QR_PAYLOAD = JSON.stringify({ id: ME.id });

// «مُغيث» reads the pilgrim's own vitals + conditions and produces a live
// assessment + guidance addressed to them — same agent the field team sees.
const NOW = new Date().toISOString();
const ME_ENTRY: ScannedPilgrim = {
  pilgrim: {
    id: ME.id,
    full_name: ME.name,
    age: ME.age,
    nationality: ME.nationality,
    passport_number: null,
    has_diabetes: ME.conditions.includes("السكري"),
    has_hypertension: ME.conditions.includes("ارتفاع ضغط الدم"),
    has_heart_condition: ME.conditions.some((c) => c.includes("قلب")),
    medications: INITIAL_MEDS.map((m) => m.name),
    created_at: NOW,
  },
  vitals: {
    id: "v-me",
    pilgrim_id: ME.id,
    heart_rate: 72,
    temperature: 37.0,
    oxygen_level: 97,
    recorded_at: NOW,
  },
  risk: { id: "r-me", pilgrim_id: ME.id, risk_level: ME.risk, score: 0.6, assessed_at: NOW },
  scannedAt: NOW,
};
const ME_SUGGESTION = getResponseSuggestion(ME_ENTRY);

const RISK_LABEL: Record<RiskLevel, string> = {
  red: "مرتفع",
  yellow: "متوسط",
  green: "منخفض",
};

const TABS = [
  { id: "today", ar: "اليوم" },
  { id: "health", ar: "بطاقتي" },
  { id: "help", ar: "الطوارئ" },
] as const;
type TabId = (typeof TABS)[number]["id"];

// ─── Tab: اليوم — Today ─────────────────────────────────────────────────────

function TabToday({
  meds,
  onTake,
}: {
  meds: Med[];
  onTake: (idx: number) => void;
}) {
  const taken = meds.filter((m) => m.status === "taken").length;

  return (
    <ScrollView
      style={styles.tabScroll}
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
    >
      {/* «مُغيث» — health assistant: live assessment + guidance for the pilgrim */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.agentRole}>{AGENTS.response.role}</Text>
          <View style={styles.agentNameRow}>
            <Text style={styles.cardTitle}>{AGENTS.response.name}</Text>
            <Sparkles color={SN.gold} size={14} strokeWidth={2} />
          </View>
        </View>

        <View style={styles.agentDiagRow}>
          <Stethoscope
            color={RISK_COLORS[ME_SUGGESTION.diagnosis.severity]}
            size={17}
            strokeWidth={1.9}
          />
          <Text
            style={[
              styles.agentDiag,
              { color: RISK_COLORS[ME_SUGGESTION.diagnosis.severity] },
            ]}
          >
            {ME_SUGGESTION.diagnosis.title}
          </Text>
        </View>

        <Text style={styles.agentGuidance}>{ME_SUGGESTION.guidance}</Text>

        <Text style={styles.agentNote}>مساعدك الصحي — يتابع حالتك ويُنبّه الفريق عند الحاجة</Text>
      </View>

      {/* medications */}
      <View style={[styles.card, styles.cardFlush]}>
        <View style={styles.cardHeader}>
          <Text style={styles.medsCount}>
            {taken}/{meds.length} تم
          </Text>
          <Text style={styles.cardTitle}>أدوية اليوم</Text>
        </View>

        {meds.map((m, i) => {
          const isNow = m.status === "now";
          const isTaken = m.status === "taken";
          return (
            <View
              key={m.name}
              style={[
                styles.medRow,
                i > 0 && styles.medDivider,
                isNow && styles.medRowNow,
              ]}
            >
              {isTaken && (
                <View style={styles.medCheck}>
                  <Check color={SN.teal} size={11} strokeWidth={2.6} />
                </View>
              )}
              {isNow && (
                <TouchableOpacity
                  style={styles.medNowBtn}
                  activeOpacity={0.8}
                  onPress={() => onTake(i)}
                >
                  <Text style={styles.medNowBtnText}>أخذتها</Text>
                </TouchableOpacity>
              )}
              {m.status === "upcoming" && (
                <Text style={styles.medUpcoming}>قادم</Text>
              )}
              <View style={styles.medNameWrap}>
                <Text style={[styles.medName, isTaken && styles.medNameTaken]}>
                  {m.name}
                </Text>
                <Text style={styles.medDose}>{m.dose}</Text>
              </View>
              <Text style={[styles.medTime, isTaken && { color: SN.fg3 }]}>
                {m.time}
              </Text>
            </View>
          );
        })}
      </View>

      {/* weather advisory */}
      <View style={styles.advisory}>
        <Text style={styles.advisoryText}>
          الحرارة ٤٤°م — تجنّب الشمس بين ١١ و٣
        </Text>
        <Sun color={SN.fg3} size={15} strokeWidth={1.7} />
      </View>
    </ScrollView>
  );
}

// ─── Tab: صحتي — Health ─────────────────────────────────────────────────────

function TabHealth() {
  const [open, setOpen] = useState(false);
  const risk = RISK_COLORS[ME.risk];

  return (
    <ScrollView
      style={styles.tabScroll}
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
    >
      {/* identity — Nusuk health card (ported from the card/ Vite design) */}
      <TouchableOpacity activeOpacity={0.9} onPress={() => setOpen(true)}>
        <HealthCard
          name={ME.name}
          nationality={ME.nationality}
          initials={ME.initials}
          risk={ME.risk}
          qrValue={QR_PAYLOAD}
          fields={[
            { labelEn: "PILGRIM ID", labelAr: "رقم الحاج", value: ME.id },
            { labelEn: "IDENTITY NO.", labelAr: "رقم الهوية", value: ME.identityId, align: "center" },
            { labelEn: "AGE", labelAr: "العمر", value: `${ME.age} yrs` },
            { labelEn: "BLOOD TYPE", labelAr: "فصيلة الدم", value: ME.bloodType, align: "center" },
          ]}
        />
        <Text style={styles.cardTapHint}>اضغط لعرض الرمز للفريق الطبي</Text>
      </TouchableOpacity>

      {/* vitals */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.vitalsTime}>قبل ساعتين</Text>
          <Text style={styles.cardTitle}>العلامات الحيوية</Text>
        </View>
        <View style={styles.vitalsRow}>
          {VITALS.map((v) => (
            <View key={v.label} style={styles.vitalItem}>
              <View style={styles.vitalValueRow}>
                <Text style={styles.vitalValue}>{v.value}</Text>
                <Text style={styles.vitalUnit}>{v.unit}</Text>
              </View>
              <Text style={styles.vitalLabel}>{v.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* chronic conditions */}
      <View style={[styles.card, styles.cardFlush]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>الأمراض المزمنة</Text>
        </View>
        {ME.conditions.map((c, i) => (
          <View key={c} style={[styles.condRow, i > 0 && styles.medDivider]}>
            <Text style={styles.condText}>{c}</Text>
            <View style={styles.condDot} />
          </View>
        ))}
      </View>

      <QrModal open={open} onClose={() => setOpen(false)} risk={risk} />
    </ScrollView>
  );
}

function QrModal({
  open,
  onClose,
  risk,
}: {
  open: boolean;
  onClose: () => void;
  risk: string;
}) {
  return (
    <Modal
      visible={open}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.qrSheet}>
          <TouchableOpacity
            style={styles.qrClose}
            onPress={onClose}
            hitSlop={12}
            activeOpacity={0.7}
          >
            <X color={SN.fg2} size={22} />
          </TouchableOpacity>

          <Text style={styles.qrSheetLabel}>بطاقتي الصحية</Text>
          <Text style={styles.qrSheetName}>{ME.name}</Text>

          <View style={styles.qrBig}>
            <QRCode value={QR_PAYLOAD} size={236} backgroundColor="#ffffff" color="#0d0d0d" />
          </View>

          <View
            style={[
              styles.riskBadge,
              { borderColor: risk, backgroundColor: `${risk}1A`, marginTop: 2 },
            ]}
          >
            <Text style={[styles.riskBadgeText, { color: risk }]}>
              مستوى الخطورة: {RISK_LABEL[ME.risk]}
            </Text>
          </View>

          <Text style={styles.qrSheetHint}>
            اعرض هذا الرمز للفريق الطبي للوصول الفوري لملفك الصحي الكامل
          </Text>
          <Text style={styles.qrSheetCode}>{ME.id}</Text>
        </View>
      </View>
    </Modal>
  );
}

function NotifModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      visible={open}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.notifSheet}>
          <TouchableOpacity
            style={styles.qrClose}
            onPress={onClose}
            hitSlop={12}
            activeOpacity={0.7}
          >
            <X color={SN.fg2} size={22} />
          </TouchableOpacity>

          <View style={styles.notifIcon}>
            <HeartPulse color={SN.red} size={26} strokeWidth={2} />
          </View>
          <Text style={styles.notifLabel}>تنبيه صحّي</Text>
          <Text style={styles.notifTitle}>نبضك ١١٣ نبضة/الدقيقة</Text>
          <Text style={styles.notifBody}>
            ضربات قلبك مرتفعة قليلاً. اجلس واسترِح واشرب بعض الماء.
          </Text>

          <TouchableOpacity style={styles.notifBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.notifBtnText}>حسنًا</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Tab: الطوارئ — Help / Emergency ────────────────────────────────────────

function TabHelp({ onCall, onChat }: { onCall: () => void; onChat: () => void }) {
  return (
    <ScrollView
      style={styles.tabScroll}
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 937 hotline */}
      <View style={styles.card}>
        <View style={styles.hotlineTop}>
          <Text style={styles.hotlineDigits}>937</Text>
          <View style={styles.hotlineInfo}>
            <Text style={styles.hotlineTag}>الخط الساخن</Text>
            <Text style={styles.hotlineTitle}>طوارئ صحية للحجاج</Text>
            <Text style={styles.hotlineSub}>مترجم فوري · 24/7 · مجاني</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.callBtn} activeOpacity={0.85} onPress={onCall}>
          <Phone color="#f7f7f5" size={18} fill="#f7f7f5" />
          <Text style={styles.callBtnText}>اتصل الآن</Text>
        </TouchableOpacity>
      </View>

      {/* quick actions */}
      <ActionRow
        Icon={MessageSquare}
        label="دردشة مع ممرض"
        sub="استجابة خلال دقائق"
        onPress={onChat}
      />
      <ActionRow
        Icon={MapPin}
        label="أقرب مركز صحي"
        sub="مركز منى — ٣٢٠ م"
      />
      <ActionRow
        Icon={PlusCircle}
        label="إسعاف إلى موقعي"
        sub="يستخدم موقعك الحالي"
      />
    </ScrollView>
  );
}

function ActionRow({
  Icon,
  label,
  sub,
  onPress,
}: {
  Icon: typeof MessageSquare;
  label: string;
  sub: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionRow} activeOpacity={0.75} onPress={onPress}>
      <ChevronLeft color={SN.fg3} size={15} strokeWidth={1.8} />
      <View style={styles.actionText}>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionSub}>{sub}</Text>
      </View>
      <View style={styles.actionIcon}>
        <Icon color={SN.gold} size={17} strokeWidth={1.7} />
      </View>
    </TouchableOpacity>
  );
}

// ─── screen ────────────────────────────────────────────────────────────────

export default function PilgrimHome() {
  const router = useRouter();
  const [meds, setMeds] = useState<Med[]>(INITIAL_MEDS);
  const [tab, setTab] = useState<TabId>("today");
  const [notifOpen, setNotifOpen] = useState(false);

  const markTaken = (idx: number) =>
    setMeds((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, status: "taken" } : m)),
    );

  const switchToCoordinator = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatar}
          activeOpacity={0.7}
          onPress={switchToCoordinator}
        >
          <Text style={styles.avatarText}>م.أ</Text>
          <View style={styles.avatarBadge}>
            <Repeat color={SN.bg} size={9} strokeWidth={2.6} />
          </View>
        </TouchableOpacity>
        <Text style={styles.wordmark}>سند</Text>
        <TouchableOpacity
          style={styles.bellWrap}
          activeOpacity={0.7}
          onPress={() => setNotifOpen(true)}
          hitSlop={10}
        >
          <Bell color={SN.fg3} size={19} strokeWidth={1.6} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      {/* greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingEyebrow}>السلام عليكم</Text>
        <Text style={styles.greetingName}>محمد، تقبّل الله حجّك</Text>
        <Text style={styles.greetingSub}>اليوم الثالث · يوم النحر · منى</Text>
      </View>

      {/* segmented tabs */}
      <View style={styles.tabBarWrap}>
        <View style={styles.tabBar}>
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                activeOpacity={0.8}
                onPress={() => setTab(t.id)}
              >
                <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                  {t.ar}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* tab content */}
      {tab === "today" && <TabToday meds={meds} onTake={markTaken} />}
      {tab === "health" && <TabHealth />}
      {tab === "help" && (
        <TabHelp
          onCall={() => router.push("/call")}
          onChat={() => router.push("/chat")}
        />
      )}

      <NotifModal open={notifOpen} onClose={() => setNotifOpen(false)} />
    </SafeAreaView>
  );
}

// ─── styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SN.bg },

  // header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: SN.graphite2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 10, color: SN.fg3, fontWeight: "600" },
  avatarBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: SN.gold,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: SN.bg,
  },
  wordmark: { fontSize: 24, fontWeight: "700", letterSpacing: 2, color: SN.gold },

  // greeting
  greeting: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 18, alignItems: "flex-end" },
  greetingEyebrow: { fontSize: 11, color: SN.fg3, letterSpacing: 2, marginBottom: 9 },
  greetingName: { fontSize: 23, fontWeight: "700", color: SN.fg1, lineHeight: 30 },
  greetingSub: { fontSize: 12.5, color: SN.fg3, marginTop: 7, textAlign: "right" },

  // segmented tabs
  tabBarWrap: { paddingHorizontal: 24, paddingBottom: 16 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: SN.bgRaised,
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: SN.rule,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnActive: { backgroundColor: SN.gold },
  tabBtnText: { fontSize: 13, fontWeight: "500", color: SN.fg2 },
  tabBtnTextActive: { color: SN.goldInk, fontWeight: "800" },

  // tab scroll
  tabScroll: { flex: 1 },
  tabContent: { paddingHorizontal: 24, paddingBottom: 28 },

  // generic card
  card: {
    backgroundColor: SN.bgRaised,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SN.rule,
    padding: 20,
    marginBottom: 14,
  },
  cardFlush: { padding: 0, overflow: "hidden" },
  cardHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardHeadText: { alignItems: "flex-end" },
  cardTitle: { fontSize: 14, fontWeight: "700", color: SN.fg1 },
  cardTapHint: { color: SN.fg3, fontSize: 11, textAlign: "center", marginTop: 8 },

  // «مُغيث» assistant card
  agentRole: { color: SN.fg3, fontSize: 11, fontWeight: "600" },
  agentNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  agentDiagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 7,
    marginTop: 12,
  },
  agentDiag: { fontSize: 15, fontWeight: "800", textAlign: "right", flexShrink: 1 },
  agentGuidance: {
    color: SN.fg2,
    fontSize: 13,
    lineHeight: 21,
    textAlign: "right",
    marginTop: 8,
  },
  agentNote: {
    color: SN.fg3,
    fontSize: 11,
    textAlign: "right",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: SN.rule,
  },
  cardSub: { fontSize: 11.5, color: SN.fg3, marginTop: 4, textAlign: "right" },

  // hydration
  hydroNumber: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  hydroDrunk: { fontSize: 26, fontWeight: "800", color: SN.gold, letterSpacing: -0.5 },
  hydroGoal: { fontSize: 13, color: SN.fg3 },
  hydroBars: { flexDirection: "row", gap: 6 },
  hydroBar: { flex: 1, height: 8, borderRadius: 4 },

  // meds
  medsCount: { fontSize: 11.5, color: SN.fg3, letterSpacing: 0.3 },
  medRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  medRowNow: { backgroundColor: SN.goldSoft },
  medDivider: { borderTopWidth: 1, borderTopColor: SN.rule },
  medNameWrap: { flex: 1, alignItems: "flex-end" },
  medName: { fontSize: 13.5, fontWeight: "700", color: SN.fg, textAlign: "right" },
  medNameTaken: { color: SN.fg3, textDecorationLine: "line-through" },
  medDose: { fontSize: 11, color: SN.fg3, marginTop: 2 },
  medTime: { fontSize: 14, fontWeight: "700", color: SN.fg1, minWidth: 48, textAlign: "left" },
  medCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: SN.tealFill,
    alignItems: "center",
    justifyContent: "center",
  },
  medNowBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: SN.gold,
    borderRadius: 999,
  },
  medNowBtnText: { color: SN.goldInk, fontSize: 12, fontWeight: "800" },
  medUpcoming: { fontSize: 11.5, color: SN.fg3 },

  // advisory
  advisory: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  advisoryText: { fontSize: 11.5, color: SN.fg3, lineHeight: 18 },

  // identity card
  idTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  idNameWrap: { flex: 1, alignItems: "flex-end" },
  idCardLabel: { color: SN.fg3, fontSize: 10.5, fontWeight: "700", letterSpacing: 1.4, marginBottom: 8 },
  idName: { color: SN.fg1, fontSize: 17, fontWeight: "700", textAlign: "right" },
  idMeta: { color: SN.fg3, fontSize: 12, marginTop: 5, textAlign: "right" },
  riskBadge: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  riskBadgeText: { fontSize: 11, fontWeight: "800" },
  idDivider: { height: 1, backgroundColor: SN.rule, marginVertical: 16 },
  idBottomRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  idQrThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  idBottomText: { flex: 1, alignItems: "flex-end" },
  idCode: { color: SN.fg1, fontSize: 12.5, fontWeight: "700", letterSpacing: 0.5 },
  idHintRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
  idCardHint: { color: SN.fg3, fontSize: 11, textAlign: "right" },

  // vitals
  vitalsTime: { fontSize: 10.5, color: SN.fg3, letterSpacing: 0.5 },
  vitalsRow: { flexDirection: "row", gap: 16 },
  vitalItem: { flex: 1, alignItems: "flex-end" },
  vitalValueRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  vitalValue: { fontSize: 19, fontWeight: "800", color: SN.fg1, letterSpacing: -0.5 },
  vitalUnit: { fontSize: 10, color: SN.fg3 },
  vitalLabel: { fontSize: 11, color: SN.fg3, marginTop: 6 },

  // conditions
  condRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  condText: { fontSize: 13, color: SN.fg, textAlign: "right" },
  condDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: SN.goldDeep },

  // hotline
  hotlineTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  hotlineInfo: { flex: 1, alignItems: "flex-end" },
  hotlineTag: { fontSize: 10.5, color: SN.fg3, fontWeight: "700", letterSpacing: 1.6, marginBottom: 8 },
  hotlineTitle: { fontSize: 17, fontWeight: "700", color: SN.fg1 },
  hotlineSub: { fontSize: 11.5, color: SN.fg3, marginTop: 6, textAlign: "right" },
  hotlineDigits: { fontSize: 32, fontWeight: "800", color: SN.fg1, letterSpacing: 1, marginRight: 14 },
  callBtn: {
    backgroundColor: SN.red,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  callBtnText: { fontSize: 15, fontWeight: "800", color: "#f7f7f5", letterSpacing: 0.2 },

  // action rows
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: SN.bgRaised,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SN.rule,
    paddingHorizontal: 18,
    paddingVertical: 15,
    marginBottom: 10,
  },
  actionText: { flex: 1, alignItems: "flex-end" },
  actionLabel: { fontSize: 13.5, fontWeight: "700", color: SN.fg1 },
  actionSub: { fontSize: 11.5, color: SN.fg3, marginTop: 3, textAlign: "right" },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: SN.goldSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  // QR fullscreen modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.82)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  qrSheet: {
    width: "100%",
    backgroundColor: SN.bgRaised,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: SN.rule,
    paddingTop: 26,
    paddingBottom: 24,
    paddingHorizontal: 22,
    alignItems: "center",
  },
  qrClose: { position: "absolute", top: 14, right: 14, padding: 4, zIndex: 2 },
  qrSheetLabel: { color: SN.gold, fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  qrSheetName: {
    color: SN.fg1,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 18,
    textAlign: "center",
  },
  qrBig: { padding: 16, backgroundColor: "#ffffff", borderRadius: 16, marginBottom: 16 },
  qrSheetHint: {
    color: SN.fg2,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 14,
    paddingHorizontal: 6,
  },
  qrSheetCode: { color: SN.fg3, fontSize: 13, fontWeight: "700", letterSpacing: 0.6, marginTop: 10 },

  // bell + notification
  bellWrap: { padding: 2 },
  bellDot: {
    position: "absolute",
    top: 1,
    right: 1,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: SN.red,
    borderWidth: 1.5,
    borderColor: SN.bg,
  },
  notifSheet: {
    width: "100%",
    backgroundColor: SN.bgRaised,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: SN.rule,
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  notifIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: SN.redFill,
    borderWidth: 1,
    borderColor: SN.redRule,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  notifLabel: { color: SN.red, fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  notifTitle: {
    color: SN.fg1,
    fontSize: 19,
    fontWeight: "800",
    marginTop: 5,
    textAlign: "center",
  },
  notifBody: {
    color: SN.fg2,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  notifBtn: {
    marginTop: 20,
    alignSelf: "stretch",
    backgroundColor: SN.gold,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  notifBtnText: { color: SN.goldInk, fontSize: 15, fontWeight: "800", letterSpacing: 0.2 },
});
