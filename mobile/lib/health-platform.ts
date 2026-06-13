// Client for the Hajj Health Platform (teammates' Django backend).
// The bracelet QR encodes only the pilgrim id, which equals their `patient_id`.
// We fetch the unified medical history for that id and overlay it onto the
// live record (vitals + risk stay local — they come from the bracelet).

import type { RiskLevel } from "@/types";

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

// ─── triage (real XGBoost risk from the platform) ──────────────────────────

export interface TriageRiskFactor {
  feature: string;
  value: string | number;
}

export interface TriageResult {
  status: string; // Green | Orange | Red | insufficient_data | triage_failed
  risk_level: RiskLevel | null;
  vitals?: {
    CVD_Risk_Percentage?: string;
    Age?: number | null;
    BMI?: number | null;
    Blood_Pressure?: string;
    Cholesterol?: string;
  };
  known_conditions?: string[];
  primary_risk_factors?: TriageRiskFactor[];
}

/** Fetch the real model-driven triage for a pilgrim id (== QR payload). Returns
 *  null when the platform is unconfigured/unreachable; the in-band statuses
 *  `insufficient_data` / `triage_failed` mean the pilgrim has no feature vector
 *  (e.g. a bracelet record) or the model errored. */
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

// ─── roster analytics (Data screen) ───────────────────────────────────────

export interface PilgrimStats {
  total_pilgrims: number;
  risk_distribution: Record<RiskLevel, number>;
  chronic_conditions: {
    diabetes: number;
    hypertension: number;
    heart: number;
    respiratory: number;
    kidney: number;
    none: number;
  };
}

/** Aggregate roster analytics computed server-side from the imported dataset
 *  (risk distribution + chronic-condition counts + total). Returns null when
 *  the platform is unconfigured/unreachable so the Data screen falls back to
 *  its built-in sample figures. */
export async function fetchStats(): Promise<PilgrimStats | null> {
  if (!HP_URL) return null;
  try {
    const res = await fetch(`${HP_URL}/api/pilgrims/stats/`);
    if (!res.ok) return null;
    return (await res.json()) as PilgrimStats;
  } catch {
    return null;
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
