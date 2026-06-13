import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Siren,
  MapPin,
  Activity,
  Check,
  X,
  Navigation,
  Radio,
  ChevronLeft,
  Sparkles,
  Languages,
  PackageCheck,
  AlertTriangle,
} from "lucide-react-native";
import { RISK_COLORS, type RiskLevel } from "@/types";
import { AGENTS, getPreArrivalBrief } from "@/lib/agents";

interface Dispatch {
  id: string;
  name: string;
  flag: string;
  age: number;
  nationality: string;
  risk: Extract<RiskLevel, "red" | "yellow">;
  zone: string;
  vitals: string;
  reason: string;
  ago: string;
  mapId: string; // map pin to focus on locate
}

const DISPATCHES: Dispatch[] = [
  {
    id: "d1",
    name: "حسين رضا",
    flag: "🇵🇰",
    age: 71,
    nationality: "باكستان",
    risk: "red",
    zone: "منى — مخيم B4",
    vitals: "نبض 128 · حرارة 39.1° · أكسجين 89%",
    reason: "اشتباه إجهاد حراري — هبوط مفاجئ في الأكسجين",
    ago: "الآن",
    mapId: "11",
  },
  {
    id: "d2",
    name: "زينب مالك",
    flag: "🇳🇬",
    age: 66,
    nationality: "نيجيريا",
    risk: "red",
    zone: "عرفات — مسار المشاة",
    vitals: "ضغط 182/108 · نبض 116",
    reason: "ارتفاع حاد في الضغط — الحاجة لم تستجب لاتصال الفريق",
    ago: "منذ 3 د",
    mapId: "16",
  },
  {
    id: "d3",
    name: "طارق منصور",
    flag: "🇪🇬",
    age: 58,
    nationality: "مصر",
    risk: "yellow",
    zone: "عرفات — قرب الخيمة 12",
    vitals: "حرارة 38.4° · نبض 104",
    reason: "علامات جفاف مبكرة — يُنصح بالمتابعة الميدانية",
    ago: "منذ 9 د",
    mapId: "17",
  },
];

