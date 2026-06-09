import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Phone, PhoneIncoming, Sparkles, Languages } from "lucide-react-native";

interface CallRecord {
  id: string;
  name: string;
  flag: string;
  language: string;
  location: string;
  duration: string;
  ago: string;
  outcome: "answered" | "missed";
}

const RECENTS: CallRecord[] = [
  {
    id: "c1",
    name: "أحمد يلماز قايا",
    flag: "🇹🇷",
    language: "تركية",
    location: "المسجد الحرام",
    duration: "03:42",
    ago: "منذ 12 د",
    outcome: "answered",
  },
  {
    id: "c2",
    name: "خديجة بنت أحمد",
    flag: "🇲🇾",
    language: "ماليزية",
    location: "منى",
    duration: "01:18",
    ago: "منذ 38 د",
    outcome: "answered",
  },
  {
    id: "c3",
    name: "علي حسن رضا",
    flag: "🇵🇰",
    language: "أردية",
    location: "عرفات",
    duration: "—",
    ago: "منذ ساعة",
    outcome: "missed",
  },
  {
    id: "c4",
    name: "محمد إبراهيم الفارسي",
    flag: "🇪🇬",
    language: "عربية",
    location: "المسجد الحرام",
    duration: "05:21",
    ago: "منذ ساعتين",
    outcome: "answered",
  },
];

export default function Support() {
  const router = useRouter();

  const startIncoming = () => {
    router.push({ pathname: "/call", params: {} });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* header */}
      <View style={styles.header}>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>الخط الساخن نشط</Text>
        </View>
        <Text style={styles.headerTitle}>الخط الساخن</Text>
      </View>

      {/* hero card */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Languages color="#f97316" size={28} />
          </View>
          <Text style={styles.heroTitle}>ترجمة فورية بالذكاء الاصطناعي</Text>
          <Text style={styles.heroBody}>
            استقبل مكالمات الحجاج بأي لغة. يُترجم المساعد كلامهم إلى العربية مباشرة،
            وتُترجم ردودك المكتوبة إلى لغتهم ويُقرأها لهم.
          </Text>
          <View style={styles.langChips}>
            {["🇮🇩 إندونيسية", "🇹🇷 تركية", "🇵🇰 أردية", "🇲🇾 ماليزية", "+20"].map(
              (chip) => (
                <View key={chip} style={styles.langChip}>
                  <Text style={styles.langChipText}>{chip}</Text>
                </View>
              ),
            )}
          </View>
        </View>

        {/* simulate button (demo) */}
        <TouchableOpacity
          style={styles.simBtn}
          onPress={startIncoming}
          activeOpacity={0.85}
        >
          <View style={styles.simBtnIcon}>
            <PhoneIncoming color="#fff" size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.simBtnTitle}>محاكاة مكالمة واردة</Text>
            <Text style={styles.simBtnSub}>تجربة المساعد المترجم</Text>
          </View>
          <Sparkles color="#fdba74" size={16} />
        </TouchableOpacity>

        {/* recents */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionCount}>{RECENTS.length}</Text>
          <Text style={styles.sectionTitle}>المكالمات الأخيرة</Text>
        </View>

        {RECENTS.map((c) => (
          <View key={c.id} style={styles.callRow}>
            <View
              style={[
                styles.callIcon,
                c.outcome === "missed" && styles.callIconMissed,
              ]}
            >
              <Phone
                color={c.outcome === "missed" ? "#ef4444" : "#22c55e"}
                size={16}
              />
            </View>
            <View style={styles.callMeta}>
              <Text style={styles.callDuration}>
                {c.outcome === "missed" ? "فائتة" : c.duration}
              </Text>
              <Text style={styles.callAgo}>{c.ago}</Text>
            </View>
            <View style={styles.callBody}>
              <Text style={styles.callName}>{c.name}</Text>
              <Text style={styles.callSub}>
                {c.location} · {c.language}
              </Text>
            </View>
            <Text style={styles.callFlag}>{c.flag}</Text>
          </View>
        ))}
      </ScrollView>
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
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0f1f12",
    borderWidth: 1,
    borderColor: "#14532d",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22c55e" },
  statusText: { color: "#86efac", fontSize: 11, fontWeight: "700" },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 32 },

  hero: {
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 16,
    padding: 18,
    gap: 10,
    alignItems: "flex-end",
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#1c1410",
    borderWidth: 1,
    borderColor: "#7c2d12",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { color: "#fff", fontSize: 18, fontWeight: "800", textAlign: "right" },
  heroBody: {
    color: "#9ca3af",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "right",
  },
  langChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
    alignSelf: "stretch",
    justifyContent: "flex-end",
  },
  langChip: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  langChipText: { color: "#e5e7eb", fontSize: 11, fontWeight: "600" },

  simBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#7c2d12",
    borderRadius: 14,
    padding: 14,
  },
  simBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#9a3412",
    alignItems: "center",
    justifyContent: "center",
  },
  simBtnTitle: { color: "#fff", fontSize: 15, fontWeight: "800", textAlign: "right" },
  simBtnSub: { color: "#fed7aa", fontSize: 12, textAlign: "right" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  sectionTitle: { color: "#fff", fontSize: 15, fontWeight: "800" },
  sectionCount: { color: "#6b7280", fontSize: 12 },

  callRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#1a1a1a",
    borderRadius: 12,
  },
  callIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0f1f12",
    borderWidth: 1,
    borderColor: "#14532d",
    alignItems: "center",
    justifyContent: "center",
  },
  callIconMissed: { backgroundColor: "#1f1010", borderColor: "#7f1d1d" },
  callMeta: { alignItems: "center" },
  callDuration: { color: "#e5e7eb", fontSize: 12, fontWeight: "700", fontVariant: ["tabular-nums"] },
  callAgo: { color: "#6b7280", fontSize: 11 },
  callBody: { flex: 1, alignItems: "flex-end" },
  callName: { color: "#fff", fontSize: 14, fontWeight: "700", textAlign: "right" },
  callSub: { color: "#6b7280", fontSize: 12, textAlign: "right" },
  callFlag: { fontSize: 22 },
});
