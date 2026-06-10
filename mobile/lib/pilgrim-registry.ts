import type { ScannedPilgrim } from "@/lib/scanned-store";
import type { RiskLevel } from "@/types";
import {
  fetchRemotePilgrim,
  parseMedications,
  deriveConditionFlags,
} from "@/lib/health-platform";

interface RegistryEntry {
  id: string;
  name: string;
  age: number;
  nationality: string;
  passport: string;
  risk: RiskLevel;
  hr: number;
  temp: number;
  ox: number;
  score: number;
  diabetes: boolean;
  heart: boolean;
  hypertension: boolean;
  meds: string[] | null;
}

// Bracelet IDs → static pilgrim records. The QR carries just the ID.
const REGISTRY: Record<string, RegistryEntry> = {
  "SA-2024-NG-07231": {
    id: "SA-2024-NG-07231",
    name: "فاطمة عبدالله سيدي",
    age: 74,
    nationality: "نيجيريا",
    passport: "SA-2024-NG-07231",
    risk: "red",
    hr: 132, temp: 39.4, ox: 88, score: 0.91,
    diabetes: true, heart: true, hypertension: true,
    meds: ["أملوديبين 10mg", "ميتفورمين 500mg", "أسبرين 81mg"],
  },
  "SA-2024-EG-04412": {
    id: "SA-2024-EG-04412",
    name: "محمد إبراهيم الفارسي",
    age: 68,
    nationality: "مصر",
    passport: "SA-2024-EG-04412",
    risk: "red",
    hr: 128, temp: 38.9, ox: 90, score: 0.84,
    diabetes: false, heart: true, hypertension: true,
    meds: ["بيسوبرولول 5mg", "أتورفاستاتين 20mg"],
  },
  "SA-2024-ID-09887": {
    id: "SA-2024-ID-09887",
    name: "سيتي نور حسنة",
    age: 62,
    nationality: "إندونيسيا",
    passport: "SA-2024-ID-09887",
    risk: "yellow",
    hr: 108, temp: 38.1, ox: 94, score: 0.58,
    diabetes: true, heart: false, hypertension: true,
    meds: ["ميتفورمين 850mg"],
  },
  "SA-2024-TR-02156": {
    id: "SA-2024-TR-02156",
    name: "أحمد يلماز قايا",
    age: 55,
    nationality: "تركيا",
    passport: "SA-2024-TR-02156",
    risk: "yellow",
    hr: 102, temp: 37.8, ox: 95, score: 0.51,
    diabetes: false, heart: false, hypertension: true,
    meds: ["لوسارتان 50mg"],
  },
  "SA-2024-MY-06329": {
    id: "SA-2024-MY-06329",
    name: "خديجة بنت أحمد",
    age: 41,
    nationality: "ماليزيا",
    passport: "SA-2024-MY-06329",
    risk: "green",
    hr: 78, temp: 36.8, ox: 98, score: 0.14,
    diabetes: false, heart: false, hypertension: false,
    meds: null,
  },
  "SA-2024-PK-01784": {
    id: "SA-2024-PK-01784",
    name: "علي حسن رضا",
    age: 49,
    nationality: "باكستان",
    passport: "SA-2024-PK-01784",
    risk: "green",
    hr: 82, temp: 36.9, ox: 97, score: 0.19,
    diabetes: false, heart: false, hypertension: false,
    meds: null,
  },
};

// Accept either a raw ID or a { "id": "..." } JSON QR payload.
function parsePayloadId(rawPayload: string): string {
  let id = rawPayload.trim();
  try {
    const parsed = JSON.parse(rawPayload);
    if (parsed && typeof parsed.id === "string") id = parsed.id;
  } catch {
    // not JSON — treat as raw ID
  }
  return id;
}

export function lookupPilgrim(rawPayload: string): ScannedPilgrim | null {
  const id = parsePayloadId(rawPayload);
  const e = REGISTRY[id];
  if (!e) return null;

  const now = new Date().toISOString();
  return {
    pilgrim: {
      id: e.id,
      full_name: e.name,
      age: e.age,
      nationality: e.nationality,
      passport_number: e.passport,
      has_diabetes: e.diabetes,
      has_heart_condition: e.heart,
      has_hypertension: e.hypertension,
      medications: e.meds,
      created_at: now,
    },
    vitals: {
      id: `v-${e.id}`,
      pilgrim_id: e.id,
      heart_rate: e.hr,
      temperature: e.temp,
      oxygen_level: e.ox,
      recorded_at: now,
    },
    risk: {
      id: `r-${e.id}`,
      pilgrim_id: e.id,
      risk_level: e.risk,
      score: e.score,
      assessed_at: now,
    },
    scannedAt: now,
  };
}

/**
 * Resolve a scanned QR payload into a full record.
 *
 * Vitals + risk come from the local (bracelet-simulated) registry; the medical
 * history (name, nationality, conditions, medications) is overlaid from the
 * Hajj Health Platform when it has a record for this id. Falls back to the
 * local registry alone when the platform is unconfigured/unreachable, so the
 * scan flow never breaks.
 */
export async function resolveScannedPilgrim(
  rawPayload: string,
): Promise<ScannedPilgrim | null> {
  const id = parsePayloadId(rawPayload);
  const local = lookupPilgrim(rawPayload);
  const remote = await fetchRemotePilgrim(id);

  if (!remote) return local; // platform offline/unknown → local only (may be null)

  const now = new Date().toISOString();
  const hp = remote.health_profile;

  // Base on the local record when we have one (keeps real vitals + risk),
  // otherwise synthesize a minimal shell with unknown vitals/risk.
  const base: ScannedPilgrim = local ?? {
    pilgrim: {
      id,
      full_name: remote.full_name,
      age: 0,
      nationality: remote.nationality || null,
      passport_number: remote.passport_number || null,
      has_diabetes: false,
      has_heart_condition: false,
      has_hypertension: false,
      medications: null,
      created_at: now,
    },
    vitals: {
      id: `v-${id}`,
      pilgrim_id: id,
      heart_rate: null,
      temperature: null,
      oxygen_level: null,
      recorded_at: now,
    },
    risk: {
      id: `r-${id}`,
      pilgrim_id: id,
      risk_level: "green",
      score: 0,
      assessed_at: now,
    },
    scannedAt: now,
  };

  return {
    ...base,
    pilgrim: {
      ...base.pilgrim,
      full_name: remote.full_name || base.pilgrim.full_name,
      nationality: remote.nationality || base.pilgrim.nationality,
      passport_number: remote.passport_number || base.pilgrim.passport_number,
      ...(hp
        ? {
            ...deriveConditionFlags(hp.diseases),
            medications: parseMedications(hp.medications),
          }
        : {}),
    },
    scannedAt: now,
  };
}

export function listRegistryIds(): string[] {
  return Object.keys(REGISTRY);
}

export function randomRegistryId(): string {
  const ids = listRegistryIds();
  return ids[Math.floor(Math.random() * ids.length)];
}
