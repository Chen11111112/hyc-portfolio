"use client";

import { useFrame } from "@react-three/fiber";
import { createContext, useContext, useRef, type MutableRefObject, type ReactNode } from "react";

/**
 * Day/night blend shared across the scene: 0 = day, 1 = night. It eases toward the target each frame,
 * and lights/materials read it in their own useFrame, so switching fades instead of snapping.
 */
const NightContext = createContext<MutableRefObject<number>>({ current: 0 });

export function NightProvider({ night, children }: { night: boolean; children: ReactNode }) {
  const mix = useRef(night ? 1 : 0);
  useFrame((_, dt) => {
    const target = night ? 1 : 0;
    mix.current += (target - mix.current) * Math.min(1, dt * 4);
    if (Math.abs(target - mix.current) < 1e-3) mix.current = target;
  });
  return <NightContext.Provider value={mix}>{children}</NightContext.Provider>;
}

export function useNightMix() {
  return useContext(NightContext);
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const STORAGE_KEY = "hyc-room-night";

export function readStoredNight(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function storeNight(night: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, night ? "1" : "0");
  } catch {
    // Storage unavailable (private mode, blocked): the toggle still works for this visit.
  }
}
