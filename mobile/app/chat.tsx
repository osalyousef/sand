import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  I18nManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ChevronRight, Send, Sparkles, Phone } from "lucide-react-native";

I18nManager.forceRTL(true);

// ─── warm-paper palette (shared with the pilgrim home) ─────────────────────
const SN = {
  bg: "#f7f0e1",
  bgRaised: "#fdf8ec",
  graphite: "#e6dcc8",
  graphite2: "#d8ccb2",
  gold: "#b07d12",
  goldInk: "#3a2c08",
  goldFill: "rgba(176,125,18,0.12)",
  teal: "#1f8a80",
  fg1: "#3d3424",
  fg: "#2a2620",
  fg2: "#6b6457",
  fg3: "#9a917f",
  rule: "rgba(60,50,30,0.14)",
};

const NURSE = {
  name: "الممرضة سارة",
  initials: "س.م",
  role: "فريق الرعاية الميدانية",
};

// The pilgrim speaks Indonesian (matches the call demo's DEMO_CALLER); the
// nurse types Arabic. Every message carries both the original and the AI
// translation, mirroring the live call transcript.
type Sender = "nurse" | "me";
interface Message {
  id: string;
  from: Sender;
  original: string; // language the sender wrote in
  translation: string; // AI translation for the other side
}

const SEED: Message[] = [
  {
    id: "m1",
    from: "nurse",
    original: "السلام عليكم، معك الممرضة سارة من فريق الرعاية. أين تشعرين بالتعب؟",
    translation:
      "Assalamualaikum, ini Perawat Sarah dari tim perawatan. Di mana Anda merasa tidak enak badan?",
  },
  {
    id: "m2",
    from: "me",
    original: "Saya merasa pusing dan sangat lelah setelah melempar jumrah.",
    translation: "أشعر بدوار وتعب شديد بعد رمي الجمرات.",
  },
  {
    id: "m3",
    from: "nurse",
    original: "سلامتك. هل شربتِ ماءً كافياً اليوم؟ وهل أنتِ في مكان مظلل الآن؟",
    translation:
      "Semoga lekas pulih. Apakah Anda cukup minum air hari ini? Apakah Anda di tempat teduh sekarang?",
  },
];

// nurse replies (Arabic + Indonesian translation) cycle as you send — demo only
const NURSE_REPLIES: { original: string; translation: string }[] = [
  {
    original: "حسناً، اجلسي في الظل وارتشفي الماء ببطء. سأبقى معك.",
    translation:
      "Baik, duduklah di tempat teduh dan minum air perlahan. Saya akan tetap bersama Anda.",
  },
  {
    original:
      "إن استمر الدوار أكثر من ١٠ دقائق سأرسل فريقاً ميدانياً إلى موقعك فوراً.",
    translation:
      "Jika pusing berlanjut lebih dari 10 menit, saya akan segera kirim tim ke lokasi Anda.",
  },
  {
    original:
      "راقبي نبضك، وإن شعرتِ بضيق في التنفس اضغطي على زر الاتصال بـ ٩٣٧.",
    translation:
      "Pantau denyut nadi Anda, dan jika sesak napas tekan tombol panggil 937.",
  },
  {
    original: "أنا هنا متى احتجتِ. اعتني بنفسك وتقبّل الله طاعتك.",
    translation:
      "Saya di sini kapan pun Anda butuh. Jaga diri Anda, semoga ibadah Anda diterima.",
  },
];

// Arabic translations shown for the pilgrim's outgoing messages — demo only
const ME_TRANSLATIONS = [
  "أشعر بتحسّن بسيط، شكراً لك.",
  "حسناً، سأبقى في مكاني وأنتظر.",
  "نعم، الجو حار جداً هنا.",
  "جزاكِ الله خيراً.",
];

