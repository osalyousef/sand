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
import { useState } from "react";
import {
  Bell,
  Phone,
  MessageSquare,
  Check,
  Repeat,
  Droplet,
} from "lucide-react-native";

I18nManager.forceRTL(true);

// ─── design tokens (Sannad — neo-kinpaku, oklch → hex) ─────────────────────
const SN = {
  bg: "#0f0f0d",
  bgDeep: "#090908",
  bgRaised: "#171715",
  graphite: "#1f1f1b",
  graphite2: "#2a2a24",
  gold: "#eca31c",
  goldDeep: "#9c7c44",
  teal: "#34afa4",
  red: "#c0563e",
  fg1: "#e6e6e6",
  fg: "#dcdcdc",
  fg2: "#b0b0b0",
  fg3: "#949494",
  rule: "rgba(200,200,200,0.16)",
  ruleG: "rgba(190,160,90,0.45)",
  redFill: "rgba(192,86,62,0.08)",
  redRule: "rgba(192,86,62,0.25)",
  goldFill: "rgba(236,163,28,0.07)",
};

// ─── mock data (replace with Supabase queries later) ───────────────────────
type MedStatus = "taken" | "now" | "upcoming";
interface Med {
  time: string;
  name: string;
  status: MedStatus;
}

const INITIAL_MEDS: Med[] = [
  { time: "٠٨:٠٠", name: "ميتفورمين 1000mg", status: "taken" },
  { time: "١٤:٠٠", name: "ميتوبرولول 50mg", status: "now" },
  { time: "٢٠:٠٠", name: "ليسينوبريل 10mg", status: "upcoming" },
];

// ─── components ────────────────────────────────────────────────────────────

function Hotline({ onCall }: { onCall: () => void }) {
  return (
    <View style={styles.hotline}>
      <View style={styles.hotlineTop}>
        <View style={styles.hotlineInfo}>
          <View style={styles.hotlineTag}>
            <Text style={styles.hotlineTagText}>الخط الساخن</Text>
            <View style={styles.hotlineDot} />
          </View>
          <Text style={styles.hotlineTitle}>طوارئ صحية للحجاج</Text>
          <Text style={styles.hotlineSub}>مترجم فوري · متاح 24/7 · مجاني</Text>
        </View>
        <View style={styles.hotlineNumber}>
          <Text style={styles.hotlineDigits}>937</Text>
          <Text style={styles.hotlineCallLabel}>اتصل</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.callBtn} activeOpacity={0.85} onPress={onCall}>
        <Phone color="#f7f7f5" size={19} fill="#f7f7f5" />
        <Text style={styles.callBtnText}>اتصل الآن</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.chatAction} activeOpacity={0.7}>
        <MessageSquare color={SN.red} size={17} strokeWidth={1.7} />
        <Text style={styles.actionLabel}>دردشة</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── screen ────────────────────────────────────────────────────────────────

