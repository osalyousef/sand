// Operational data layer for the field app — health institutions, field teams,
// shift state, environmental readings, and analytics. Ported from the web
// dashboard (dashboard2/lib/ops-data.ts + mock-data.ts) and recolored for the
// app's warm-paper light theme. Deterministic; no randomness.

import type { RiskLevel } from "@/types";

/* ================= Health institutions ================= */

export type InstitutionStatus = "operational" | "overwhelmed" | "full";
export type InstitutionType = "hospital" | "center" | "first-aid" | "mobile";

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  lat: number;
  lng: number;
  bedsTotal: number;
  bedsOccupied: number;
  specialties: string[];
  distanceKm: number; // from the current worst hotspot (Jamarat)
  etaMin: number;
  casesToday: number;
  contact: string;
  radio: string;
  status: InstitutionStatus;
}

export const INSTITUTION_STATUS_META: Record<
  InstitutionStatus,
  { label: string; color: string }
> = {
  operational: { label: "تعمل", color: "#22c55e" },
  overwhelmed: { label: "ضغط عالٍ", color: "#eab308" },
  full: { label: "ممتلئ", color: "#ef4444" },
};

export const INSTITUTION_TYPE_LABEL: Record<InstitutionType, string> = {
  hospital: "مستشفى",
  center: "مركز طبي",
  "first-aid": "نقطة إسعاف",
  mobile: "وحدة متنقلة",
};

export const INSTITUTIONS: Institution[] = [
  {
    id: "H01", name: "المستشفى الميداني بمنى", type: "hospital",
    lat: 21.398, lng: 39.885,
    bedsTotal: 200, bedsOccupied: 142,
    specialties: ["عناية مركزة", "قلب", "إصابات", "ضربات حرارة"],
    distanceKm: 1.8, etaMin: 6, casesToday: 96,
    contact: "920001111", radio: "قناة ٣",
    status: "operational",
  },
  {
    id: "H02", name: "المركز الطبي بعرفات", type: "center",
    lat: 21.355, lng: 39.984,
    bedsTotal: 120, bedsOccupied: 117,
    specialties: ["طوارئ", "ضربات حرارة", "جفاف"],
    distanceKm: 12.4, etaMin: 22, casesToday: 134,
    contact: "920002222", radio: "قناة ٥",
    status: "overwhelmed",
  },
  {
    id: "H03", name: "نقاط الإسعاف بمزدلفة", type: "first-aid",
    lat: 21.383, lng: 39.936,
    bedsTotal: 40, bedsOccupied: 12,
    specialties: ["إسعافات أولية", "ترطيب"],
    distanceKm: 6.7, etaMin: 14, casesToday: 28,
    contact: "920003333", radio: "قناة ٧",
    status: "operational",
  },
  {
    id: "H04", name: "مدينة الملك عبدالله الطبية", type: "hospital",
    lat: 21.4258, lng: 39.795,
    bedsTotal: 350, bedsOccupied: 289,
    specialties: ["عناية مركزة", "قلب", "أطفال", "إصابات", "جراحة"],
    distanceKm: 8.2, etaMin: 25, casesToday: 41,
    contact: "920004444", radio: "قناة ١",
    status: "operational",
  },
  {
    id: "H05", name: "عيادات جسر الجمرات", type: "center",
    lat: 21.4225, lng: 39.871,
    bedsTotal: 60, bedsOccupied: 60,
    specialties: ["طوارئ", "ضربات حرارة"],
    distanceKm: 0.3, etaMin: 2, casesToday: 71,
    contact: "920005555", radio: "قناة ٢",
    status: "full",
  },
  {
    id: "M01", name: "الوحدة المتنقلة م١", type: "mobile",
    lat: 21.408, lng: 39.874,
    bedsTotal: 8, bedsOccupied: 3,
    specialties: ["إسعافات أولية", "نقل"],
    distanceKm: 1.6, etaMin: 5, casesToday: 17,
    contact: "0556000001", radio: "قناة ٩",
    status: "operational",
  },
  {
    id: "M02", name: "الوحدة المتنقلة م٢", type: "mobile",
    lat: 21.388, lng: 39.858,
    bedsTotal: 8, bedsOccupied: 5,
    specialties: ["إسعافات أولية", "نقل"],
    distanceKm: 4.1, etaMin: 9, casesToday: 13,
    contact: "0556000002", radio: "قناة ٩",
    status: "operational",
  },
];

export function occupancyPct(inst: Institution): number {
  return Math.round((inst.bedsOccupied / inst.bedsTotal) * 100);
}

export function bedsFree(inst: Institution): number {
  return inst.bedsTotal - inst.bedsOccupied;
}

export function occupancyColor(pct: number): string {
  return pct >= 95 ? "#ef4444" : pct >= 75 ? "#eab308" : "#22c55e";
}

/**
 * Nearest institution that can actually take a patient: has a free bed and
 * isn't marked full, closest by ETA. When `needsHospital` is set (critical /
 * cardiac case) only true hospitals/centers are considered. Falls back to the
 * closest non-full facility if nothing matches.
 */
