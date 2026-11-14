"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Group } from "three";
import type { Vec3 } from "../layout";
import { rng } from "../layout";
import { Box, Cyl } from "./primitives";

export const DRAWER_FRONT = "#6e4a33";
const DRAWER_BOX = "#b48c64";
const CAVITY = "#140e0a";
/** Pointer travel (px) between down and up beyond which a click counts as an orbit drag. */
const DRAG_PX = 6;
const SIDE_T = 0.01;

/** Brushed-metal bar pull on a drawer front at depth `z` (front face), centred at height `y`. */
export function DrawerPull({ z, y, width }: { z: number; y: number; width: number }) {
  return (
    <group position={[0, y, z]}>
      <mesh position={[0, 0, 0.014]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.0055, 0.0055, width, 12]} />
        <meshStandardMaterial color="#c3c6ca" roughness={0.3} metalness={0.85} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (width / 2 - 0.012), 0, 0.007]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.014, 10]} />
          <meshStandardMaterial color="#c3c6ca" roughness={0.3} metalness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

type DrawerProps = {
  /** Centre of the drawer front (x, y); `z` is the back face of the front panel when closed. */
  x: number;
  y: number;
  z: number;
  /** Opening size (the front panel is this minus a seam each side). */
  width: number;
  height: number;
  seam: number;
  panelT: number;
  /** Drawer box depth (hidden inside the carcass when closed) and how far it slides out when open. */
  depth: number;
  travel: number;
  pullWidth: number;
  pullY: number;
  /** Contents, laid out from the drawer's inner floor: x centred, y = 0 on the floor, z = 0 at the front, going −z. */
  children?: ReactNode;
};

/**
 * A desk drawer that slides out on click (and back on a second click), with its contents inside.
 * Hovering only switches to the pointer cursor.
 * The carcass behind it is solid, so a dark panel on its face reads as the opening once it's out.
 */
