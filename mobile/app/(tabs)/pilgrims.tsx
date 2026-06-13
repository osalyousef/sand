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
      <ScanQrCode color="#cbbfa8" size={64} strokeWidth={1.5} />
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
            <Clock color="#9a917f" size={11} />
            <Text style={styles.rowTimeText}>{timeAgo(item.scannedAt)}</Text>
          </View>
          <Text style={[styles.rowBadge, { color }]}>
            {riskLabel(item.risk.risk_level)}
          </Text>
        </View>
      </View>
      <ChevronLeft color="#cbbfa8" size={18} />
    </TouchableOpacity>
  );
}

// ─── screen ────────────────────────────────────────────────────────────────

export default function Pilgrims() {
  const { recents } = useScanned();

  // Recents are seeded from the DB on launch and grow as bracelets are scanned.
  const list = recents;
  const isEmpty = recents.length === 0;

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
        />
      )}
    </SafeAreaView>
  );
}

// ─── styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f0e1" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e6dcc8",
  },
  headerTitle: { color: "#3d3424", fontSize: 20, fontWeight: "700" },
  headerCount: { color: "#9a917f", fontSize: 13 },

  listContent: { paddingVertical: 12 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: "#fdf8ec",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e6dcc8",
    marginHorizontal: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  rowIndicator: { width: 4, height: 44, borderRadius: 2 },
  rowContent: { flex: 1, alignItems: "flex-end", gap: 3 },
  rowName: { color: "#3d3424", fontSize: 15, fontWeight: "700", textAlign: "right" },
  rowMeta: { color: "#9a917f", fontSize: 12, textAlign: "right" },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  rowTime: { flexDirection: "row", alignItems: "center", gap: 4 },
  rowTimeText: { color: "#9a917f", fontSize: 11 },
  rowBadge: { fontSize: 12, fontWeight: "700" },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: { color: "#3d3424", fontSize: 18, fontWeight: "700" },
  emptySubtitle: {
    color: "#9a917f",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
