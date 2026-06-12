import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState, useCallback } from "react";
import { ScannedContext, type ScannedPilgrim } from "@/lib/scanned-store";

export default function RootLayout() {
  const [recents, setRecents] = useState<ScannedPilgrim[]>([]);

  const add = useCallback((entry: ScannedPilgrim) => {
    setRecents((prev) => {
      const filtered = prev.filter((p) => p.pilgrim.id !== entry.pilgrim.id);
      return [entry, ...filtered].slice(0, 10);
    });
  }, []);

  return (
    <ScannedContext.Provider value={{ recents, add }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </ScannedContext.Provider>
  );
}
