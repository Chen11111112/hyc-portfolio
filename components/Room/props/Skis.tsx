"use client";

import { DESK, type Vec3 } from "../layout";
import { Box, Cyl } from "./primitives";

// A pair of skis stood on their tails against the back wall, crossed in an X,
// between the LEGO piano cabinet and the guitars, with the poles standing in the V.
const L = 1.65; // ski length
const T = 0.014; // thickness
const SPREAD = 0.15; // half the distance between the tails (and between the tips)
const TILT = Math.atan2(SPREAD * 2, L * 0.97); // in-wall-plane tilt that crosses them
const LEAN = 0.13; // lean back toward the wall
const BASE_Z = 0.24;
export const SKIS_CX = DESK.x1 + 0.67;

// Grey top sheet with blue graphics.
const TOP = { color: "#8a9099", roughness: 0.32, metalness: 0.2 };
const ACCENT = "#2f6fd6";
const GRAPHIC = "#1d3f7a";
const BINDING = { color: "#2b2d31", roughness: 0.4, metalness: 0.4 };
const BINDING_TRIM = { color: ACCENT, roughness: 0.45 };

/** One ski, modelled tail at y = 0 up to the tip at y = L, top sheet facing +z. */
function Ski() {
  const tipStart = L - 0.15;
  return (
    <group>
      {/* Tail, waist, shovel. */}
      <Box size={[0.088, 0.12, T]} position={[0, 0.06, 0]} {...TOP} />
      <Box size={[0.074, tipStart - 0.24, T]} position={[0, 0.12 + (tipStart - 0.24) / 2, 0]} {...TOP} />
      <Box size={[0.1, 0.12, T]} position={[0, tipStart - 0.06, 0]} {...TOP} />
      {/* Tip curving up toward the top-sheet side. */}
      <group position={[0, tipStart, 0]} rotation={[0.42, 0, 0]}>
        <Box size={[0.096, 0.15, T * 0.8]} position={[0, 0.075, 0]} {...TOP} />
        <Box size={[0.07, 0.03, 0.001]} position={[0, 0.09, T * 0.4 + 0.0006]} color={ACCENT} roughness={0.4} cast={false} />
      </group>
      {/* Base (P-tex) underside. */}
      <Box size={[0.072, tipStart - 0.02, 0.002]} position={[0, (tipStart - 0.02) / 2 + 0.01, -T / 2 - 0.001]} color="#0d0d0f" roughness={0.25} cast={false} />
      {/* Top-sheet graphics. */}
      <Box size={[0.076, 0.3, 0.001]} position={[0, 1.08, T / 2 + 0.0006]} color={ACCENT} roughness={0.4} cast={false} />
      <Box size={[0.012, 0.42, 0.001]} position={[0, 1.08, T / 2 + 0.0012]} color={GRAPHIC} roughness={0.4} cast={false} />
      <Box size={[0.076, 0.05, 0.001]} position={[0, 0.2, T / 2 + 0.0006]} color={GRAPHIC} roughness={0.4} cast={false} />
      {/* Binding: plate, heel piece, toe piece, brake arms. */}
      <Box size={[0.07, 0.48, 0.012]} position={[0, 0.72, T / 2 + 0.006]} color="#5c6066" roughness={0.35} metalness={0.7} />
      <Box size={[0.062, 0.1, 0.055]} position={[0, 0.53, T / 2 + 0.034]} {...BINDING} />
      <Box size={[0.064, 0.015, 0.012]} position={[0, 0.575, T / 2 + 0.058]} {...BINDING_TRIM} />
      <Box size={[0.062, 0.07, 0.045]} position={[0, 0.9, T / 2 + 0.03]} {...BINDING} />
      <Box size={[0.064, 0.012, 0.01]} position={[0, 0.88, T / 2 + 0.05]} {...BINDING_TRIM} />
      {[-1, 1].map((s) => (
        <Box key={s} size={[0.006, 0.09, 0.006]} position={[s * 0.045, 0.47, T / 2 + 0.012]} rotation={[0.3, 0, 0]} color="#8a8f95" metalness={0.8} roughness={0.3} />
      ))}
    </group>
  );
}

const POLE_L = 1.2;

/** Ski pole, modelled tip at y = 0 up to the grip at y = POLE_L. */
function Pole() {
  return (
    <group>
      <Cyl r={0.0015} rTop={0.006} h={0.05} position={[0, 0.025, 0]} color="#c9ccd0" metalness={0.9} roughness={0.25} />
      <Cyl r={0.0085} rTop={0.0075} h={POLE_L - 0.18} position={[0, 0.05 + (POLE_L - 0.18) / 2, 0]} color="#7e858e" metalness={0.75} roughness={0.3} />
      <Cyl r={0.0088} h={0.25} position={[0, 0.75, 0]} color={ACCENT} roughness={0.4} metalness={0.3} />
      {/* Basket. */}
      <Cyl r={0.045} h={0.006} position={[0, 0.1, 0]} seg={20} color="#1c1d20" roughness={0.6} />
      {/* Grip + strap loop. */}
      <Cyl r={0.016} rTop={0.018} h={0.15} position={[0, POLE_L - 0.075, 0]} color="#1c1d20" roughness={0.7} />
      <Cyl r={0.019} h={0.012} position={[0, POLE_L - 0.006, 0]} color={ACCENT} roughness={0.45} />
      <mesh position={[0, POLE_L - 0.1, 0.02]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[0.04, 0.004, 6, 18]} />
        <meshStandardMaterial color={GRAPHIC} roughness={0.6} />
      </mesh>
    </group>
  );
}

export default function Skis() {
  const skis: { base: Vec3; tilt: number }[] = [
    // Left tail → top leans right; the right one sits a touch further out so they cross cleanly.
    { base: [SKIS_CX - SPREAD, 0.002, BASE_Z], tilt: -TILT },
    { base: [SKIS_CX + SPREAD, 0.002, BASE_Z + 0.028], tilt: TILT },
  ];
  return (
    <group>
      {skis.map(({ base, tilt }) => (
        // Euler XYZ applies Z first: tilt within the wall plane, then lean back onto the wall.
        <group key={base[0]} position={base} rotation={[-LEAN, 0, tilt]}>
          <Ski />
        </group>
      ))}
      {/* Poles stand in the V of the crossed skis, leaning on the wall just behind them. */}
      {[-1, 1].map((s) => (
        <group key={`pole${s}`} position={[SKIS_CX + s * 0.035, 0.002, BASE_Z - 0.05]} rotation={[-0.11, 0, s * -0.03]}>
          <Pole />
        </group>
      ))}
    </group>
  );
}
