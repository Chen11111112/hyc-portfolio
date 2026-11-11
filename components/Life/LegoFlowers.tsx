"use client";

import { useEffect, useMemo } from "react";
import { CatmullRomCurve3, DoubleSide, LatheGeometry, TubeGeometry, Vector2, Vector3 } from "three";
import { Rod } from "@/components/Room/props/primitives";
import type { Vec3 } from "@/components/Room/layout";

// Brick-built flower arrangements for the Life desk: glossy moulded-plastic petals and leaves, glass vases
// and little terracotta pots. Each one's origin is the bottom centre of its pot or vase; all face +z.

const PLASTIC = { roughness: 0.32, metalness: 0 };
const STEM = "#3f8a3a";
const LEAF = "#2f7d3a";
const DARK_LEAF = "#1f5e2c";
const TERRACOTTA = "#c0703f";

function Plastic({ color }: { color: string }) {
  return <meshStandardMaterial color={color} {...PLASTIC} />;
}

/** Flattened ellipsoid: petals and leaves. `size` is the half-extents. */
function Blob({ size, color, position, rotation }: { size: Vec3; color: string; position?: Vec3; rotation?: Vec3 }) {
  return (
    <mesh position={position} rotation={rotation} scale={size} castShadow>
      <sphereGeometry args={[1, 14, 10]} />
      <Plastic color={color} />
    </mesh>
  );
}

function Stem({ from, to, r = 0.0018 }: { from: Vec3; to: Vec3; r?: number }) {
  return <Rod from={from} to={to} r={r} color={STEM} {...PLASTIC} />;
}

/** A leaf rooted at the origin, pointing up then leaning outward by `tilt` toward `yaw`. */
function Leaf({ at, yaw, tilt, len, width, color = LEAF }: { at: Vec3; yaw: number; tilt: number; len: number; width: number; color?: string }) {
  return (
    <group position={at} rotation={[0, yaw, 0]}>
      <group rotation={[tilt, 0, 0]}>
        <Blob size={[width, len, 0.0025]} position={[0, len, 0]} color={color} />
      </group>
    </group>
  );
}

