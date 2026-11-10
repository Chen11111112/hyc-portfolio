"use client";

import { RoundedBox } from "@react-three/drei";
import type { Vec3 } from "../layout";
import { Box, Cyl, Mat } from "./primitives";

const RED = { color: "#b3161d", roughness: 0.55 };
const BLACK = { color: "#1b1b1e", roughness: 0.7 };
const NYLON = { color: "#151517", roughness: 0.5, metalness: 0.1 };
const CHROME = { color: "#cfd2d5", roughness: 0.2, metalness: 0.95 };

function Pad({ size, position, rotation, radius = 0.02, mat }: { size: Vec3; position: Vec3; rotation?: Vec3; radius?: number; mat: typeof RED }) {
  return (
    <RoundedBox args={size} radius={radius} smoothness={3} position={position} rotation={rotation} castShadow receiveShadow>
      <Mat {...mat} />
    </RoundedBox>
  );
}

/** Red/black racing chair, swivelled away from the desk so it doesn't hide the laptop. Front faces −z locally. */
export default function GamingChair({ position, yaw }: { position: Vec3; yaw: number }) {
  const legs = [0, 1, 2, 3, 4].map((i) => (i / 5) * Math.PI * 2 + 0.3);
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {/* Star base + casters. */}
      {legs.map((a) => (
        <group key={a} rotation={[0, a, 0]}>
          <Box size={[0.04, 0.035, 0.3]} position={[0, 0.075, 0.15]} rotation={[0.08, 0, 0]} {...NYLON} />
          <mesh position={[0, 0.03, 0.29]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.028, 0.028, 0.035, 16]} />
            <Mat {...NYLON} />
          </mesh>
        </group>
      ))}
      <Cyl r={0.045} rTop={0.032} h={0.08} position={[0, 0.1, 0]} {...NYLON} />
      <Cyl r={0.022} h={0.24} position={[0, 0.24, 0]} {...CHROME} />
      <Cyl r={0.034} h={0.12} position={[0, 0.2, 0]} {...BLACK} />
      <Box size={[0.26, 0.04, 0.26]} position={[0, 0.38, 0]} {...NYLON} />

      {/* Seat with raised bolsters. */}
      <Pad size={[0.52, 0.09, 0.5]} position={[0, 0.45, 0]} mat={RED} radius={0.035} />
      <Pad size={[0.32, 0.03, 0.42]} position={[0, 0.495, -0.01]} mat={BLACK} radius={0.012} />
      {[-1, 1].map((s) => (
        <Pad key={s} size={[0.08, 0.07, 0.48]} position={[s * 0.23, 0.51, 0]} mat={RED} radius={0.03} />
      ))}

      {/* Armrests. */}
      {[-1, 1].map((s) => (
        <group key={`arm${s}`}>
          <Box size={[0.035, 0.2, 0.05]} position={[s * 0.3, 0.52, 0.05]} {...NYLON} />
          <Box size={[0.04, 0.02, 0.12]} position={[s * 0.285, 0.42, 0.05]} {...NYLON} />
          <Pad size={[0.08, 0.03, 0.25]} position={[s * 0.3, 0.635, 0.02]} mat={BLACK} radius={0.012} />
        </group>
      ))}

      {/* Backrest, reclined slightly. */}
      <group position={[0, 0.5, 0.22]} rotation={[0.16, 0, 0]}>
        <Pad size={[0.52, 0.86, 0.09]} position={[0, 0.43, 0]} mat={RED} radius={0.04} />
        <Pad size={[0.3, 0.62, 0.02]} position={[0, 0.38, -0.045]} mat={BLACK} radius={0.01} />
        {[-1, 1].map((s) => (
          <Pad key={s} size={[0.08, 0.5, 0.12]} position={[s * 0.23, 0.32, -0.02]} rotation={[0, s * -0.2, 0]} mat={RED} radius={0.035} />
        ))}
        {/* Harness slots + logo strip near the top. */}
        {[-1, 1].map((s) => (
          <Box key={`slot${s}`} size={[0.05, 0.08, 0.004]} position={[s * 0.13, 0.76, -0.046]} {...BLACK} cast={false} />
        ))}
        <Box size={[0.22, 0.012, 0.002]} position={[0, 0.66, -0.047]} color="#f2f2f2" roughness={0.5} cast={false} />
        <Pad size={[0.26, 0.12, 0.07]} position={[0, 0.68, -0.08]} mat={BLACK} radius={0.03} />
        <Pad size={[0.3, 0.14, 0.07]} position={[0, 0.16, -0.08]} mat={BLACK} radius={0.03} />
      </group>
    </group>
  );
}
