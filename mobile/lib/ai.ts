import type { AIPrediction, VitalsInput } from "../types";

const AI_URL = process.env.EXPO_PUBLIC_AI_URL || null;

// Returns null when the AI endpoint isn't configured (or unreachable) so callers
// fall back to whatever risk they already have, rather than a fabricated value.
export async function getRiskLevel(
  data: VitalsInput,
): Promise<AIPrediction | null> {
  if (!AI_URL) return null;

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
