// Nusuk-style pilgrim health card — React Native port of the Vite `card/`
// design (CardFront). Identity face: emblem header, risk stripe, photo,
// info grid, and the pilgrim QR. Generic over the data source: callers pass
// the four grid fields + a QR payload, so it serves both the signed-in
// pilgrim's home card and a scanned record's detail screen.
import { View, Text, StyleSheet } from "react-native";
import Svg, {
  Path,
  G,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import QRCode from "react-native-qrcode-svg";
import type { RiskLevel } from "@/types";

// Deep Nusuk-card accents per risk (richer than the live-map RISK_COLORS).
const RISK_THEME: Record<
  RiskLevel,
  { accent: string; labelEn: string; labelAr: string; warn: boolean }
> = {
  green: { accent: "#1a6b3c", labelEn: "Low", labelAr: "منخفض", warn: false },
  yellow: { accent: "#92640a", labelEn: "Medium", labelAr: "متوسط", warn: false },
  red: { accent: "#8b1a1a", labelEn: "High", labelAr: "مرتفع", warn: true },
};

export interface CardField {
  labelEn: string;
  labelAr: string;
  value: string;
  align?: "left" | "center";
}

// Simplified Saudi emblem (crossed swords + palm) — ported from Brand.jsx.
function SaudiEmblem({ size = 28, color = "#0f8f86" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <G stroke={color} strokeWidth={2.4} strokeLinecap="round">
        <Path d="M10 44c8 4 18 6 22 6s14-2 22-6" />
        <Path d="M12 40c7 3.4 15 5.2 20 5.2S46 43.4 52 40" />
      </G>
      <G fill={color}>
        <Path d="M14 41l3.4-1.8 1.7 3-3.3 1.8z" />
        <Path d="M50 41l-3.4-1.8-1.7 3 3.3 1.8z" />
      </G>
      <G stroke={color} strokeWidth={2} strokeLinecap="round" fill="none">
        <Path d="M32 38V20" />
        <Path d="M32 22c-3-5-9-7-14-6 4 1 7 3 9 6" />
        <Path d="M32 22c3-5 9-7 14-6-4 1-7 3-9 6" />
        <Path d="M32 19c-2-5-7-8-12-8 4 2 6 5 8 9" />
        <Path d="M32 19c2-5 7-8 12-8-4 2-6 5-8 9" />
        <Path d="M32 18c0-5-2-9-2-12 0 3-2 7-2 12" />
        <Path d="M32 18c0-5 2-9 2-12 0 3 2 7 2 12" />
      </G>
    </Svg>
  );
}

// Avatar: initials when known, else a silhouette (mirrors the web fallback).
function Avatar({ accent, initials }: { accent: string; initials?: string }) {
  return (
    <View style={[styles.avatar, { borderColor: accent }]}>
      {initials ? (
        <Text style={[styles.avatarInitials, { color: accent }]}>{initials}</Text>
      ) : (
        <Svg width={56} height={56} viewBox="0 0 24 24">
          <Circle cx={12} cy={8} r={4} fill="#cbd5e1" />
          <Path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" fill="#cbd5e1" />
        </Svg>
      )}
    </View>
  );
}

// One label+value cell: "ENGLISH / عربي" over a bold value.
function Field({ field }: { field: CardField }) {
  const align = field.align ?? "left";
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { textAlign: align }]}>
        {field.labelEn} / <Text style={styles.fieldLabelAr}>{field.labelAr}</Text>
      </Text>
      <Text style={[styles.fieldValue, { textAlign: align }]}>{field.value}</Text>
    </View>
  );
}

