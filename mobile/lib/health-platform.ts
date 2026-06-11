// Client for the Hajj Health Platform (teammates' Django backend).
// The bracelet QR encodes only the pilgrim id, which equals their `patient_id`.
// We fetch the unified medical history for that id and overlay it onto the
// live record (vitals + risk stay local — they come from the bracelet).

const HP_URL = process.env.EXPO_PUBLIC_HEALTH_PLATFORM_URL || null;

export interface RemoteHealthProfile {
  status: string; // pending | approved | needs_review
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
  health_profile: RemoteHealthProfile | null;
}

/**
 * Look a pilgrim up on the health platform by id (== QR payload).
 * Returns null when the platform isn't configured, the id is unknown (404),
 * or the network call fails — callers fall back to the local registry so the
 * app keeps working before the backend is live.
 */
export async function fetchRemotePilgrim(
  patientId: string,
): Promise<RemotePilgrim | null> {
  if (!HP_URL) return null;
  try {
    const res = await fetch(
      `${HP_URL}/api/pilgrims/${encodeURIComponent(patientId)}/`,
    );
    if (!res.ok) return null; // 404 or server error → fall back
    return (await res.json()) as RemotePilgrim;
  } catch {
    return null; // unreachable backend → fall back
  }
}

// ─── mapping helpers: free-text medical fields → our typed shape ───────────

/** Split a medication string into a clean array. The platform separates meds
 *  with semicolons ("Amlodipine (10mg); Aspirin (81mg)") or commas, depending
 *  on the record — handle both, plus Arabic comma and newlines. */
export function parseMedications(text: string): string[] {
  return text
    .split(/[;,،\n]/)
    .map((m) => m.trim())
    .filter(Boolean);
}

const DIABETES = /سكري|diabet/i;
const HEART = /قلب|تاجي|heart|cardiac/i;
const HYPERTENSION = /ضغط|hypertens/i;

export function deriveConditionFlags(diseases: string) {
  return {
    has_diabetes: DIABETES.test(diseases),
    has_heart_condition: HEART.test(diseases),
    has_hypertension: HYPERTENSION.test(diseases),
  };
}
