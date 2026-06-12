"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "sanad-theme";

// Owns the theme: reads the saved preference, applies the html.light class,
// and exposes a toggle. Use in the component that renders the switch (Header).
export function useTheme() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const isLight = localStorage.getItem(STORAGE_KEY) === "light";
    setLight(isLight);
    document.documentElement.classList.toggle("light", isLight);
  }, []);

  const toggle = useCallback(() => {
    setLight(prev => {
      const next = !prev;
      document.documentElement.classList.toggle("light", next);
      localStorage.setItem(STORAGE_KEY, next ? "light" : "dark");
      return next;
    });
  }, []);

  return { light, toggle };
}

// Read-only observer for components that need to react to the theme but
// don't own the toggle (e.g., the map picks dark/light tiles).
export function useIsLight() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const el = document.documentElement;
    const update = () => setLight(el.classList.contains("light"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return light;
}
