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

/**
 * Day/night follows the device's light/dark setting (live), unless the visitor flips the toggle.
 * That choice is an override for this visit only (sessionStorage), so the next visit starts from
 * the device again; choosing what the device already says simply drops the override.
 */
const DARK_QUERY = "(prefers-color-scheme: dark)";
const OVERRIDE_KEY = "hyc-room-night-override";

export function subscribeDeviceDark(onChange: () => void) {
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export const isDeviceDark = () => window.matchMedia(DARK_QUERY).matches;

export function readNightOverride(): boolean | null {
  try {
    const v = window.sessionStorage.getItem(OVERRIDE_KEY);
    return v === null ? null : v === "1";
  } catch {
    return null;
  }
}

export function storeNightOverride(night: boolean | null) {
  try {
    if (night === null) window.sessionStorage.removeItem(OVERRIDE_KEY);
    else window.sessionStorage.setItem(OVERRIDE_KEY, night ? "1" : "0");
  } catch {
    // Storage unavailable (private mode, blocked): the toggle still works until the page reloads.
  }
}
