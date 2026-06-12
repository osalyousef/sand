// Shared operations store — the connective tissue between tabs.
// Dispatching a team from the alerts feed, a pilgrim profile, or a hotline
// agent suggestion all flow through here, so every panel reflects the same
// operational truth. Also drives cross-tab navigation (bell → alert → map).

import { create } from "zustand";
import { MOCK_TEAMS, MOCK_PILGRIMS } from "./mock-data";
import { INITIAL_ALERT_STATUS, type AlertStatus } from "./ops-data";

export type TabId = "live" | "hotline" | "institutions" | "search" | "data";
export type TeamStatus = "available" | "dispatched" | "on-scene";

interface SanadStore {
  /* ---- navigation ---- */
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  /* ---- map / alert focus ---- */
  focusPilgrimId: string | null; // map flies to this pilgrim
  focusAlertId: string | null;   // alerts feed selects & scrolls to this alert
  focusPoint: { lat: number; lng: number; label: string } | null; // generic target (institutions…)
  focusOnMap: (pilgrimId: string) => void;
  focusOnPoint: (point: { lat: number; lng: number; label: string }) => void;
  goToAlert: (alertId: string) => void;
  clearFocus: () => void;

  /* ---- alert lifecycle (shared across all tabs) ---- */
  alertStatuses: Record<string, AlertStatus>;
  // Advances the alert AND keeps the assigned team in sync:
  // treating → team goes on-scene; resolved/transferred → team freed.
  advanceAlert: (id: string, next: AlertStatus) => void;

  /* ---- field teams ---- */
  teamStatuses: Record<string, TeamStatus>;
  // teamId → pilgrimId, or a free-text mission label (e.g. a map cell)
  teamAssignments: Record<string, string | undefined>;
  reassignTeam: (teamId: string, pilgrimId: string) => void;
  // Advances the pilgrim's alert and assigns the first available team.
  // Returns the dispatched team's name (null if none free).
  dispatchForPilgrim: (pilgrimId: string) => string | null;
  // Sends the first available team to a location (map cell, hotspot…).
  dispatchToLocation: (label: string) => string | null;

  /* ---- live pulse: increments every few seconds, panels derive jitter ---- */
  tick: number;
  bump: () => void;
}

export const useSanadStore = create<SanadStore>((set, get) => ({
  activeTab: "live",
  setActiveTab: tab => set({ activeTab: tab }),

  focusPilgrimId: null,
  focusAlertId: null,
  focusPoint: null,
  focusOnMap: pilgrimId =>
    set({ activeTab: "live", focusPilgrimId: pilgrimId, focusAlertId: null, focusPoint: null }),
  focusOnPoint: point =>
    set({ activeTab: "live", focusPoint: point, focusPilgrimId: null, focusAlertId: null }),
  goToAlert: alertId =>
    set({ activeTab: "live", focusAlertId: alertId, focusPilgrimId: alertId, focusPoint: null }),
  clearFocus: () => set({ focusPilgrimId: null, focusAlertId: null, focusPoint: null }),

  alertStatuses: { ...INITIAL_ALERT_STATUS },
  advanceAlert: (id, next) =>
    set(s => {
      // keep the assigned team's status in lockstep with the case
      const teamId = Object.keys(s.teamAssignments).find(t => s.teamAssignments[t] === id);
      const teamStatuses = { ...s.teamStatuses };
      const teamAssignments = { ...s.teamAssignments };
      if (teamId) {
        if (next === "treating") teamStatuses[teamId] = "on-scene";
        if (next === "resolved" || next === "transferred") {
          teamStatuses[teamId] = "available"; // case closed → team frees up
          teamAssignments[teamId] = undefined;
        }
      }
      return { alertStatuses: { ...s.alertStatuses, [id]: next }, teamStatuses, teamAssignments };
    }),

  teamStatuses: Object.fromEntries(MOCK_TEAMS.map(t => [t.id, t.status])) as Record<string, TeamStatus>,
  teamAssignments: Object.fromEntries(MOCK_TEAMS.map(t => [t.id, t.assignedAlert])),
  reassignTeam: (teamId, pilgrimId) =>
    set(s => ({ teamAssignments: { ...s.teamAssignments, [teamId]: pilgrimId } })),

  dispatchForPilgrim: pilgrimId => {
    const s = get();
    const statuses = { ...s.alertStatuses };
    if (statuses[pilgrimId] === "new") statuses[pilgrimId] = "dispatched";

    const freeTeamId = MOCK_TEAMS.map(t => t.id).find(id => s.teamStatuses[id] === "available");
    if (!freeTeamId) {
      set({ alertStatuses: statuses });
      return null;
    }
    set({
      alertStatuses: statuses,
      teamStatuses: { ...s.teamStatuses, [freeTeamId]: "dispatched" },
      teamAssignments: { ...s.teamAssignments, [freeTeamId]: pilgrimId },
    });
    return MOCK_TEAMS.find(t => t.id === freeTeamId)?.name ?? null;
  },

  dispatchToLocation: label => {
    const s = get();
    const freeTeamId = MOCK_TEAMS.map(t => t.id).find(id => s.teamStatuses[id] === "available");
    if (!freeTeamId) return null;
    set({
      teamStatuses: { ...s.teamStatuses, [freeTeamId]: "dispatched" },
      teamAssignments: { ...s.teamAssignments, [freeTeamId]: label },
    });
    return MOCK_TEAMS.find(t => t.id === freeTeamId)?.name ?? null;
  },

  tick: 0,
  bump: () => set(s => ({ tick: s.tick + 1 })),
}));

// Deterministic small jitter so vitals feel live without random hydration issues.
export function jitter(base: number, seed: number, tick: number, range = 3): number {
  return base + (((tick * 7 + seed * 13) % (range * 2 + 1)) - range);
}

export function pilgrimById(id: string) {
  return MOCK_PILGRIMS.find(p => p.id === id) ?? null;
}
