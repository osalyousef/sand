import type { RiskLevel } from "./types";

export interface AlertHistoryEntry {
  id: string;
  riskLevel: RiskLevel;
  condition: string;        // what triggered it
  resolution: string;       // how it was handled
  resolved: boolean;
  // vitals snapshot at the time of the alert
  heartRate: number;
  temperature: number;
  oxygenLevel: number;
  timeLabel: string;        // relative, e.g. "قبل ساعتين"
  dateLabel: string;        // absolute, e.g. "٨ ذو الحجة · ١٤:٣٢"
}

export interface MockPilgrim {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female";
  nationality: string;
  nationalityFlag: string;
  passportNumber: string;
  bloodType: string;
  riskLevel: RiskLevel;
  heartRate: number;
  temperature: number;
  oxygenLevel: number;
  hasDiabetes: boolean;
  hasHeartCondition: boolean;
  hasHypertension: boolean;
  medications: string[];
  lat: number;
  lng: number;
  condition?: string;
  alertTime?: string;
  lastUpdate: string;
  alertHistory: AlertHistoryEntry[];
}

export interface MockTeam {
  id: string;
  name: string;
  members: number;
  status: "available" | "dispatched" | "on-scene";
  location: string;
  assignedAlert?: string;
}

export interface ChatMessage {
  id: string;
  sender: "pilgrim" | "support";
  text: string;          // original language
  translation?: string;  // Arabic translation (for pilgrim msgs) / pilgrim-lang (for support msgs)
  time: string;
}

export interface MockContact {
  id: string;
  type: "call" | "chat";
  pilgrimId: string;        // links to a MOCK_PILGRIMS record
  pilgrimName: string;
  language: string;
  flag: string;
  riskLevel: RiskLevel;
  issue: string;
  waitTime: string;            // how long they've waited in queue
  // call only:
  transcript?: string;         // spoken, original language
  translation?: string;        // spoken, translated to Arabic
  // chat only:
  messages?: ChatMessage[];
}

// Mina / Mecca bounding box (approximate)
// lat 21.38–21.43, lng 39.85–39.91
const LATS = [21.382, 21.395, 21.410, 21.421, 21.388, 21.401, 21.415, 21.427, 21.391, 21.406];
const LNGS = [39.853, 39.862, 39.871, 39.880, 39.889, 39.857, 39.866, 39.875, 39.884, 39.893];

const NATIONALITIES = [
  { name: "السعودية", flag: "🇸🇦" },
  { name: "إندونيسيا", flag: "🇮🇩" },
  { name: "باكستان", flag: "🇵🇰" },
  { name: "بنغلاديش", flag: "🇧🇩" },
  { name: "نيجيريا", flag: "🇳🇬" },
  { name: "مصر", flag: "🇪🇬" },
  { name: "تركيا", flag: "🇹🇷" },
  { name: "إيران", flag: "🇮🇷" },
  { name: "ماليزيا", flag: "🇲🇾" },
  { name: "المغرب", flag: "🇲🇦" },
];

const NAMES = [
  "أحمد الراشدي", "فاطمة يوسف", "محمد إقبال", "عائشة بيغوم",
  "إبراهيم أوكونكو", "زينب حسن", "مصطفى دمير", "خديجة أحمدي",
  "يوسف بن إسماعيل", "مريم الأمين", "عمر شيخ", "نور الفارسي",
  "حسن كريمي", "ليلى بطرس", "بلال صديقي", "سميرة تان",
  "طارق الغامدي", "رقية باتيل", "إدريس توري", "حفصة مالك",
];

const MEDS = ["أملوديبين ٥مغ", "ميتفورمين ٥٠٠مغ", "إنسولين", "أسبرين ٧٥مغ", "أتورفاستاتين", "ليزينوبريل"];
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const CONDITIONS = ["إجهاد حراري", "ألم في الصدر", "انخفاض الأكسجين", "ارتفاع ضغط الدم", "أزمة سكري", "إرهاق شديد"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min: number, max: number, decimals = 0) {
  const v = Math.random() * (max - min) + min;
  return parseFloat(v.toFixed(decimals));
}