export default function HealthCard({
  name,
  nationality,
  initials,
  fields,
  risk,
  qrValue,
}: {
  name: string;
  nationality?: string | null;
  initials?: string;
  fields: CardField[];
  risk: RiskLevel;
  qrValue: string;
}) {
  const theme = RISK_THEME[risk];
  const rows: CardField[][] = [];
  for (let i = 0; i < fields.length; i += 2) rows.push(fields.slice(i, i + 2));

  return (
    <View style={styles.card}>
      {/* Header — ministry + Nusuk wordmark */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SaudiEmblem size={28} color="#0f8f86" />
          <View>
            <Text style={styles.kingdom}>Kingdom of Saudi Arabia</Text>
            <Text style={styles.ministry}>Ministry of Hajj &amp; Umrah</Text>
            <Text style={styles.ministryAr}>وزارة الحج والعمرة</Text>
          </View>
        </View>
        <View style={styles.wordmark}>
          <Svg width={42} height={22}>
            <Defs>
              <LinearGradient id="nusuk" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#0f8f86" />
                <Stop offset="0.5" stopColor="#2b6fa8" />
                <Stop offset="1" stopColor="#7e3b97" />
              </LinearGradient>
            </Defs>
            <SvgText x={42} y={17} textAnchor="end" fontSize={18} fontWeight="800" fill="url(#nusuk)">
              سند
            </SvgText>
          </Svg>
          <Text style={styles.wordmarkEn}>sanad</Text>
        </View>
      </View>

      {/* Risk stripe */}
      <View style={[styles.stripe, { backgroundColor: theme.accent }]}>
        <Text style={styles.stripeText}>
          {theme.warn ? "⚠ " : ""}RISK: {theme.labelEn.toUpperCase()}{"  "}
          <Text style={styles.stripeAr}>{theme.labelAr}</Text>
        </Text>
      </View>

      {/* Photo + name */}
      <View style={styles.identity}>
        <Avatar accent={theme.accent} initials={initials} />
        <Text style={styles.name}>{name}</Text>
        {nationality ? <Text style={styles.nationality}>{nationality}</Text> : null}
      </View>

      {/* Info grid */}
      <View style={styles.grid}>
        {rows.map((row, r) => (
          <View key={r} style={[styles.gridRow, r > 0 && styles.gridRowBorderT]}>
            {row.map((f, c) => (
              <View
                key={c}
                style={[styles.gridCell, c < row.length - 1 && styles.gridCellBorderR]}
              >
                <Field field={f} />
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* QR */}
      <View style={styles.qrWrap}>
        <View style={styles.qrBox}>
          <QRCode value={qrValue} size={104} backgroundColor="#ffffff" color="#1f2937" />
        </View>
        <Text style={styles.qrCaption}>SCAN ID</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerAr}>سند ضيوف الرحمن</Text>
        <Text style={styles.footerEn}>sanad · Hajj 1446</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    aspectRatio: 0.62, // vertical ID-badge proportions, like the real Nusuk card
    backgroundColor: "#fdf8ec", // matches the warm cream of the app's other cards
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ece3d0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  kingdom: {
    fontSize: 7,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#94a3b8",
  },
  ministry: { fontSize: 10, fontWeight: "800", color: "#1e293b" },
  ministryAr: { fontSize: 9, fontWeight: "600", color: "#64748b", textAlign: "left" },
  wordmark: { alignItems: "flex-end" },
  wordmarkEn: {
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 2.5,
    textTransform: "uppercase",
    color: "#94a3b8",
  },

  stripe: { paddingVertical: 4, alignItems: "center", justifyContent: "center" },
  stripeText: { color: "#ffffff", fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  stripeAr: { fontSize: 9, fontWeight: "800" },

  identity: { alignItems: "center", paddingHorizontal: 12, paddingTop: 12, paddingBottom: 6, gap: 4 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#f4edda",
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontSize: 32, fontWeight: "800", letterSpacing: 1 },
  name: { fontSize: 15, fontWeight: "700", color: "#0f172a", textAlign: "center" },
  nationality: { fontSize: 11, fontWeight: "500", color: "#94a3b8", textAlign: "center" },

  grid: { marginHorizontal: 12, marginTop: 4, borderWidth: 1, borderColor: "#ece3d0" },
  gridRow: { flexDirection: "row" },
  gridRowBorderT: { borderTopWidth: 1, borderTopColor: "#ece3d0" },
  gridCell: { flex: 1 },
  gridCellBorderR: { borderRightWidth: 1, borderRightColor: "#ece3d0" },
  field: { paddingHorizontal: 10, paddingVertical: 7 },
  fieldLabel: {
    fontSize: 7.5,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#64748b",
  },
  fieldLabelAr: { fontWeight: "500", color: "#94a3b8" },
  fieldValue: { marginTop: 3, fontSize: 11, fontWeight: "700", color: "#0f172a" },

  qrWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12, gap: 6 },
  qrBox: {
    backgroundColor: "#ffffff",
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  qrCaption: {
    fontSize: 7,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#94a3b8",
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "#f4edda",
    borderTopWidth: 1,
    borderTopColor: "#ece3d0",
  },
  footerAr: { fontSize: 9, fontWeight: "700", color: "#475569" },
  footerEn: {
    fontSize: 7.5,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#94a3b8",
  },
});
