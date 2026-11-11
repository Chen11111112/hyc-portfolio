"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { CatmullRomCurve3, SRGBColorSpace, TubeGeometry, Vector3, type Group, type Texture } from "three";
import { WORKSHOP_PHOTOS } from "@/lib/roomContent";
import { rng } from "../layout";
import { useCanvasTexture, type Draw } from "./canvasTexture";
import { Box, Cyl } from "./primitives";
import SafeSuspense from "./SafeSuspense";

// Side-wall additions (side-wall-local coords: wall face z = 0, room toward +z, x runs away from the
// corner as it goes negative): a wall clock beside the window, handwritten scores pinned above the
// marimba, and a string of workshop polaroids above them.

/* ---------------------------------- Clock ---------------------------------- */

export const CLOCK = { x: -2.17, y: 2.08, r: 0.13 };

const drawClockFace: Draw = (ctx, w) => {
  const c = w / 2;
  ctx.fillStyle = "#fbfaf7";
  ctx.beginPath();
  ctx.arc(c, c, c, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1c1c1e";
  for (let i = 0; i < 60; i += 1) {
    const a = (i / 60) * Math.PI * 2;
    const long = i % 5 === 0;
    const r0 = c * (long ? 0.8 : 0.86);
    ctx.save();
    ctx.translate(c + Math.sin(a) * r0, c - Math.cos(a) * r0);
    ctx.rotate(a);
    ctx.fillRect(long ? -3 : -1, 0, long ? 6 : 2, c * (long ? 0.12 : 0.05));
    ctx.restore();
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${Math.round(w * 0.1)}px Helvetica, Arial, sans-serif`;
  [12, 3, 6, 9].forEach((n, i) => {
    const a = (i / 4) * Math.PI * 2;
    ctx.fillText(String(n), c + Math.sin(a) * c * 0.6, c - Math.cos(a) * c * 0.6);
  });
};

/** Hours/minutes/seconds for either Taipei (UTC+8) or the visitor's own clock. */
function timeParts(taipei: boolean) {
  const d = new Date();
  if (!taipei) return { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() + d.getMilliseconds() / 1000 };
  return { h: (d.getUTCHours() + 8) % 24, m: d.getUTCMinutes(), s: d.getUTCSeconds() + d.getUTCMilliseconds() / 1000 };
}

/** Analog wall clock. `taipei` picks Taipei time; otherwise the visitor's local time. */
export function WallClock({ taipei }: { taipei: boolean }) {
  const face = useCanvasTexture(drawClockFace, 256, 256);
  const hour = useRef<Group>(null);
  const minute = useRef<Group>(null);
  const second = useRef<Group>(null);
  useFrame(() => {
    const { h, m, s } = timeParts(taipei);
    if (second.current) second.current.rotation.z = -(s / 60) * Math.PI * 2;
    if (minute.current) minute.current.rotation.z = -((m + s / 60) / 60) * Math.PI * 2;
    if (hour.current) hour.current.rotation.z = -(((h % 12) + m / 60) / 12) * Math.PI * 2;
  });
  const { r } = CLOCK;
  return (
    <group position={[CLOCK.x, CLOCK.y, 0]}>
      <Cyl r={r + 0.012} h={0.03} seg={48} position={[0, 0, 0.015]} rotation={[Math.PI / 2, 0, 0]} color="#1c1c1e" roughness={0.4} metalness={0.3} />
      <mesh position={[0, 0, 0.031]}>
        <circleGeometry args={[r, 48]} />
        <meshStandardMaterial map={face} roughness={0.6} />
      </mesh>
      <group position={[0, 0, 0.034]}>
        <group ref={hour}>
          <Box size={[0.009, r * 0.55, 0.003]} position={[0, r * 0.22, 0]} color="#1c1c1e" cast={false} />
        </group>
        <group ref={minute} position={[0, 0, 0.003]}>
          <Box size={[0.006, r * 0.82, 0.003]} position={[0, r * 0.35, 0]} color="#1c1c1e" cast={false} />
        </group>
        <group ref={second} position={[0, 0, 0.006]}>
          <Box size={[0.002, r * 0.9, 0.002]} position={[0, r * 0.32, 0]} color="#d64545" cast={false} />
        </group>
        <Cyl r={0.008} h={0.012} position={[0, 0, 0.006]} rotation={[Math.PI / 2, 0, 0]} color="#d64545" cast={false} />
      </group>
      {/* Glass. */}
      <mesh position={[0, 0, 0.042]}>
        <circleGeometry args={[r, 48]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.05} transparent opacity={0.08} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ----------------------------- Handwritten scores --------------------------- */

function scoreDraw(seed: number, title: string): Draw {
  return (ctx, w, h) => {
    const rand = rng(seed);
    ctx.fillStyle = "#f8f4e8";
    ctx.fillRect(0, 0, w, h);
    const pencil = "rgba(45,45,55,0.85)";
    ctx.strokeStyle = "rgba(90,90,90,0.55)";
    ctx.lineWidth = 1;
    for (let sys = 0; sys < 6; sys += 1) {
      const top = 70 + sys * 64;
      for (let l = 0; l < 5; l += 1) {
        ctx.beginPath();
        ctx.moveTo(20, top + l * 6);
        ctx.lineTo(w - 20, top + l * 6);
        ctx.stroke();
      }
      // Pencilled notes: slightly wobbly heads and stems, a few beams.
      ctx.fillStyle = pencil;
      ctx.strokeStyle = pencil;
      let x = 34 + rand() * 10;
      while (x < w - 30) {
        const y = top + Math.floor(rand() * 9) * 3 - 3;
        ctx.beginPath();
        ctx.ellipse(x, y, 3.4, 2.5, -0.5 + (rand() - 0.5) * 0.3, 0, Math.PI * 2);
        if (rand() > 0.3) ctx.fill();
        else ctx.stroke();
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x + 3, y);
        ctx.lineTo(x + 3 + (rand() - 0.5) * 1.5, y - 20);
        ctx.stroke();
        if (rand() > 0.6) {
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(x + 3, y - 20);
          ctx.lineTo(x + 17, y - 21 + (rand() - 0.5) * 3);
          ctx.stroke();
        }
        x += 14 + rand() * 12;
      }
      ctx.strokeStyle = "rgba(90,90,90,0.55)";
      ctx.lineWidth = 1;
    }
    ctx.fillStyle = pencil;
    ctx.textAlign = "center";
    ctx.font = `italic 20px "Bradley Hand", "Segoe Print", "Comic Sans MS", cursive`;
    ctx.fillText(title, w / 2, 40);
  };
}

const SCORES = [
  { x: -2.66, y: 1.72, tilt: 0.05, seed: 3, title: "Sketch No. 1" },
  { x: -2.96, y: 1.75, tilt: -0.03, seed: 7, title: "Untitled (marimba)" },
  { x: -3.26, y: 1.7, tilt: 0.04, seed: 11, title: "Groove in D" },
];

function ScoreSheet({ x, y, tilt, seed, title }: (typeof SCORES)[number]) {
  const draw = useCallback<Draw>((ctx, w, h) => scoreDraw(seed, title)(ctx, w, h), [seed, title]);
  const map = useCanvasTexture(draw, 300, 420);
  return (
    <group position={[x, y, 0.004]} rotation={[0, 0, tilt]}>
      <mesh receiveShadow>
        <planeGeometry args={[0.21, 0.29]} />
        <meshStandardMaterial map={map} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.13, 0.004]}>
        <sphereGeometry args={[0.006, 10, 8]} />
        <meshStandardMaterial color="#2f6fd6" roughness={0.3} />
      </mesh>
    </group>
  );
}

export function HandwrittenScores() {
  return (
    <group>
      {SCORES.map((s) => (
        <ScoreSheet key={s.seed} {...s} />
      ))}
    </group>
  );
}

/* ------------------------------ Polaroid string ----------------------------- */

const STRING = { x0: -2.4, x1: -3.9, y: 2.3, sag: 0.08, z: 0.03 };
const POLAROID = { w: 0.09, h: 0.106, pic: 0.078 };

const TINTS: [string, string, string][] = [
  ["#f6c28b", "#f7e3c4", "#5b7d5a"],
  ["#8ec5e8", "#e3f1f8", "#3e6b4f"],
  ["#c9a7d8", "#f5d7c8", "#4f4a6b"],
  ["#7fb6c9", "#dcefe9", "#c9b58a"],
  ["#f2a07b", "#fde2c2", "#7a4e3d"],
  ["#9cc3a0", "#eef3dd", "#4d6a3f"],
];

/** Placeholder "group photo": warm room, a row of heads. */
function placeholderDraw(i: number): Draw {
  return (ctx, w, h) => {
    const [a, b, c] = TINTS[i % TINTS.length];
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = c;
    for (let k = 0; k < 5; k += 1) {
      const x = 14 + k * 25;
      ctx.beginPath();
      ctx.arc(x, h * 0.55, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 11, h * 0.55 + 10, 22, h);
    }
  };
}

function Picture({ map }: { map: Texture }) {
  const { h, pic } = POLAROID;
  return (
    <mesh position={[0, h / 2 - (POLAROID.w - pic) / 2 - pic / 2, 0.0016]}>
      <planeGeometry args={[pic, pic]} />
      <meshStandardMaterial map={map} roughness={0.4} />
    </mesh>
  );
}

function PlaceholderPicture({ index }: { index: number }) {
  const draw = useMemo(() => placeholderDraw(index), [index]);
  return <Picture map={useCanvasTexture(draw, 128, 128)} />;
}

function LoadedPicture({ src }: { src: string }) {
  const map = useTexture(src, (t) => {
    (Array.isArray(t) ? t : [t]).forEach((tex) => (tex.colorSpace = SRGBColorSpace));
  });
  return <Picture map={map} />;
}

function stringY(x: number) {
  const t = (x - STRING.x0) / (STRING.x1 - STRING.x0);
  return STRING.y - STRING.sag * 4 * t * (1 - t);
}

export function PhotoString() {
  const rope = useMemo(() => {
    const pts = Array.from({ length: 24 }, (_, i) => {
      const x = STRING.x0 + ((STRING.x1 - STRING.x0) * i) / 23;
      return new Vector3(x, stringY(x), STRING.z);
    });
    return new TubeGeometry(new CatmullRomCurve3(pts), 64, 0.0015, 5, false);
  }, []);
  useEffect(() => () => rope.dispose(), [rope]);
  const rand = rng(31);
  const n = WORKSHOP_PHOTOS.length;
  return (
    <group>
      <mesh geometry={rope}>
        <meshStandardMaterial color="#b49a78" roughness={0.9} />
      </mesh>
      {[STRING.x0, STRING.x1].map((x) => (
        <Cyl key={x} r={0.005} h={0.03} position={[x, STRING.y, 0.015]} rotation={[Math.PI / 2, 0, 0]} color="#8a8f95" metalness={0.8} roughness={0.3} />
      ))}
      {WORKSHOP_PHOTOS.map((p, i) => {
        const x = STRING.x0 + ((STRING.x1 - STRING.x0) * (i + 0.5)) / n;
        const y = stringY(x);
        const tilt = (rand() - 0.5) * 0.16;
        return (
          <group key={i} position={[x, y, STRING.z]}>
            {/* Mini wooden clip. */}
            <Box size={[0.01, 0.026, 0.008]} position={[0, -0.004, 0.003]} color="#d7b98a" roughness={0.7} />
            <group position={[0, -0.012 - POLAROID.h / 2, -0.004]} rotation={[0, 0, tilt]}>
              <Box size={[POLAROID.w, POLAROID.h, 0.002]} color="#fbfaf6" roughness={0.6} />
              {p.src ? (
                <SafeSuspense fallback={<PlaceholderPicture index={i} />}>
                  <LoadedPicture src={p.src} />
                </SafeSuspense>
              ) : (
                <PlaceholderPicture index={i} />
              )}
            </group>
          </group>
        );
      })}
    </group>
  );
}
