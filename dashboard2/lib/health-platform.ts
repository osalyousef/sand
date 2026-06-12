// Client for the Hajj Health Platform (the Django backend).
// This is the dashboard's half of the same link the mobile app already uses:
// both clients read the same pilgrim records + medical history from Django.
//
// Mirrors the mobile app's architecture deliberately — the platform owns the
// MEDICAL record (conditions, medications, allergies, vaccinations, status),
// while live-ops fields (vitals, GPS, risk) are bracelet data the platform does
// not have. For backend-backed pilgrims we synthesize stable demo vitals from
// the patient id so the existing live-ops UI renders, but every medical field
// shown is real data fetched from the platform.

import type { MockPilgrim } from "./mock-data";
import type { RiskLevel } from "./types";

const HP_URL = process.env.NEXT_PUBLIC_HEALTH_PLATFORM_URL || null;

export interface RemoteHealthProfile {
  status: string; // pending | needs_review | approved
  confidence_score: number;
  diseases: string;
  medications: string;
  allergies: string;
  vaccinations: string;
}

export interface RemotePilgrim {
  patient_id: string;
  full_name: string;
  nationality: string;
  passport_number: string;
  gender: string;
  age: number | null;
  date_of_birth: string | null;
  health_profile: RemoteHealthProfile | null;
}

/** Fetch the full pilgrim roster from the platform. Returns [] when the backend
 *  isn't configured or is unreachable, so the dashboard falls back to mock data
 *  and keeps working before the backend is live. */
export async function fetchRemotePilgrims(query?: string): Promise<RemotePilgrim[]> {
  if (!HP_URL) return [];
  try {
    const url = new URL(`${HP_URL}/api/pilgrims/`);
    if (query) url.searchParams.set("q", query);
    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: RemotePilgrim[] };
    return data.results ?? [];
  } catch {
    return [];
  }
}

// ─── triage (real XGBoost risk from the platform) ────────────────────────────

export interface TriageRiskFactor {
  feature: string;
  value: string | number;
}

export interface TriageResult {
  status: string; // Green | Orange | Red | insufficient_data | triage_failed
  risk_level: "green" | "yellow" | "red" | null;
  vitals?: {
    CVD_Risk_Percentage?: string;
    Age?: number | null;
    BMI?: number | null;
    Blood_Pressure?: string;
    Cholesterol?: string;
  };
  known_conditions?: string[];
  active_support?: string[];
  primary_risk_factors?: TriageRiskFactor[];
}

/** Fetch the real model-driven triage for one pilgrim. Returns null when the
 *  backend is unreachable; the caller distinguishes that from the in-band
 *  `insufficient_data` / `triage_failed` statuses. */
export async function fetchTriage(patientId: string): Promise<TriageResult | null> {
  if (!HP_URL) return null;
  try {
    const res = await fetch(
      `${HP_URL}/api/pilgrims/${encodeURIComponent(patientId)}/triage/`,
    );
    if (!res.ok) return null;
    return (await res.json()) as TriageResult;
  } catch {
    return null;
  }
}

// ─── mapping helpers (ported from the mobile client so both sides agree) ─────

/** Split a medication string into a clean array — the platform separates meds
 *  with semicolons or commas (incl. the Arabic comma) and sometimes newlines. */
export function parseMedications(text: string): string[] {
  return text
    .split(/[;,،\n]/)
    .map((m) => m.trim())
    .filter(Boolean);
}

const DIABETES = /سكري|diabet/i;
const HEART = /قلب|تاجي|قلبي|heart|cardiac|coronary/i;
const HYPERTENSION = /ضغط|hypertens/i;

export function deriveConditionFlags(diseases: string) {
  return {
    has_diabetes: DIABETES.test(diseases),
    has_heart_condition: HEART.test(diseases),
    has_hypertension: HYPERTENSION.test(diseases),
  };
}

// Arabic + English country name → flag, covering the seeded backend records.
const FLAGS: Record<string, string> = {
  السعودية: "🇸🇦", إندونيسيا: "🇮🇩", باكستان: "🇵🇰", بنغلاديش: "🇧🇩",
  نيجيريا: "🇳🇬", مصر: "🇪🇬", تركيا: "🇹🇷", إيران: "🇮🇷", ماليزيا: "🇲🇾",
  المغرب: "🇲🇦", الهند: "🇮🇳", اليمن: "🇾🇪", السودان: "🇸🇩",
  Egypt: "🇪🇬", Nigeria: "🇳🇬", Indonesia: "🇮🇩", Pakistan: "🇵🇰",
};

// Stable 32-bit hash of the patient id — drives deterministic demo vitals so a
// given pilgrim always renders the same numbers (no hydration drift, no flicker).
function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296; // → 0..1
}

function riskFromVitals(hr: number, temp: number, o2: number): RiskLevel {
  if (temp >= 39.5 || hr >= 115 || o2 <= 93) return "red";
  if (temp >= 38.5 || hr >= 100 || o2 <= 96) return "yellow";
  return "green";
}

// Mina / Mecca bounding box, matching the mock data's coordinate range.
const LAT0 = 21.382, LAT1 = 21.43;
const LNG0 = 39.853, LNG1 = 39.893;

/** Map a platform pilgrim into the dashboard's MockPilgrim shape. Medical fields
 *  are REAL (from Django); vitals/GPS are stable demo values stood in for the
 *  bracelet data the platform doesn't carry. */
export function remoteToMockPilgrim(r: RemotePilgrim): MockPilgrim {
  const hp = r.health_profile;
  const flags = deriveConditionFlags(hp?.diseases ?? "");
  const meds = hp?.medications ? parseMedications(hp.medications) : [];

  // Deterministic demo vitals derived from the id (kept in a plausible range;
  // nudged up when chronic conditions are present so the risk dot reads sensibly).
  const seed = hashId(r.patient_id);
  const seed2 = hashId(r.patient_id + "x");
  const seed3 = hashId(r.patient_id + "y");
  const load = (flags.has_heart_condition ? 1 : 0) + (flags.has_diabetes ? 1 : 0) + (flags.has_hypertension ? 1 : 0);
  const hr = Math.round(72 + seed * 40 + load * 8);
  const temp = parseFloat((36.6 + seed2 * 2.2 + load * 0.3).toFixed(1));
  const o2 = Math.round(99 - seed3 * 6 - load * 1.5);

  return {
    id: r.patient_id,
    name: r.full_name,
    age: r.age ?? 60,
    gender: r.gender === "female" ? "female" : "male",
    nationality: r.nationality || "—",
    nationalityFlag: FLAGS[r.nationality] ?? "🌍",
    passportNumber: r.passport_number,
    bloodType: "—",
    riskLevel: riskFromVitals(hr, temp, o2),
    heartRate: hr,
    temperature: temp,
    oxygenLevel: o2,
    hasDiabetes: flags.has_diabetes,
    hasHeartCondition: flags.has_heart_condition,
    hasHypertension: flags.has_hypertension,
    medications: meds,
    lat: LAT0 + seed * (LAT1 - LAT0),
    lng: LNG0 + seed2 * (LNG1 - LNG0),
    condition: undefined,
    lastUpdate: "من المنصة الصحية",
    alertHistory: [],
    // platform-only extras (consumed where available; ignored by mock UI)
    fromPlatform: true,
    profileStatus: hp?.status,
    confidenceScore: hp?.confidence_score,
    allergies: hp?.allergies,
    vaccinations: hp?.vaccinations,
  };
}
