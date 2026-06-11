// Operational data layer: alert lifecycle, per-pilgrim medical timelines,
// health institutions, shift management, and environmental readings.
// Everything here is deterministic (no randomness) so server and client agree.

import { MOCK_ALERTS, MOCK_PILGRIMS, type MockPilgrim } from "./mock-data";

/* ================= Alert lifecycle =================
 * 🔴 New → 🟡 Dispatched → 🔵 Under treatment → ✅ Resolved / 🏥 Transferred
 */
export type AlertStatus = "new" | "dispatched" | "treating" | "resolved" | "transferred";

export const ALERT_STATUS_META: Record<
  AlertStatus,
  { label: string; color: string; chip: string; step: number }
> = {
  new:         { label: "جديد",           color: "#ef4444", chip: "bg-red-500/10 border-red-500/50 text-red-400",       step: 0 },
  dispatched:  { label: "فريق في الطريق", color: "#f59e0b", chip: "bg-yellow-500/10 border-yellow-500/50 text-yellow-400", step: 1 },
  treating:    { label: "قيد العلاج",     color: "#3b82f6", chip: "bg-blue-500/10 border-blue-500/50 text-blue-400",     step: 2 },
  resolved:    { label: "تم الحل",        color: "#00d4aa", chip: "bg-emerald-500/10 border-emerald-500/50 text-emerald-400", step: 3 },
  transferred: { label: "نُقل للمستشفى",  color: "#a855f7", chip: "bg-purple-500/10 border-purple-500/50 text-purple-400", step: 3 },
};

export const LIFECYCLE_STEPS: AlertStatus[] = ["new", "dispatched", "treating", "resolved"];

// Initial status per active alert (deterministic spread across the lifecycle).
const STATUS_CYCLE: AlertStatus[] = ["new", "dispatched", "treating", "new", "dispatched"];
export const INITIAL_ALERT_STATUS: Record<string, AlertStatus> = Object.fromEntries(
  MOCK_ALERTS.map((a, i) => [a.id, STATUS_CYCLE[i % STATUS_CYCLE.length]])
);

/* ================= Medical event timeline ================= */
export type MedicalEventType = "hotline" | "dispatch" | "treatment" | "transfer" | "discharge";

export interface MedicalEvent {
  id: string;
  type: MedicalEventType;
  title: string;
  detail: string;
  actor?: string; // treating doctor / team
  when: string;   // "٨ ذو الحجة · ١٤:٣٢"
}

const TEAM_NAMES = ["فريق الإسعاف أ", "فريق الاستجابة ب", "فريق الرعاية ج", "فريق التدخل السريع", "فريق الدعم الطبي"];
const DOCTORS = ["د. خالد العتيبي", "د. سارة القحطاني", "د. فهد الزهراني", "د. منى الشريف"];
const TREATMENTS = [
  "محاليل وريدية وتبريد سطحي للجسم",
  "أكسجين عبر القناع ومراقبة تخطيط القلب",
  "قياس سكر الدم وإعطاء جرعة جلوكوز",
  "خافض حرارة وترطيب فموي مكثف",
  "تثبيت العلامات الحيوية ومراقبة لمدة ٣٠ دقيقة",
];
const DOCTOR_NOTES = [
  "استجابة جيدة للعلاج، يُنصح بتجنب الشمس حتى المغرب",
  "الحالة مستقرة، متابعة قياس الضغط كل ٤ ساعات",
  "يحتاج مراجعة العيادة خلال ٢٤ ساعة للاطمئنان",
  "تحسن ملحوظ بعد الترطيب، شرب الماء كل ٣٠ دقيقة",
];

// Builds the chronological health log from the pilgrim's alert history.
// Newest first. Deterministic per pilgrim (index-based picks).
export function getTimeline(p: MockPilgrim): MedicalEvent[] {
  const n = parseInt(p.id.slice(1), 10) || 0;
  const events: MedicalEvent[] = [];

  p.alertHistory.forEach((h, i) => {
    const team = TEAM_NAMES[(n + i) % TEAM_NAMES.length];
    const doctor = DOCTORS[(n + i) % DOCTORS.length];
    const transferred = h.resolution.includes("نُقل");

    events.push({
      id: `${h.id}-call`,
      type: "hotline",
      title: "بلاغ عبر الخط الساخن",
      detail: `أبلغ الحاج عن «${h.condition}» — نبض ${h.heartRate}، حرارة ${h.temperature}°م، أكسجين ${h.oxygenLevel}%`,
      when: h.dateLabel,
    });
    events.push({
      id: `${h.id}-dispatch`,
      type: "dispatch",
      title: "إرسال فريق ميداني",
      detail: `${team} — زمن الوصول التقديري ~٥ دقائق`,
      actor: team,
      when: h.dateLabel,
    });
    events.push({
      id: `${h.id}-treat`,
      type: "treatment",
      title: "علاج ميداني في الموقع",
      detail: TREATMENTS[(n + i) % TREATMENTS.length],
      actor: doctor,
      when: h.dateLabel,
    });
    if (transferred) {
      events.push({
        id: `${h.id}-transfer`,
        type: "transfer",
        title: "نقل إلى المستشفى الميداني بمنى",
        detail: "نُقل بسيارة إسعاف مع مرافقة طبية، استقرت الحالة عند الوصول",
        actor: team,
        when: h.dateLabel,
      });
    }
    if (h.resolved) {
      events.push({
        id: `${h.id}-discharge`,
        type: "discharge",
        title: transferred ? "خروج من المستشفى — الحالة مستقرة" : "إغلاق الحالة — مستقرة",
        detail: `ملاحظة الطبيب: ${DOCTOR_NOTES[(n + i) % DOCTOR_NOTES.length]}`,
        actor: doctor,
        when: h.dateLabel,
      });
    }
  });

  return events.reverse();
}

