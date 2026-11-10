"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { DoubleSide, ExtrudeGeometry, Shape } from "three";
import { DESK, type Vec3 } from "../layout";
import { Box, Cyl, Mat, Rod } from "./primitives";

/* ------------------------------------------------------------------ */
/* LEGO grand piano on a low white cabinet, just right of the desk.    */
/* ------------------------------------------------------------------ */

export const CAB = { x0: DESK.x1 + 0.04, x1: DESK.x1 + 0.46, z0: 0.03, z1: 0.43, h: 0.46 };
const CAB_LEG = 0.12;
export const CAB_TOP = CAB.h;
const LEGO_BLACK = { color: "#0e0e10", roughness: 0.28, metalness: 0.05 };

function pianoShape(w: number, l: number) {
  const s = new Shape();
  s.moveTo(0, 0);
  s.lineTo(w, 0);
  s.lineTo(w, l * 0.3);
  s.bezierCurveTo(w, l * 0.55, w * 0.46, l * 0.52, w * 0.42, l * 0.8);
  s.bezierCurveTo(w * 0.38, l * 1.0, w * 0.06, l * 1.02, 0, l * 0.94);
  s.lineTo(0, 0);
  return s;
}

function useExtrude(shape: Shape, depth: number, bevel = 0) {
  const geo = useMemo(
    () =>
      new ExtrudeGeometry(shape, {
        depth,
        curveSegments: 28,
        bevelEnabled: bevel > 0,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 2,
      }),
    [shape, depth, bevel],
  );
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}

function PianoCabinet() {
  const w = CAB.x1 - CAB.x0;
  const d = CAB.z1 - CAB.z0;
  const cx = (CAB.x0 + CAB.x1) / 2;
  const cz = (CAB.z0 + CAB.z1) / 2;
  return (
    <group>
      {/* Raised on short legs so the wall outlet underneath stays reachable. */}
      <Box size={[w, CAB.h - CAB_LEG, d]} position={[cx, CAB_LEG + (CAB.h - CAB_LEG) / 2, cz]} color="#ebe7e0" roughness={0.75} />
      {[
        [CAB.x0 + 0.025, CAB.z0 + 0.025],
        [CAB.x1 - 0.025, CAB.z0 + 0.025],
        [CAB.x0 + 0.025, CAB.z1 - 0.025],
        [CAB.x1 - 0.025, CAB.z1 - 0.025],
      ].map(([x, z]) => (
        <Box key={`${x}${z}`} size={[0.028, CAB_LEG, 0.028]} position={[x, CAB_LEG / 2, z]} color="#d9d4cb" roughness={0.6} />
      ))}
      <Box size={[w - 0.02, 0.003, 0.002]} position={[cx, CAB.h * 0.55, CAB.z1 + 0.001]} color="#cfc9bf" roughness={0.8} cast={false} />
    </group>
  );
}

