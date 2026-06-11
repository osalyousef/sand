export type RiskLevel = "green" | "yellow" | "red";

export const RISK_COLORS: Record<RiskLevel, string> = {
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
};

export interface Pilgrim {
  id: string;
  full_name: string;
  age: number;
  nationality: string | null;
  passport_number: string | null;
  has_diabetes: boolean;
  has_heart_condition: boolean;
  has_hypertension: boolean;
  medications: string[] | null;
  created_at: string;
}

export interface Vitals {
  id: string;
  pilgrim_id: string;
  heart_rate: number | null;
  temperature: number | null;
  oxygen_level: number | null;
  recorded_at: string;
}

export interface RiskAssessment {
  id: string;
  pilgrim_id: string;
  risk_level: RiskLevel;
  score: number;
  assessed_at: string;
}

export interface PilgrimLocation {
  id: string;
  pilgrim_id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
}

export interface VitalsInput {
  age: number;
  heart_rate: number;
  temperature: number;
  oxygen_level: number;
  has_diabetes: boolean;
  has_heart_condition: boolean;
  has_hypertension: boolean;
}

export interface AIPrediction {
  risk_level: RiskLevel;
  score: number;
}
