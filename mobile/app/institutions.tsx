import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  I18nManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronRight,
  Building2,
  Phone,
  Clock,
  MapPin,
  BedDouble,
  Radio,
  Activity,
} from "lucide-react-native";
import {
  INSTITUTIONS,
  INSTITUTION_STATUS_META,
  INSTITUTION_TYPE_LABEL,
  bedsFree,
  occupancyPct,
  occupancyColor,
  nearestWithCapacity,
  type Institution,
} from "@/lib/ops-data";

I18nManager.forceRTL(true);

const SN = {
  bg: "#f7f0e1",
  raised: "#fdf8ec",
  rule: "#e6dcc8",
  gold: "#b07d12",
  fg1: "#3d3424",
  fg2: "#6b6457",
  fg3: "#9a917f",
};

function InstitutionCard({
  inst,
  recommended,
}: {
  inst: Institution;
  recommended: boolean;
}) {
  const status = INSTITUTION_STATUS_META[inst.status];
  const pct = occupancyPct(inst);
  const free = bedsFree(inst);

  return (
    <View
      style={[
        styles.card,
        recommended && { borderColor: SN.gold, borderWidth: 1.5 },
      ]}
    >
      {recommended && (
        <View style={styles.recBadge}>
          <Text style={styles.recBadgeText}>الأقرب بسرير متاح</Text>
        </View>
      )}

      <View style={styles.cardHead}>
        <View style={[styles.statusChip, { borderColor: status.color }]}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
        <View style={styles.cardTitleGroup}>
          <Text style={styles.cardTitle}>{inst.name}</Text>
          <Text style={styles.cardType}>{INSTITUTION_TYPE_LABEL[inst.type]}</Text>
        </View>
        <Building2 color={SN.gold} size={20} />
      </View>

      {/* beds */}
      <View style={styles.bedsRow}>
        <Text style={[styles.bedsFree, { color: occupancyColor(pct) }]}>
          {free} سرير متاح
        </Text>
        <Text style={styles.bedsTotal}>
          {inst.bedsOccupied}/{inst.bedsTotal} مشغول · {pct}٪
        </Text>
      </View>
      <View style={styles.bar}>
        <View
          style={[
            styles.barFill,
            { width: `${pct}%`, backgroundColor: occupancyColor(pct) },
          ]}
        />
      </View>

      {/* facts */}
      <View style={styles.facts}>
        <View style={styles.fact}>
          <Text style={styles.factText}>{inst.distanceKm} كم</Text>
          <MapPin color={SN.fg3} size={13} />
        </View>
        <View style={styles.fact}>
          <Text style={styles.factText}>~{inst.etaMin} د</Text>
          <Clock color={SN.fg3} size={13} />
        </View>
        <View style={styles.fact}>
          <Text style={styles.factText}>{inst.casesToday} حالة اليوم</Text>
          <Activity color={SN.fg3} size={13} />
        </View>
        <View style={styles.fact}>
          <Text style={styles.factText}>{inst.radio}</Text>
          <Radio color={SN.fg3} size={13} />
        </View>
      </View>

      {/* specialties */}
      <View style={styles.specs}>
        {inst.specialties.map((s) => (
          <View key={s} style={styles.spec}>
            <Text style={styles.specText}>{s}</Text>
          </View>
        ))}
      </View>

      {/* call */}
      <TouchableOpacity
        style={styles.callBtn}
        activeOpacity={0.85}
        onPress={() => Linking.openURL(`tel:${inst.contact}`)}
      >
        <Phone color="#3d3424" size={16} />
        <Text style={styles.callText}>اتصال — {inst.contact}</Text>
      </TouchableOpacity>
    </View>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof BedDouble;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <Icon color={color} size={18} />
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

export default function InstitutionsScreen() {
  const router = useRouter();
  const { needsHospital } = useLocalSearchParams<{ needsHospital?: string }>();
  const critical = needsHospital === "1";
  const recommended = nearestWithCapacity(critical);

  const totalBeds = INSTITUTIONS.reduce((s, i) => s + i.bedsTotal, 0);
  const occupied = INSTITUTIONS.reduce((s, i) => s + i.bedsOccupied, 0);
  const cases = INSTITUTIONS.reduce((s, i) => s + i.casesToday, 0);

  // Recommended first, then by ETA.
  const ordered = [...INSTITUTIONS].sort((a, b) => {
    if (a.id === recommended.id) return -1;
    if (b.id === recommended.id) return 1;
    return a.etaMin - b.etaMin;
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <ChevronRight color={SN.fg1} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المنشآت الصحية</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryRow}>
          <SummaryCard icon={BedDouble} label="أسرّة متاحة" value={String(totalBeds - occupied)} color="#22c55e" />
          <SummaryCard icon={Activity} label="حالات اليوم" value={String(cases)} color="#3b82f6" />
          <SummaryCard icon={Building2} label="منشأة" value={String(INSTITUTIONS.length)} color={SN.gold} />
        </View>

        {ordered.map((inst) => (
          <InstitutionCard
            key={inst.id}
            inst={inst}
            recommended={inst.id === recommended.id}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SN.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: SN.rule,
  },
  headerTitle: { color: SN.fg1, fontSize: 18, fontWeight: "800" },
  scroll: { padding: 12, gap: 12, paddingBottom: 28 },

  summaryRow: { flexDirection: "row", gap: 8 },
  summaryCard: {
    flex: 1,
    backgroundColor: SN.raised,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: SN.rule,
    paddingVertical: 12,
    alignItems: "center",
    gap: 3,
  },
  summaryValue: { fontSize: 18, fontWeight: "800" },
  summaryLabel: { color: SN.fg3, fontSize: 11 },

  card: {
    backgroundColor: SN.raised,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SN.rule,
    padding: 14,
    gap: 10,
  },
  recBadge: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(176,125,18,0.12)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recBadgeText: { color: SN.gold, fontSize: 11, fontWeight: "800" },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardTitleGroup: { flex: 1, alignItems: "flex-end" },
  cardTitle: { color: SN.fg1, fontSize: 15, fontWeight: "800", textAlign: "right" },
  cardType: { color: SN.fg3, fontSize: 12, marginTop: 1 },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },

  bedsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bedsFree: { fontSize: 14, fontWeight: "800" },
  bedsTotal: { color: SN.fg2, fontSize: 12 },
  bar: { height: 6, borderRadius: 3, backgroundColor: SN.rule, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },

  facts: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 14,
  },
  fact: { flexDirection: "row", alignItems: "center", gap: 4 },
  factText: { color: SN.fg2, fontSize: 12 },

  specs: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 6 },
  spec: {
    backgroundColor: SN.bg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: SN.rule,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  specText: { color: SN.fg2, fontSize: 11 },

  callBtn: {
    backgroundColor: SN.gold,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  callText: { color: "#3d3424", fontSize: 14, fontWeight: "800" },
});
