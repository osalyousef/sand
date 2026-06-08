import type { AIPrediction, VitalsInput } from "../types";

const AI_URL = process.env.EXPO_PUBLIC_AI_URL || null;

export async function getRiskLevel(data: VitalsInput): Promise<AIPrediction> {
  if (!AI_URL) {
    // Mock response — remove once teammates' FastAPI endpoint is live
    return { risk_level: "yellow", score: 0.65 };
  }

  const res = await fetch(`${AI_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`AI prediction failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
