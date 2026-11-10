"use client";

import { useMemo } from "react";
import { DESK, rng, type Vec3 } from "../layout";
import { Cyl, Rod } from "./primitives";

// Small potted plants on the window end of the desk (front-left, beside the desk books).
const TOP = DESK.top;

function Pot({ r, h, color }: { r: number; h: number; color: string }) {
  return (
    <group>
      <Cyl r={r * 0.78} rTop={r} h={h} position={[0, h / 2, 0]} seg={28} color={color} roughness={0.85} />
      <Cyl r={r + 0.004} h={0.012} position={[0, h - 0.006, 0]} seg={28} color={color} roughness={0.8} />
      <Cyl r={r - 0.004} h={0.004} position={[0, h - 0.008, 0]} seg={24} color="#3b2a1e" roughness={1} cast={false} />
      <Cyl r={r * 0.95} h={0.004} position={[0, -0.002, 0]} seg={24} color="#8a5a3a" roughness={0.8} />
    </group>
  );
}

/** Tuft of grass blades fanning out from the soil. */
function Grass({ seed, soilY }: { seed: number; soilY: number }) {
  const blades = useMemo(() => {
    const rand = rng(seed);
    return Array.from({ length: 26 }, () => {
      const a = rand() * Math.PI * 2;
      const lean = 0.15 + rand() * 0.45;
      const len = 0.09 + rand() * 0.08;
      return { a, lean, len, color: rand() > 0.5 ? "#5f9a3a" : "#77b347", r: rand() * 0.015 };
    });
  }, [seed]);
  return (
    <group position={[0, soilY, 0]}>
      {blades.map((b, i) => (
        <group key={i} rotation={[0, b.a, 0]}>
          <mesh position={[0, 0, b.r]} rotation={[b.lean, 0, 0]}>
            <coneGeometry args={[0.0035, b.len, 3]} />
            <meshStandardMaterial color={b.color} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** A few stems with five-petal flowers and leaves. */
function Flowers({ seed, soilY, petal, center }: { seed: number; soilY: number; petal: string; center: string }) {
  const stems = useMemo(() => {
    const rand = rng(seed);
    return Array.from({ length: 5 }, () => {
      const a = rand() * Math.PI * 2;
      const spread = 0.01 + rand() * 0.03;
      const h = 0.12 + rand() * 0.07;
      return { top: [Math.sin(a) * spread * 1.6, h, Math.cos(a) * spread * 1.6] as Vec3, base: [Math.sin(a) * spread * 0.3, 0, Math.cos(a) * spread * 0.3] as Vec3, a };
    });
  }, [seed]);
  return (
    <group position={[0, soilY, 0]}>
      {stems.map((s, i) => (
        <group key={i}>
          <Rod from={s.base} to={s.top} r={0.0018} color="#4f8a35" roughness={0.7} />
          {/* Leaves partway up the stem. */}
          {[0.35, 0.6].map((t) => (
            <mesh
              key={t}
              position={[s.top[0] * t + 0.012 * Math.sin(s.a + t * 6), s.top[1] * t, s.top[2] * t + 0.012 * Math.cos(s.a + t * 6)]}
              rotation={[0.9, s.a + t * 6, 0]}
              scale={[0.5, 1, 0.12]}
              castShadow
            >
              <sphereGeometry args={[0.016, 10, 6]} />
              <meshStandardMaterial color="#5a9a3c" roughness={0.6} />
            </mesh>
          ))}
          {/* Flower head facing up-and-out. */}
          <group position={s.top} rotation={[0.35, s.a, 0]}>
            {Array.from({ length: 5 }, (_, k) => {
              const pa = (k / 5) * Math.PI * 2;
              return (
                <mesh key={k} position={[Math.cos(pa) * 0.011, 0, Math.sin(pa) * 0.011]} rotation={[0, -pa, 0]} scale={[1, 0.3, 0.7]} castShadow>
                  <sphereGeometry args={[0.01, 10, 6]} />
                  <meshStandardMaterial color={petal} roughness={0.55} />
                </mesh>
              );
            })}
            <mesh position={[0, 0.003, 0]}>
              <sphereGeometry args={[0.0065, 10, 8]} />
              <meshStandardMaterial color={center} roughness={0.6} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

export default function Plants() {
  return (
    <group>
      {/* Flowers in terracotta. */}
      <group position={[-0.12, TOP, 0.33]}>
        <Pot r={0.045} h={0.075} color="#c06b45" />
        <Flowers seed={3} soilY={0.068} petal="#f2a7c3" center="#f7d154" />
      </group>
      {/* Grass in a white ceramic pot. */}
      <group position={[-0.115, TOP, 0.5]}>
        <Pot r={0.04} h={0.07} color="#eeece6" />
        <Grass seed={9} soilY={0.064} />
      </group>
      {/* Small yellow flowers in a sage pot. */}
      <group position={[0.02, TOP, 0.62]}>
        <Pot r={0.036} h={0.06} color="#9db59a" />
        <Flowers seed={17} soilY={0.054} petal="#f7d154" center="#c4772b" />
      </group>
    </group>
  );
}
