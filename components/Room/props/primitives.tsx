"use client";

import type { Vec3 } from "../layout";

export type MatProps = {
  color: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
};

type Placement = {
  position?: Vec3;
  rotation?: Vec3;
  cast?: boolean;
  receive?: boolean;
};

export function Mat({ color, roughness = 0.7, metalness = 0, emissive = "#000000", emissiveIntensity = 1 }: MatProps) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
    />
  );
}

export function Box({ size, position, rotation, cast = true, receive = true, ...mat }: MatProps & Placement & { size: Vec3 }) {
  return (
    <mesh position={position} rotation={rotation} castShadow={cast} receiveShadow={receive}>
      <boxGeometry args={size} />
      <Mat {...mat} />
    </mesh>
  );
}

export function Cyl({
  r,
  rTop,
  h,
  seg = 24,
  position,
  rotation,
  cast = true,
  receive = true,
  ...mat
}: MatProps & Placement & { r: number; rTop?: number; h: number; seg?: number }) {
  return (
    <mesh position={position} rotation={rotation} castShadow={cast} receiveShadow={receive}>
      <cylinderGeometry args={[rTop ?? r, r, h, seg]} />
      <Mat {...mat} />
    </mesh>
  );
}

/** A box spanning two points — handy for strings, rods and struts. */
export function Rod({ from, to, r, ...mat }: MatProps & { from: Vec3; to: Vec3; r: number }) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const len = Math.hypot(dx, dy, dz);
  const mid: Vec3 = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
  // Cylinder default axis is +Y; tilt it toward the target direction.
  const pitch = Math.atan2(Math.hypot(dx, dz), dy);
  const yaw = Math.atan2(dx, dz);
  return (
    <group position={mid} rotation={[0, yaw, 0]}>
      <mesh rotation={[pitch, 0, 0]} castShadow>
        <cylinderGeometry args={[r, r, len, 8]} />
        <Mat {...mat} />
      </mesh>
    </group>
  );
}
