import { createContext, useContext } from "react";
import type { Pilgrim, RiskAssessment, Vitals } from "@/types";

export interface ScannedPilgrim {
  pilgrim: Pilgrim;
  vitals: Vitals;
  risk: RiskAssessment;
  scannedAt: string;
}

export interface ScannedStore {
  recents: ScannedPilgrim[];
  add: (entry: ScannedPilgrim) => void;
}

export const ScannedContext = createContext<ScannedStore>({
  recents: [],
  add: () => {},
});

export function useScanned() {
  return useContext(ScannedContext);
}