export function SlidingDrawer({ x, y, z, width, height, seam, panelT, depth, travel, pullWidth, pullY, children }: DrawerProps) {
  const slide = useRef<Group>(null);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  useFrame((_, dt) => {
    const g = slide.current;
    if (!g) return;
    const goal = open ? travel : 0;
    g.position.z += (goal - g.position.z) * Math.min(1, dt * 8);
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > DRAG_PX) return;
    setOpen((v) => !v);
  };

  const frontW = width - seam * 2;
  const innerW = frontW - 0.03;
  const boxH = height - 0.03;
  const floorY = -height / 2 + 0.015;
  const wallY = floorY + boxH / 2;

  return (
    <group
      position={[x, y, z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
    >
      {/* The opening in the carcass, only seen once the drawer is out. */}
      <mesh position={[0, 0, 0.0004]}>
        <planeGeometry args={[frontW - 0.004, height - 0.004]} />
        <meshStandardMaterial color={CAVITY} roughness={1} metalness={0} />
      </mesh>
      <group ref={slide}>
        <mesh position={[0, 0, panelT / 2]} castShadow receiveShadow>
          <boxGeometry args={[frontW, height, panelT]} />
          <meshStandardMaterial color={DRAWER_FRONT} roughness={0.66} metalness={0} />
        </mesh>
        <DrawerPull z={panelT} y={pullY} width={pullWidth} />
        {/* Drawer box: floor, two sides and a back, in lighter plywood. */}
        <Box size={[innerW, SIDE_T, depth]} position={[0, floorY + SIDE_T / 2, -depth / 2]} color={DRAWER_BOX} roughness={0.8} />
        {[-1, 1].map((s) => (
          <Box
            key={s}
            size={[SIDE_T, boxH, depth]}
            position={[s * (innerW / 2 - SIDE_T / 2), wallY, -depth / 2]}
            color={DRAWER_BOX}
            roughness={0.8}
          />
        ))}
        <Box size={[innerW, boxH, SIDE_T]} position={[0, wallY, -depth + SIDE_T / 2]} color={DRAWER_BOX} roughness={0.8} />
        <group position={[0, floorY + SIDE_T, 0]}>{children}</group>
      </group>
    </group>
  );
}

/* ---------- Contents. Each set fits the front part of its drawer (the part that slides out). ---------- */

const flat = (yaw = 0): Vec3 => [0, yaw, 0];
const lying = (yaw = 0): [number, number, number] => [0, yaw, Math.PI / 2];

function Pen({ position, yaw = 0, color, len = 0.14 }: { position: Vec3; yaw?: number; color: string; len?: number }) {
  return (
    <group position={position} rotation={flat(yaw)}>
      <Cyl r={0.0048} h={len} seg={12} rotation={lying()} position={[0, 0.0048, 0]} color="#f1f1ee" roughness={0.4} />
      <Cyl r={0.0052} h={len * 0.32} seg={12} rotation={lying()} position={[len * 0.34, 0.0048, 0]} color={color} roughness={0.4} />
      <Box size={[0.03, 0.002, 0.003]} position={[len * 0.3, 0.0105, 0]} color={color} roughness={0.4} />
    </group>
  );
}

function Pencil({ position, yaw = 0 }: { position: Vec3; yaw?: number }) {
  return (
    <group position={position} rotation={flat(yaw)}>
      <Cyl r={0.0038} h={0.16} seg={6} rotation={lying()} position={[0, 0.0038, 0]} color="#f2c230" roughness={0.6} />
      <Cyl r={0.0039} h={0.012} seg={12} rotation={lying()} position={[-0.086, 0.0038, 0]} color="#c9ccd0" metalness={0.7} roughness={0.35} />
      <Cyl r={0.0038} h={0.012} seg={12} rotation={lying()} position={[-0.098, 0.0038, 0]} color="#ec8fa0" />
      <Cyl r={0.0038} rTop={0.0006} h={0.02} seg={12} rotation={[0, 0, -Math.PI / 2]} position={[0.09, 0.0038, 0]} color="#e2c9a0" />
    </group>
  );
}

function Polaroid({ position, yaw, sky, land }: { position: Vec3; yaw: number; sky: string; land: string }) {
  return (
    <group position={position} rotation={flat(yaw)}>
      <Box size={[0.088, 0.0016, 0.106]} position={[0, 0.0008, 0]} color="#f7f5ef" roughness={0.85} />
      <Box size={[0.074, 0.0004, 0.05]} position={[0, 0.0018, -0.019]} color={sky} roughness={0.5} cast={false} />
      <Box size={[0.074, 0.0004, 0.024]} position={[0, 0.0018, 0.018]} color={land} roughness={0.5} cast={false} />
    </group>
  );
}

function CableCoil({ position, color, r = 0.034 }: { position: Vec3; color: string; r?: number }) {
  return (
    <group position={position}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 0.004, 0.004 + i * 0.0045, i * 0.003]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[r - i * 0.003, 0.0032, 8, 40]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
      ))}
      {/* Plug end hanging off the coil. */}
      <Box size={[0.012, 0.007, 0.028]} position={[r + 0.01, 0.004, 0.012]} rotation={flat(0.4)} color={color} roughness={0.45} />
      <Box size={[0.008, 0.003, 0.008]} position={[r + 0.016, 0.004, 0.028]} rotation={flat(0.4)} color="#b9bcc0" metalness={0.8} roughness={0.3} />
    </group>
  );
}

function Battery({ position, yaw = 0 }: { position: Vec3; yaw?: number }) {
  return (
    <group position={position} rotation={flat(yaw)}>
      <Cyl r={0.007} h={0.05} seg={14} rotation={lying()} position={[0, 0.007, 0]} color="#1f1f22" roughness={0.4} />
      <Cyl r={0.0071} h={0.016} seg={14} rotation={lying()} position={[0.017, 0.007, 0]} color="#c8742d" metalness={0.5} roughness={0.35} />
      <Cyl r={0.0025} h={0.003} seg={10} rotation={lying()} position={[0.0265, 0.007, 0]} color="#c9ccd0" metalness={0.8} roughness={0.3} />
    </group>
  );
}