/* ================= Cure / discharge ================= */
export interface DischargeRecord {
  condition: string;
  treatment: string;
  followUp: string;
  doctor: string;
  team: string;
  time: string;
}

// Pilgrims already cured and discharged today.
export const RECOVERED_IDS = new Set(["P029", "P030", "P031", "P032", "P033", "P034"]);

export function getDischarge(p: MockPilgrim): DischargeRecord {
  const n = parseInt(p.id.slice(1), 10) || 0;
  return {
    condition: ["إجهاد حراري", "انخفاض الأكسجين", "أزمة سكري", "إرهاق شديد"][n % 4],
    treatment: TREATMENTS[n % TREATMENTS.length],
    followUp: DOCTOR_NOTES[n % DOCTOR_NOTES.length],
    doctor: DOCTORS[n % DOCTORS.length],
    team: TEAM_NAMES[n % TEAM_NAMES.length],
    time: `٩ ذو الحجة · ${["٠٩:١٥", "١٠:٤٠", "١١:٢٢", "١٢:٠٥", "١٣:٣٠", "١٤:١٠"][n % 6]}`,
  };
}

export const RECOVERY_STATS = { today: 23, yesterday: 19 };

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
  distanceKm: number;   // from the current worst hotspot (Jamarat)
  etaMin: number;
  casesToday: number;
  contact: string;
  radio: string;
  status: InstitutionStatus;
}

export const INSTITUTION_STATUS_META: Record<InstitutionStatus, { label: string; chip: string; dot: string }> = {
  operational: { label: "تعمل",     chip: "bg-emerald-500/10 border-emerald-500/50 text-emerald-400", dot: "bg-emerald-500" },
  overwhelmed: { label: "ضغط عالٍ", chip: "bg-yellow-500/10 border-yellow-500/50 text-yellow-400",    dot: "bg-yellow-500 animate-pulse" },
  full:        { label: "ممتلئ",    chip: "bg-red-500/10 border-red-500/50 text-red-400",             dot: "bg-red-500 animate-pulse" },
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

export function occupancyColor(pct: number): string {
  return pct >= 95 ? "#ef4444" : pct >= 75 ? "#f59e0b" : "#00d4aa";
}

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

export const CROWD_META: Record<CrowdLevel, { label: string; chip: string }> = {
  low:      { label: "منخفضة", chip: "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" },
  medium:   { label: "متوسطة", chip: "bg-blue-500/10 border-blue-500/50 text-blue-400" },
  high:     { label: "عالية",  chip: "bg-yellow-500/10 border-yellow-500/50 text-yellow-400" },
  critical: { label: "حرجة",   chip: "bg-red-500/10 border-red-500/50 text-red-400" },
};

export const ENV_READINGS: EnvReading[] = [
  { site: "منى",     temp: 47, humidity: 18, heatIndex: 51, uv: 11, windKmh: 14, crowd: "critical" },
  { site: "عرفات",   temp: 45, humidity: 22, heatIndex: 49, uv: 10, windKmh: 18, crowd: "high" },
  { site: "مزدلفة",  temp: 43, humidity: 20, heatIndex: 46, uv: 9,  windKmh: 16, crowd: "medium" },
];

/* ================= Shifts & teams ================= */
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

// Hours each team has been on shift (fatigue indicator, 12h shift).
export const TEAM_HOURS: Record<string, number> = {
  T01: 9, T02: 7, T03: 4, T04: 11, T05: 2,
};

export function fatigueColor(hours: number): string {
  return hours >= 9 ? "#ef4444" : hours >= 6 ? "#f59e0b" : "#00d4aa";
}

/* ================= Hotline queue ================= */
// Seconds each contact has been waiting (live timers tick from these).
export const WAIT_SECONDS: Record<string, number> = {
  C001: 12, C002: 45, C003: 80, C004: 8, C005: 152, C006: 33,
};

/* ================= Status bar ================= */
export const OPS_SUMMARY = {
  responseImproving: true,
  responseDelta: "١٢٪",
  avgResponse: "1m 24s",
  resolvedToday: RECOVERY_STATS.today,
  resolvedYesterday: RECOVERY_STATS.yesterday,
  teamAvailabilityPct: 40,
  nextShiftMin: CURRENT_SHIFT.nextShiftMin,
};

// Unhandled critical alerts → global notification badge.
export const CRITICAL_NOTIFICATIONS = MOCK_ALERTS.filter(
  a => a.riskLevel === "red" && INITIAL_ALERT_STATUS[a.id] === "new"
);

export { MOCK_PILGRIMS };
