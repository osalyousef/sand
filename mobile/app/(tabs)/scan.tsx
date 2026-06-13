import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Camera, Zap, RefreshCw } from "lucide-react-native";
import {
  resolveScannedPilgrim,
  randomBackendBraceletId,
} from "@/lib/pilgrim-registry";
import { useScanned } from "@/lib/scanned-store";

export default function Scan() {
  const router = useRouter();
  const { add } = useScanned();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const cooldown = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePayload = useCallback(
    async (raw: string) => {
      if (scanned) return;
      setScanned(true);
      const entry = await resolveScannedPilgrim(raw);
      if (!entry) {
        Alert.alert("رمز غير معروف", `لم يتم العثور على حاج بالمعرف:\n${raw}`, [
          { text: "حسنًا", onPress: () => setScanned(false) },
        ]);
        return;
      }
      add(entry); // append the scanned pilgrim to the recents list
      router.push({
        pathname: "/pilgrim/[id]",
        params: { id: entry.pilgrim.id, data: JSON.stringify(entry) },
      });
      cooldown.current = setTimeout(() => setScanned(false), 1500);
    },
    [router, scanned, add],
  );

  const demoScan = () => handlePayload(randomBackendBraceletId());

  // ─── permission states ─────────────────────────────────────────────────
  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color="#b07d12" />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Camera color="#b07d12" size={48} />
          <Text style={styles.permTitle}>الكاميرا مطلوبة</Text>
          <Text style={styles.permBody}>
            نحتاج إذن الكاميرا لمسح أساور الحجاج.
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>منح الإذن</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.demoBtnAlt} onPress={demoScan}>
            <Zap color="#3d3424" size={16} />
            <Text style={styles.demoBtnText}>محاكاة مسح للعرض</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── camera ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={
          scanned ? undefined : ({ data }) => handlePayload(data)
        }
      />

      {/* overlay */}
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.header}>
          <Text style={styles.title}>مسح أسوار الحاج</Text>
          <Text style={styles.subtitle}>وجّه الكاميرا نحو رمز QR</Text>
        </View>

        {/* reticle */}
        <View style={styles.reticleWrap} pointerEvents="none">
          <View style={styles.reticle}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>
        </View>

        {/* footer */}
        <View style={styles.footer}>
          {scanned && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => setScanned(false)}
            >
              <RefreshCw color="#3d3424" size={16} />
              <Text style={styles.resetText}>مسح مرة أخرى</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.demoBtn} onPress={demoScan}>
            <Zap color="#f7f0e1" size={16} />
            <Text style={styles.demoBtnTextDark}>محاكاة مسح للعرض</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f0e1" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },

  // permission
  permTitle: { color: "#3d3424", fontSize: 20, fontWeight: "800", marginTop: 12 },
  permBody: { color: "#6b6457", fontSize: 14, textAlign: "center", lineHeight: 20 },
  permBtn: {
    backgroundColor: "#b07d12",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  permBtnText: { color: "#3d3424", fontWeight: "700", fontSize: 15 },

  // overlay
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "space-between",
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 4,
  },
  title: { color: "#3d3424", fontSize: 20, fontWeight: "800" },
  subtitle: { color: "#3f3a30", fontSize: 13 },

  reticleWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  reticle: {
    width: 260,
    height: 260,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 36,
    height: 36,
    borderColor: "#b07d12",
  },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 10,
  },
  resetBtn: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "#cbbfa8",
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  resetText: { color: "#3d3424", fontWeight: "700", fontSize: 14 },
  demoBtn: {
    backgroundColor: "#b07d12",
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  demoBtnTextDark: { color: "#f7f0e1", fontWeight: "800", fontSize: 15 },
  demoBtnAlt: {
    marginTop: 6,
    backgroundColor: "#e6dcc8",
    borderWidth: 1,
    borderColor: "#cbbfa8",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  demoBtnText: { color: "#3d3424", fontWeight: "700", fontSize: 14 },
});