/** Shallow drawer 1: stationery. */
export function StationeryContents() {
  return (
    <group>
      <Pen position={[-0.15, 0, -0.04]} yaw={0.08} color="#2c5bd6" />
      <Pen position={[-0.14, 0, -0.06]} yaw={-0.04} color="#1d1d20" />
      <Pen position={[-0.15, 0, -0.078]} yaw={0.12} color="#d23a3a" />
      <Pencil position={[-0.13, 0, -0.11]} yaw={-0.1} />
      <Box size={[0.3, 0.002, 0.032]} position={[-0.04, 0.001, -0.15]} rotation={flat(0.03)} color="#e9e5d6" roughness={0.4} />
      {/* Sticky notes: a yellow pad with a pink one askew on top. */}
      <Box size={[0.076, 0.012, 0.076]} position={[0.07, 0.006, -0.07]} rotation={flat(0.1)} color="#f6df5c" roughness={0.9} />
      <Box size={[0.076, 0.008, 0.076]} position={[0.075, 0.016, -0.075]} rotation={flat(-0.25)} color="#f39bb4" roughness={0.9} />
      {/* Eraser with its paper sleeve. */}
      <Box size={[0.042, 0.012, 0.02]} position={[0.03, 0.006, -0.145]} rotation={flat(-0.3)} color="#f6f6f2" roughness={0.9} />
      <Box size={[0.026, 0.0125, 0.0205]} position={[0.034, 0.0062, -0.143]} rotation={flat(-0.3)} color="#2f63b8" roughness={0.7} />
      {/* Stapler. */}
      <group position={[0.17, 0, -0.12]} rotation={flat(1.45)}>
        <Box size={[0.13, 0.012, 0.032]} position={[0, 0.006, 0]} color="#2a2b2f" roughness={0.5} />
        <RoundedBox args={[0.125, 0.018, 0.03]} radius={0.006} smoothness={3} position={[-0.002, 0.021, 0]} castShadow>
          <meshStandardMaterial color="#c8302f" roughness={0.45} />
        </RoundedBox>
      </group>
      {/* Paper clips. */}
      {[
        [0.13, -0.035, 0.4],
        [0.145, -0.05, -0.6],
        [0.16, -0.03, 1.2],
      ].map(([px, pz, yaw], i) => (
        <mesh key={i} position={[px, 0.001, pz]} rotation={[Math.PI / 2, 0, yaw]} scale={[1, 2, 1]} castShadow>
          <torusGeometry args={[0.006, 0.0008, 6, 20]} />
          <meshStandardMaterial color="#b8bcc2" metalness={0.85} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

const PHOTO_TONES: [string, string][] = [
  ["#8ec5e8", "#3e6b4f"],
  ["#f6c28b", "#5b7d5a"],
  ["#c9a7d8", "#4f4a6b"],
  ["#dbe9f2", "#ffffff"],
  ["#f2a07b", "#7a4e3d"],
  ["#89a7d8", "#2e3d59"],
];

/** Shallow drawer 2: loose photos, an envelope and guitar picks. */
export function PhotoContents() {
  const r = rng(7);
  return (
    <group>
      <Box size={[0.16, 0.004, 0.1]} position={[-0.13, 0.002, -0.09]} rotation={flat(-0.08)} color="#efe6d2" roughness={0.9} />
      <Box size={[0.16, 0.0006, 0.05]} position={[-0.13, 0.0043, -0.112]} rotation={flat(-0.08)} color="#e3d7bf" roughness={0.9} cast={false} />
      {PHOTO_TONES.map(([sky, land], i) => (
        <Polaroid
          key={i}
          position={[-0.04 + i * 0.045 + (r() - 0.5) * 0.02, 0.0018 * i, -0.085 + (r() - 0.5) * 0.05]}
          yaw={(r() - 0.5) * 0.9}
          sky={sky}
          land={land}
        />
      ))}
      {[
        ["#e8473c", -0.2, -0.03],
        ["#f2c230", -0.18, -0.045],
        ["#2c5bd6", -0.205, -0.055],
      ].map(([color, px, pz], i) => (
        <Cyl
          key={i}
          r={0.013}
          h={0.0016}
          seg={3}
          position={[px as number, 0.0008, pz as number]}
          rotation={[0, i * 0.9, 0]}
          color={color as string}
          roughness={0.35}
        />
      ))}
    </group>
  );
}

/** Shallow drawer 3: charging cables and other electronics odds and ends. */
export function CableContents() {
  return (
    <group>
      <CableCoil position={[-0.17, 0, -0.08]} color="#f3f3f1" />
      <CableCoil position={[-0.08, 0, -0.1]} color="#1d1d20" r={0.04} />
      {/* Wall charger with its prongs folded out. */}
      <group position={[0.02, 0, -0.06]} rotation={flat(0.3)}>
        <RoundedBox args={[0.045, 0.028, 0.045]} radius={0.006} smoothness={3} position={[0, 0.014, 0]} castShadow>
          <meshStandardMaterial color="#f4f4f2" roughness={0.4} />
        </RoundedBox>
        {[-1, 1].map((s) => (
          <Box key={s} size={[0.002, 0.012, 0.016]} position={[s * 0.007, 0.014, 0.03]} color="#c9ccd0" metalness={0.8} roughness={0.3} />
        ))}
      </group>
      <RoundedBox args={[0.07, 0.016, 0.13]} radius={0.006} smoothness={3} position={[0.1, 0.008, -0.1]} rotation={[0, -0.12, 0]} castShadow>
        <meshStandardMaterial color="#3a3c42" roughness={0.5} />
      </RoundedBox>
      {/* Earbuds case. */}
      <RoundedBox args={[0.05, 0.022, 0.04]} radius={0.01} smoothness={4} position={[0.18, 0.011, -0.05]} castShadow>
        <meshStandardMaterial color="#fbfbfa" roughness={0.3} />
      </RoundedBox>
      {/* USB stick and batteries. */}
      <group position={[0.02, 0, -0.14]} rotation={flat(-0.5)}>
        <Box size={[0.045, 0.008, 0.018]} position={[0, 0.004, 0]} color="#d23a3a" roughness={0.45} />
        <Box size={[0.012, 0.0045, 0.012]} position={[0.028, 0.004, 0]} color="#c9ccd0" metalness={0.85} roughness={0.3} />
      </group>
      <Battery position={[0.17, 0, -0.12]} yaw={0.2} />
      <Battery position={[0.18, 0, -0.14]} yaw={0.1} />
    </group>
  );
}

/** Cabinet drawer (top): jewellery and accessories. */
export function JewelleryContents() {
  return (
    <group>
      {/* Open jewellery tray with rings standing in the slots. */}
      <group position={[-0.07, 0, -0.12]}>
        <Box size={[0.15, 0.035, 0.1]} position={[0, 0.0175, 0]} color="#1f2a4a" roughness={0.9} />
        <Box size={[0.138, 0.002, 0.088]} position={[0, 0.0355, 0]} color="#2e3b63" roughness={1} cast={false} />
        {[
          ["#d8b25a", -0.045],
          ["#c9ccd0", -0.015],
          ["#e3c27a", 0.015],
          ["#c9ccd0", 0.045],
        ].map(([color, px], i) => (
          <mesh key={i} position={[px as number, 0.046, -0.01 + (i % 2) * 0.02]} castShadow>
            <torusGeometry args={[0.009, 0.0024, 10, 28]} />
            <meshStandardMaterial color={color as string} metalness={0.9} roughness={0.25} />
          </mesh>
        ))}
      </group>
      {/* Watch: steel case on a leather strap. */}
      <group position={[0.08, 0, -0.12]} rotation={flat(0.35)}>
        <Box size={[0.022, 0.004, 0.18]} position={[0, 0.002, 0]} color="#6a4128" roughness={0.7} />
        <Cyl r={0.021} h={0.011} seg={28} position={[0, 0.0095, 0]} color="#c9ccd0" metalness={0.9} roughness={0.25} />
        <Cyl r={0.017} h={0.001} seg={28} position={[0, 0.0155, 0]} color="#10151f" roughness={0.2} cast={false} />
      </group>
      {/* Bracelets: two metal bangles and a beaded one. */}
      {[
        ["#d8b25a", -0.12, -0.04],
        ["#c9ccd0", -0.08, -0.03],
      ].map(([color, px, pz], i) => (
        <mesh key={i} position={[px as number, 0.0045 + i * 0.006, pz as number]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.032, 0.004, 10, 40]} />
          <meshStandardMaterial color={color as string} metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
      <group position={[0.02, 0.006, -0.04]}>
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          const colors = ["#3a7f6f", "#f1e7d6", "#8b5a3c", "#1d1d20"];
          return (
            <mesh key={i} position={[Math.cos(a) * 0.03, 0, Math.sin(a) * 0.03]} castShadow>
              <sphereGeometry args={[0.0058, 12, 10]} />
              <meshStandardMaterial color={colors[i % colors.length]} roughness={0.35} />
            </mesh>
          );
        })}
      </group>
      {/* Pearl earrings. */}
      {[0.12, 0.135].map((px) => (
        <mesh key={px} position={[px, 0.005, -0.035]} castShadow>
          <sphereGeometry args={[0.005, 14, 12]} />
          <meshStandardMaterial color="#f4efe6" roughness={0.2} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

/** Cabinet drawer: medicine. */
export function MedicineContents() {
  return (
    <group>
      {/* Pill bottles: amber with a white cap, and a white one. */}
      <group position={[-0.12, 0, -0.07]}>
        <Cyl r={0.022} h={0.07} position={[0, 0.035, 0]} color="#b8661c" roughness={0.25} />
        <Box size={[0.03, 0.035, 0.001]} position={[0, 0.035, 0.0222]} color="#f4f1e8" roughness={0.8} cast={false} />
        <Cyl r={0.024} h={0.018} position={[0, 0.079, 0]} color="#f6f6f4" roughness={0.5} />
      </group>
      <group position={[-0.065, 0, -0.1]}>
        <Cyl r={0.019} h={0.06} position={[0, 0.03, 0]} color="#f6f6f4" roughness={0.45} />
        <Cyl r={0.02} h={0.014} position={[0, 0.067, 0]} color="#2f8a5b" roughness={0.5} />
      </group>
      {/* Blister packs. */}
      {[
        [0.02, -0.05, 0.2, 0],
        [0.03, -0.06, -0.15, 0.005],
      ].map(([px, pz, yaw, py], i) => (
        <group key={i} position={[px, py, pz]} rotation={flat(yaw)}>
          <Box size={[0.095, 0.002, 0.045]} position={[0, 0.001, 0]} color="#d5d8dc" metalness={0.6} roughness={0.35} />
          {Array.from({ length: 10 }, (_, j) => (
            <mesh key={j} position={[-0.036 + (j % 5) * 0.018, 0.002, j < 5 ? -0.01 : 0.01]} scale={[1, 0.5, 1]}>
              <sphereGeometry args={[0.0062, 10, 8]} />
              <meshStandardMaterial color="#f3f3f0" roughness={0.3} transparent opacity={0.85} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Box of plasters and a carton of cold medicine. */}
      <group position={[0.12, 0, -0.14]} rotation={flat(-0.1)}>
        <Box size={[0.09, 0.03, 0.06]} position={[0, 0.015, 0]} color="#e9c9a6" roughness={0.8} />
        <Box size={[0.091, 0.008, 0.061]} position={[0, 0.02, 0]} color="#d23a3a" roughness={0.8} cast={false} />
      </group>
      <group position={[0.1, 0, -0.06]} rotation={flat(0.15)}>
        <Box size={[0.1, 0.034, 0.05]} position={[0, 0.017, 0]} color="#fafaf8" roughness={0.75} />
        <Box size={[0.101, 0.006, 0.051]} position={[0, 0.026, 0]} color="#2f8a5b" roughness={0.75} cast={false} />
      </group>
      {/* Digital thermometer. */}
      <group position={[-0.03, 0, -0.15]} rotation={flat(0.5)}>
        <Box size={[0.12, 0.008, 0.018]} position={[0, 0.004, 0]} color="#f4f6f8" roughness={0.4} />
        <Box size={[0.03, 0.0005, 0.011]} position={[0.02, 0.0083, 0]} color="#9fb3a8" roughness={0.3} cast={false} />
        <Cyl r={0.003} h={0.02} seg={10} rotation={lying()} position={[-0.068, 0.004, 0]} color="#c9ccd0" metalness={0.8} roughness={0.3} />
      </group>
    </group>
  );
}

function Bulb({ position, yaw = 0 }: { position: Vec3; yaw?: number }) {
  // Lying on its side: glass globe, neck and screw base along local x.
  return (
    <group position={position} rotation={flat(yaw)}>
      <mesh position={[0.02, 0.03, 0]} castShadow>
        <sphereGeometry args={[0.03, 24, 18]} />
        <meshStandardMaterial color="#fffaf0" roughness={0.08} transparent opacity={0.6} />
      </mesh>
      <Cyl r={0.018} rTop={0.012} h={0.026} rotation={[0, 0, Math.PI / 2]} position={[-0.016, 0.03, 0]} color="#f7f4ec" roughness={0.3} />
      <Cyl r={0.0135} h={0.024} rotation={lying()} position={[-0.04, 0.03, 0]} color="#c9ccd0" metalness={0.85} roughness={0.3} />
      <Cyl r={0.006} h={0.006} rotation={lying()} position={[-0.054, 0.03, 0]} color="#1d1d20" roughness={0.5} />
      {/* Filament inside the glass. */}
      <Box size={[0.03, 0.002, 0.002]} position={[0.02, 0.03, 0]} color="#d9a15a" roughness={0.5} cast={false} />
    </group>
  );
}

/** Cabinet drawer: spare light bulbs and a torch. */
export function BulbContents() {
  return (
    <group>
      <Bulb position={[-0.08, 0, -0.06]} yaw={0.3} />
      <Bulb position={[0.0, 0, -0.08]} yaw={-0.2} />
      <Bulb position={[-0.06, 0, -0.15]} yaw={2.6} />
      {/* Boxed bulbs, standing. */}
      <Box size={[0.065, 0.11, 0.065]} position={[0.1, 0.055, -0.15]} rotation={flat(0.1)} color="#f4f4f2" roughness={0.8} />
      <Box size={[0.066, 0.04, 0.066]} position={[0.1, 0.085, -0.15]} rotation={flat(0.1)} color="#2f63b8" roughness={0.8} cast={false} />
      <Box size={[0.065, 0.11, 0.065]} position={[0.13, 0.055, -0.07]} rotation={flat(-0.15)} color="#f6d15a" roughness={0.8} />
      {/* Torch. */}
      <group position={[0.05, 0, -0.03]} rotation={flat(0.1)}>
        <Cyl r={0.014} h={0.11} rotation={lying()} position={[0, 0.016, 0]} color="#1f1f22" roughness={0.45} />
        <Cyl r={0.019} rTop={0.014} h={0.03} rotation={[0, 0, Math.PI / 2]} position={[0.07, 0.019, 0]} color="#1f1f22" roughness={0.45} />
        <Cyl r={0.017} h={0.002} rotation={lying()} position={[0.086, 0.019, 0]} color="#f2f2ea" roughness={0.1} cast={false} />
      </group>
    </group>
  );
}

const LEGO = ["#d23a3a", "#2c5bd6", "#f2c230", "#2f8a5b", "#f4f4f2"];

/** Cabinet drawer (bottom): odds and ends — LEGO bricks, ski wax, a tape measure. */
export function OddsContents() {
  const r = rng(21);
  return (
    <group>
      {Array.from({ length: 7 }, (_, i) => {
        const long = r() > 0.5;
        const w = long ? 0.032 : 0.016;
        return (
          <group key={i} position={[-0.14 + r() * 0.12, 0, -0.04 - r() * 0.1]} rotation={flat(r() * Math.PI)}>
            <Box size={[w, 0.0096, 0.016]} position={[0, 0.0048, 0]} color={LEGO[i % LEGO.length]} roughness={0.35} />
            {Array.from({ length: long ? 4 : 2 }, (_, j) => (
              <Cyl
                key={j}
                r={0.0024}
                h={0.0017}
                seg={12}
                position={[-w / 2 + 0.004 + (j % (long ? 2 : 1)) * 0.008 + (long ? Math.floor(j / 2) * 0.016 : 0), 0.0105, j % 2 ? 0.004 : -0.004]}
                color={LEGO[i % LEGO.length]}
                roughness={0.35}
              />
            ))}
          </group>
        );
      })}
      {/* Ski wax bar. */}
      <group position={[0.06, 0, -0.06]} rotation={flat(-0.2)}>
        <Box size={[0.09, 0.02, 0.05]} position={[0, 0.01, 0]} color="#7d5bb5" roughness={0.6} />
        <Box size={[0.06, 0.0005, 0.03]} position={[0, 0.0203, 0]} color="#f4f4f2" roughness={0.8} cast={false} />
      </group>
      {/* Tape measure. */}
      <group position={[0.12, 0, -0.13]}>
        <RoundedBox args={[0.06, 0.026, 0.06]} radius={0.01} smoothness={3} position={[0, 0.013, 0]} castShadow>
          <meshStandardMaterial color="#f2c230" roughness={0.5} />
        </RoundedBox>
        <Box size={[0.012, 0.004, 0.016]} position={[0.034, 0.004, 0.012]} color="#1d1d20" roughness={0.5} />
      </group>
    </group>
  );
}
