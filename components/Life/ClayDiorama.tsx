"use client";

import { useEffect, useMemo } from "react";
import { BufferAttribute, CanvasTexture, Color, ExtrudeGeometry, LatheGeometry, Path, Shape, SRGBColorSpace, Vector2 } from "three";
import type { Vec3 } from "@/components/Room/layout";

// The hand-made clay diorama on the Life desk: a lumpy, glossy green hill with a dark glittery pond sunk
// in the middle, three cypress trees (the tall one tipped with a red ball), a little red-roofed house,
// and — as separate pieces — a mini white cat and dog that usually sit on the back rim.
// Origin at the bottom centre; the house and tall trees are at the back right, the pond toward the front.

const BASE = { a: 0.12, b: 0.09, slab: 0.022, bevel: 0.014 };
const POND = { x: -0.02, z: 0.02, a: 0.048, b: 0.038 };
const BASE_TOP = BASE.slab + BASE.bevel * 2;
const GLOSS = { roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.12 };

/** How much taller the hill is at (x, z): higher toward the back, with soft lumps. */
function lift(x: number, z: number) {
  const back = Math.min(1, Math.max(0, (0.03 - z) / 0.12));
  return 1 + 0.9 * back + 0.22 * Math.sin(x * 38 + 1.1) * Math.cos(z * 33 - 0.4);
}

/** Height of the hill's top surface at (x, z), for standing things on it. */
export function hillTop(x: number, z: number) {
  return BASE_TOP * lift(x, z);
}

function outline(theta: number) {
  return 1 + 0.08 * Math.sin(3 * theta + 0.5) + 0.05 * Math.sin(5 * theta + 1.3);
}

function pondOutline(theta: number) {
  return 1 + 0.06 * Math.sin(2 * theta + 0.8) + 0.04 * Math.sin(4 * theta);
}

