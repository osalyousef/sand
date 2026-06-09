import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ScanQrCode, ChevronLeft, Clock } from "lucide-react-native";
import { useScanned, type ScannedPilgrim } from "@/lib/scanned-store";
import { RISK_COLORS, type RiskLevel } from "@/types";

// ─── fake data ─────────────────────────────────────────────────────────────

const FAKE: ScannedPilgrim[] = [
  {
    pilgrim: {
      id: "1",
      full_name: "محمد أحمد الفارسي",
      age: 68,
      nationality: "إيران",
      passport_number: "SA-2024-IR-04892",
      has_diabetes: true,
      has_heart_condition: true,
      has_hypertension: true,
      medications: ["ميتوبرولول 50mg", "ميتفورمين 1000mg", "ليسينوبريل 10mg"],
      created_at: new Date().toISOString(),
    },
    vitals: {
      id: "v1",
      pilgrim_id: "1",
      heart_rate: 108,
      temperature: 38.9,
      oxygen_level: 94,
      recorded_at: new Date().toISOString(),
    },
    risk: {
      id: "r1",
      pilgrim_id: "1",
      risk_level: "red",
      score: 0.94,
      assessed_at: new Date().toISOString(),
    },
    scannedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    pilgrim: {
      id: "2",
      full_name: "فاطمة عبدالله سيدي",
      age: 74,
      nationality: "نيجيريا",
      passport_number: "SA-2024-NG-07231",
      has_diabetes: false,
      has_heart_condition: false,
      has_hypertension: true,
      medications: ["أملوديبين 10mg"],
      created_at: new Date().toISOString(),
    },
    vitals: {
      id: "v2",
      pilgrim_id: "2",
      heart_rate: 92,
      temperature: 37.8,
      oxygen_level: 96,
      recorded_at: new Date().toISOString(),
    },
    risk: {
      id: "r2",
      pilgrim_id: "2",
      risk_level: "red",
      score: 0.88,
      assessed_at: new Date().toISOString(),
    },
    scannedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  },
  {
    pilgrim: {
      id: "3",
      full_name: "أحمد رضا محمودي",
      age: 71,
      nationality: "باكستان",
      passport_number: "SA-2024-PK-11045",
      has_diabetes: true,
      has_heart_condition: false,
      has_hypertension: false,
      medications: ["ميتفورمين 500mg"],
      created_at: new Date().toISOString(),
    },
    vitals: {
      id: "v3",
      pilgrim_id: "3",
      heart_rate: 88,
      temperature: 39.2,
      oxygen_level: 97,
      recorded_at: new Date().toISOString(),
    },
    risk: {
      id: "r3",
      pilgrim_id: "3",
      risk_level: "yellow",
      score: 0.61,
      assessed_at: new Date().toISOString(),
    },
    scannedAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
  },
];

// ─── helpers ───────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} د`;
  const hrs = Math.floor(mins / 60);
  return `منذ ${hrs} س`;
}

function riskLabel(level: RiskLevel) {
  return level === "red" ? "حرج" : level === "yellow" ? "عالٍ" : "منخفض";
}

// ─── components ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <ScanQrCode color="#374151" size={64} strokeWidth={1.5} />
      <Text style={styles.emptyTitle}>لا يوجد حجاج بعد</Text>
      <Text style={styles.emptySubtitle}>
        افتح تبويب المسح وامسح بطاقة الحاج لإضافته هنا
      </Text>
    </View>
  );
}

function PilgrimRow({ item }: { item: ScannedPilgrim }) {
  const router = useRouter();
  const color = RISK_COLORS[item.risk.risk_level];

  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: "/pilgrim/[id]",
          params: { id: item.pilgrim.id, data: JSON.stringify(item) },
        })
      }
    >
      <View style={[styles.rowIndicator, { backgroundColor: color }]} />
      <View style={styles.rowContent}>
        <Text style={styles.rowName}>{item.pilgrim.full_name}</Text>
        <Text style={styles.rowMeta}>
          {item.pilgrim.nationality} · {item.pilgrim.age} سنة ·{" "}
          {item.pilgrim.passport_number}
        </Text>
        <View style={styles.rowBottom}>
          <View style={styles.rowTime}>
            <Clock color="#6b7280" size={11} />
            <Text style={styles.rowTimeText}>{timeAgo(item.scannedAt)}</Text>
          </View>
          <Text style={[styles.rowBadge, { color }]}>
            {riskLabel(item.risk.risk_level)}
          </Text>
        </View>
      </View>
      <ChevronLeft color="#374151" size={18} />
    </TouchableOpacity>
  );
}

// ─── screen ────────────────────────────────────────────────────────────────

export default function Pilgrims() {
  const { recents } = useScanned();

  // use real recents if available, otherwise fall back to fake data for demo
  const list = recents.length > 0 ? recents : FAKE;
  const isEmpty = recents.length === 0 && FAKE.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الحجاج</Text>
        {list.length > 0 && (
          <Text style={styles.headerCount}>آخر {list.length} مسح</Text>
        )}
      </View>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.pilgrim.id}
          renderItem={({ item }) => <PilgrimRow item={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

// ─── styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0d0d0d" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  headerCount: { color: "#6b7280", fontSize: 13 },

  listContent: { paddingVertical: 8 },
  separator: { height: 1, backgroundColor: "#1a1a1a", marginHorizontal: 16 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIndicator: { width: 4, height: 44, borderRadius: 2 },
  rowContent: { flex: 1, alignItems: "flex-end", gap: 3 },
  rowName: { color: "#fff", fontSize: 15, fontWeight: "700", textAlign: "right" },
  rowMeta: { color: "#6b7280", fontSize: 12, textAlign: "right" },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  rowTime: { flexDirection: "row", alignItems: "center", gap: 4 },
  rowTimeText: { color: "#6b7280", fontSize: 11 },
  rowBadge: { fontSize: 12, fontWeight: "700" },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  emptySubtitle: {
    color: "#6b7280",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
