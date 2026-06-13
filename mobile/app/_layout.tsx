import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState, useCallback, useEffect } from "react";
import { ScannedContext, type ScannedPilgrim } from "@/lib/scanned-store";
import { seedRecentsFromDb } from "@/lib/pilgrim-registry";

export default function RootLayout() {
  const [recents, setRecents] = useState<ScannedPilgrim[]>([]);

  const add = useCallback((entry: ScannedPilgrim) => {
    setRecents((prev) => {
      const filtered = prev.filter((p) => p.pilgrim.id !== entry.pilgrim.id);
      return [entry, ...filtered].slice(0, 10);
    });
  }, []);

  // Seed the recents feed from the live DB once, before any real scans. Real
  // scans then prepend onto this via add(). No-op if the platform is offline.
  useEffect(() => {
    let active = true;
    seedRecentsFromDb().then((seeded) => {
      if (active && seeded.length > 0) {
        setRecents((prev) => (prev.length > 0 ? prev : seeded));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <ScannedContext.Provider value={{ recents, add }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </ScannedContext.Provider>
  );
}