function LegoPiano() {
  const W = 0.25;
  const L = 0.34;
  const bodyH = 0.07;
  const legH = 0.11;
  const shape = useMemo(() => pianoShape(W, L), []);
  const body = useExtrude(shape, bodyH);
  const lid = useExtrude(shape, 0.005);
  const bodyTop = legH + bodyH;
  const whiteKeys = 26;
  const keyPitch = (W - 0.03) / whiteKeys;
  const blackKeys = useMemo(() => {
    const keys: number[] = [];
    for (let i = 0; i < whiteKeys - 1; i += 1) if ([0, 1, 3, 4, 5].includes(i % 7)) keys.push(i);
    return keys;
  }, []);
  const lidAngle = 0.55;
  const propX = W * 0.78;
  return (
    <group
      position={[(CAB.x0 + CAB.x1) / 2 + 0.01, CAB.h, (CAB.z0 + CAB.z1) / 2 + 0.11]}
      rotation={[0, -0.35, 0]}
    >
      <group position={[-W / 2, 0, 0]}>
        {/* Case: shape lies in XY, extrude upward (+Z → +Y) with the tail toward the wall. */}
        <mesh geometry={body} position={[0, legH, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <Mat {...LEGO_BLACK} />
        </mesh>
        <group position={[0, bodyTop, 0]} rotation={[0, 0, lidAngle]}>
          <mesh geometry={lid} rotation={[-Math.PI / 2, 0, 0]} castShadow>
            <meshStandardMaterial {...LEGO_BLACK} side={DoubleSide} />
          </mesh>
        </group>
        <Rod
          from={[propX * 0.96, bodyTop, -L * 0.42]}
          to={[propX * Math.cos(lidAngle), bodyTop + propX * Math.sin(lidAngle) - 0.003, -L * 0.42]}
          r={0.0022}
          {...LEGO_BLACK}
        />
        {/* Legs + pedal lyre. */}
        {[
          [0.02, 0.025],
          [W - 0.02, 0.025],
          [W * 0.2, -L * 0.85],
        ].map(([x, z]) => (
          <Box key={`${x}${z}`} size={[0.018, legH, 0.018]} position={[x, legH / 2, z - 0.01]} {...LEGO_BLACK} />
        ))}
        <Box size={[0.03, legH * 0.8, 0.008]} position={[W / 2, legH * 0.42, -0.06]} {...LEGO_BLACK} />
        <Box size={[0.04, 0.004, 0.012]} position={[W / 2, 0.012, -0.052]} color="#c9a24a" metalness={0.8} roughness={0.3} />
        {/* Keyboard. */}
        <Box size={[W, 0.03, 0.06]} position={[W / 2, legH + 0.015, 0.03]} {...LEGO_BLACK} />
        <Box size={[W - 0.03, 0.008, 0.045]} position={[W / 2, legH + 0.034, 0.034]} color="#f4f3ef" roughness={0.35} />
        {Array.from({ length: whiteKeys - 1 }, (_, i) => (
          <Box
            key={`s${i}`}
            size={[0.0008, 0.0082, 0.045]}
            position={[0.015 + keyPitch * (i + 1), legH + 0.0341, 0.034]}
            color="#b9b8b2"
            cast={false}
          />
        ))}
        {blackKeys.map((i) => (
          <Box
            key={`b${i}`}
            size={[keyPitch * 0.55, 0.006, 0.026]}
            position={[0.015 + keyPitch * (i + 1), legH + 0.041, 0.024]}
            color="#121214"
            roughness={0.3}
            cast={false}
          />
        ))}
        {/* Music desk. */}
        <Box size={[W * 0.6, 0.05, 0.004]} position={[W / 2, bodyTop + 0.022, -0.035]} rotation={[-0.25, 0, 0]} {...LEGO_BLACK} />
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Guitars: jazz archtop and classical.                               */
/* ------------------------------------------------------------------ */

type GuitarKind = "jazz" | "folk" | "classical";

type GuitarSpec = {
  kind: GuitarKind;
  lower: number; // half-width of lower bout
  waist: number;
  upper: number;
  len: number; // body length
  depth: number;
  top: string;
  side: string;
  neck: string;
  board: string;
  head: string;
  hardware: string;
  strings: string;
};

/** Wall-hung guitars; `position[0]` is the x along the back wall (y and z come from the hangers). */
const GUITARS: { spec: GuitarSpec; position: Vec3; yaw: number }[] = [
  {
    position: [DESK.x1 + 1.15, 0, 0],
    yaw: 0.42,
    spec: {
      kind: "jazz",
      lower: 0.205,
      waist: 0.14,
      upper: 0.155,
      len: 0.52,
      depth: 0.075,
      top: "#141416",
      side: "#141416",
      neck: "#2a1a12",
      board: "#1a110c",
      head: "#121214",
      hardware: "#d2ae5a",
      strings: "#d8d0bc",
    },
  },
  {
    position: [DESK.x1 + 1.6, 0, 0],
    yaw: 0.3,
    spec: {
      kind: "classical",
      lower: 0.18,
      waist: 0.125,
      upper: 0.14,
      len: 0.48,
      depth: 0.095,
      top: "#ead2a0",
      side: "#5a2f1c",
      neck: "#8a5a36",
      board: "#1c120d",
      head: "#5a2f1c",
      hardware: "#c9a24a",
      strings: "#f3efe4",
    },
  },
];

function guitarShape({ lower: lw, waist: ww, upper: uw, len }: GuitarSpec) {
  const s = new Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(lw * 0.62, 0, lw, len * 0.08, lw, len * 0.3);
  s.bezierCurveTo(lw, len * 0.45, ww, len * 0.47, ww, len * 0.56);
  s.bezierCurveTo(ww, len * 0.63, uw, len * 0.66, uw, len * 0.79);
  s.bezierCurveTo(uw, len * 0.93, uw * 0.5, len, 0, len);
  s.bezierCurveTo(-uw * 0.5, len, -uw, len * 0.93, -uw, len * 0.79);
  s.bezierCurveTo(-uw, len * 0.66, -ww, len * 0.63, -ww, len * 0.56);
  s.bezierCurveTo(-ww, len * 0.47, -lw, len * 0.45, -lw, len * 0.3);
  s.bezierCurveTo(-lw, len * 0.08, -lw * 0.62, 0, 0, 0);
  return s;
}

const NECK_LEN = 0.3;
const HEAD_LEN = 0.19;

function Guitar({ spec }: { spec: GuitarSpec }) {
  const shape = useMemo(() => guitarShape(spec), [spec]);
  const body = useExtrude(shape, spec.depth - 0.008, 0.004);
  const classical = spec.kind === "classical";
  const jazz = spec.kind === "jazz";
  const front = spec.depth / 2;
  const neckW = classical ? 0.054 : 0.046;
  const bridgeY = spec.len * 0.24;
  const nutY = spec.len + NECK_LEN;
  const scale = nutY - bridgeY;
  const boardStart = classical ? spec.len - 0.02 : spec.len - 0.1;
  const boardZ = front + 0.012;
  const stringZ = boardZ + 0.006;
  const holeY = spec.len * 0.68;

  const frets = useMemo(
    () =>
      Array.from({ length: 19 }, (_, i) => nutY - scale * (1 - 2 ** (-(i + 1) / 12))).filter((y) => y > boardStart + 0.005),
    [nutY, scale, boardStart],
  );

  return (
    <group>
      <mesh geometry={body} position={[0, 0, -front + 0.004]} castShadow receiveShadow>
        <meshStandardMaterial attach="material-0" color={spec.top} roughness={jazz ? 0.22 : 0.38} />
        <meshStandardMaterial attach="material-1" color={spec.side} roughness={0.35} />
      </mesh>

      {/* Neck, fretboard, frets, headstock. */}
      <Box size={[neckW, NECK_LEN + 0.04, 0.022]} position={[0, spec.len + NECK_LEN / 2 - 0.02, front - 0.005]} color={spec.neck} roughness={0.45} />
      <Box
        size={[neckW + 0.002, nutY - boardStart, 0.006]}
        position={[0, (nutY + boardStart) / 2, boardZ - 0.003]}
        color={spec.board}
        roughness={0.55}
      />
      {frets.map((y) => (
        <Box key={y} size={[neckW, 0.0014, 0.0018]} position={[0, y, boardZ + 0.0005]} color="#cfd2d4" metalness={0.9} roughness={0.25} cast={false} />
      ))}
      <Box size={[neckW, 0.004, 0.004]} position={[0, nutY, boardZ + 0.001]} color="#efe9da" roughness={0.4} cast={false} />
      <group position={[0, nutY, front - 0.004]} rotation={[-0.22, 0, 0]}>
        <Box size={[classical ? 0.07 : 0.082, HEAD_LEN, 0.016]} position={[0, HEAD_LEN / 2, 0]} color={spec.head} roughness={0.35} />
        {classical &&
          [-0.017, 0.017].map((x) => (
            <Box key={x} size={[0.012, HEAD_LEN * 0.66, 0.017]} position={[x, HEAD_LEN * 0.52, 0]} color="#120c08" roughness={0.8} cast={false} />
          ))}
        {jazz && (
          <Box size={[0.03, 0.05, 0.001]} position={[0, HEAD_LEN * 0.6, 0.0085]} color="#f1ece0" roughness={0.2} metalness={0.3} cast={false} />
        )}
        {[0.045, 0.095, 0.145].map((y) =>
          [-1, 1].map((side) => (
            <Cyl
              key={`${y}${side}`}
              r={0.006}
              h={0.024}
              seg={10}
              position={[side * (classical ? 0.045 : 0.05), y, classical ? 0 : -0.012]}
              rotation={[0, 0, Math.PI / 2]}
              color={spec.hardware}
              metalness={0.85}
              roughness={0.3}
              cast={false}
            />
          )),
        )}
      </group>

      {/* Top details. */}
      {!jazz && (
        <>
          <mesh position={[0, holeY, front + 0.0045]}>
            <circleGeometry args={[classical ? 0.042 : 0.047, 40]} />
            <meshStandardMaterial color="#0d0907" roughness={1} />
          </mesh>
          <mesh position={[0, holeY, front + 0.0044]}>
            <ringGeometry args={[classical ? 0.045 : 0.05, classical ? 0.06 : 0.058, 48]} />
            <meshStandardMaterial color={classical ? "#3c5a3a" : "#2a1a12"} roughness={0.6} />
          </mesh>
        </>
      )}
      {spec.kind === "folk" && (
        <mesh position={[0.062, holeY - 0.075, front + 0.0046]} scale={[0.8, 1.25, 1]} rotation={[0, 0, 0.35]}>
          <circleGeometry args={[0.05, 32]} />
          <meshStandardMaterial color="#1b1312" roughness={0.3} />
        </mesh>
      )}
      {jazz && (
        <>
          {[-1, 1].map((side) => (
            <Box
              key={side}
              size={[0.008, 0.11, 0.002]}
              position={[side * 0.1, spec.len * 0.4, front + 0.0046]}
              rotation={[0, 0, side * 0.14]}
              color="#050505"
              cast={false}
            />
          ))}
          <Box size={[0.075, 0.036, 0.012]} position={[0, spec.len - 0.06, front + 0.006]} color="#0a0a0a" roughness={0.4} />
          <Box size={[0.07, 0.03, 0.002]} position={[0, spec.len - 0.06, front + 0.0125]} color={spec.hardware} metalness={0.9} roughness={0.25} cast={false} />
          <Box size={[0.07, 0.16, 0.003]} position={[0.085, spec.len * 0.48, front + 0.016]} rotation={[0, 0, -0.18]} color="#1d1514" roughness={0.25} />
          <Box size={[0.07, 0.11, 0.006]} position={[0, spec.len * 0.075, front + 0.007]} color={spec.hardware} metalness={0.9} roughness={0.25} />
        </>
      )}
      <Box
        size={[classical ? 0.17 : jazz ? 0.12 : 0.15, jazz ? 0.012 : 0.026, jazz ? 0.016 : 0.008]}
        position={[0, bridgeY, front + (jazz ? 0.012 : 0.008)]}
        color={jazz ? "#1a110c" : "#2b1b13"}
        roughness={0.5}
      />

      {/* Strings. */}
      {Array.from({ length: 6 }, (_, i) => {
        const tx = (i - 2.5) * (neckW * 0.78) / 5;
        const bx = (i - 2.5) * (jazz ? 0.0105 : 0.0118);
        const bridgeZ = front + (jazz ? 0.02 : 0.014);
        return (
          <Rod
            key={i}
            from={[bx, jazz ? spec.len * 0.13 : bridgeY, bridgeZ]}
            to={[tx, nutY + 0.002, stringZ]}
            r={0.0006 + (5 - i) * 0.00012}
            color={spec.strings}
            metalness={classical ? 0 : 0.8}
            roughness={0.35}
          />
        );
      })}
    </group>
  );
}

/** Height of the wall hangers' yokes; each guitar hangs by its headstock from one. */
const HOOK_Y = 1.75;
/** Gap between the wall and the back of a hanging guitar (hanger stand-off). */
const HANG_GAP = 0.045;

/** Wall hanger in the guitar's local frame: wooden wall block, arm, and padded yoke under the headstock. */
function WallHanger({ spec }: { spec: GuitarSpec }) {
  const nutY = spec.len + NECK_LEN;
  const front = spec.depth / 2;
  const wallZ = -front - HANG_GAP;
  const y = nutY - 0.006;
  const dark = { color: "#1b1c1e", roughness: 0.45, metalness: 0.5 };
  return (
    <group>
      <Box size={[0.07, 0.11, 0.018]} position={[0, y, wallZ + 0.009]} color="#6b4a32" roughness={0.6} />
      <Rod from={[0, y, wallZ + 0.018]} to={[0, y, front - 0.014]} r={0.0055} {...dark} />
      <Box size={[0.07, 0.008, 0.012]} position={[0, y, front - 0.014]} {...dark} />
      {[-1, 1].map((side) => (
        <Box key={side} size={[0.009, 0.03, 0.012]} position={[side * 0.031, y + 0.013, front - 0.014]} color="#2a2b2e" roughness={0.8} />
      ))}
    </group>
  );
}

export function Guitars() {
  return (
    <group>
      {GUITARS.map(({ spec, position }) => (
        <group key={spec.kind} position={[position[0], HOOK_Y - (spec.len + NECK_LEN), spec.depth / 2 + HANG_GAP]}>
          <WallHanger spec={spec} />
          <Guitar spec={spec} />
        </group>
      ))}
    </group>
  );
}

/** Cabinet + piano; `children` lets the caller wrap just the piano (e.g. to make it clickable). */
export function PianoCorner({ children }: { children: (piano: ReactNode) => ReactNode }) {
  return (
    <group>
      <PianoCabinet />
      {children(<LegoPiano />)}
    </group>
  );
}
