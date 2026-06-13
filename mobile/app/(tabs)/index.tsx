import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
  Animated,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  X,
  Repeat,
  Building2,
  BarChart3,
  ChevronLeft,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useState, useRef } from "react";
import { ENV_READINGS, CROWD_META } from "@/lib/ops-data";
import { OPS_INSIGHTS, AGENTS } from "@/lib/agents";
import InsightCard from "@/components/InsightCard";

I18nManager.forceRTL(true);

// ─── components ──────────────────────────────────────────────────────────

function AlertBanner({ onDismiss }: { onDismiss: () => void }) {
  const peak = ENV_READINGS[0];
  return (
    <View style={styles.alertBanner}>
      <TouchableOpacity onPress={onDismiss} style={styles.alertDismiss}>
        <X color="#3d3424" size={16} />
      </TouchableOpacity>
      <View style={styles.alertTextGroup}>
        <Text style={styles.alertTitle}>تنبيه حراري — منطقة {peak.site}</Text>
        <Text style={styles.alertSub}>
          {peak.temp}°م · محسوسة {peak.heatIndex}° · رطوبة {peak.humidity}%
        </Text>
      </View>
    </View>
  );
}

type EnvReading = (typeof ENV_READINGS)[number];

// Card face — shared by the swipeable top card and the one peeking behind it.
function EnvCardBody({ e }: { e: EnvReading }) {
  const crowd = CROWD_META[e.crowd];
  return (
    <>
      <View style={styles.envHead}>
        <View style={styles.envFeelsRow}>
          <Text style={styles.envFeels}>{e.heatIndex}°</Text>
          <Text style={styles.envFeelsLabel}>محسوسة</Text>
        </View>
        <View style={styles.envSiteGroup}>
          <Text style={[styles.envSite, { color: crowd.color }]}>{e.site}</Text>
          <View style={[styles.crowdChip, { borderColor: crowd.color }]}>
            <Text style={[styles.crowdText, { color: crowd.color }]}>{crowd.label}</Text>
          </View>
        </View>
      </View>

      <View style={styles.envDivider} />

      <View style={styles.envMetrics}>
        <View style={styles.envMetric}>
          <Sun color="#b07d12" size={13} />
          <Text style={styles.envMetricText}>UV {e.uv}</Text>
        </View>
        <Text style={styles.envDot}>·</Text>
        <View style={styles.envMetric}>
          <Wind color="#b07d12" size={13} />
          <Text style={styles.envMetricText}>{e.windKmh} كم/س</Text>
        </View>
        <Text style={styles.envDot}>·</Text>
        <View style={styles.envMetric}>
          <Droplets color="#b07d12" size={13} />
          <Text style={styles.envMetricText}>{e.humidity}%</Text>
        </View>
        <Text style={styles.envDot}>·</Text>
        <View style={styles.envMetric}>
          <Thermometer color="#b07d12" size={13} />
          <Text style={styles.envMetricText}>{e.temp}°</Text>
        </View>
      </View>
    </>
  );
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const SWIPE_THRESHOLD = 110;

// Per-site environment as a Tinder-style swipe deck (pattern follows
// meteor-factory/react-native-tinder-swipe-cards): `pan` tracks the drag,
// `enter` springs the incoming card in. Release past the threshold flings the
// card off with momentum (Animated.decay) and reveals the next site.
function EnvDeck() {
  const [index, setIndex] = useState(0);
  const len = ENV_READINGS.length;
  const pan = useRef(new Animated.ValueXY()).current;
  const enter = useRef(new Animated.Value(1)).current;

  const e = ENV_READINGS[index];
  const next = ENV_READINGS[(index + 1) % len];
  const crowd = CROWD_META[e.crowd];
  const hasStack = len > 1;

  const rotate = pan.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ["-18deg", "0deg", "18deg"],
  });
  const opacity = pan.x.interpolate({
    inputRange: [-220, -110, 0, 110, 220],
    outputRange: [0.6, 1, 1, 1, 0.6],
  });
  // The incoming card starts exactly where the behind-card sits (the ghost
  // slot: scale 0.96, nudged down 8px) and grows into the top slot, so there's
  // no snap when the front card flings away.
  const enterScale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });
  const enterTransY = enter.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
  const translateY = Animated.add(pan.y, enterTransY);

  const animateEntrance = () => {
    enter.setValue(0);
    Animated.spring(enter, { toValue: 1, friction: 7, useNativeDriver: false }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      // Claim the gesture only on a clear horizontal drag, so the page still
      // scrolls vertically.
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 5 && Math.abs(g.dx) > Math.abs(g.dy) * 1.3,
      onPanResponderGrant: () => {
        // @ts-expect-error _value is RN-internal but the canonical way to read it
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, { vx, vy, dx, dy }) => {
        pan.flattenOffset();
        // @ts-expect-error _value is RN-internal
        const x: number = pan.x._value;
        if (Math.abs(x) > SWIPE_THRESHOLD) {
          const velocity = vx === 0 ? (x < 0 ? -3 : 3) : clamp(Math.abs(vx), 3, 5) * (vx < 0 ? -1 : 1);
          Animated.decay(pan, {
            velocity: { x: velocity, y: vy },
            deceleration: 0.985,
            useNativeDriver: false,
          }).start(({ finished }) => {
            if (finished) {
              pan.setValue({ x: 0, y: 0 });
              setIndex((i) => (i + 1) % len);
              animateEntrance();
            }
          });
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 4,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <View style={styles.deckWrap}>
      <View style={styles.deckStack}>
        {hasStack && (
          <View style={[styles.envCard, styles.envGhost, styles.envGhost2]} pointerEvents="none" />
        )}
        {hasStack && (
          <View style={[styles.envCard, styles.envGhost, styles.envGhost1]} pointerEvents="none">
            <EnvCardBody e={next} />
          </View>
        )}
        <Animated.View
          style={[
            styles.envCard,
            styles.envTop,
            {
              opacity,
              transform: [
                { translateX: pan.x },
                { translateY },
                { rotate },
                { scale: enterScale },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <EnvCardBody e={e} />
        </Animated.View>
      </View>

      {hasStack && (
        <View style={styles.deckDots}>
          {ENV_READINGS.map((r, i) => (
            <View
              key={r.site}
              style={[
                styles.deckDot,
                i === index && { backgroundColor: crowd.color, width: 16 },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function QuickLinks() {
  const router = useRouter();
  return (
    <View style={styles.quickRow}>
      <TouchableOpacity
        style={styles.quickCard}
        activeOpacity={0.8}
        onPress={() => router.push("/institutions")}
      >
        <Building2 color="#b07d12" size={20} />
        <Text style={styles.quickText}>المنشآت الصحية</Text>
      </TouchableOpacity>

    </View>
  );
}

// ─── screen ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const [alertVisible, setAlertVisible] = useState(true);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerAvatar}
          activeOpacity={0.7}
          onPress={() => router.push("/pilgrim")}
        >
          <Text style={styles.headerAvatarText}>م.ص</Text>
          <View style={styles.headerAvatarBadge}>
            <Repeat color="#f7f0e1" size={9} strokeWidth={2.6} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>سند</Text>
        <Bell color="#6b6457" size={22} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {alertVisible && <AlertBanner onDismiss={() => setAlertVisible(false)} />}

        <EnvDeck />

        <QuickLinks />

        {/* «راصد» ops insights — single summary card; «عرض الكل» opens the feed */}
        <View style={styles.sectionHeader}>
          <TouchableOpacity
            style={styles.viewAllLink}
            activeOpacity={0.7}
            onPress={() => router.push("/insights")}
          >
            <Text style={styles.viewAllText}>عرض الكل</Text>
            <ChevronLeft color="#8a6a2e" size={15} />
          </TouchableOpacity>
          <View style={styles.sectionTitleGroup}>
            <View style={styles.liveRow}>
              <Text style={styles.agentName}>{AGENTS.ops.name}</Text>
              <View style={styles.liveDot} />
              <Text style={styles.liveLabel}>مباشر</Text>
            </View>
            <Text style={styles.sectionTitle}>رؤى العمليات</Text>
          </View>
        </View>
        {OPS_INSIGHTS.slice(0, 2).map((item) => (
          <InsightCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────

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
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3d3424",
    textDecorationLine: "underline",
    textDecorationColor: "#b07d12",
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e6dcc8",
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: { color: "#6b6457", fontSize: 12, fontWeight: "600" },
  headerAvatarBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#b07d12",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#f7f0e1",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  // alert
  alertBanner: {
    margin: 12,
    backgroundColor: "#ecdcb6",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  alertDismiss: { paddingTop: 2 },
  alertTextGroup: { flex: 1, alignItems: "flex-end" },
  alertTitle: { color: "#8a6a2e", fontWeight: "700", fontSize: 14, textAlign: "right" },
  alertSub: { color: "#8a6a2e", fontSize: 12, marginTop: 2, textAlign: "right" },

  // env strip
  // env deck — full-width card stacked like a deck, tap to cycle sites
  deckWrap: { paddingHorizontal: 22, paddingVertical: 2 },
  deckStack: { position: "relative", marginBottom: 14 },
  envCard: {
    backgroundColor: "#fdf8ec",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6dcc8",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  envTop: { zIndex: 1 },
  envGhost: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  envGhost1: { transform: [{ translateY: 8 }, { scale: 0.96 }], opacity: 0.85, zIndex: -1 },
  envGhost2: { transform: [{ translateY: 16 }, { scale: 0.92 }], opacity: 0.5, zIndex: -2 },
  envHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  envSiteGroup: { alignItems: "flex-end", gap: 5 },
  envSite: { fontSize: 18, fontWeight: "800" },
  crowdChip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  crowdText: { fontSize: 11, fontWeight: "800" },
  envFeelsRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  envFeels: { color: "#c2410c", fontSize: 30, fontWeight: "800" },
  envFeelsLabel: { color: "#9a917f", fontSize: 11 },
  envDivider: { height: 1, backgroundColor: "#e6dcc8" },
  envMetrics: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  envMetric: { flexDirection: "row", alignItems: "center", gap: 4 },
  envMetricText: { color: "#3f3a30", fontSize: 11, fontWeight: "700" },
  envDot: { color: "#cbbfa8", fontSize: 11 },
  deckDots: { flexDirection: "row", justifyContent: "center", gap: 5, marginTop: 2 },
  deckDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#d8ccb2" },

  // quick links
  quickRow: { flexDirection: "row", gap: 10, marginHorizontal: 12, marginTop: 12 },
  quickCard: {
    flex: 1,
    backgroundColor: "#fdf8ec",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e6dcc8",
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  quickText: { color: "#3d3424", fontSize: 13, fontWeight: "700" },

  // section
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitleGroup: { alignItems: "flex-end", gap: 3 },
  sectionTitle: { color: "#3d3424", fontSize: 18, fontWeight: "800" },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  agentName: { color: "#8a6a2e", fontSize: 12, fontWeight: "800" },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#1f8a80" },
  liveLabel: { color: "#9a917f", fontSize: 11.5, fontWeight: "600" },

  viewAllLink: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  viewAllText: { color: "#8a6a2e", fontSize: 13, fontWeight: "800" },
});