export default function PilgrimHome() {
  const router = useRouter();
  const [meds, setMeds] = useState<Med[]>(INITIAL_MEDS);

  const taken = meds.filter((m) => m.status === "taken").length;

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
        <Bell color={SN.fg3} size={19} strokeWidth={1.6} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingEyebrow}>السلام عليكم</Text>
          <Text style={styles.greetingName}>محمد، تقبّل الله حجّك</Text>
        </View>

        {/* hotline — primary */}
        <Hotline onCall={() => router.push("/call")} />

        {/* hydration reminder */}
        <View style={styles.hydrationCard}>
          <Droplet color={SN.gold} size={20} strokeWidth={1.6} />
          <View style={styles.hydrationCardText}>
            <Text style={styles.hydrationCardTitle}>اشرب الماء بانتظام</Text>
            <Text style={styles.hydrationCardSub}>
              لا تنسَ شرب الماء والبقاء في مكان بارد
            </Text>
          </View>
        </View>

        {/* medications */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>أدوية اليوم</Text>
          <Text style={styles.medsCount}>
            {taken}/{meds.length} تم
          </Text>
        </View>
        <View>
          {meds.map((m, i) => {
            const isNow = m.status === "now";
            const isTaken = m.status === "taken";
            return (
              <View
                key={m.name}
                style={[
                  styles.medRow,
                  i < meds.length - 1 && styles.medDivider,
                  isNow && styles.medRowNow,
                ]}
              >
                <View style={styles.medTimeWrap}>
                  <Text
                    style={[
                      styles.medTime,
                      isTaken && { color: SN.fg3 },
                      isNow && { color: SN.gold },
                    ]}
                  >
                    {m.time}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.medName,
                    isTaken && styles.medNameTaken,
                  ]}
                >
                  {m.name}
                </Text>
                {isTaken && (
                  <View style={styles.medTakenTag}>
                    <Check color={SN.teal} size={11} strokeWidth={2.5} />
                    <Text style={styles.medTakenText}>تم</Text>
                  </View>
                )}
                {isNow && (
                  <TouchableOpacity
                    style={styles.medNowBtn}
                    activeOpacity={0.8}
                    onPress={() => markTaken(i)}
                  >
                    <Text style={styles.medNowBtnText}>أخذتها</Text>
                  </TouchableOpacity>
                )}
                {m.status === "upcoming" && (
                  <Text style={styles.medUpcoming}>قادم</Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
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
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: SN.rule,
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
  wordmark: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 2,
    color: SN.gold,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 8 },

  // greeting
  greeting: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: SN.rule,
    alignItems: "flex-end",
  },
  greetingEyebrow: {
    fontSize: 11,
    color: SN.fg3,
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  greetingName: { fontSize: 19, fontWeight: "700", color: SN.fg1, lineHeight: 24 },

  // hotline
  hotline: {
    borderTopWidth: 3,
    borderTopColor: SN.red,
    backgroundColor: SN.redFill,
    borderBottomWidth: 1,
    borderBottomColor: SN.redRule,
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  hotlineTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  hotlineInfo: { flex: 1, alignItems: "flex-end" },
  hotlineTag: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 7 },
  hotlineTagText: {
    fontSize: 10,
    color: SN.red,
    fontWeight: "700",
    letterSpacing: 1.6,
  },
  hotlineDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: SN.red },
  hotlineTitle: { fontSize: 16, fontWeight: "700", color: SN.fg1 },
  hotlineSub: { fontSize: 12, color: SN.fg2, marginTop: 5 },
  hotlineNumber: { alignItems: "center", marginLeft: 14 },
  hotlineDigits: {
    fontSize: 34,
    fontWeight: "800",
    color: SN.red,
    letterSpacing: 1,
    lineHeight: 36,
  },
  hotlineCallLabel: { fontSize: 9, color: SN.red, letterSpacing: 1.5, marginTop: 3 },

  callBtn: {
    backgroundColor: SN.red,
    borderRadius: 3,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 11,
  },
  callBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#f7f7f5",
    letterSpacing: 0.2,
  },

  chatAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: SN.redRule,
    paddingTop: 14,
  },
  actionLabel: { fontSize: 12, color: SN.red, fontWeight: "600" },

  // section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 15,
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: SN.ruleG,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: SN.fg1 },

  // hydration reminder
  hydrationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 22,
    paddingVertical: 16,
    backgroundColor: SN.bgRaised,
    borderBottomWidth: 1,
    borderBottomColor: SN.rule,
  },
  hydrationCardText: { flex: 1, alignItems: "flex-end" },
  hydrationCardTitle: { fontSize: 13.5, fontWeight: "700", color: SN.gold },
  hydrationCardSub: { fontSize: 12, color: SN.fg2, marginTop: 4, textAlign: "right" },

  // meds
  medsCount: { fontSize: 11, color: SN.fg3 },
  medRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 14,
    gap: 16,
    borderRightWidth: 2,
    borderRightColor: "transparent",
  },
  medRowNow: { backgroundColor: SN.goldFill, borderRightColor: SN.gold },
  medDivider: { borderBottomWidth: 1, borderBottomColor: SN.rule },
  medTimeWrap: { minWidth: 52 },
  medTime: { fontSize: 15, fontWeight: "700", color: SN.fg1, letterSpacing: 0.3 },
  medName: { flex: 1, fontSize: 13.5, fontWeight: "600", color: SN.fg, textAlign: "right" },
  medNameTaken: { color: SN.fg3, textDecorationLine: "line-through" },
  medTakenTag: { flexDirection: "row", alignItems: "center", gap: 5 },
  medTakenText: { fontSize: 11.5, color: SN.teal, fontWeight: "600" },
  medNowBtn: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    backgroundColor: SN.gold,
    borderRadius: 3,
  },
  medNowBtnText: { color: SN.bgDeep, fontSize: 11.5, fontWeight: "800" },
  medUpcoming: { fontSize: 11.5, color: SN.fg3 },
});