export default function ChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(SEED);
  const [draft, setDraft] = useState("");
  const [replyIdx, setReplyIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const scrollDown = () =>
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const mine: Message = {
      id: `me-${Date.now()}`,
      from: "me",
      original: text,
      translation: ME_TRANSLATIONS[replyIdx % ME_TRANSLATIONS.length],
    };
    setMessages((prev) => [...prev, mine]);
    setDraft("");
    scrollDown();

    // simulated nurse reply
    const reply = NURSE_REPLIES[replyIdx % NURSE_REPLIES.length];
    setReplyIdx((i) => i + 1);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `nurse-${Date.now()}`,
          from: "nurse",
          original: reply.original,
          translation: reply.translation,
        },
      ]);
      scrollDown();
    }, 900);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={10}
          activeOpacity={0.7}
        >
          <ChevronRight color={SN.fg2} size={24} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{NURSE.name}</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusText}>متصلة الآن</Text>
            <View style={styles.statusDot} />
          </View>
        </View>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{NURSE.initials}</Text>
        </View>
      </View>

      {/* translation notice */}
      <View style={styles.transNotice}>
        <Text style={styles.transNoticeText}>الرسائل تُترجم تلقائياً لك وللممرضة</Text>
        <Sparkles color={SN.gold} size={13} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.thread}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollDown}
        >
          {messages.map((m) => {
            const mine = m.from === "me";
            return (
              <View
                key={m.id}
                style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleNurse]}
              >
                <Text style={[styles.original, mine && styles.originalMine]}>
                  {m.original}
                </Text>

                <View
                  style={[styles.transLine, mine ? styles.transLineMine : styles.transLineNurse]}
                >
                  <Sparkles color={mine ? SN.goldInk : SN.gold} size={10} />
                  <Text style={[styles.transLabel, mine && styles.transLabelMine]}>
                    {mine ? "ترجمة إلى العربية" : "ترجمة إلى الإندونيسية"}
                  </Text>
                </View>

                <Text style={[styles.translation, mine && styles.translationMine]}>
                  {m.translation}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* composer */}
        <View style={styles.composer}>
          <TouchableOpacity
            style={styles.callBtn}
            activeOpacity={0.8}
            onPress={() => router.push("/call")}
          >
            <Phone color={SN.teal} size={20} strokeWidth={1.8} />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="اكتب رسالتك..."
            placeholderTextColor={SN.fg3}
            multiline
            textAlign="right"
            onSubmitEditing={send}
          />

          <TouchableOpacity
            style={[styles.sendBtn, !draft.trim() && styles.sendBtnOff]}
            activeOpacity={0.8}
            onPress={send}
            disabled={!draft.trim()}
          >
            <Send color={draft.trim() ? SN.goldInk : SN.fg3} size={19} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SN.bg },
  flex: { flex: 1 },

  // header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: SN.rule,
  },
  backBtn: { padding: 2 },
  headerInfo: { flex: 1, alignItems: "flex-end" },
  headerName: { fontSize: 16, fontWeight: "800", color: SN.fg1 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  statusText: { fontSize: 11.5, color: SN.teal, fontWeight: "600" },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: SN.teal },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SN.graphite2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 12, fontWeight: "700", color: SN.fg1 },

  // translation notice
  transNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 9,
    backgroundColor: SN.goldFill,
  },
  transNoticeText: { fontSize: 11.5, color: SN.fg2, fontWeight: "600" },

  // thread
  thread: { padding: 16, gap: 10, paddingBottom: 20 },
  bubble: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleNurse: {
    alignSelf: "flex-start",
    backgroundColor: SN.bgRaised,
    borderWidth: 1,
    borderColor: SN.rule,
    borderTopRightRadius: 4,
  },
  bubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: SN.gold,
    borderTopLeftRadius: 4,
  },
  original: { fontSize: 14, lineHeight: 21, color: SN.fg2, textAlign: "right" },
  originalMine: { color: "rgba(58,44,8,0.7)" },
  transLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 7,
    paddingTop: 7,
    borderTopWidth: 1,
  },
  transLineNurse: { borderTopColor: SN.rule },
  transLineMine: { borderTopColor: "rgba(58,44,8,0.18)" },
  transLabel: { fontSize: 10, fontWeight: "700", color: SN.gold },
  transLabelMine: { color: SN.goldInk },
  translation: {
    fontSize: 14.5,
    lineHeight: 22,
    fontWeight: "600",
    color: SN.fg1,
    textAlign: "right",
    marginTop: 3,
  },
  translationMine: { color: SN.goldInk },

  // composer
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: SN.rule,
    backgroundColor: SN.bgRaised,
  },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: SN.rule,
    backgroundColor: SN.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: SN.rule,
    backgroundColor: SN.bg,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 14,
    color: SN.fg,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: SN.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnOff: { backgroundColor: SN.graphite2 },
});
