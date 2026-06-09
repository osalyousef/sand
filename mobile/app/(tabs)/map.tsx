import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Circle } from "react-native-maps";
import { useEffect, useMemo, useRef, useState } from "react";
import { Flame, MapPin, ChevronLeft } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { RISK_COLORS, type RiskLevel } from "@/types";
import type { ScannedPilgrim } from "@/lib/scanned-store";

// ─── constants ─────────────────────────────────────────────────────────────

// Tight bounds around the Hajj corridor: Haram → Mina → Muzdalifah → Arafat.
const HAJJ_BOUNDS = {
  northEast: { latitude: 21.46, longitude: 40.02 },
  southWest: { latitude: 21.33, longitude: 39.79 },
};

// Centered on Mina — the densest cluster — at street-readable zoom.
const INITIAL_REGION = {
  latitude: 21.4133,
  longitude: 39.8940,
  latitudeDelta: 0.025,
  longitudeDelta: 0.025,
};

const RISK_LABELS: Record<RiskLevel, string> = {
  red: "حرج",
  yellow: "عالٍ",
  green: "منخفض",
};

const RISK_WEIGHT: Record<RiskLevel, number> = {
  red: 3,
  yellow: 2,
  green: 1,
};

// ─── types ─────────────────────────────────────────────────────────────────

interface PilgrimPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  risk: RiskLevel;
  location: string;
}

type Filter = RiskLevel | "all";
type ViewMode = "pins" | "heat";

// ─── mock data ─────────────────────────────────────────────────────────────

const PILGRIMS: PilgrimPin[] = [
  { id: "1",  name: "محمد الفارسي",  lat: 21.4225, lng: 39.8262, risk: "red",    location: "المسجد الحرام" },
  { id: "2",  name: "فاطمة سيدي",    lat: 21.4198, lng: 39.8241, risk: "red",    location: "المسجد الحرام" },
  { id: "3",  name: "علي حسن",        lat: 21.4248, lng: 39.8289, risk: "yellow", location: "المسجد الحرام" },
  { id: "4",  name: "خديجة نور",      lat: 21.4211, lng: 39.8275, risk: "green",  location: "المسجد الحرام" },
  { id: "5",  name: "يوسف أمين",      lat: 21.4235, lng: 39.8255, risk: "green",  location: "المسجد الحرام" },
  { id: "6",  name: "أحمد محمودي",    lat: 21.4133, lng: 39.8936, risk: "yellow", location: "منى" },
  { id: "7",  name: "سارة إبراهيم",   lat: 21.4118, lng: 39.8960, risk: "red",    location: "منى" },
  { id: "8",  name: "عمر خالد",       lat: 21.4150, lng: 39.8912, risk: "green",  location: "منى" },
  { id: "9",  name: "نور الدين",      lat: 21.4122, lng: 39.8944, risk: "yellow", location: "منى" },
  { id: "10", name: "ليلى حمدي",      lat: 21.4145, lng: 39.8975, risk: "green",  location: "منى" },
  { id: "11", name: "حسين رضا",       lat: 21.4108, lng: 39.8928, risk: "red",    location: "منى" },
  { id: "12", name: "مريم سالم",      lat: 21.4160, lng: 39.8950, risk: "green",  location: "منى" },
  { id: "13", name: "إبراهيم كانو",   lat: 21.3772, lng: 39.9350, risk: "yellow", location: "مزدلفة" },
  { id: "14", name: "حفصة دياو",      lat: 21.3758, lng: 39.9368, risk: "green",  location: "مزدلفة" },
  { id: "15", name: "عبدالله تورى",   lat: 21.3785, lng: 39.9335, risk: "yellow", location: "مزدلفة" },
  { id: "16", name: "زينب مالك",      lat: 21.3544, lng: 39.9848, risk: "red",    location: "عرفات" },
  { id: "17", name: "طارق منصور",     lat: 21.3562, lng: 39.9865, risk: "yellow", location: "عرفات" },
  { id: "18", name: "آمنة جبريل",     lat: 21.3528, lng: 39.9831, risk: "green",  location: "عرفات" },
  { id: "19", name: "بلال عثمان",     lat: 21.3550, lng: 39.9820, risk: "yellow", location: "عرفات" },
  { id: "20", name: "رقية أحمد",      lat: 21.3535, lng: 39.9860, risk: "red",    location: "عرفات" },
];

const SITES: { key: string; label: string; lat: number; lng: number; delta: number }[] = [
  { key: "haram",      label: "الحرم",     lat: 21.4225, lng: 39.8262, delta: 0.015 },
  { key: "mina",       label: "منى",       lat: 21.4133, lng: 39.8940, delta: 0.020 },
  { key: "muzdalifah", label: "مزدلفة",   lat: 21.3770, lng: 39.9355, delta: 0.020 },
  { key: "arafat",     label: "عرفات",     lat: 21.3545, lng: 39.9840, delta: 0.020 },
];

