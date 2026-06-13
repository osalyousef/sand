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
import { ChevronRight, Sparkles } from "lucide-react-native";
import { OPS_INSIGHTS, AGENTS } from "@/lib/agents";
import InsightCard from "@/components/InsightCard";

I18nManager.forceRTL(true);

const SN = {
  bg: "#f7f0e1",
  raised: "#fdf8ec",
  rule: "#e6dcc8",
  gold: "#b07d12",
  goldDeep: "#8a6a2e",
  fg1: "#3d3424",
  fg3: "#9a917f",
};

export default function Insights() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <ChevronRight color={SN.fg1} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>رؤى العمليات</Text>
        <View style={styles.agentTag}>
          <Sparkles color={SN.gold} size={12} />
          <Text style={styles.agentTagText}>{AGENTS.ops.name}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.lead}>
          {OPS_INSIGHTS.length} رؤى نشطة — مرتّبة حسب الأولوية. كل إجراء يُنفَّذ بعد اعتماد المنسّق.
        </Text>
        {OPS_INSIGHTS.map((item) => (
          <InsightCard key={item.id} item={item} />
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
  agentTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(176,125,18,0.12)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  agentTagText: { color: SN.goldDeep, fontSize: 12, fontWeight: "800" },
  scroll: { paddingVertical: 12 },
  lead: {
    color: SN.fg3,
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: "right",
    marginHorizontal: 12,
    marginBottom: 12,
  },
});