function useHillGeometry() {
  const geo = useMemo(() => {
    // Shapes are drawn in XY and extruded along +Z, then turned so Z → up: shape y = −world z.
    const shape = new Shape();
    const N = 72;
    for (let i = 0; i <= N; i += 1) {
      const t = (i / N) * Math.PI * 2;
      const k = outline(t);
      const x = Math.cos(t) * BASE.a * k;
      const y = Math.sin(t) * BASE.b * k;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    const hole = new Path();
    for (let i = 0; i <= N; i += 1) {
      const t = (i / N) * Math.PI * 2;
      const k = pondOutline(t);
      const x = POND.x + Math.cos(t) * POND.a * k;
      const y = -POND.z + Math.sin(t) * POND.b * k;
      if (i === 0) hole.moveTo(x, y);
      else hole.lineTo(x, y);
    }
    shape.holes.push(hole);
    const g = new ExtrudeGeometry(shape, {
      depth: BASE.slab,
      bevelEnabled: true,
      bevelThickness: BASE.bevel,
      bevelSize: BASE.bevel,
      bevelSegments: 6,
      curveSegments: 72,
    });
    g.rotateX(-Math.PI / 2);
    g.translate(0, BASE.bevel, 0);
    // Lumps + vertex colours: mottled greens, turning yellow-green down into the pond.
    const pos = g.attributes.position as BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const deep = new Color("#2b7f2a");
    const bright = new Color("#6fbf32");
    const moss = new Color("#b4c838");
    const c = new Color();
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      pos.setY(i, y * lift(x, z));
      const mottle = 0.5 + 0.5 * Math.sin(x * 55 + z * 21) * Math.cos(z * 47 - x * 13);
      c.copy(deep).lerp(bright, mottle * 0.85);
      const toPond = Math.hypot((x - POND.x) / POND.a, (z - POND.z) / POND.b);
      if (toPond < 1.45) c.lerp(moss, Math.min(1, (1.45 - toPond) / 0.35) * 0.8);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}

/** Dark water with silver glitter and a few ripples, like the glazed pond. */
function usePondTexture() {
  const tex = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 256;
    cv.height = 256;
    const ctx = cv.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#45494c";
      ctx.fillRect(0, 0, 256, 256);
      let seed = 3;
      const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
      ctx.strokeStyle = "rgba(20,22,24,0.45)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 26; i += 1) {
        const y = rand() * 256;
        ctx.beginPath();
        ctx.moveTo(rand() * 60, y);
        ctx.bezierCurveTo(80, y + rand() * 10 - 5, 170, y + rand() * 10 - 5, 200 + rand() * 56, y + rand() * 6 - 3);
        ctx.stroke();
      }
      for (let i = 0; i < 900; i += 1) {
        ctx.fillStyle = `rgba(230,232,235,${0.25 + rand() * 0.6})`;
        ctx.fillRect(rand() * 256, rand() * 256, 1, 1);
      }
    }
    const t = new CanvasTexture(cv);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

function Pond() {
  const map = usePondTexture();
  const geo = useMemo(() => {
    const s = new Shape();
    const N = 48;
    for (let i = 0; i <= N; i += 1) {
      const t = (i / N) * Math.PI * 2;
      const k = pondOutline(t) * 1.02;
      const x = Math.cos(t) * POND.a * k;
      const y = Math.sin(t) * POND.b * k;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    return new ExtrudeGeometry(s, { depth: 0.002, bevelEnabled: false, curveSegments: 48 }).rotateX(-Math.PI / 2);
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo} position={[POND.x, BASE.bevel + 0.004, POND.z]} receiveShadow>
      <meshPhysicalMaterial map={map} roughness={0.28} metalness={0.25} clearcoat={1} clearcoatRoughness={0.05} />
    </mesh>
  );
}

/** Cypress: a teardrop of glossy green, `round` for the stubby front one. */
function Cypress({ at, h, r, round, ball }: { at: [number, number]; h: number; r: number; round?: boolean; ball?: string }) {
  const geo = useMemo(() => {
    const pts: Vector2[] = [new Vector2(0, 0)];
    const n = 20;
    for (let i = 0; i <= n; i += 1) {
      const t = i / n;
      // Swells quickly, widest about a third up, then tapers to a rounded (or blunt) tip.
      const swell = Math.sin(Math.min(1, t * 2.6 + 0.08) * (Math.PI / 2));
      const taper = round ? 1 - Math.pow(t, 3) : 1 - Math.pow(t, 1.6) * 0.92;
      pts.push(new Vector2(Math.max(0.0005, r * swell * taper), t * h));
    }
    pts.push(new Vector2(0, h));
    return new LatheGeometry(pts, 24);
  }, [h, r, round]);
  useEffect(() => () => geo.dispose(), [geo]);
  const [x, z] = at;
  const y = hillTop(x, z) - 0.006;
  return (
    <group position={[x, y, z]}>
      <mesh geometry={geo} castShadow>
        <meshPhysicalMaterial color="#2f8a2b" {...GLOSS} />
      </mesh>
      {ball && (
        <mesh position={[0, h + 0.004, 0]} castShadow>
          <sphereGeometry args={[0.0075, 16, 12]} />
          <meshPhysicalMaterial color={ball} {...GLOSS} />
        </mesh>
      )}
    </group>
  );
}

function House({ at }: { at: [number, number] }) {
  const [x, z] = at;
  const y = hillTop(x, z) - 0.004;
  const s = 0.032;
  return (
    <group position={[x, y, z]} rotation={[0, -0.35, 0.05]}>
      <mesh position={[0, 0.011, 0]} castShadow receiveShadow>
        <boxGeometry args={[s, 0.022, s]} />
        <meshPhysicalMaterial color="#f2eee4" {...GLOSS} />
      </mesh>
      <mesh position={[0, 0.0275, 0]} castShadow>
        <boxGeometry args={[s + 0.002, 0.012, s + 0.002]} />
        <meshPhysicalMaterial color="#a3262f" {...GLOSS} />
      </mesh>
    </group>
  );
}

/** The hill, pond, trees and house (no cat or dog: those are their own pieces). */
export function ClayDiorama() {
  const hill = useHillGeometry();
  return (
    <group>
      <mesh geometry={hill} castShadow receiveShadow>
        <meshPhysicalMaterial vertexColors {...GLOSS} />
      </mesh>
      <Pond />
      <Cypress at={[0.05, -0.052]} h={0.11} r={0.021} ball="#c8202c" />
      <Cypress at={[0.0, -0.07]} h={0.072} r={0.013} />
      <Cypress at={[-0.098, 0.02]} h={0.05} r={0.015} round />
      <House at={[0.088, -0.004]} />
    </group>
  );
}

/** Where the cat and the dog sit on the diorama's back-left rim, in its own coordinates. */
export const DIORAMA_SEATS: { cat: Vec3; dog: Vec3 } = {
  cat: [-0.072, hillTop(-0.072, -0.048) - 0.003, -0.048],
  dog: [-0.046, hillTop(-0.046, -0.056) - 0.003, -0.056],
};

/* ------------------------------ Mini figures ------------------------------ */

const PORCELAIN = { roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 };

function Glaze({ color, glow }: { color: string; glow?: boolean }) {
  return <meshPhysicalMaterial color={color} {...PORCELAIN} emissive={glow ? "#ffb04a" : "#000000"} emissiveIntensity={glow ? 0.35 : 0} />;
}

/** Mini white cat with brown ears and a brown patch; ~2 cm tall, faces +z, origin at its feet. */
export function MiniCat({ glow }: { glow?: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.007, 0]} scale={[1, 1.15, 0.9]} castShadow>
        <sphereGeometry args={[0.0072, 16, 12]} />
        <Glaze color="#f6f3ec" glow={glow} />
      </mesh>
      <mesh position={[0.0055, 0.0075, -0.002]} scale={[0.5, 0.9, 0.9]}>
        <sphereGeometry args={[0.004, 12, 8]} />
        <Glaze color="#7a4a2a" glow={glow} />
      </mesh>
      <mesh position={[0, 0.0175, 0.001]} castShadow>
        <sphereGeometry args={[0.0066, 16, 12]} />
        <Glaze color="#f6f3ec" glow={glow} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.0038, 0.0238, 0]} rotation={[0, 0, -s * 0.35]} castShadow>
          <coneGeometry args={[0.0028, 0.006, 8]} />
          <Glaze color={s < 0 ? "#7a4a2a" : "#f6f3ec"} glow={glow} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`e${s}`} position={[s * 0.0024, 0.0182, 0.0062]}>
          <sphereGeometry args={[0.0008, 8, 6]} />
          <meshStandardMaterial color="#1b1b1b" />
        </mesh>
      ))}
    </group>
  );
}