function riskFromVitals(hr: number, temp: number, o2: number): RiskLevel {
  if (temp >= 39.5 || hr >= 115 || o2 <= 93) return "red";
  if (temp >= 38.5 || hr >= 100 || o2 <= 96) return "yellow";
  return "green";
}

const TIMES = ["0:32", "1:14", "2:05", "3:47", "5:20", "7:01", "9:33", "12:18"];

const RESOLUTIONS = [
  "تم إرسال فريق طبي",
  "تمت المتابعة هاتفياً",
  "نُقل إلى المستشفى الميداني",
  "قُدّمت إسعافات أولية",
  "تم الترطيب والمراقبة",
];
const HIJRI_DAYS = ["٧ ذو الحجة", "٨ ذو الحجة", "٩ ذو الحجة", "١٠ ذو الحجة"];
const REL_TIMES = ["قبل ١٢ دقيقة", "قبل ٤٥ دقيقة", "قبل ساعتين", "قبل ٥ ساعات", "أمس", "قبل يومين"];
const CLOCKS = ["٠٨:١٢", "١١:٤٥", "١٤:٣٢", "١٦:٠٧", "١٩:٢٠", "٢٢:٥١"];

function buildAlertHistory(pilgrimSeed: number): AlertHistoryEntry[] {
  const count = Math.floor(Math.random() * 5); // 0–4 past alerts
  return Array.from({ length: count }, (_, k) => {
    const level: RiskLevel = Math.random() > 0.6 ? "red" : "yellow";
    const resolved = k > 0 || Math.random() > 0.3; // most past ones resolved
    return {
      id: `${pilgrimSeed}-A${k + 1}`,
      riskLevel: level,
      condition: pick(CONDITIONS),
      resolution: pick(RESOLUTIONS),
      resolved,
      heartRate: rand(95, 135),
      temperature: rand(37.8, 40.3, 1),
      oxygenLevel: rand(88, 96),
      timeLabel: REL_TIMES[k % REL_TIMES.length],
      dateLabel: `${pick(HIJRI_DAYS)} · ${pick(CLOCKS)}`,
    };
  });
}

export const MOCK_PILGRIMS: MockPilgrim[] = Array.from({ length: 40 }, (_, i) => {
  const hr = rand(72, 130);
  const temp = rand(36.5, 40.2, 1);
  const o2 = rand(90, 99);
  const nat = NATIONALITIES[i % NATIONALITIES.length];
  const hasDiabetes = Math.random() > 0.7;
  const hasHeartCondition = Math.random() > 0.85;
  const hasHypertension = Math.random() > 0.65;
  const meds: string[] = [];
  if (hasHypertension) meds.push("أملوديبين ٥مغ");
  if (hasDiabetes) meds.push(Math.random() > 0.5 ? "ميتفورمين ٥٠٠مغ" : "إنسولين");
  if (hasHeartCondition) meds.push("أسبرين ٧٥مغ");
  if (meds.length === 0 && Math.random() > 0.7) meds.push(pick(MEDS));

  return {
    id: `P${String(i + 1).padStart(3, "0")}`,
    name: NAMES[i % NAMES.length],
    age: rand(30, 78),
    gender: i % 2 === 0 ? "male" : "female",
    nationality: nat.name,
    nationalityFlag: nat.flag,
    passportNumber: `${nat.name.slice(0, 1)}${rand(1000000, 9999999)}`,
    bloodType: pick(BLOOD_TYPES),
    riskLevel: riskFromVitals(hr, temp, o2),
    heartRate: hr,
    temperature: temp,
    oxygenLevel: o2,
    hasDiabetes,
    hasHeartCondition,
    hasHypertension,
    medications: meds,
    lat: LATS[i % LATS.length] + rand(-0.003, 0.003, 4),
    lng: LNGS[i % LNGS.length] + rand(-0.003, 0.003, 4),
    condition: Math.random() > 0.6 ? pick(CONDITIONS) : undefined,
    alertTime: Math.random() > 0.5 ? pick(TIMES) + " ago" : undefined,
    lastUpdate: `قبل ${rand(1, 9)} دقائق`,
    alertHistory: buildAlertHistory(i + 1),
  };
});