// ─── dark map style (Google Maps JSON) ─────────────────────────────────────

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1d1d1d" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1d1d1d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d1d5db" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1f2a1f" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a2a" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1d1d1d" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3a2a1a" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#fdba74" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a0a0a" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4b5563" }] },
];

// ─── screen ────────────────────────────────────────────────────────────────

// Vitals + score that read plausibly for the demo, derived from the pin's risk.
function synthesize(pin: PilgrimPin): ScannedPilgrim {
  const now = new Date().toISOString();
  const byRisk = {
    red:    { hr: 132, temp: 39.4, ox: 89, score: 0.87 },
    yellow: { hr: 108, temp: 38.1, ox: 94, score: 0.55 },
    green:  { hr:  78, temp: 36.8, ox: 98, score: 0.18 },
  }[pin.risk];

  return {
    pilgrim: {
      id: pin.id,
      full_name: pin.name,
      age: 58,
      nationality: pin.location,
      passport_number: `P${pin.id.padStart(7, "0")}`,
      has_diabetes: pin.risk !== "green",
      has_heart_condition: pin.risk === "red",
      has_hypertension: pin.risk !== "green",
      medications: pin.risk === "red" ? ["ميتفورمين", "أملوديبين"] : null,
      created_at: now,
    },
    vitals: {
      id: `v-${pin.id}`,
      pilgrim_id: pin.id,
      heart_rate: byRisk.hr,
      temperature: byRisk.temp,
      oxygen_level: byRisk.ox,
      recorded_at: now,
    },
    risk: {
      id: `r-${pin.id}`,
      pilgrim_id: pin.id,
      risk_level: pin.risk,
      score: byRisk.score,
      assessed_at: now,
    },
    scannedAt: now,
  };
}

