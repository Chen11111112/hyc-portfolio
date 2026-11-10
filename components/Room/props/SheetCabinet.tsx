"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { DoubleSide, type Group } from "three";
import { rng } from "../layout";
import { Box, Cyl, Rod } from "./primitives";

// Horizontal 日-shaped open sheet-music cabinet with a vinyl turntable on top; sits under the wall-hung guitars.
// Side-wall-local coords: wall at z = 0, room toward +z. `x1` is the edge nearest the marimba.
export const SHEET_CABINET_W = 0.95;
const W = SHEET_CABINET_W;
const D = 0.42;
const H = 0.45;
const WOOD = { color: "#4a2f20", roughness: 0.55 };
const FRONT = { color: "#5a3a28", roughness: 0.5 };

function Turntable() {
  const platter = useRef<Group>(null);
  // 33⅓ rpm.
  useFrame((_, dt) => {
    if (platter.current) platter.current.rotation.y -= dt * ((33.333 / 60) * Math.PI * 2);
  });
  const plinthH = 0.07;
  const top = plinthH;
  return (
    <group>
      <Box size={[0.45, plinthH, 0.35]} position={[0, plinthH / 2, 0]} color="#2a1a12" roughness={0.4} />
      <Box size={[0.452, 0.004, 0.352]} position={[0, plinthH - 0.002, 0]} color="#1a1b1d" roughness={0.3} metalness={0.3} />
      {[
        [-0.19, -0.15],
        [0.19, -0.15],
        [-0.19, 0.15],
        [0.19, 0.15],
      ].map(([x, z]) => (
        <Cyl key={`${x}${z}`} r={0.018} h={0.012} position={[x, -0.004, z]} color="#111" roughness={0.6} />
      ))}
      <group ref={platter} position={[-0.05, top, 0]}>
        <Cyl r={0.152} h={0.016} position={[0, 0.008, 0]} seg={48} color="#b9bcc0" roughness={0.25} metalness={0.85} />
        <Cyl r={0.149} h={0.003} position={[0, 0.0175, 0]} seg={48} color="#0e0e10" roughness={0.18} />
        <Cyl r={0.045} h={0.0035} position={[0, 0.018, 0]} seg={32} color="#d4483b" roughness={0.6} cast={false} />
        <Box size={[0.03, 0.0005, 0.008]} position={[0.02, 0.02, 0]} color="#f1e0b8" cast={false} />
        <Cyl r={0.003} h={0.02} position={[0, 0.025, 0]} color="#d9dcdf" metalness={0.9} roughness={0.2} />
      </group>
      {/* Tonearm resting on the record. */}
      <Cyl r={0.02} h={0.025} position={[0.15, top + 0.0125, -0.11]} color="#b9bcc0" metalness={0.85} roughness={0.25} />
      <Rod from={[0.15, top + 0.035, -0.11]} to={[0.04, top + 0.03, 0.06]} r={0.0035} color="#d9dcdf" metalness={0.9} roughness={0.2} />
      <Box size={[0.016, 0.01, 0.03]} position={[0.035, top + 0.026, 0.07]} rotation={[0, 0.55, 0]} color="#1a1a1a" roughness={0.4} />
      <Cyl r={0.012} h={0.025} position={[0.17, top + 0.03, -0.14]} rotation={[0, 0, Math.PI / 2]} color="#2a2b2e" metalness={0.6} roughness={0.3} />
      {/* Speed knob + start button. */}
      <Cyl r={0.012} h={0.01} position={[-0.18, top + 0.005, 0.14]} color="#c2c6ca" metalness={0.85} roughness={0.25} />
      <Box size={[0.025, 0.006, 0.015]} position={[-0.14, top + 0.003, 0.15]} color="#c2c6ca" metalness={0.85} roughness={0.25} />
      {/* Dust cover, propped open toward the wall. */}
      <group position={[0, top + 0.002, -0.175]} rotation={[-1.25, 0, 0]}>
        <mesh position={[0, 0.002, 0.175]}>
          <boxGeometry args={[0.45, 0.004, 0.35]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.05} transparent opacity={0.14} side={DoubleSide} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

type Stack = { x: number; y: number; w: number; h: number; d: number; color: string; upright: boolean };

/** Scores and sheet-music folders for one compartment: a flat stack, then a row of upright books. */
function compartment(seed: number, width: number): Stack[] {
  const rand = rng(seed);
  const items: Stack[] = [];
  let x = -width / 2 + 0.02;
  // Flat stack of loose sheet music / scores.
  const stackW = 0.24;
  let y = 0;
  const layers = 5 + Math.floor(rand() * 4);
  for (let i = 0; i < layers; i += 1) {
    const h = 0.008 + rand() * 0.012;
    items.push({ x: x + stackW / 2 + (rand() - 0.5) * 0.015, y, w: stackW - rand() * 0.02, h, d: 0.31, color: pick(rand), upright: false });
    y += h;
  }
  x += stackW + 0.02;
  // Upright score books / binders.
  while (x < width / 2 - 0.03) {
    const w = 0.012 + rand() * 0.025;
    if (x + w > width / 2 - 0.02) break;
    items.push({ x: x + w / 2, y: 0, w, h: 0.24 + rand() * 0.08, d: 0.3, color: pick(rand), upright: true });
    x += w + 0.002;
  }
  return items;
}

const SCORE_COLORS = ["#f3efe4", "#e9e2cf", "#2f4858", "#8c2f2f", "#d9c9a3", "#3d5a40", "#f6f3ea", "#1f2a36", "#c49a45"];
function pick(rand: () => number) {
  return SCORE_COLORS[Math.floor(rand() * SCORE_COLORS.length)];
}

function Compartment({ seed, floorY, cx, cz, width }: { seed: number; floorY: number; cx: number; cz: number; width: number }) {
  const items = compartment(seed, width);
  return (
    <group position={[cx, floorY, cz]}>
      {items.map((it, i) => (
        <Box key={i} size={[it.w, it.h, it.d]} position={[it.x, it.y + it.h / 2, 0]} color={it.color} roughness={it.upright ? 0.75 : 0.85} />
      ))}
    </group>
  );
}

/**
 * Sheet-music cabinet shaped like a 日 lying on its side: a wide, low open-fronted box split by one
 * vertical divider into left and right compartments, with a vinyl turntable on top.
 * Wall at z = 0, room toward +z; `x1` is the right-hand edge.
 */
export default function SheetCabinet({ x1 }: { x1: number }) {
  const cx = x1 - W / 2;
  const cz = 0.01 + D / 2;
  const T = 0.022; // board thickness
  const bottomY = T / 2 + 0.03;
  const floorY = bottomY + T / 2;
  const compW = W / 2 - T * 1.5;
  return (
    <group>
      {/* Sides + central divider. */}
      {[cx - W / 2 + T / 2, cx + W / 2 - T / 2].map((x) => (
        <Box key={x} size={[T, H, D]} position={[x, H / 2, cz]} {...WOOD} />
      ))}
      <Box size={[T, H - bottomY - T, D - 0.01]} position={[cx, floorY + (H - T - floorY) / 2, cz]} {...FRONT} />
      {/* Bottom + top boards. */}
      <Box size={[W - T * 2, T, D]} position={[cx, bottomY, cz]} {...FRONT} />
      <Box size={[W - T * 2, T, D]} position={[cx, H - T / 2, cz]} {...FRONT} />
      {/* Kick plate, back panel. */}
      <Box size={[W - T * 2, 0.03, T]} position={[cx, 0.015, cz + D / 2 - T]} color="#2e1d14" roughness={0.6} />
      <Box size={[W, H, 0.008]} position={[cx, H / 2, cz - D / 2 + 0.004]} color="#3e271b" roughness={0.6} />
      <Compartment seed={11} floorY={floorY} cx={cx - W / 4 + T / 4} cz={cz + 0.02} width={compW} />
      <Compartment seed={29} floorY={floorY} cx={cx + W / 4 - T / 4} cz={cz + 0.02} width={compW} />
      <group position={[cx - 0.12, H, cz + 0.01]}>
        <Turntable />
      </group>
      {/* A couple of record sleeves leaning against the right side. */}
      {[
        { c: "#e3b23c", dz: 0.0 },
        { c: "#2f4858", dz: 0.012 },
      ].map(({ c, dz }) => (
        <Box key={c} size={[0.004, 0.31, 0.31]} position={[cx + W / 2 + 0.03 + dz * 2, 0.155, cz + 0.02 + dz]} rotation={[0, 0, -0.12]} color={c} roughness={0.6} />
      ))}
    </group>
  );
}
