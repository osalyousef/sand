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
  // Backend-linked bracelets — id == a real Pilgrim.patient_id in the CSV
  // roster, so a scan resolves to live medical history + XGBoost triage.
  // Vitals/risk below are the bracelet-sim layer (backend has no vitals).
  "BE49325DE12B": {
    id: "BE49325DE12B",
    name: "Michelle Anderson",
    age: 63,
    nationality: "Ukraine",
    passport: "BE49325DE12B",
    risk: "red",
    hr: 132, temp: 39.4, ox: 88, score: 0.91,
    diabetes: true, heart: false, hypertension: true,
    meds: null,
  },
  "3C27343B9F43": {
    id: "3C27343B9F43",
    name: "Rachel Smith",
    age: 85,
    nationality: "Solomon Islands",
    passport: "3C27343B9F43",
    risk: "red",
    hr: 128, temp: 38.9, ox: 90, score: 0.84,
    diabetes: true, heart: false, hypertension: true,
    meds: null,
  },
  "71A4E530EF26": {
    id: "71A4E530EF26",
    name: "Trevor Martin",
    age: 35,
    nationality: "Somalia",
    passport: "71A4E530EF26",
    risk: "yellow",
    hr: 108, temp: 38.1, ox: 94, score: 0.58,
    diabetes: false, heart: true, hypertension: true,
    meds: ["Diuretics", "Beta-Blockers"],
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

// Bracelets whose id is a real Pilgrim.patient_id in the CSV roster, so a scan
// resolves to live medical history + XGBoost triage. Used to seed the recents
// list from the DB and to drive the demo-scan button.
export const BACKEND_BRACELET_IDS = [
  "3C27343B9F43",
  "BE49325DE12B",
  "71A4E530EF26",
] as const;

export function randomRegistryId(): string {
  const ids = listRegistryIds();
  return ids[Math.floor(Math.random() * ids.length)];
}

// Demo-scan prefers a backend-linked bracelet so the detail screen always shows
// real triage (not a local-only fallback record).
export function randomBackendBraceletId(): string {
  return BACKEND_BRACELET_IDS[
    Math.floor(Math.random() * BACKEND_BRACELET_IDS.length)
  ];
}

/**
 * Seed "recent scans" from the DB: resolve each backend-linked bracelet (live
 * history overlaid on the bracelet-sim vitals) and stagger the scan times so
 * the list looks like a real recent-activity feed. Returns [] when the platform
 * is unreachable for all of them.
 */
export async function seedRecentsFromDb(): Promise<ScannedPilgrim[]> {
  const agesMinutes = [5, 18, 42];
  const resolved = await Promise.all(
    BACKEND_BRACELET_IDS.map((id) => resolveScannedPilgrim(id)),
  );
  return resolved
    .map((entry, i) =>
      entry
        ? {
            ...entry,
            scannedAt: new Date(
              Date.now() - agesMinutes[i] * 60 * 1000,
            ).toISOString(),
          }
        : null,
    )
    .filter((e): e is ScannedPilgrim => e !== null);
}
