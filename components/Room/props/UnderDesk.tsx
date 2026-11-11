"use client";

import { useMemo } from "react";
import { Quaternion, Vector3 } from "three";
import type { Vec3 } from "../layout";
import { Box, Rod } from "./primitives";

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
