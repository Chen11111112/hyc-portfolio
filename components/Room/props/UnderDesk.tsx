"use client";

import { useMemo } from "react";
import { DoubleSide, Quaternion, Vector3 } from "three";
import { rng, type Vec3 } from "../layout";
import { Box, Cyl, Rod } from "./primitives";

// Things kept in the knee space under the desk: a football and a classical-guitar footstool.

const PHI = (1 + Math.sqrt(5)) / 2;
/** The 12 vertices of an icosahedron — where a football's black pentagons sit. */
const PATCH_DIRS = [
  [0, 1, PHI],
  [0, -1, PHI],
  [0, 1, -PHI],
  [0, -1, -PHI],
  [1, PHI, 0],
  [-1, PHI, 0],
  [1, -PHI, 0],
  [-1, -PHI, 0],
  [PHI, 0, 1],
  [-PHI, 0, 1],
  [PHI, 0, -1],
  [-PHI, 0, -1],
].map(([x, y, z]) => new Vector3(x, y, z).normalize());

/** Classic black-and-white football resting on the floor. */
export function Football({ position, r = 0.11 }: { position: Vec3; r?: number }) {
  const patches = useMemo(
    () =>
      PATCH_DIRS.map((dir) => ({
        position: dir.clone().multiplyScalar(r * 1.002).toArray() as Vec3,
        quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), dir).toArray() as [number, number, number, number],
      })),
    [r],
  );
  return (
    <group position={[position[0], position[1] + r, position[2]]} rotation={[0.4, 0.7, 0.2]}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[r, 32, 24]} />
        <meshStandardMaterial color="#f4f4f1" roughness={0.45} />
      </mesh>
      {patches.map((p) => (
        <mesh key={p.position.join()} position={p.position} quaternion={p.quaternion}>
          <circleGeometry args={[r * 0.3, 5]} />
          <meshStandardMaterial color="#17181a" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/** Adjustable classical-guitar footstool: ribbed plate tilted on two crossed wire frames. */
export function GuitarFootstool({ position, yaw = 0 }: { position: Vec3; yaw?: number }) {
  const steel = { color: "#c3c6ca", roughness: 0.3, metalness: 0.85 };
  const w = 0.3;
  const d = 0.11;
  const hFront = 0.1;
  const hBack = 0.16;
  const tilt = Math.atan2(hBack - hFront, d);
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {/* Crossed frames at each end. */}
      {[-1, 1].map((s) => {
        const x = s * (w / 2 - 0.03);
        return (
          <group key={s}>
            <Rod from={[x, 0.004, d / 2 + 0.02]} to={[x, hBack - 0.01, -d / 2]} r={0.004} {...steel} />
            <Rod from={[x, 0.004, -d / 2 - 0.02]} to={[x, hFront - 0.01, d / 2]} r={0.004} {...steel} />
          </group>
        );
      })}
      {[d / 2 + 0.02, -d / 2 - 0.02].map((z) => (
        <Rod key={z} from={[-(w / 2 - 0.03), 0.004, z]} to={[w / 2 - 0.03, 0.004, z]} r={0.004} {...steel} />
      ))}
      {/* Foot plate with rubber ribs. */}
      <group position={[0, (hFront + hBack) / 2, 0]} rotation={[tilt, 0, 0]}>
        <Box size={[w, 0.008, d + 0.01]} color="#1c1d20" roughness={0.5} metalness={0.3} />
        {[-0.036, -0.012, 0.012, 0.036].map((z) => (
          <Box key={z} size={[w - 0.02, 0.003, 0.012]} position={[0, 0.0055, z]} color="#0e0e10" roughness={0.9} cast={false} />
        ))}
      </group>
    </group>
  );
}

const HOLDER_R = 0.07;
const HOLDER_H = 0.3;
/** Yarn colours for the marimba mallets: pairs of the same hardness share a colour. */
const MALLET_YARN = ["#2f4f8a", "#2f4f8a", "#b8322e", "#b8322e", "#e0b43a", "#e0b43a", "#3c7a5a", "#3c7a5a", "#6b4a8a", "#6b4a8a"];

/**
 * Cardboard tube standing under the desk with 10 marimba mallets (yarn heads up, rattan shafts)
 * and 6 drumsticks (acorn tips up), splayed slightly against the rim.
 */
export function MalletHolder({ position }: { position: Vec3 }) {
  const sticks = useMemo(() => {
    const r = rng(42);
    const all = [
      ...MALLET_YARN.map((yarn) => ({ kind: "mallet" as const, yarn })),
      ...Array.from({ length: 6 }, () => ({ kind: "stick" as const, yarn: "" })),
    ];
    return all.map((s, i) => {
      // Spread round the tube, leaning outwards so the tops fan open.
      const a = (i / all.length) * Math.PI * 2 + r() * 0.3;
      const base = HOLDER_R * (0.25 + r() * 0.45);
      const len = s.kind === "mallet" ? 0.37 + r() * 0.02 : 0.405;
      // At most enough to rest against the rim, never through the tube wall.
      const lean = Math.atan((HOLDER_R - 0.008 - base) / (HOLDER_H - 0.012)) * (0.6 + r() * 0.4);
      const bx = Math.cos(a) * base;
      const bz = Math.sin(a) * base;
      const top: Vec3 = [bx + Math.cos(a) * Math.sin(lean) * len, 0.012 + Math.cos(lean) * len, bz + Math.sin(a) * Math.sin(lean) * len];
      return { ...s, from: [bx, 0.012, bz] as Vec3, top };
    });
  }, []);

  return (
    <group position={position}>
      {/* Tube: open top, kraft outside, darker inside, with a rolled rim and a base. */}
      <mesh position={[0, HOLDER_H / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[HOLDER_R, HOLDER_R, HOLDER_H, 40, 1, true]} />
        <meshStandardMaterial color="#b08a5a" roughness={0.85} side={DoubleSide} />
      </mesh>
      <mesh position={[0, HOLDER_H, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[HOLDER_R, 0.004, 8, 40]} />
        <meshStandardMaterial color="#8a6a42" roughness={0.8} />
      </mesh>
      <Cyl r={HOLDER_R} h={0.012} position={[0, 0.006, 0]} seg={40} color="#8a6a42" roughness={0.8} />
      <Box size={[0.0005, 0.08, 0.06]} position={[HOLDER_R + 0.0003, HOLDER_H * 0.55, 0]} color="#f2ede2" roughness={0.9} cast={false} />
      {sticks.map((s, i) =>
        s.kind === "mallet" ? (
          <group key={i}>
            <Rod from={s.from} to={s.top} r={0.0042} color="#d9bf8c" roughness={0.6} />
            <mesh position={s.top} castShadow>
              <sphereGeometry args={[0.017, 16, 12]} />
              <meshStandardMaterial color={s.yarn} roughness={0.95} />
            </mesh>
          </group>
        ) : (
          <group key={i}>
            <Rod from={s.from} to={s.top} r={0.0072} color="#e3c48f" roughness={0.55} />
            {/* Acorn tip. */}
            <mesh position={s.top} scale={[1, 1.5, 1]} castShadow>
              <sphereGeometry args={[0.0055, 12, 10]} />
              <meshStandardMaterial color="#e3c48f" roughness={0.5} />
            </mesh>
          </group>
        ),
      )}
    </group>
  );
}
