import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  PhoneOff,
  Phone,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Languages,
} from "lucide-react-native";
import { DEMO_CALLER, DEMO_SCRIPT, type Turn } from "@/lib/call-script";

type Phase = "incoming" | "active" | "ended";

interface RenderedTurn {
  turn: Turn;
  index: number;
  shownChars: number; // for typing animation in translated text
  finished: boolean;
}

export default function CallScreen() {
  const router = useRouter();
  const { autoAccept } = useLocalSearchParams<{ autoAccept?: string }>();
  const [phase, setPhase] = useState<Phase>("incoming");
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [turns, setTurns] = useState<RenderedTurn[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  // ringing pulse
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (phase !== "incoming") return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, pulse]);

  // auto-accept (from notification deep link)
  useEffect(() => {
    if (autoAccept === "1" && phase === "incoming") {
      const t = setTimeout(() => accept(), 1200);
      return () => clearTimeout(t);
    }
  }, [autoAccept, phase]);

  // call timer
  useEffect(() => {
    if (phase !== "active") return;
    const i = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [phase]);

  // play script
  useEffect(() => {
    if (phase !== "active") return;
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    let cursor = 0;
    DEMO_SCRIPT.forEach((turn, index) => {
      const startDelay = cursor + (turn.delayMs ?? 0);
      cursor = startDelay + turn.durationMs;

      // schedule turn start
      timeouts.push(
        setTimeout(() => {
          if (cancelled) return;
          setTurns((prev) => [
            ...prev,
            { turn, index, shownChars: 0, finished: false },
          ]);
          // letter-by-letter reveal of translation over durationMs
          const total = turn.translation.length;
          const steps = Math.min(total, 40);
          const stepMs = Math.max(40, Math.floor(turn.durationMs / steps));
          for (let s = 1; s <= steps; s++) {
            timeouts.push(
              setTimeout(() => {
                if (cancelled) return;
                setTurns((prev) =>
                  prev.map((t) =>
                    t.index === index
                      ? {
                          ...t,
                          shownChars: Math.floor((s / steps) * total),
                          finished: s === steps,
                        }
                      : t,
                  ),
                );
                scrollRef.current?.scrollToEnd({ animated: true });
              }, s * stepMs),
            );
          }
        }, startDelay),
      );
    });

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [phase]);

  const accept = () => setPhase("active");
  const decline = () => router.back();
  const endCall = () => {
    setPhase("ended");
    setTimeout(() => router.back(), 600);
  };

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ─── incoming ───────────────────────────────────────────────────────────
  if (phase === "incoming") {
    const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
    const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.incomingTop}>
          <Text style={styles.incomingLabel}>مكالمة واردة</Text>
          <View style={styles.translateBadge}>
            <Sparkles color="#f97316" size={12} />
            <Text style={styles.translateBadgeText}>ترجمة فورية مفعّلة</Text>
          </View>
        </View>

        <View style={styles.avatarWrap}>
          <Animated.View
            style={[
              styles.avatarRing,
              { transform: [{ scale: ringScale }], opacity: ringOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.avatarRing,
              {
                transform: [
                  { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) },
                ],
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0] }),
              },
            ]}
          />
          <View style={styles.avatar}>
            <Text style={styles.avatarFlag}>{DEMO_CALLER.flag}</Text>
          </View>
        </View>

        <View style={styles.callerInfo}>
          <Text style={styles.callerName}>{DEMO_CALLER.name}</Text>
          <Text style={styles.callerMeta}>
            {DEMO_CALLER.age} سنة · {DEMO_CALLER.language}
          </Text>
          <View style={styles.locationRow}>
            <Text style={styles.locationDot}>📍</Text>
            <Text style={styles.locationText}>{DEMO_CALLER.location}</Text>
          </View>
        </View>

        <View style={styles.incomingActions}>
          <View style={styles.actionCol}>
            <TouchableOpacity
              style={[styles.bigBtn, styles.declineBtn]}
              onPress={decline}
              activeOpacity={0.85}
            >
              <PhoneOff color="#3d3424" size={28} />
            </TouchableOpacity>
            <Text style={styles.bigBtnLabel}>رفض</Text>
          </View>
          <View style={styles.actionCol}>
            <TouchableOpacity
              style={[styles.bigBtn, styles.acceptBtn]}
              onPress={accept}
              activeOpacity={0.85}
            >
              <Phone color="#3d3424" size={28} />
            </TouchableOpacity>
            <Text style={styles.bigBtnLabel}>قبول</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── ended ──────────────────────────────────────────────────────────────
  if (phase === "ended") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.endedWrap}>
          <Text style={styles.endedTitle}>انتهت المكالمة</Text>
          <Text style={styles.endedTime}>{fmtTime(seconds)}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── active ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      {/* top bar */}
      <View style={styles.activeTop}>
        <View style={styles.activeTopLeft}>
          <View style={styles.liveDot} />
          <Text style={styles.timer}>{fmtTime(seconds)}</Text>
        </View>
        <View style={styles.translateBadgeSmall}>
          <Languages color="#f97316" size={12} />
          <Text style={styles.translateBadgeText}>{DEMO_CALLER.language} ⇄ العربية</Text>
        </View>
      </View>

      {/* caller mini header */}
      <View style={styles.activeCaller}>
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarFlagSmall}>{DEMO_CALLER.flag}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.activeName}>{DEMO_CALLER.name}</Text>
          <Text style={styles.activeMeta}>
            {DEMO_CALLER.age} سنة · {DEMO_CALLER.location}
          </Text>
        </View>
      </View>

      {/* transcript */}
      <ScrollView
        ref={scrollRef}
        style={styles.transcript}
        contentContainerStyle={styles.transcriptContent}
      >
        {turns.length === 0 && (
          <View style={styles.listening}>
            <View style={styles.listeningDot} />
            <Text style={styles.listeningText}>
              يستمع المساعد الذكي... سيظهر النص بعد لحظات
            </Text>
          </View>
        )}

        {turns.map((t) => {
          const isPilgrim = t.turn.role === "pilgrim";
          const shown = t.turn.translation.slice(0, t.shownChars);
          return (
            <View
              key={t.index}
              style={[
                styles.bubble,
                isPilgrim ? styles.bubblePilgrim : styles.bubbleCoord,
              ]}
            >
              <View style={styles.bubbleHead}>
                <View
                  style={[
                    styles.roleDot,
                    isPilgrim ? styles.dotPilgrim : styles.dotCoord,
                  ]}
                />
                <Text style={styles.roleLabel}>
                  {isPilgrim ? `${DEMO_CALLER.name}` : "أنت"}
                </Text>
                <Text style={styles.roleLang}>
                  {isPilgrim ? DEMO_CALLER.language : "العربية"}
                </Text>
              </View>

              <Text style={styles.original}>{t.turn.original}</Text>

              <View style={styles.translateLine}>
                <Sparkles color="#f97316" size={10} />
                <Text style={styles.translateLabel}>
                  {isPilgrim ? "ترجمة إلى العربية" : "ترجمة إلى الإندونيسية"}
                </Text>
              </View>
              <Text
                style={[
                  styles.translation,
                  isPilgrim ? styles.translationAr : styles.translationFor,
                ]}
              >
                {shown}
                {!t.finished && <Text style={styles.caret}>▍</Text>}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* bottom controls */}
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <ControlBtn
            active={!muted}
            onPress={() => setMuted((m) => !m)}
            Icon={muted ? MicOff : Mic}
            label={muted ? "مكتوم" : "ميكروفون"}
          />
          <ControlBtn
            active={speaker}
            onPress={() => setSpeaker((s) => !s)}
            Icon={Volume2}
            label="مكبر"
          />
          <ControlBtn
            active
            onPress={() => {}}
            Icon={Sparkles}
            label="ترجمة"
            tint="#f97316"
          />
        </View>
        <TouchableOpacity style={styles.endBtn} onPress={endCall} activeOpacity={0.85}>
          <PhoneOff color="#3d3424" size={26} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ControlBtn({
  Icon,
  label,
  active,
  onPress,
  tint,
}: {
  Icon: typeof Mic;
  label: string;
  active: boolean;
  onPress: () => void;
  tint?: string;
}) {
  const color = tint ?? "#3d3424";
  return (
    <TouchableOpacity style={styles.ctrlCol} onPress={onPress} activeOpacity={0.7}>
      <View
        style={[
          styles.ctrlBtn,
          active && { backgroundColor: tint ? `${tint}22` : "#e6dcc8", borderColor: tint ?? "#cbbfa8" },
        ]}
      >
        <Icon color={active ? color : "#9a917f"} size={22} />
      </View>
      <Text style={[styles.ctrlLabel, active && { color: tint ?? "#3d3424" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f0e1" },

  // ── incoming ─────────────────────────────────────────
  incomingTop: { alignItems: "center", paddingTop: 12, gap: 10 },
  incomingLabel: { color: "#6b6457", fontSize: 14, letterSpacing: 0.5 },
  translateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fdf0e2",
    borderWidth: 1,
    borderColor: "#fad4b3",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  translateBadgeSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fdf0e2",
    borderWidth: 1,
    borderColor: "#fad4b3",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  translateBadgeText: { color: "#9a3412", fontSize: 11, fontWeight: "700" },

  avatarWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 48,
    height: 160,
  },
  avatarRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#f97316",
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#fdf8ec",
    borderWidth: 2,
    borderColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFlag: { fontSize: 64 },

  callerInfo: { alignItems: "center", marginTop: 28, gap: 6 },
  callerName: { color: "#3d3424", fontSize: 28, fontWeight: "800" },
  callerMeta: { color: "#6b6457", fontSize: 15 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  locationDot: { fontSize: 14 },
  locationText: { color: "#3f3a30", fontSize: 14, fontWeight: "600" },

  incomingActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 24,
    paddingBottom: 36,
    marginTop: "auto",
  },
  actionCol: { alignItems: "center", gap: 8 },
  bigBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  declineBtn: { backgroundColor: "#dc2626" },
  acceptBtn: { backgroundColor: "#16a34a" },
  bigBtnLabel: { color: "#3d3424", fontSize: 13, fontWeight: "600" },

  // ── active ───────────────────────────────────────────
  activeTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  activeTopLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" },
  timer: { color: "#3d3424", fontSize: 15, fontWeight: "700", fontVariant: ["tabular-nums"] },

  activeCaller: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e6dcc8",
  },
  avatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fdf8ec",
    borderWidth: 1.5,
    borderColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFlagSmall: { fontSize: 22 },
  activeName: { color: "#3d3424", fontSize: 16, fontWeight: "800", textAlign: "right" },
  activeMeta: { color: "#6b6457", fontSize: 12, textAlign: "right" },

  transcript: { flex: 1 },
  transcriptContent: { padding: 16, gap: 12, paddingBottom: 24 },

  listening: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    backgroundColor: "#fdf8ec",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6dcc8",
  },
  listeningDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#f97316",
  },
  listeningText: { color: "#6b6457", fontSize: 13, flex: 1 },

  bubble: {
    backgroundColor: "#fdf8ec",
    borderRadius: 14,
    padding: 12,
    gap: 6,
    borderWidth: 1,
  },
  bubblePilgrim: { borderColor: "#e6dcc8" },
  bubbleCoord: { borderColor: "#fad4b3", backgroundColor: "#fdf0e2" },

  bubbleHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  dotPilgrim: { backgroundColor: "#3b82f6" },
  dotCoord: { backgroundColor: "#f97316" },
  roleLabel: { color: "#3d3424", fontSize: 12, fontWeight: "800" },
  roleLang: { color: "#9a917f", fontSize: 11, marginLeft: "auto" },

  original: { color: "#3f3a30", fontSize: 15, lineHeight: 22 },
  translateLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e6dcc8",
  },
  translateLabel: { color: "#6b6457", fontSize: 10, fontWeight: "700" },
  translation: { fontSize: 15, lineHeight: 22, fontWeight: "600" },
  translationAr: { color: "#3d3424", textAlign: "right" },
  translationFor: { color: "#9a3412" },
  caret: { color: "#f97316" },

  // ── controls ─────────────────────────────────────────
  controls: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#e6dcc8",
    gap: 16,
    alignItems: "center",
  },
  controlRow: { flexDirection: "row", gap: 24 },
  ctrlCol: { alignItems: "center", gap: 6 },
  ctrlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f7f0e1",
    borderWidth: 1.5,
    borderColor: "#e6dcc8",
    alignItems: "center",
    justifyContent: "center",
  },
  ctrlLabel: { color: "#9a917f", fontSize: 11, fontWeight: "600" },

  endBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── ended ────────────────────────────────────────────
  endedWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  endedTitle: { color: "#3d3424", fontSize: 22, fontWeight: "800" },
  endedTime: { color: "#6b6457", fontSize: 16, fontVariant: ["tabular-nums"] },
});