export function nearestWithCapacity(needsHospital = false): Institution {
  const open = INSTITUTIONS.filter(
    (i) => i.status !== "full" && bedsFree(i) > 0,
  );
  const pool = needsHospital
    ? open.filter((i) => i.type === "hospital" || i.type === "center")
    : open;
  const ranked = (pool.length > 0 ? pool : open).sort(
    (a, b) => a.etaMin - b.etaMin,
  );
  return ranked[0] ?? INSTITUTIONS[0];
}

/* ================= Field teams ================= */

export type TeamStatus = "available" | "dispatched" | "on-scene";

export interface FieldTeam {
  id: string;
  name: string;
  members: number;
  status: TeamStatus;
  location: string;
  lat: number;
  lng: number;
  hours: number; // hours on shift (12h shift) — fatigue indicator
}

export const TEAM_STATUS_META: Record<
  TeamStatus,
  { label: string; color: string }
> = {
  available: { label: "متاح", color: "#22c55e" },
  dispatched: { label: "في الطريق", color: "#eab308" },
  "on-scene": { label: "في الموقع", color: "#3b82f6" },
};

export const FIELD_TEAMS: FieldTeam[] = [
  { id: "T01", name: "فريق الإسعاف أ", members: 4, status: "dispatched", location: "قطاع منى A", lat: 21.4150, lng: 39.8915, hours: 9 },
  { id: "T02", name: "فريق الاستجابة ب", members: 3, status: "on-scene", location: "جسر الجمرات", lat: 21.4228, lng: 39.8728, hours: 7 },
  { id: "T03", name: "فريق الرعاية ج", members: 5, status: "available", location: "المستشفى الميداني", lat: 21.3985, lng: 39.8852, hours: 4 },
  { id: "T04", name: "فريق التدخل السريع", members: 4, status: "dispatched", location: "طريق عرفات", lat: 21.3560, lng: 39.9850, hours: 11 },
  { id: "T05", name: "فريق الدعم الطبي", members: 3, status: "available", location: "المعسكر الرئيسي", lat: 21.4090, lng: 39.8770, hours: 2 },
];

export function fatigueColor(hours: number): string {
  return hours >= 9 ? "#ef4444" : hours >= 6 ? "#eab308" : "#22c55e";
}

/* ================= Shift ================= */

export const CURRENT_SHIFT = {
  name: "الوردية النهارية ب",
  supervisor: "د. خالد العتيبي",
  start: "٠٨:٠٠",
  end: "٢٠:٠٠",
  elapsedPct: 75,
  staffOnDuty: 38,
  nextShiftMin: 47,
  handoffNotes: [
    "مخيم C3: أعطال تكييف مستمرة — توقع حالات إجهاد حراري متكررة",
    "نقص محاليل وريدية في الوحدة المتنقلة م٢ — طلب تزويد مُرسل ١٣:٤٠",
  ],
};

export const RECOVERY_STATS = { today: 23, yesterday: 19 };

/* ================= Environment ================= */

export type CrowdLevel = "low" | "medium" | "high" | "critical";

export interface EnvReading {
  site: string;
  temp: number;
  humidity: number;
  heatIndex: number; // "feels like"
  uv: number;
  windKmh: number;
  crowd: CrowdLevel;
}

export const CROWD_META: Record<CrowdLevel, { label: string; color: string }> = {
  low: { label: "منخفضة", color: "#22c55e" },
  medium: { label: "متوسطة", color: "#3b82f6" },
  high: { label: "عالية", color: "#eab308" },
  critical: { label: "حرجة", color: "#ef4444" },
};

export const ENV_READINGS: EnvReading[] = [
  { site: "منى", temp: 47, humidity: 18, heatIndex: 51, uv: 11, windKmh: 14, crowd: "critical" },
  { site: "عرفات", temp: 45, humidity: 22, heatIndex: 49, uv: 10, windKmh: 18, crowd: "high" },
  { site: "مزدلفة", temp: 43, humidity: 20, heatIndex: 46, uv: 9, windKmh: 16, crowd: "medium" },
];

/* ================= Analytics (Data screen) ================= */

export const RISK_DISTRIBUTION: Record<RiskLevel, number> = {
  green: 24,
  yellow: 11,
  red: 5,
};

export const CHRONIC_CONDITIONS: { name: string; count: number; color: string }[] = [
  { name: "ارتفاع الضغط", count: 18, color: "#6366f1" },
  { name: "السكري", count: 12, color: "#f59e0b" },
  { name: "أمراض القلب", count: 7, color: "#ef4444" },
  { name: "الجهاز التنفسي", count: 9, color: "#3b82f6" },
  { name: "لا يوجد", count: 34, color: "#22c55e" },
];

export const HOURLY_ALERTS = [2, 4, 3, 7, 12, 9, 6, 14, 11, 8, 5, 3, 2, 6, 10, 13, 9, 7, 4, 3, 5, 8, 11, 6];

export const AI_KPIS = {
  predictionAccuracy: 94.2,
  agentResolutionRate: 78.5,
  avgResponseTime: "1m 24s",
  activeAlerts: 5,
  totalPilgrims: 40,
  fieldTeams: 5,
  icuOccupancy: 68,
  fieldHospitalOccupancy: 42,
  ambulances: { total: 12, available: 7 },
};