// Simulated critical-pilgrim positions for the density grid. In production this
// comes from thousands of live red-status pilgrims; here we scatter points around
// a few hotspot centers so the 100m grid shows realistic variation.
function gaussian() {
  // Box–Muller
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const CRITICAL_CLUSTERS = [
  { lat: 21.4225, lng: 39.8725, count: 140, spread: 0.0015 }, // Jamarat — busiest
  { lat: 21.4120, lng: 39.8620, count: 90, spread: 0.0018 },  // Mina camp C3
  { lat: 21.3990, lng: 39.8855, count: 70, spread: 0.0012 },  // near field hospital
  { lat: 21.4060, lng: 39.8750, count: 50, spread: 0.0022 },  // central corridor
  { lat: 21.3880, lng: 39.8570, count: 30, spread: 0.0014 },  // main gate
];

export const MOCK_CRITICAL_POINTS: [number, number, number][] = CRITICAL_CLUSTERS.flatMap(c =>
  Array.from({ length: c.count }, () => [
    c.lat + gaussian() * c.spread,
    c.lng + gaussian() * c.spread,
    1,
  ] as [number, number, number])
);

// Predicted critical-density field (+4h projection). Hotspots shift and grow vs.
// "now". Later: replace with FastAPI model output via lib/ai.ts getPredictedHotspots().
const PREDICTED_CLUSTERS = [
  { lat: 21.4235, lng: 39.8745, count: 180, spread: 0.0020 }, // Jamarat worsens
  { lat: 21.4135, lng: 39.8640, count: 130, spread: 0.0022 }, // camp C3 spreads
  { lat: 21.4010, lng: 39.8870, count: 60, spread: 0.0014 },
  { lat: 21.4080, lng: 39.8700, count: 80, spread: 0.0025 },  // new corridor hotspot
];

export const MOCK_PREDICTED_POINTS: [number, number, number][] = PREDICTED_CLUSTERS.flatMap(c =>
  Array.from({ length: c.count }, () => [
    c.lat + gaussian() * c.spread,
    c.lng + gaussian() * c.spread,
    1,
  ] as [number, number, number])
);

export const MOCK_ALERTS = MOCK_PILGRIMS
  .filter(p => p.riskLevel !== "green")
  .sort((a, b) => (a.riskLevel === "red" ? -1 : b.riskLevel === "red" ? 1 : 0))
  .slice(0, 12);

export const MOCK_TEAMS: MockTeam[] = [
  { id: "T01", name: "فريق الإسعاف أ", members: 4, status: "dispatched", location: "قطاع منى A", assignedAlert: MOCK_ALERTS[0]?.id },
  { id: "T02", name: "فريق الاستجابة ب", members: 3, status: "on-scene", location: "جسر الجمرات", assignedAlert: MOCK_ALERTS[1]?.id },
  { id: "T03", name: "فريق الرعاية ج", members: 5, status: "available", location: "المستشفى الميداني ٣" },
  { id: "T04", name: "فريق التدخل السريع", members: 4, status: "dispatched", location: "طريق عرفات", assignedAlert: MOCK_ALERTS[2]?.id },
  { id: "T05", name: "فريق الدعم الطبي", members: 3, status: "available", location: "المعسكر الرئيسي" },
];

export const MOCK_CONTACTS: MockContact[] = [
  {
    id: "C001", type: "call", pilgrimId: "P001", pilgrimName: "أحمد الراشدي", language: "العربية", flag: "🇸🇦",
    riskLevel: "red", issue: "ألم في الصدر وصعوبة في التنفس", waitTime: "٠:١٢",
    transcript: "أنا عندي ألم في صدري ولا أقدر أتنفس بشكل صحيح",
    translation: "أعاني من ألم في الصدر ولا أستطيع التنفس جيداً. أنا قرب الخيمة الخضراء في منى.",
  },
  {
    id: "C002", type: "chat", pilgrimId: "P004", pilgrimName: "عائشة بيغوم", language: "البنغالية", flag: "🇧🇩",
    riskLevel: "yellow", issue: "دوخة شديدة، احتمال ضربة شمس", waitTime: "٠:٤٥",
    messages: [
      { id: "m1", sender: "pilgrim", text: "আমার মাথা ঘুরছে, আমি হাঁটতে পারছি না", translation: "رأسي يدور، لا أستطيع المشي.", time: "14:02" },
      { id: "m2", sender: "pilgrim", text: "অনেক গরম লাগছে, পানি দরকার", translation: "أشعر بحرارة شديدة، أحتاج ماءً.", time: "14:02" },
    ],
  },
  {
    id: "C003", type: "call", pilgrimId: "P009", pilgrimName: "يوسف بن إسماعيل", language: "الماليزية", flag: "🇲🇾",
    riskLevel: "yellow", issue: "تائه، انفصل عن مجموعته", waitTime: "١:٢٠",
    transcript: "Saya terpisah dari kumpulan saya, saya tak tahu di mana saya",
    translation: "انفصلت عن مجموعتي ولا أعرف أين أنا. رقم مجموعتي MYS-447.",
  },
  {
    id: "C004", type: "chat", pilgrimId: "P010", pilgrimName: "مريم الأمين", language: "الفرنسية", flag: "🇲🇦",
    riskLevel: "red", issue: "حالة سكري طارئة، انخفاض السكر", waitTime: "٠:٠٨",
    messages: [
      { id: "m1", sender: "pilgrim", text: "Je suis diabétique et je me sens très mal", translation: "أنا مصابة بالسكري وأشعر بتوعك شديد.", time: "14:05" },
      { id: "m2", sender: "support", text: "نحن معكِ. هل تستطيعين تناول شيء يحتوي على سكر الآن؟", translation: "Nous sommes avec vous. Pouvez-vous manger quelque chose de sucré maintenant?", time: "14:05" },
      { id: "m3", sender: "pilgrim", text: "Non, je n'ai rien. Près d'un pilier blanc.", translation: "لا، لا أملك شيئاً. أنا قرب عمود أبيض.", time: "14:06" },
    ],
  },
  {
    id: "C005", type: "chat", pilgrimId: "P015", pilgrimName: "بلال صديقي", language: "الأردية", flag: "🇵🇰",
    riskLevel: "green", issue: "طلب تجديد دواء", waitTime: "٢:٣٠",
    messages: [
      { id: "m1", sender: "pilgrim", text: "میری بلڈ پریشر کی دوائی ختم ہوگئی ہے", translation: "نفد دواء ضغط الدم الخاص بي.", time: "13:58" },
    ],
  },
  {
    id: "C006", type: "call", pilgrimId: "P005", pilgrimName: "إبراهيم أوكونكو", language: "الإنجليزية", flag: "🇳🇬",
    riskLevel: "yellow", issue: "إرهاق وجفاف", waitTime: "٠:٣٣",
    transcript: "I feel very weak and dizzy, I haven't had water in hours",
    translation: "أشعر بضعف ودوار شديد، لم أشرب الماء منذ ساعات.",
  },
];

// Data tab stats
export const RISK_DISTRIBUTION = { green: 24, yellow: 11, red: 5 };
export const CHRONIC_CONDITIONS = [
  { name: "Hypertension", count: 18, color: "#6366f1" },
  { name: "Diabetes", count: 12, color: "#f59e0b" },
  { name: "Heart Condition", count: 7, color: "#ef4444" },
  { name: "Respiratory", count: 9, color: "#3b82f6" },
  { name: "None", count: 34, color: "#22c55e" },
];
export const HOURLY_ALERTS = [2, 4, 3, 7, 12, 9, 6, 14, 11, 8, 5, 3, 2, 6, 10, 13, 9, 7, 4, 3, 5, 8, 11, 6];
export const AI_KPIS = {
  predictionAccuracy: 94.2,
  agentResolutionRate: 78.5,
  avgResponseTime: "1m 24s",
  activeAlerts: MOCK_ALERTS.filter(a => a.riskLevel === "red").length,
  totalPilgrims: 40,
  fieldTeams: 5,
  icuOccupancy: 68,
  fieldHospitalOccupancy: 42,
  ambulances: { total: 12, available: 7 },
};