/** Glass vase from a lathe profile [radius, height] pairs, with a little water. */
function GlassVase({ profile, tint = "#cfe6dc", water }: { profile: [number, number][]; tint?: string; water?: number }) {
  const geo = useMemo(() => new LatheGeometry(profile.map(([r, h]) => new Vector2(r, h)), 40), [profile]);
  useEffect(() => () => geo.dispose(), [geo]);
  const waterR = useMemo(() => {
    if (water === undefined) return 0;
    const i = profile.findIndex(([, h]) => h >= water);
    return (profile[Math.max(0, i)]?.[0] ?? 0.03) * 0.94;
  }, [profile, water]);
  return (
    <group>
      <mesh geometry={geo} castShadow>
        <meshPhysicalMaterial color={tint} roughness={0.06} transparent opacity={0.32} side={DoubleSide} depthWrite={false} />
      </mesh>
      {water !== undefined && (
        <mesh position={[0, water / 2, 0]}>
          <cylinderGeometry args={[waterR, waterR * 0.95, water, 32]} />
          <meshPhysicalMaterial color="#dcefe9" roughness={0.05} transparent opacity={0.22} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

/* ------------------------------ Roses ------------------------------ */

/** Rose head: a tight bud in the middle, then rings of petals opening outward. */
function Rose({ color, at, tilt = [0, 0, 0] }: { color: string; at: Vec3; tilt?: Vec3 }) {
  const rings = [
    { n: 4, r: 0.006, size: 0.0085, open: 0.25, y: 0.004 },
    { n: 5, r: 0.011, size: 0.0105, open: 0.55, y: 0.001 },
    { n: 6, r: 0.016, size: 0.012, open: 0.95, y: -0.003 },
  ];
  return (
    <group position={at} rotation={tilt}>
      <mesh position={[0, 0.003, 0]} castShadow>
        <cylinderGeometry args={[0.006, 0.005, 0.014, 12]} />
        <Plastic color={color} />
      </mesh>
      {rings.map((ring, ri) =>
        Array.from({ length: ring.n }, (_, k) => {
          const a = (k / ring.n) * Math.PI * 2 + ri * 0.5;
          return (
            <group key={`${ri}-${k}`} rotation={[0, a, 0]}>
              <Blob size={[ring.size, ring.size * 0.9, 0.0028]} position={[0, ring.y, ring.r]} rotation={[ring.open, 0, 0]} color={color} />
            </group>
          );
        }),
      )}
      {/* Sepals under the head. */}
      {Array.from({ length: 5 }, (_, k) => (
        <group key={`s${k}`} rotation={[0, (k / 5) * Math.PI * 2, 0]}>
          <Blob size={[0.004, 0.008, 0.0015]} position={[0, -0.008, 0.009]} rotation={[1.9, 0, 0]} color={DARK_LEAF} />
        </group>
      ))}
    </group>
  );
}

/** Sprigs of baby's breath: little white beads on short stems. */
function BabysBreath({ at }: { at: Vec3 }) {
  const beads: Vec3[] = [
    [0, 0, 0],
    [0.006, 0.004, 0.002],
    [-0.005, 0.005, 0.003],
    [0.002, 0.009, -0.004],
    [-0.003, -0.002, 0.006],
    [0.007, -0.003, -0.003],
  ];
  return (
    <group position={at}>
      {beads.map((b) => (
        <mesh key={b.join()} position={b}>
          <sphereGeometry args={[0.0028, 8, 6]} />
          <Plastic color="#f6f4ee" />
        </mesh>
      ))}
    </group>
  );
}

/** Dome of pink roses with baby's breath in a short, wide glass vase. */
export function RoseBouquet() {
  const heads = useMemo(() => {
    const out: { p: Vec3; color: string }[] = [];
    const pinks = ["#e66ea3", "#f08bb8", "#d9548e"];
    // A top rose, then two rings lower down the dome.
    out.push({ p: [0, 0.255, 0], color: pinks[0] });
    for (let k = 0; k < 5; k += 1) {
      const a = (k / 5) * Math.PI * 2 + 0.3;
      out.push({ p: [Math.sin(a) * 0.04, 0.24, Math.cos(a) * 0.04], color: pinks[(k + 1) % 3] });
    }
    for (let k = 0; k < 7; k += 1) {
      const a = (k / 7) * Math.PI * 2;
      out.push({ p: [Math.sin(a) * 0.072, 0.212, Math.cos(a) * 0.072], color: pinks[k % 3] });
    }
    return out;
  }, []);
  const vase: [number, number][] = [
    [0, 0],
    [0.045, 0],
    [0.05, 0.03],
    [0.046, 0.08],
    [0.038, 0.11],
    [0.041, 0.12],
  ];
  return (
    <group>
      <GlassVase profile={vase} water={0.07} />
      {heads.map(({ p, color }) => {
        const out = Math.hypot(p[0], p[2]);
        // Heads lean out with the dome.
        const tilt: Vec3 = [Math.atan2(p[2], 0.12) * (out > 0 ? 1 : 0), 0, -Math.atan2(p[0], 0.12)];
        return (
          <group key={p.join()}>
            <Stem from={[p[0] * 0.2, 0.02, p[2] * 0.2]} to={[p[0], p[1] - 0.01, p[2]]} />
            <Rose color={color} at={p} tilt={tilt} />
          </group>
        );
      })}
      {[0.4, 1.5, 2.6, 3.7, 4.8, 5.8].map((a) => (
        <BabysBreath key={a} at={[Math.sin(a) * 0.062, 0.235, Math.cos(a) * 0.062]} />
      ))}
      {[0.2, 1.3, 2.4, 3.5, 4.6, 5.6].map((a) => (
        <Leaf key={a} at={[Math.sin(a) * 0.03, 0.15, Math.cos(a) * 0.03]} yaw={a} tilt={1.0} len={0.024} width={0.01} color={DARK_LEAF} />
      ))}
    </group>
  );
}

/* ------------------------------ Peace lily ------------------------------ */

/** Peace lily: long glossy leaves and white spathes, in a pot of upright tan tubes. */
export function PeaceLily() {
  const tubes = 16;
  const potR = 0.048;
  const potH = 0.085;
  const leaves = [
    { yaw: 0.1, tilt: 0.75, len: 0.07 },
    { yaw: 0.8, tilt: 0.95, len: 0.065 },
    { yaw: 1.6, tilt: 0.7, len: 0.075 },
    { yaw: 2.3, tilt: 1.0, len: 0.06 },
    { yaw: 3.0, tilt: 0.8, len: 0.07 },
    { yaw: 3.8, tilt: 0.9, len: 0.068 },
    { yaw: 4.6, tilt: 0.65, len: 0.075 },
    { yaw: 5.4, tilt: 1.05, len: 0.06 },
    { yaw: 0.5, tilt: 0.35, len: 0.08 },
    { yaw: 3.4, tilt: 0.4, len: 0.078 },
  ];
  const flowers: { x: number; z: number; h: number; lean: number }[] = [
    { x: -0.008, z: 0.006, h: 0.32, lean: 0.08 },
    { x: 0.012, z: -0.006, h: 0.28, lean: -0.12 },
    { x: -0.004, z: -0.012, h: 0.25, lean: 0.2 },
  ];
  return (
    <group>
      {Array.from({ length: tubes }, (_, k) => {
        const a = (k / tubes) * Math.PI * 2;
        return (
          <mesh key={k} position={[Math.sin(a) * potR, potH / 2, Math.cos(a) * potR]} castShadow receiveShadow>
            <cylinderGeometry args={[0.0105, 0.0105, potH, 14]} />
            <Plastic color="#e9b98e" />
          </mesh>
        );
      })}
      <mesh position={[0, potH - 0.006, 0]}>
        <cylinderGeometry args={[potR, potR, 0.004, 24]} />
        <meshStandardMaterial color="#3b2a1e" roughness={0.9} />
      </mesh>
      {leaves.map((l) => (
        <Leaf key={l.yaw} at={[0, potH, 0]} yaw={l.yaw} tilt={l.tilt} len={l.len} width={0.02} />
      ))}
      {flowers.map((f) => {
        const top: Vec3 = [f.x + Math.sin(f.lean) * 0.03, f.h, f.z];
        return (
          <group key={f.h}>
            <Stem from={[f.x, potH, f.z]} to={top} r={0.0022} />
            <group position={top} rotation={[0.25, 0, -f.lean]}>
              {/* White spathe cupped behind a yellow spadix. */}
              <Blob size={[0.013, 0.026, 0.006]} position={[0, 0.018, -0.003]} color="#f7f5ef" />
              <mesh position={[0, 0.016, 0.004]} castShadow>
                <cylinderGeometry args={[0.0028, 0.0034, 0.022, 10]} />
                <Plastic color="#f2cf57" />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
}

/* ------------------------------ Tulips ------------------------------ */

/** Tulip cup: three outer and three inner petals curling in at the top. */
function Tulip({ color, at, tilt }: { color: string; at: Vec3; tilt: Vec3 }) {
  return (
    <group position={at} rotation={tilt}>
      {Array.from({ length: 6 }, (_, k) => {
        const a = (k / 6) * Math.PI * 2;
        const inner = k % 2 === 1;
        return (
          <group key={k} rotation={[0, a, 0]}>
            <Blob size={[0.011, 0.02, 0.003]} position={[0, 0.018, inner ? 0.006 : 0.009]} rotation={[-0.15, 0, 0]} color={color} />
          </group>
        );
      })}
    </group>
  );
}

/** Bunch of tulips in mixed colours in a tall clear vase, with long strap leaves. */
export function TulipBouquet() {
  const blooms = useMemo(() => {
    const colors = ["#d23c2f", "#f2c230", "#7d4fb0", "#f28cb1", "#f28c28", "#c43a7a", "#f2c230", "#d23c2f", "#7d4fb0"];
    return colors.map((color, k) => {
      const a = (k / colors.length) * Math.PI * 2 + 0.2;
      const spread = k === 0 ? 0 : 0.03 + (k % 3) * 0.012;
      return { color, p: [Math.sin(a) * spread, 0.27 + ((k * 7) % 5) * 0.012, Math.cos(a) * spread] as Vec3 };
    });
  }, []);
  const vase: [number, number][] = [
    [0, 0],
    [0.034, 0],
    [0.036, 0.02],
    [0.03, 0.12],
    [0.034, 0.16],
  ];
  return (
    <group>
      <GlassVase profile={vase} water={0.1} />
      {blooms.map(({ color, p }) => (
        <group key={p.join()}>
          <Stem from={[p[0] * 0.15, 0.02, p[2] * 0.15]} to={p} r={0.002} />
          <Tulip color={color} at={p} tilt={[p[2] * 2.5, 0, -p[0] * 2.5]} />
        </group>
      ))}
      {[0.3, 1.4, 2.5, 3.6, 4.7, 5.7].map((a) => (
        <Leaf key={a} at={[Math.sin(a) * 0.02, 0.15, Math.cos(a) * 0.02]} yaw={a} tilt={0.45} len={0.055} width={0.011} color="#4b8b4a" />
      ))}
    </group>
  );
}

/* ------------------------------ Orchid ------------------------------ */

function OrchidFlower({ at, yaw }: { at: Vec3; yaw: number }) {
  return (
    <group position={at} rotation={[0, yaw, 0]}>
      {Array.from({ length: 5 }, (_, k) => {
        const a = (k / 5) * Math.PI * 2;
        return (
          <group key={k} rotation={[0, 0, a]}>
            <Blob size={[0.009, 0.014, 0.0022]} position={[0, 0.011, 0]} color="#fbf6fa" />
          </group>
        );
      })}
      <Blob size={[0.006, 0.006, 0.004]} position={[0, -0.002, 0.003]} color="#d65f9f" />
      <mesh position={[0, 0.001, 0.005]}>
        <sphereGeometry args={[0.0025, 8, 6]} />
        <Plastic color="#f2cf57" />
      </mesh>
    </group>
  );
}

/** Orchid: broad leaves low in a blue ribbed pot, one arching spray of white-and-pink flowers. */
export function Orchid() {
  const potH = 0.09;
  const arc = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(0, potH, 0),
        new Vector3(0.004, 0.2, -0.005),
        new Vector3(0.02, 0.3, 0.0),
        new Vector3(0.06, 0.33, 0.02),
        new Vector3(0.1, 0.31, 0.035),
      ]),
    [],
  );
  const tube = useMemo(() => new TubeGeometry(arc, 40, 0.0018, 6, false), [arc]);
  useEffect(() => () => tube.dispose(), [tube]);
  const blooms = [0.55, 0.66, 0.77, 0.88, 0.99].map((t) => arc.getPoint(t));
  return (
    <group>
      <mesh position={[0, potH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.046, 0.04, potH, 28]} />
        <Plastic color="#7f9fc6" />
      </mesh>
      {Array.from({ length: 14 }, (_, k) => {
        const a = (k / 14) * Math.PI * 2;
        return (
          <mesh key={k} position={[Math.sin(a) * 0.0445, potH / 2, Math.cos(a) * 0.0445]} rotation={[0, a, 0]}>
            <boxGeometry args={[0.004, potH * 0.92, 0.004]} />
            <Plastic color="#6f8fb8" />
          </mesh>
        );
      })}
      {[0.4, 2.2, 3.6, 5.2].map((yaw) => (
        <Leaf key={yaw} at={[0, potH, 0]} yaw={yaw} tilt={1.25} len={0.045} width={0.017} color={DARK_LEAF} />
      ))}
      <mesh geometry={tube} castShadow>
        <meshStandardMaterial color="#5a6b3a" roughness={0.5} />
      </mesh>
      {blooms.map((p, i) => (
        <OrchidFlower key={i} at={[p.x, p.y - 0.012, p.z + 0.004]} yaw={0.2 - i * 0.08} />
      ))}
    </group>
  );
}

/* ------------------------------ Wildflowers ------------------------------ */

function Daisy({ at, petal, center, tilt, size = 1 }: { at: Vec3; petal: string; center: string; tilt: Vec3; size?: number }) {
  const n = 10;
  return (
    <group position={at} rotation={tilt} scale={size}>
      {Array.from({ length: n }, (_, k) => {
        const a = (k / n) * Math.PI * 2;
        return (
          <group key={k} rotation={[0, a, 0]}>
            <Blob size={[0.0045, 0.0018, 0.011]} position={[0, 0, 0.012]} color={petal} />
          </group>
        );
      })}
      <mesh position={[0, 0.002, 0]} castShadow>
        <cylinderGeometry args={[0.0075, 0.0075, 0.005, 16]} />
        <Plastic color={center} />
      </mesh>
    </group>
  );
}

/** A spike of small beads tapering upward (lavender, delphinium). */
function Spike({ at, color, len }: { at: Vec3; color: string; len: number }) {
  const n = Math.round(len / 0.008);
  return (
    <group position={at}>
      {Array.from({ length: n }, (_, k) => {
        const t = k / n;
        const r = 0.0045 * (1 - t * 0.6);
        return (
          <mesh key={k} position={[Math.sin(k * 2.4) * 0.002, k * 0.008, Math.cos(k * 2.4) * 0.002]}>
            <sphereGeometry args={[r, 8, 6]} />
            <Plastic color={color} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Mixed wildflowers in a green-tinted bulb vase: sunflowers, spikes, pink daisies, baby's breath. */
export function WildflowerVase() {
  const vase: [number, number][] = [
    [0, 0],
    [0.03, 0],
    [0.048, 0.035],
    [0.05, 0.07],
    [0.03, 0.12],
    [0.022, 0.17],
    [0.026, 0.18],
  ];
  const heads: { kind: "sun" | "pink" | "spike" | "blue"; p: Vec3; color?: string }[] = [
    { kind: "sun", p: [0.025, 0.31, 0.02] },
    { kind: "sun", p: [-0.035, 0.28, 0.025] },
    { kind: "pink", p: [0.045, 0.27, -0.01], color: "#e84f8a" },
    { kind: "pink", p: [-0.01, 0.33, -0.015], color: "#c45bd0" },
    { kind: "blue", p: [-0.05, 0.3, -0.02], color: "#5a7fd6" },
    { kind: "spike", p: [0.0, 0.33, 0.0], color: "#8b6fd6" },
    { kind: "spike", p: [-0.025, 0.32, -0.03], color: "#d672b8" },
    { kind: "spike", p: [0.035, 0.32, -0.03], color: "#7aa8e0" },
  ];
  return (
    <group>
      <GlassVase profile={vase} tint="#9fc79a" water={0.08} />
      {heads.map(({ kind, p, color }) => {
        const tilt: Vec3 = [p[2] * 4, 0, -p[0] * 4];
        return (
          <group key={p.join()}>
            <Stem from={[p[0] * 0.1, 0.03, p[2] * 0.1]} to={p} />
            {kind === "sun" && <Daisy at={p} petal="#f2c230" center="#6b3d1e" tilt={[tilt[0] + 1.2, 0, tilt[2]]} size={1.3} />}
            {kind === "pink" && <Daisy at={p} petal={color!} center="#f7d154" tilt={[tilt[0] + 1.1, 0, tilt[2]]} />}
            {kind === "blue" && <Daisy at={p} petal={color!} center="#f4f1ea" tilt={[tilt[0] + 1.0, 0, tilt[2]]} size={0.8} />}
            {kind === "spike" && <Spike at={p} color={color!} len={0.06} />}
          </group>
        );
      })}
      {[0.6, 2.0, 3.3, 4.5].map((a) => (
        <BabysBreath key={a} at={[Math.sin(a) * 0.04, 0.27, Math.cos(a) * 0.04]} />
      ))}
      {[0.2, 1.9, 3.9, 5.3].map((a) => (
        <Leaf key={a} at={[Math.sin(a) * 0.01, 0.2, Math.cos(a) * 0.01]} yaw={a} tilt={0.7} len={0.04} width={0.008} color="#5e8f4e" />
      ))}
    </group>
  );
}

/* ------------------------------ Mini pots ------------------------------ */

function MiniPot({ children }: { children: React.ReactNode }) {
  return (
    <group>
      <mesh position={[0, 0.016, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.021, 0.016, 0.032, 20]} />
        <Plastic color={TERRACOTTA} />
      </mesh>
      <mesh position={[0, 0.033, 0]} castShadow>
        <cylinderGeometry args={[0.024, 0.024, 0.008, 20]} />
        <Plastic color="#b5653a" />
      </mesh>
      <mesh position={[0, 0.0365, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.002, 16]} />
        <meshStandardMaterial color="#3b2a1e" roughness={0.9} />
      </mesh>
      <group position={[0, 0.037, 0]}>{children}</group>
    </group>
  );
}

/** Tiny potted plants: a succulent rosette, a cactus with a flower, or a little red bloom. */
export function MiniPlant({ kind }: { kind: "rosette" | "cactus" | "bloom" }) {
  return (
    <MiniPot>
      {kind === "rosette" &&
        [0, 1].map((ring) =>
          Array.from({ length: 6 }, (_, k) => {
            const a = (k / 6) * Math.PI * 2 + ring * 0.5;
            return (
              <group key={`${ring}-${k}`} rotation={[0, a, 0]}>
                <Blob size={[0.006, 0.013 - ring * 0.003, 0.003]} position={[0, 0.006, 0.006 - ring * 0.003]} rotation={[0.9 - ring * 0.5, 0, 0]} color={ring ? "#9cc7a0" : "#7fb08a"} />
              </group>
            );
          }),
        )}
      {kind === "cactus" && (
        <group>
          <mesh position={[0, 0.02, 0]} castShadow>
            <cylinderGeometry args={[0.011, 0.012, 0.04, 14]} />
            <Plastic color="#5f9a55" />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <sphereGeometry args={[0.011, 14, 10]} />
            <Plastic color="#5f9a55" />
          </mesh>
          <Blob size={[0.005, 0.004, 0.005]} position={[0, 0.052, 0]} color="#e2483d" />
        </group>
      )}
      {kind === "bloom" && (
        <group>
          <Stem from={[0, 0, 0]} to={[0.002, 0.045, 0]} />
          <Leaf at={[0, 0.006, 0]} yaw={0.6} tilt={0.9} len={0.012} width={0.006} />
          <Leaf at={[0, 0.006, 0]} yaw={3.4} tilt={0.9} len={0.012} width={0.006} />
          <Tulip color="#e2483d" at={[0.002, 0.042, 0]} tilt={[0, 0, 0]} />
        </group>
      )}
    </MiniPot>
  );
}
