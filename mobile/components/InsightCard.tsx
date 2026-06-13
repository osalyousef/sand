// «راصد» ops insight card — shared by the home summary and the full
// رؤى العمليات screen.
import { View, Text, StyleSheet } from "react-native";
import { TrendingUp, Truck, Activity, AlertTriangle } from "lucide-react-native";
import {
  INSIGHT_SEVERITY_COLOR,
  INSIGHT_TYPE_LABEL,
  type InsightType,
  type OpsInsight,
} from "@/lib/agents";

const INSIGHT_ICON: Record<InsightType, typeof TrendingUp> = {
  surge: Activity,
  prediction: TrendingUp,
  logistics: Truck,
  anomaly: AlertTriangle,
};

export default function InsightCard({ item }: { item: OpsInsight }) {
  const color = INSIGHT_SEVERITY_COLOR[item.severity];
  const Icon = INSIGHT_ICON[item.type];
  return (
    <View style={[styles.insightCard, { borderRightColor: color }]}>
      <View style={styles.insightHead}>
        <View style={styles.insightMetaGroup}>
          <Text style={styles.insightTime}>{item.timeLabel}</Text>
          <View style={[styles.insightTypeChip, { borderColor: color }]}>
            <Text style={[styles.insightTypeText, { color }]}>
              {INSIGHT_TYPE_LABEL[item.type]}
            </Text>
          </View>
        </View>
        <View style={styles.insightTitleGroup}>
          <Text style={styles.insightTitle}>{item.title}</Text>
          <Text style={styles.insightArea}>{item.area}</Text>
        </View>
        <Icon color={color} size={18} />
      </View>
      <Text style={styles.insightDetail}>{item.detail}</Text>
      <View style={styles.insightActionRow}>
        <Text style={styles.insightConfidence}>ثقة {item.confidence}٪</Text>
        <Text style={styles.insightAction}>↩ {item.action}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  insightCard: {
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: "#fdf8ec",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e6dcc8",
    borderRightWidth: 4,
    padding: 14,
    gap: 8,
  },
  insightHead: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  insightMetaGroup: { alignItems: "flex-start", gap: 4 },
  insightTime: { color: "#9a917f", fontSize: 10 },
  insightTypeChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
  insightTypeText: { fontSize: 10, fontWeight: "800" },
  insightTitleGroup: { flex: 1, alignItems: "flex-end" },
  insightTitle: { color: "#3d3424", fontSize: 14, fontWeight: "800", textAlign: "right" },
  insightArea: { color: "#9a917f", fontSize: 11, marginTop: 1 },
  insightDetail: { color: "#6b6457", fontSize: 12.5, lineHeight: 19, textAlign: "right" },
  insightActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e6dcc8",
    paddingTop: 8,
  },
  insightConfidence: { color: "#9a917f", fontSize: 11, fontWeight: "700" },
  insightAction: {
    color: "#8a6a2e",
    fontSize: 11.5,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
    marginRight: 8,
  },
});