/** Mini white dog with floppy black ears; ~2 cm tall, faces +z, origin at its feet. */
export function MiniDog({ glow }: { glow?: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.0072, 0]} scale={[1, 1.15, 0.9]} castShadow>
        <sphereGeometry args={[0.0075, 16, 12]} />
        <Glaze color="#f6f3ec" glow={glow} />
      </mesh>
      <mesh position={[0, 0.0182, 0.001]} scale={[1.05, 1, 1]} castShadow>
        <sphereGeometry args={[0.0068, 16, 12]} />
        <Glaze color="#f6f3ec" glow={glow} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.0068, 0.0178, 0]} rotation={[0, 0, s * 0.25]} scale={[0.45, 1, 0.75]} castShadow>
          <sphereGeometry args={[0.0048, 12, 8]} />
          <Glaze color="#1d1d21" glow={glow} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`e${s}`} position={[s * 0.0024, 0.019, 0.0064]}>
          <sphereGeometry args={[0.0008, 8, 6]} />
          <meshStandardMaterial color="#1b1b1b" />
        </mesh>
      ))}
      <mesh position={[0, 0.0168, 0.0068]}>
        <sphereGeometry args={[0.0011, 8, 6]} />
        <meshStandardMaterial color="#1b1b1b" />
      </mesh>
    </group>
  );
}