export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ focus?: string }>();
  const [selected, setSelected] = useState<PilgrimPin | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [mode, setMode] = useState<ViewMode>("pins");
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (!params.focus) return;
    const pin = PILGRIMS.find((p) => p.id === params.focus);
    if (!pin) return;
    const t = setTimeout(() => {
      setMode("pins");
      setSelected(pin);
      mapRef.current?.animateToRegion(
        { latitude: pin.lat, longitude: pin.lng, latitudeDelta: 0.008, longitudeDelta: 0.008 },
        500,
      );
    }, 500);
    return () => clearTimeout(t);
  }, [params.focus]);

  const openDetail = (pin: PilgrimPin) => {
    router.push({
      pathname: "/pilgrim/[id]",
      params: {
        id: pin.id,
        data: JSON.stringify(synthesize(pin)),
        lat: String(pin.lat),
        lng: String(pin.lng),
      },
    });
  };

  useEffect(() => {
    const t = setTimeout(() => {
      mapRef.current?.setMapBoundaries?.(HAJJ_BOUNDS.northEast, HAJJ_BOUNDS.southWest);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const visible = useMemo(
    () => (filter === "all" ? PILGRIMS : PILGRIMS.filter((p) => p.risk === filter)),
    [filter],
  );

  const counts = useMemo(
    () => ({
      red:    PILGRIMS.filter((p) => p.risk === "red").length,
      yellow: PILGRIMS.filter((p) => p.risk === "yellow").length,
      green:  PILGRIMS.filter((p) => p.risk === "green").length,
    }),
    [],
  );

  const flyTo = (lat: number, lng: number, delta: number) => {
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta },
      450,
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.modeBtn}
          onPress={() => setMode(mode === "pins" ? "heat" : "pins")}
          activeOpacity={0.7}
        >
          {mode === "pins" ? (
            <Flame color="#f97316" size={16} />
          ) : (
            <MapPin color="#374151" size={16} />
          )}
          <Text style={styles.modeBtnText}>
            {mode === "pins" ? "حرارة" : "نقاط"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === "heat" ? "الخريطة الحرارية" : "خريطة الحجاج"}
        </Text>
      </View>

      {/* site jump bar */}
      <View style={styles.siteBar}>
        {SITES.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={styles.siteChip}
            onPress={() => flyTo(s.lat, s.lng, s.delta)}
            activeOpacity={0.7}
          >
            <Text style={styles.siteChipText}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* filter bar */}
      <View style={styles.filterBar}>
        {(["red", "yellow", "green"] as RiskLevel[]).map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.chip,
              filter === level && {
                borderColor: RISK_COLORS[level],
                backgroundColor: `${RISK_COLORS[level]}18`,
              },
            ]}
            onPress={() => setFilter(filter === level ? "all" : level)}
            activeOpacity={0.7}
          >
            <View style={[styles.chipDot, { backgroundColor: RISK_COLORS[level] }]} />
            <Text style={styles.chipLabel}>{RISK_LABELS[level]}</Text>
            <Text style={[styles.chipCount, { color: RISK_COLORS[level] }]}>
              {counts[level]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        minZoomLevel={11}
        maxZoomLevel={18}
        onPress={() => setSelected(null)}
        showsPointsOfInterests={false}
        showsBuildings
        showsCompass={false}
        userInterfaceStyle="dark"
        customMapStyle={DARK_MAP_STYLE}
      >
        {mode === "pins" &&
          visible.map((pin) => {
            const color = RISK_COLORS[pin.risk];
            return (
              <Marker
                key={pin.id}
                coordinate={{ latitude: pin.lat, longitude: pin.lng }}
                onPress={() => setSelected(pin)}
                tracksViewChanges={false}
              >
                <View style={[styles.pin, { borderColor: color }]}>
                  <View style={[styles.pinCore, { backgroundColor: color }]} />
                </View>
              </Marker>
            );
          })}

        {mode === "heat" &&
          visible.flatMap((pin) => {
            const color = RISK_COLORS[pin.risk];
            const w = RISK_WEIGHT[pin.risk];
            const base = 60 * w;
            return [
              <Circle
                key={`${pin.id}-outer`}
                center={{ latitude: pin.lat, longitude: pin.lng }}
                radius={base * 2.2}
                strokeColor="transparent"
                fillColor={`${color}10`}
              />,
              <Circle
                key={`${pin.id}-mid`}
                center={{ latitude: pin.lat, longitude: pin.lng }}
                radius={base * 1.3}
                strokeColor="transparent"
                fillColor={`${color}22`}
              />,
              <Circle
                key={`${pin.id}-core`}
                center={{ latitude: pin.lat, longitude: pin.lng }}
                radius={base * 0.6}
                strokeColor="transparent"
                fillColor={`${color}55`}
              />,
            ];
          })}

        {mode === "pins" && selected && (
          <Circle
            center={{ latitude: selected.lat, longitude: selected.lng }}
            radius={150}
            strokeColor={RISK_COLORS[selected.risk]}
            fillColor={`${RISK_COLORS[selected.risk]}22`}
            strokeWidth={2}
          />
        )}
      </MapView>

      {/* callout */}
      {selected && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => openDetail(selected)}
          style={[styles.callout, { borderLeftColor: RISK_COLORS[selected.risk] }]}
        >
          <ChevronLeft color="#9ca3af" size={20} />
          <View style={styles.calloutBody}>
            <Text style={styles.calloutName}>{selected.name}</Text>
            <Text style={styles.calloutMeta}>
              {selected.location} · {RISK_LABELS[selected.risk]} · اضغط للتفاصيل
            </Text>
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              setSelected(null);
            }}
            hitSlop={10}
          >
            <Text style={styles.calloutClose}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* legend */}
      <View style={styles.legend}>
        {(["red", "yellow", "green"] as RiskLevel[]).map((level) => (
          <View key={level} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: RISK_COLORS[level] }]} />
            <Text style={styles.legendText}>{RISK_LABELS[level]}</Text>
          </View>
        ))}
      </View>
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
    paddingVertical: 12,
    backgroundColor: "#0d0d0d",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#262626",
    backgroundColor: "#161616",
  },
  modeBtnText: { color: "#e5e7eb", fontSize: 12, fontWeight: "700" },

  siteBar: {
    flexDirection: "row",
    backgroundColor: "#0d0d0d",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  siteChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#1f2937",
    alignItems: "center",
  },
  siteChipText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  filterBar: {
    flexDirection: "row",
    backgroundColor: "#0d0d0d",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#262626",
    backgroundColor: "#161616",
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipLabel: { color: "#e5e7eb", fontSize: 12, fontWeight: "600" },
  chipCount: { fontSize: 13, fontWeight: "800" },

  map: { flex: 1 },

  pin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    backgroundColor: "#0d0d0d",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  pinCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  callout: {
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: "#161616",
    borderRadius: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "#262626",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  calloutBody: { alignItems: "flex-end", flex: 1 },
  calloutName: { color: "#fff", fontSize: 15, fontWeight: "700", textAlign: "right" },
  calloutMeta: { color: "#9ca3af", fontSize: 13, textAlign: "right", marginTop: 2 },
  calloutClose: { color: "#9ca3af", fontSize: 18, paddingLeft: 12 },

  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    paddingVertical: 10,
    backgroundColor: "#0d0d0d",
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: "#e5e7eb", fontSize: 12, fontWeight: "600" },
});