export default function DispatchScreen() {
  const router = useRouter();
  const [active, setActive] = useState<Dispatch | null>(null);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});

  const locate = (d: Dispatch) => {
    setActive(null);
    router.push({ pathname: "/(tabs)/map", params: { focus: d.mapId } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* header */}
      <View style={styles.header}>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>غرفة العمليات متصلة</Text>
        </View>
        <Text style={styles.headerTitle}>البلاغات</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* dispatcher banner */}
        <View style={styles.opsCard}>
          <View style={styles.opsIcon}>
            <Radio color="#b07d12" size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.opsTitle}>إيفاد ميداني مباشر</Text>
            <Text style={styles.opsBody}>
              تصلك بلاغات غرفة العمليات بالحالات الخطرة القريبة منك. توجّه إلى
              الموقع وتحقق من الحاج.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionCount}>{DISPATCHES.length} بلاغ</Text>
          <Text style={styles.sectionTitle}>بلاغات نشطة</Text>
        </View>

        {DISPATCHES.map((d) => {
          const color = RISK_COLORS[d.risk];
          const isAccepted = accepted[d.id];
          return (
            <TouchableOpacity
              key={d.id}
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => setActive(d)}
            >
              <View style={[styles.rowIndicator, { backgroundColor: color }]} />
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowAgo}>{d.ago}</Text>
                  <Text style={styles.rowName}>
                    {d.name} {d.flag}
                  </Text>
                </View>
                <View style={styles.rowZoneWrap}>
                  <Text style={styles.rowReason}>{d.reason}</Text>
                  <View style={styles.rowZone}>
                    <Text style={styles.rowZoneText}>{d.zone}</Text>
                    <MapPin color="#6b6457" size={12} />
                  </View>
                </View>
                {isAccepted ? (
                  <View style={styles.enroutePill}>
                    <Text style={styles.enrouteText}>في الطريق</Text>
                    <Navigation color="#22c55e" size={11} />
                  </View>
                ) : (
                  <View style={[styles.newPill, { borderColor: color }]}>
                    <Text style={[styles.newText, { color }]}>بلاغ جديد</Text>
                    <Siren color={color} size={11} />
                  </View>
                )}
              </View>
              <ChevronLeft color="#cbbfa8" size={18} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* detail */}
      <Modal
        visible={!!active}
        animationType="slide"
        transparent
        onRequestClose={() => setActive(null)}
        statusBarTranslucent
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
            <TouchableOpacity
              style={styles.sheetClose}
              onPress={() => setActive(null)}
              hitSlop={12}
            >
              <X color="#6b6457" size={22} />
            </TouchableOpacity>

            {active && (
              <>
                <View
                  style={[
                    styles.sheetTag,
                    {
                      backgroundColor: `${RISK_COLORS[active.risk]}1A`,
                      borderColor: RISK_COLORS[active.risk],
                    },
                  ]}
                >
                  <Text style={[styles.sheetTagText, { color: RISK_COLORS[active.risk] }]}>
                    بلاغ من غرفة العمليات
                  </Text>
                  <Siren color={RISK_COLORS[active.risk]} size={13} />
                </View>

                <Text style={styles.sheetName}>
                  {active.name} {active.flag}
                </Text>
                <Text style={styles.sheetMeta}>
                  {active.age} سنة · {active.nationality}
                </Text>

                <View style={styles.sheetMsg}>
                  <Text style={styles.sheetMsgText}>{active.reason}</Text>
                </View>

                <View style={styles.sheetInfoRow}>
                  <Activity color="#b07d12" size={15} />
                  <Text style={styles.sheetInfoText}>{active.vitals}</Text>
                </View>
                <View style={styles.sheetInfoRow}>
                  <MapPin color="#b07d12" size={15} />
                  <Text style={styles.sheetInfoText}>{active.zone}</Text>
                </View>

                {/* «مُهيّئ» pre-arrival prep — appears once the mission is accepted */}
                {accepted[active.id] && <PreArrivalCard dispatch={active} />}

                {/* actions */}
                <TouchableOpacity
                  style={[
                    styles.acceptBtn,
                    accepted[active.id] && styles.acceptBtnDone,
                  ]}
                  activeOpacity={0.85}
                  onPress={() =>
                    setAccepted((p) => ({ ...p, [active.id]: true }))
                  }
                >
                  {accepted[active.id] ? (
                    <>
                      <Check color="#22c55e" size={18} />
                      <Text style={styles.acceptDoneText}>قبلت المهمة — في الطريق</Text>
                    </>
                  ) : (
                    <>
                      <Navigation color="#fdf8ec" size={18} />
                      <Text style={styles.acceptText}>قبول المهمة — أنا في الطريق</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.locateBtn}
                  activeOpacity={0.8}
                  onPress={() => locate(active)}
                >
                  <MapPin color="#b07d12" size={17} />
                  <Text style={styles.locateText}>تحديد الموقع على الخريطة</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// «مُهيّئ» — turns travel time into preparation. From the dispatch it derives
// the pilgrim's language (with a phrase to greet them), an equipment checklist
// tuned to the suspected condition, and critical heads-up flags.
function PreArrivalCard({ dispatch }: { dispatch: Dispatch }) {
  const brief = getPreArrivalBrief({
    nationality: dispatch.nationality,
    reason: dispatch.reason,
    vitals: dispatch.vitals,
    age: dispatch.age,
  });

  return (
    <View style={styles.prepCard}>
      <View style={styles.prepHeader}>
        <Text style={styles.prepRole}>{AGENTS.prearrival.role}</Text>
        <View style={styles.prepNameRow}>
          <Text style={styles.prepName}>{AGENTS.prearrival.name}</Text>
          <Sparkles color="#b07d12" size={14} strokeWidth={2} />
        </View>
      </View>
      <Text style={styles.prepIntro}>جهّز نفسك قبل الوصول — الحالة بين يديك الآن:</Text>

      {/* language + greeting */}
      <View style={styles.prepBlock}>
        <View style={styles.prepBlockHead}>
          <Text style={styles.prepBlockTitle}>لغة الحاج: {brief.language}</Text>
          <Languages color="#1f8a80" size={14} />
        </View>
        <Text style={styles.prepGreeting}>«{brief.greeting}»</Text>
      </View>

      {/* prep checklist */}
      <View style={styles.prepBlock}>
        <View style={styles.prepBlockHead}>
          <Text style={styles.prepBlockTitle}>جهّز قبل الوصول</Text>
          <PackageCheck color="#1f8a80" size={14} />
        </View>
        {brief.prep.map((item) => (
          <View key={item} style={styles.prepItem}>
            <Text style={styles.prepItemText}>{item}</Text>
            <View style={styles.prepBullet} />
          </View>
        ))}
      </View>

      {/* critical flags */}
      <View style={styles.prepBlock}>
        <View style={styles.prepBlockHead}>
          <Text style={[styles.prepBlockTitle, { color: "#b5432b" }]}>تنبيهات حرجة</Text>
          <AlertTriangle color="#b5432b" size={14} />
        </View>
        {brief.flags.map((f) => (
          <View key={f} style={styles.prepItem}>
            <Text style={styles.prepFlagText}>{f}</Text>
            <View style={[styles.prepBullet, { backgroundColor: "#b5432b" }]} />
          </View>
        ))}
      </View>
    </View>
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
  headerTitle: { color: "#3d3424", fontSize: 18, fontWeight: "800" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22c55e" },
  statusText: { color: "#15803d", fontSize: 11, fontWeight: "700" },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 32 },

  opsCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fdf8ec",
    borderWidth: 1,
    borderColor: "#e6dcc8",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  opsIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#faf2dd",
    borderWidth: 1,
    borderColor: "#ecdcb6",
    alignItems: "center",
    justifyContent: "center",
  },
  opsTitle: { color: "#3d3424", fontSize: 15, fontWeight: "800", textAlign: "right" },
  opsBody: { color: "#6b6457", fontSize: 12, lineHeight: 19, textAlign: "right", marginTop: 3 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  sectionTitle: { color: "#3d3424", fontSize: 15, fontWeight: "800" },
  sectionCount: { color: "#9a917f", fontSize: 12 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: "#fdf8ec",
    borderWidth: 1,
    borderColor: "#e6dcc8",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  rowIndicator: { width: 4, height: 56, borderRadius: 2 },
  rowBody: { flex: 1, gap: 8 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowName: { color: "#3d3424", fontSize: 15, fontWeight: "800", textAlign: "right" },
  rowAgo: { color: "#9a917f", fontSize: 11 },
  rowZoneWrap: { gap: 4, alignItems: "flex-end" },
  rowReason: { color: "#2f2a22", fontSize: 13, lineHeight: 19, textAlign: "right" },
  rowZone: { flexDirection: "row", alignItems: "center", gap: 4 },
  rowZoneText: { color: "#6b6457", fontSize: 12 },
  newPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  newText: { fontSize: 11, fontWeight: "700" },
  enroutePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  enrouteText: { color: "#15803d", fontSize: 11, fontWeight: "700" },

  // modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fdf8ec",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: "#e6dcc8",
    padding: 22,
    paddingBottom: 34,
    alignItems: "flex-end",
    gap: 8,
  },
  sheetClose: { position: "absolute", top: 16, left: 16, padding: 4 },
  sheetTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginBottom: 4,
  },
  sheetTagText: { fontSize: 12, fontWeight: "800" },
  sheetName: { color: "#3d3424", fontSize: 22, fontWeight: "800", textAlign: "right" },
  sheetMeta: { color: "#6b6457", fontSize: 13, textAlign: "right" },
  sheetMsg: {
    alignSelf: "stretch",
    backgroundColor: "#faf2dd",
    borderWidth: 1,
    borderColor: "#ecdcb6",
    borderRadius: 12,
    padding: 13,
    marginTop: 10,
  },
  sheetMsgText: { color: "#8a6a2e", fontSize: 14, lineHeight: 21, textAlign: "right" },
  sheetInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "stretch",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  sheetInfoText: { color: "#3f3a30", fontSize: 13, textAlign: "right" },

  acceptBtn: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#b5432b",
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 18,
  },
  acceptBtnDone: {
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  acceptText: { color: "#fdf8ec", fontSize: 15, fontWeight: "800" },
  acceptDoneText: { color: "#15803d", fontSize: 15, fontWeight: "800" },

  locateBtn: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#e6dcc8",
    borderWidth: 1,
    borderColor: "#e6dcc8",
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 10,
  },
  locateText: { color: "#b07d12", fontSize: 14, fontWeight: "700" },

  // «مُهيّئ» pre-arrival card
  prepCard: {
    alignSelf: "stretch",
    backgroundColor: "#faf2dd",
    borderWidth: 1,
    borderColor: "#ecdcb6",
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    gap: 10,
  },
  prepHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  prepRole: { color: "#9a917f", fontSize: 11, fontWeight: "600" },
  prepNameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  prepName: { color: "#3d3424", fontSize: 15, fontWeight: "800" },
  prepIntro: { color: "#6b6457", fontSize: 12, textAlign: "right", lineHeight: 18 },
  prepBlock: {
    backgroundColor: "#fdf8ec",
    borderWidth: 1,
    borderColor: "#e6dcc8",
    borderRadius: 12,
    padding: 11,
    gap: 7,
  },
  prepBlockHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  prepBlockTitle: { color: "#3d3424", fontSize: 13, fontWeight: "800", textAlign: "right" },
  prepGreeting: {
    color: "#1f8a80",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
    lineHeight: 22,
  },
  prepItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  prepItemText: { color: "#3f3a30", fontSize: 13, textAlign: "right", flexShrink: 1 },
  prepFlagText: { color: "#8a3a26", fontSize: 13, textAlign: "right", flexShrink: 1, lineHeight: 19 },
  prepBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#1f8a80",
    marginTop: 2,
  },
});
