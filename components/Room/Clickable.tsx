"use client";

import { Html } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Color, Mesh, type Group, type Material } from "three";
import { experienceHref, getExperience, type ExperienceSlug } from "@/lib/experiences";
import type { Vec3 } from "./layout";
import styles from "./Room.module.scss";

const GLOW = new Color("#ffb04a");
const GLOW_INTENSITY = 0.22;
const LIFT = 0.012;
/** Pointer travel (px) between down and up beyond which a click counts as an orbit drag. */
const DRAG_PX = 6;

type Emissive = Material & { emissive: Color; emissiveIntensity: number };

function emissiveMaterials(root: Group) {
  const out: Emissive[] = [];
  root.traverse((obj) => {
    if (!(obj instanceof Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) if ("emissive" in m && m.emissive instanceof Color) out.push(m as Emissive);
  });
  return out;
}

/**
 * Wraps a room prop so it lifts and glows on hover, shows its name, and opens its experience page on click.
 * `label` is where the name tag floats, in the parent group's coordinates.
 */
export default function Clickable({ slug, label, children }: { slug: ExperienceSlug; label: Vec3; children: ReactNode }) {
  const router = useRouter();
  const lift = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const href = experienceHref(slug);
  const title = getExperience(slug)?.label ?? slug;

  useEffect(() => {
    const root = lift.current;
    if (!root || !hovered) return;
    // Tint only materials that aren't already glowing (keeps lamp/screen colours intact).
    const tinted = emissiveMaterials(root)
      .filter((m) => m.emissive.getHex() === 0)
      .map((m) => ({ m, intensity: m.emissiveIntensity }));
    for (const { m } of tinted) {
      m.emissive.copy(GLOW);
      m.emissiveIntensity = GLOW_INTENSITY;
    }
    document.body.style.cursor = "pointer";
    router.prefetch(href);
    return () => {
      for (const { m, intensity } of tinted) {
        m.emissive.setHex(0);
        m.emissiveIntensity = intensity;
      }
      document.body.style.cursor = "";
    };
  }, [hovered, href, router]);

  useFrame((_, dt) => {
    const g = lift.current;
    if (!g) return;
    const goal = hovered ? LIFT : 0;
    g.position.y += (goal - g.position.y) * Math.min(1, dt * 14);
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > DRAG_PX) return;
    router.push(href);
  };

  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
    >
      <group ref={lift}>{children}</group>
      {hovered && (
        <Html position={label} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
          <span className={styles.tag}>{title}</span>
        </Html>
      )}
    </group>
  );
}
