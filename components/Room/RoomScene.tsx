"use client";

import { ContactShadows, Environment, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, Suspense, useEffect, useLayoutEffect, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { Color, DoubleSide, InstancedMesh, Object3D, PerspectiveCamera, Vector3, type DirectionalLight, type HemisphereLight } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { markBootReady } from "@/lib/boot";
import {
  DESK,
  DESK_CX,
  DESK_Z1,
  PEG_H,
  PEG_W,
  PEG_X0,
  PEG_Y0,
  SHELF_D,
  SHELF_SURFACES,
  SHELF_T,
  SHELF_W,
  SHELF_X0,
  SHELF_Z0,
  SHEET_CAB,
  SHEET_CAB_CX,
  type Vec3,
} from "./layout";
import { DeskBooks, ShelfContents } from "./props/Books";
import {
  DeskLamp,
  Figurines,
  Laptop,
  MathPapers,
  NOTEBOOK_POS,
  MacMini,
  Mug,
  Microphone,
  Monitor,
  MonitorRiser,
  Notebook,
  PenHolder,
  Phone,
  Speaker,
  StationeryBasket,
  Tablet,
} from "./props/DeskItems";
import GamingChair from "./props/GamingChair";
import { Guitars, LegoPiano, PIANO_POS } from "./props/Instruments";
import Marimba, { MARIMBA_X0, MARIMBA_X1 } from "./props/Marimba";
import {
  CERT_GRID,
  CORK,
  Certificate,
  CorkBoard,
  TROPHY_SHELF,
  TrailMap,
  TrophyShelf,
  WHITEBOARD,
  Whiteboard,
} from "./props/BackWallExtras";
import DysonFan from "./props/DysonFan";
import MidiKeyboard from "./props/MidiKeyboard";
import { Box } from "./props/primitives";
import SheetCabinet, { MathTextbooks, Nas, Turntable } from "./props/SheetCabinet";
import { Football, GuitarFootstool } from "./props/UnderDesk";
import { CLOCK, HandwrittenScores, PhotoString, WALL_NOTES, WallClock, WallNotes } from "./props/SideWallExtras";
import Skis, { SKIS_CX } from "./props/Skis";
import WoodFloor from "./props/WoodFloor";
import SkyView from "./props/SkyView";
import Outlets from "./props/Cables";
import PegboardPhotos from "./props/PegboardPhotos";
import Plants from "./props/Plants";
import Posters from "./props/Posters";
import { CERTIFICATES, MUSIC_HREF, ROOM_LINKS } from "@/lib/roomContent";
import RoomGuide from "./RoomGuide";
import Clickable from "./Clickable";
import { NightProvider, lerp, readStoredNight, storeNight, useNightMix } from "./nightMode";
import styles from "./Room.module.scss";

class Optional extends Component<{ children: ReactNode }, { on: boolean }> {
  state = { on: true };
  static getDerivedStateFromError() {
    return { on: false };
  }
  render() {
    return this.state.on ? this.props.children : null;
  }
}

// Desk colour (dark, swapped from the original light desk). The floor is light oak planks (WoodFloor).
const WOOD = "#5a3a28";
const FLOOR_SIZE: [number, number] = [12, 14];
const SHELF_WOOD = "#e4d3b4";

const CABINET_W = 0.4;
const PANEL_T = 0.016;
const PROUD = 0.005;
const SEAM = 0.004;
const UNDER = DESK.top - DESK.slab;
const DRAWER_H = (UNDER - SEAM * 3) / 4;
const PANEL_Z1 = DESK_Z1 + PROUD;
const PANEL_Z0 = PANEL_Z1 - PANEL_T;

const LEG_T = 0.02;
const LEG_X0 = DESK.x1 - LEG_T;


/** Top of the side-wall window opening (kept in sync with WIN.y1 below). */
const WIN_TOP = 2.45;
const LOOK: Vec3 = [DESK_CX + 0.3, DESK.top + 0.2, DESK.z0 + DESK.depth / 2];
const ELEVATION = (26 * Math.PI) / 180;
const AZIMUTH = Math.PI / 4;
/** Camera never rises above this (walls are 4 m), so it can't look over the wall tops. */
const MAX_CAMERA_Y = 3.85;
/**
 * After fitting the whole corner in view, pull the camera in by this factor so the desk dominates and
 * little bare wall shows. This is also the zoom-out limit (controls.maxDistance = home distance).
 */
const CLOSE_UP = 0.65;

const FRAME = [
  // Side wall: upright MIDI keyboard + marimba
  [0.7, 0, 3.5],
  [0.7, 0.9, 3.85],
  [-0.21, 1.4, 3.85],
  // Back wall right edge: skis and the end of the poster wall (nothing beyond them is framed)
  [DESK.x1 + 1.5, 0, 0.3],
  [DESK.x1 + 1.52, 1.8, 0.0],
  // Poster wall top row (starts at the pegboard's left edge)
  [DESK.x1 + 1.67, 2.26, 0.0],
  [PEG_X0, 2.26, 0.0],
  // Gaming chair
  [0.2, 0, 1.5],
  [0.5, 1.3, 1.35],
  // Window on the side wall
  [-0.21, WIN_TOP, 1.9],
  [-0.21, WIN_TOP, 0.0],
  [-0.2, 1.3, 0.192],
  [PEG_X0 + PEG_W, PEG_Y0 + PEG_H, 0.016],
  [DESK.x0, DESK.top, DESK_Z1],
  [DESK.x1, DESK.top, DESK_Z1],
].map((p) => new Vector3(...(p as Vec3)));

function CameraRig({ resetRef }: { resetRef: MutableRefObject<(() => void) | null> }) {
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);
  const hasControls = useThree((s) => s.controls !== null);
  useLayoutEffect(() => {
    const camera = get().camera as PerspectiveCamera;
    const aspect = size.width / Math.max(size.height, 1);
    camera.fov = 35;
    camera.aspect = aspect;
    camera.near = 0.08;
    camera.far = 40;
    const offset = new Vector3(
      Math.sin(AZIMUTH) * Math.cos(ELEVATION),
      Math.sin(ELEVATION),
      Math.sin(AZIMUTH) * Math.cos(ELEVATION),
    ).normalize();
    const look = new Vector3(...LOOK);
    let dist = 3.2;
    for (; dist < 16; dist += 0.05) {
      camera.position.copy(look).addScaledVector(offset, dist);
      camera.lookAt(look);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      const inside = FRAME.every((corner) => {
        const ndc = corner.clone().project(camera);
        return Math.abs(ndc.x) < 0.9 && Math.abs(ndc.y) < 0.9 && ndc.z < 1;
      });
      if (inside) break;
    }
    dist *= CLOSE_UP;
    // On portrait/narrow screens the fit would back the camera out (and up) past the wall tops;
    // cap it by height instead and let the sides crop — visitors can orbit/zoom to the rest.
    dist = Math.min(dist, (MAX_CAMERA_Y - look.y) / offset.y);
    camera.position.copy(look).addScaledVector(offset, dist);
    camera.lookAt(look);
    camera.updateMatrixWorld();
    const controls = get().controls as OrbitControlsImpl | null;
    if (controls) {
      // Zoom heads toward the cursor, so allow getting right up close to any prop.
      controls.minDistance = 0.25;
      // Never further out than the home view, so the bare wall ends beyond the L stay out of frame.
      controls.maxDistance = dist;
      controls.target.copy(look);
      controls.update();
    }
    const home = camera.position.clone();
    resetRef.current = () => {
      const c = get().controls as OrbitControlsImpl | null;
      camera.position.copy(home);
      if (c) {
        c.target.copy(look);
        c.update();
      }
    };
  }, [get, size, hasControls, resetRef]);
  return null;
}

/**
 * Low late-afternoon sun (~16° elevation) coming in through the side-wall window, aimed so the patch
 * lands on the notebook at the right of the desk. The ray enters mid-glass of one sash (z ≈ 1.2, clear of
 * the meeting stiles) about 1.3 m up, below the blind, and passes over the tablet, laptop and chair arms.
 */
const SUN_TARGET: Vec3 = [DESK.x1 - 0.24, DESK.top, 0.56];
const SUN_DIR = new Vector3(1.77, -0.55, -0.64).normalize();
const SUN_POS: Vec3 = new Vector3(...SUN_TARGET).addScaledVector(SUN_DIR, -8).toArray() as Vec3;

const SUN_DAY = new Color("#fff4e0");
const MOON = new Color("#9fb4ff");

function Sun() {
  const light = useRef<DirectionalLight>(null);
  const target = useRef<Object3D>(null);
  const mix = useNightMix();
  useLayoutEffect(() => {
    if (light.current && target.current) light.current.target = target.current;
  }, []);
  // Night: the same direction becomes faint, cool moonlight through the window.
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    l.intensity = lerp(3.2, 0.4, mix.current);
    l.color.lerpColors(SUN_DAY, MOON, mix.current);
  });
  return (
    <>
      <directionalLight
        ref={light}
        position={SUN_POS}
        color="#fff4e0"
        intensity={3.2}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={1}
        shadow-camera-far={18}
        shadow-camera-left={-6.5}
        shadow-camera-right={6.5}
        shadow-camera-top={6.5}
        shadow-camera-bottom={-6.5}
        shadow-bias={-0.0004}
        shadow-normalBias={0.012}
      />
      <object3D ref={target} position={SUN_TARGET} />
    </>
  );
}

/**
 * The room is an L-shaped corner: the back wall (z = 0) holds the desk, shelves, pegboard, piano and
 * guitars; the side wall (x = SIDE_X) holds the window and the marimba.
 *
 * Side-wall props are authored as if on a back wall (wall face z = 0, room toward +z, window opening
 * WIN) and then rotated a quarter turn into place by <SideWallGroup>: local x → world −z,
 * local z → world +x. So the window lands at world z ∈ [0.15, 1.9], starting right above the desk's left end.
 */
const SIDE_X = DESK.x0 - 0.01;
/** Window opening on the side wall, in side-wall-local coords. */
const WIN = { x0: -1.9, x1: -0.15, y0: 0.8, y1: WIN_TOP };
const WALL_T = 0.06;

function SideWallGroup({ children }: { children: ReactNode }) {
  return (
    <group position={[SIDE_X, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      {children}
    </group>
  );
}

function BackWall() {
  const x0 = SIDE_X - WALL_T;
  const x1 = 8;
  return (
    <mesh position={[(x0 + x1) / 2, 2, -WALL_T / 2]} castShadow receiveShadow>
      <boxGeometry args={[x1 - x0, 4, WALL_T]} />
      <meshStandardMaterial color="#dfe5ea" roughness={0.9} metalness={0} />
    </mesh>
  );
}

function Wall() {
  const t = WALL_T;
  const y1 = 4;
  const x0 = -14;
  const x1 = WALL_T;
  const parts: { position: Vec3; size: Vec3 }[] = [
    { position: [(x0 + WIN.x0) / 2, y1 / 2, -t / 2], size: [WIN.x0 - x0, y1, t] },
    { position: [(WIN.x1 + x1) / 2, y1 / 2, -t / 2], size: [x1 - WIN.x1, y1, t] },
    { position: [(WIN.x0 + WIN.x1) / 2, WIN.y0 / 2, -t / 2], size: [WIN.x1 - WIN.x0, WIN.y0, t] },
    { position: [(WIN.x0 + WIN.x1) / 2, (WIN.y1 + y1) / 2, -t / 2], size: [WIN.x1 - WIN.x0, y1 - WIN.y1, t] },
  ];
  return (
    <group>
      {parts.map((part) => (
        <mesh key={part.position.join(",")} position={part.position} castShadow receiveShadow>
          <boxGeometry args={part.size} />
          <meshStandardMaterial color="#dfe5ea" roughness={0.9} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

/** Large two-sash sliding window: each sash runs on its own track and they overlap at the centre. */
function Window() {
  const { x0, x1, y0, y1 } = WIN;
  const w = x1 - x0;
  const h = y1 - y0;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const d = 0.08;
  const f = 0.05;
  const frame = { color: "#eef0f2", roughness: 0.4, metalness: 0.3 };
  const members: { position: Vec3; size: Vec3 }[] = [
    { position: [x0 + f / 2, cy, d / 2 - 0.02], size: [f, h, d] },
    { position: [x1 - f / 2, cy, d / 2 - 0.02], size: [f, h, d] },
    { position: [cx, y0 + f / 2, d / 2 - 0.02], size: [w, f, d] },
    { position: [cx, y1 - f / 2, d / 2 - 0.02], size: [w, f, d] },
  ];
  const overlap = 0.05;
  const innerW = (w - 2 * f) / 2 + overlap / 2;
  const sashH = h - 2 * f;
  const sashes = [
    // Outer track (toward outside), right half; inner track (room side), left half.
    { cx: x1 - f - innerW / 2, z: 0.0, handle: -1 },
    { cx: x0 + f + innerW / 2, z: 0.028, handle: 1 },
  ];
  return (
    <group>
      {members.map((m) => (
        <Box key={m.position.join(",")} size={m.size} position={m.position} {...frame} />
      ))}
      {/* Sill. */}
      <Box size={[w + 0.06, 0.02, 0.09]} position={[cx, y0 - 0.01, 0.045]} color="#f4f5f6" roughness={0.5} />
      {sashes.map((s) => (
        <group key={s.z} position={[s.cx, cy, s.z]}>
          <Box size={[innerW, 0.035, 0.024]} position={[0, sashH / 2 - 0.0175, 0]} {...frame} />
          <Box size={[innerW, 0.035, 0.024]} position={[0, -sashH / 2 + 0.0175, 0]} {...frame} />
          <Box size={[0.035, sashH, 0.024]} position={[innerW / 2 - 0.0175, 0, 0]} {...frame} />
          <Box size={[0.035, sashH, 0.024]} position={[-innerW / 2 + 0.0175, 0, 0]} {...frame} />
          <mesh>
            <planeGeometry args={[innerW - 0.07, sashH - 0.07]} />
            <meshPhysicalMaterial color="#cfe3f0" roughness={0.05} metalness={0} transparent opacity={0.16} side={DoubleSide} depthWrite={false} />
          </mesh>
          {/* Crescent lock on the meeting stile. */}
          <Box size={[0.012, 0.05, 0.014]} position={[s.handle * (innerW / 2 - 0.0175), 0, 0.019]} color="#9aa0a6" roughness={0.3} metalness={0.8} />
        </group>
      ))}
      <RollerBlind />
    </group>
  );
}

/** How far the roller blind is pulled down from the top of the window opening (m). */
const BLIND_DROP = 0.42;

/** Roller blind on the room side: cassette at the top, fabric partly lowered, bottom bar and pull chain. */
function RollerBlind() {
  const { x0, x1, y1 } = WIN;
  const cx = (x0 + x1) / 2;
  const w = x1 - x0 - 0.04;
  const z = 0.1;
  const cassetteH = 0.075;
  const fabricTop = y1 - cassetteH;
  const fabricBottom = y1 - BLIND_DROP;
  const chainX = x1 - 0.06;
  return (
    <group>
      <Box size={[w + 0.03, cassetteH, 0.075]} position={[cx, y1 - cassetteH / 2, z - 0.01]} color="#f2f2f0" roughness={0.5} />
      <mesh position={[cx, (fabricTop + fabricBottom) / 2, z]} castShadow receiveShadow>
        <planeGeometry args={[w, fabricTop - fabricBottom]} />
        <meshStandardMaterial color="#ece6da" roughness={0.95} side={DoubleSide} transparent opacity={0.94} />
      </mesh>
      <Box size={[w + 0.004, 0.022, 0.014]} position={[cx, fabricBottom - 0.011, z]} color="#d9d6cf" roughness={0.4} metalness={0.3} />
      <Box size={[0.003, 0.5, 0.003]} position={[chainX, fabricTop - 0.25, z + 0.02]} color="#cfcfcf" roughness={0.4} cast={false} />
      <mesh position={[chainX, fabricTop - 0.5, z + 0.02]}>
        <sphereGeometry args={[0.007, 10, 8]} />
        <meshStandardMaterial color="#d8d8d8" roughness={0.3} metalness={0.4} />
      </mesh>
    </group>
  );
}

const DRAWER_FRONT = "#6e4a33";
/** Centre drawer: starts just right of the drawer cabinet. */
/** Row of shallow drawers under the desktop, spanning from the cabinet to the right leg. */
const APRON = { x0: DESK.x0 + CABINET_W + SEAM, x1: LEG_X0 - SEAM, count: 3, h: 0.08, back: DESK.z0 + 0.2 };
const APRON_W = (APRON.x1 - APRON.x0) / APRON.count;

/** Brushed-metal bar pull on a drawer front at depth `z` (front face), centred at height `y`. */
function DrawerPull({ z, y, width }: { z: number; y: number; width: number }) {
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

function Desk() {
  const drawers = [0, 1, 2, 3].map((i) => {
    const y0 = i * (DRAWER_H + SEAM);
    return y0 + DRAWER_H / 2;
  });
  return (
    <group>
      <RoundedBox
        args={[DESK.x1 - DESK.x0, DESK.slab, DESK.depth]}
        radius={0.008}
        smoothness={4}
        position={[DESK_CX, DESK.top - DESK.slab / 2, DESK.z0 + DESK.depth / 2]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={WOOD} roughness={0.72} metalness={0} />
      </RoundedBox>
      <mesh position={[DESK.x0 + CABINET_W / 2, UNDER / 2, (DESK.z0 + PANEL_Z0 - 0.001) / 2]} castShadow receiveShadow>
        <boxGeometry args={[CABINET_W, UNDER, PANEL_Z0 - 0.001 - DESK.z0]} />
        <meshStandardMaterial color={WOOD} roughness={0.74} metalness={0} />
      </mesh>
      {/* Drawer stack: fronts a shade warmer than the carcass so the seams read, each with a bar pull. */}
      {drawers.map((y) => (
        <group key={y} position={[DESK.x0 + CABINET_W / 2, y, 0]}>
          <mesh position={[0, 0, (PANEL_Z0 + PANEL_Z1) / 2]} castShadow receiveShadow>
            <boxGeometry args={[CABINET_W - SEAM * 2, DRAWER_H, PANEL_T]} />
            <meshStandardMaterial color={DRAWER_FRONT} roughness={0.66} metalness={0} />
          </mesh>
          <DrawerPull z={PANEL_Z1} y={DRAWER_H * 0.22} width={0.12} />
        </group>
      ))}
      {/* Shallow drawers across the whole underside of the desktop: one carcass, three fronts. */}
      <group position={[0, UNDER - APRON.h / 2 - 0.004, 0]}>
        <mesh position={[(APRON.x0 + APRON.x1) / 2, 0.002, (APRON.back + PANEL_Z0) / 2]} castShadow receiveShadow>
          <boxGeometry args={[APRON.x1 - APRON.x0, APRON.h + 0.004, PANEL_Z0 - APRON.back]} />
          <meshStandardMaterial color={WOOD} roughness={0.74} metalness={0} />
        </mesh>
        {Array.from({ length: APRON.count }, (_, i) => (
          <group key={i} position={[APRON.x0 + APRON_W * (i + 0.5), 0, 0]}>
            <mesh position={[0, 0, (PANEL_Z0 + PANEL_Z1) / 2]} castShadow receiveShadow>
              <boxGeometry args={[APRON_W - SEAM * 2, APRON.h, PANEL_T]} />
              <meshStandardMaterial color={DRAWER_FRONT} roughness={0.66} metalness={0} />
            </mesh>
            <DrawerPull z={PANEL_Z1} y={0} width={0.14} />
          </group>
        ))}
      </group>
      {/* Right leg; the knee space under the drawer row stays open. */}
      <mesh position={[(LEG_X0 + DESK.x1) / 2, UNDER / 2, DESK.z0 + (DESK.depth - 0.04) / 2]} castShadow receiveShadow>
        <boxGeometry args={[LEG_T, UNDER, DESK.depth - 0.04]} />
        <meshStandardMaterial color={WOOD} roughness={0.74} metalness={0} />
      </mesh>
    </group>
  );
}

function Shelves() {
  const boards = SHELF_SURFACES;
  return (
    <group>
      {boards.map((surface) => (
        <mesh
          key={surface}
          position={[SHELF_X0 + SHELF_W / 2, surface - SHELF_T / 2, SHELF_Z0 + SHELF_D / 2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[SHELF_W, SHELF_T, SHELF_D]} />
          <meshStandardMaterial color={SHELF_WOOD} roughness={0.74} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

function Pegboard() {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new Object3D();
    const cols = 13;
    const rows = 8;
    let i = 0;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        dummy.position.set((col - (cols - 1) / 2) * 0.05, (row - (rows - 1) / 2) * 0.05, 0.008);
        dummy.rotation.set(Math.PI / 2, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        i += 1;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <group position={[PEG_X0 + PEG_W / 2, PEG_Y0 + PEG_H / 2, 0.01]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[PEG_W, PEG_H, 0.012]} />
        <meshStandardMaterial color="#f5f7f8" roughness={0.82} metalness={0} />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, 13 * 8]}>
        <cylinderGeometry args={[0.0065, 0.0065, 0.014, 10]} />
        <meshStandardMaterial color="#9eacb4" roughness={0.7} metalness={0} />
      </instancedMesh>
    </group>
  );
}

/** Keeps the orbit target inside the room so panning can't wander off past the walls. */
const TARGET_MIN = new Vector3(SIDE_X + 0.15, 0.2, 0.05);
const TARGET_MAX = new Vector3(DESK.x1 + 1.35, 1.9, 2.5);
const LOOK_V = new Vector3(...LOOK);
/** Fraction of the zoom range (from fully out) over which panning freedom ramps up to the full room. */
const PAN_RAMP = 0.55;
const MIN_POLAR = 0.5;

const DAY_BG = new Color("#dfe5ea");
const NIGHT_BG = new Color("#0f121a");

function SceneBackground() {
  const bg = useRef<Color>(null);
  const mix = useNightMix();
  useFrame(() => {
    bg.current?.lerpColors(DAY_BG, NIGHT_BG, mix.current);
  });
  return <color ref={bg} attach="background" args={["#dfe5ea"]} />;
}

const HEMI_SKY_DAY = new Color("#f3f6fb");
const HEMI_SKY_NIGHT = new Color("#6c7aa8");

const SKY_TARGET: Vec3 = [1.2, 0.4, 1.0];
/**
 * High above the room's open front (no wall there to block it), so every prop is lit and drops a soft
 * shadow back onto the walls and desk behind it, which reads as depth from the camera's side.
 */
const SKY_DIR = new Vector3(0.6, 3.5, 1.6).normalize();
const SKY_POS: Vec3 = new Vector3(...SKY_TARGET).addScaledVector(SKY_DIR, 9).toArray() as Vec3;

/**
 * Daylight bouncing around the room. The hemisphere gives an even base; the "skylight" is a soft,
 * shadow-casting light from high above the open front so every prop gets a shaded side and a soft
 * shadow (otherwise only the sun patch has any). By night both drop away and the lamp carries the scene.
 */
function FillLights() {
  const hemi = useRef<HemisphereLight>(null);
  const fill = useRef<DirectionalLight>(null);
  const sky = useRef<DirectionalLight>(null);
  const skyTarget = useRef<Object3D>(null);
  const mix = useNightMix();
  useLayoutEffect(() => {
    if (sky.current && skyTarget.current) sky.current.target = skyTarget.current;
  }, []);
  useFrame(() => {
    const m = mix.current;
    if (hemi.current) {
      hemi.current.intensity = lerp(0.7, 0.22, m);
      hemi.current.color.lerpColors(HEMI_SKY_DAY, HEMI_SKY_NIGHT, m);
    }
    if (fill.current) fill.current.intensity = lerp(0.4, 0.06, m);
    if (sky.current) sky.current.intensity = lerp(1.05, 0, m);
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={["#f3f6fb", "#7b5b45", 0.7]} />
      <directionalLight ref={fill} position={[3.5, 2.6, 4.5]} color="#f6f1ea" intensity={0.4} />
      <directionalLight
        ref={sky}
        position={SKY_POS}
        color="#eef3ff"
        intensity={1.05}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={16}
        shadow-camera-left={-4.5}
        shadow-camera-right={4.5}
        shadow-camera-top={4.5}
        shadow-camera-bottom={-4.5}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
        shadow-radius={6}
      />
      <object3D ref={skyTarget} position={SKY_TARGET} />
    </>
  );
}

function Room({ resetRef, night }: { resetRef: MutableRefObject<(() => void) | null>; night: boolean }) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [taipeiClock, setTaipeiClock] = useState(true);
  useEffect(() => {
    markBootReady();
  }, []);
  const clampTarget = () => {
    const c = controlsRef.current;
    if (!c) return;
    // Panning freedom grows as you zoom in: at the home distance the target is pinned to the home view,
    // close up it can roam the whole room. Zooming back out eases the view back to home.
    const d = c.object.position.distanceTo(c.target);
    const t = Math.min(1, Math.max(0, (c.maxDistance - d) / (c.maxDistance * PAN_RAMP)));
    const lo = LOOK_V.clone().lerp(TARGET_MIN, t);
    const hi = LOOK_V.clone().lerp(TARGET_MAX, t);
    const before = c.target.clone();
    c.target.clamp(lo, hi);
    // Shift the camera by the same amount so clamping doesn't swing the view.
    c.object.position.add(c.target.clone().sub(before));
    // Height cap: camera y = target.y + d·cos(polar) ≤ MAX_CAMERA_Y  ⇒  polar ≥ acos((MAX − target.y) / d).
    const ratio = (MAX_CAMERA_Y - c.target.y) / Math.max(d, 1e-3);
    c.minPolarAngle = ratio >= 1 ? MIN_POLAR : Math.max(MIN_POLAR, Math.acos(Math.max(-1, ratio)));
  };
  return (
    <NightProvider night={night}>
      <SceneBackground />
      <CameraRig resetRef={resetRef} />
      <Sun />
      <FillLights />
      <WoodFloor position={[SIDE_X + 6, 0, 7]} size={FLOOR_SIZE} />
      <BackWall />
      <SideWallGroup>
        <Wall />
        <Window />
        <SkyView opening={WIN} />
        <Clickable onSelect={() => setTaipeiClock((v) => !v)} title={taipeiClock ? "台北時間 · 點擊切換成你的時間" : "你的當地時間 · 點擊切換成台北時間"} label={[CLOCK.x, CLOCK.y + 0.2, 0.08]}>
          <WallClock taipei={taipeiClock} />
        </Clickable>
        {/* Scratch paper + sticky notes under the window → Program. */}
        <Clickable
          href={ROOM_LINKS.program}
          title="Program 程式"
          label={[WALL_NOTES.x, WALL_NOTES.y + 0.32, 0.08]}
          zones={[{ position: [WALL_NOTES.x, WALL_NOTES.y, 0.03], size: [WALL_NOTES.w, WALL_NOTES.h, 0.06] }]}
        >
          <WallNotes />
        </Clickable>
        <Clickable href={MUSIC_HREF} title="興趣・作曲（YouTube）" label={[-2.96, 1.95, 0.08]}>
          <HandwrittenScores />
        </Clickable>
        {/* 教學經歷 (workshop photos), same story as the pegboard. */}
        <Clickable href="/about#teaching" title="教學經歷" label={[-3.15, 2.42, 0.08]}>
          <PhotoString />
        </Clickable>
        {/* 作曲: marimba and the upright MIDI keyboard light up together. */}
        <Clickable
          href={ROOM_LINKS.marimba}
          title="興趣・作曲"
          label={[(MARIMBA_X0 + MARIMBA_X1) / 2, 1.55, 0.55]}
          zones={[
            { position: [(MARIMBA_X0 + MARIMBA_X1) / 2, 0.55, 0.6], size: [MARIMBA_X1 - MARIMBA_X0 + 0.14, 1.1, 0.82] },
            { position: [WIN.x0 + 0.05, 0.66, 0.15], size: [0.4, 1.36, 0.24] },
          ]}
        >
          {/* Stood up in front of the window's left edge, leaning on the sill. */}
          <MidiKeyboard x={WIN.x0 + 0.2} />
          {/* Pulled off the wall so the music stand fits behind the bars. */}
          <group position={[0, 0, 0.25]}>
            <Marimba />
          </group>
        </Clickable>
      </SideWallGroup>
      <Desk />
      <Shelves />
      <Outlets />
      <Clickable href={ROOM_LINKS.bookshelf} title="Course 課程" label={[0.05, 1.58, 0.12]}>
        <ShelfContents />
        <DeskBooks />
      </Clickable>
      <DeskLamp />
      <MonitorRiser />
      {/* 自我介紹 → /about: every device on the desk lights up together. */}
      <Clickable href="/about" title="自我介紹" label={[DESK_CX + 0.04, 1.45, 0.2]} zones={[{ position: [DESK_CX + 0.04, 1.13, 0.14], size: [0.7, 0.45, 0.14] }]}>
        <Monitor />
        <MacMini />
        <Laptop />
        <Tablet />
        <Phone />
        <Speaker />
      </Clickable>
      <Figurines />
      <Mug />
      <StationeryBasket />
      <Plants />
      {/* 興趣・作曲: the microphone on its own. */}
      <Clickable href={ROOM_LINKS.microphone} title="興趣・作曲" label={[0.22, DESK.top + 0.42, 0.4]} zones={[{ position: [0.22, DESK.top + 0.16, 0.4], size: [0.17, 0.34, 0.17] }]}>
        <Microphone />
      </Clickable>
      {/* 數學: green notebook + scratch paper. */}
      <Clickable href={ROOM_LINKS.blog} title="Blog 部落格" label={[NOTEBOOK_POS[0], DESK.top + 0.16, NOTEBOOK_POS[2]]} zones={[{ position: [NOTEBOOK_POS[0], DESK.top + 0.02, NOTEBOOK_POS[2]], size: [0.32, 0.05, 0.32] }]}>
        <Notebook />
        <MathPapers />
      </Clickable>
      <PenHolder />
      <Clickable href={ROOM_LINKS.whiteboard} title="Next.js 開發" label={[WHITEBOARD.x, WHITEBOARD.y + 0.25, 0.08]} zones={[{ position: [WHITEBOARD.x, WHITEBOARD.y, 0.04], size: [WHITEBOARD.w + 0.06, WHITEBOARD.h + 0.06, 0.08] }]}>
        <Whiteboard />
      </Clickable>
      {/* 教學活動記錄: the whole pegboard (board + photos) → the 教學經歷 book on /about. */}
      <Clickable
        href="/about#teaching"
        title="教學經歷"
        label={[PEG_X0 + PEG_W / 2, PEG_Y0 + PEG_H + 0.05, 0.08]}
        zones={[{ position: [PEG_X0 + PEG_W / 2, PEG_Y0 + PEG_H / 2, 0.05], size: [PEG_W + 0.03, PEG_H + 0.04, 0.1] }]}
      >
        <Pegboard />
        <PegboardPhotos />
      </Clickable>
      {/* LEGO piano → YouTube channel. */}
      <Clickable href={MUSIC_HREF} title="YouTube" label={[PIANO_POS[0], SHEET_CAB.h + 0.5, 0.3]}>
        <LegoPiano />
      </Clickable>
      {/* 專案經歷: touching any poster lights them all → the 專案經歷 book on /about. */}
      <Clickable
        href="/about#projects"
        title="專案經歷"
        label={[1.88, 2.36, 0.08]}
        zones={[
          { position: [2.11, 2.045, 0.025], size: [2.76, 0.46, 0.05] },
          { position: [2.19, 1.58, 0.025], size: [1.38, 0.44, 0.05] },
        ]}
      >
        <Posters />
      </Clickable>
      {/* 證照: the 田 grid of certificates → the 證照 book on /about. */}
      <Clickable
        href="/about#certifications"
        title="證照"
        label={[CERT_GRID.cx, CERT_GRID.cy + CERT_GRID.h / 2 + 0.06, 0.06]}
        zones={[{ position: [CERT_GRID.cx, CERT_GRID.cy, 0.03], size: [CERT_GRID.w + 0.05, CERT_GRID.h + 0.05, 0.06] }]}
      >
        {CERTIFICATES.map((c, i) => (
          <Certificate key={c.name} index={i} />
        ))}
      </Clickable>
      {/* 競賽經歷: trophy shelf above the bookshelf → the 競賽經歷 book on /about. */}
      <Clickable
        href="/about#competitions"
        title="競賽經歷"
        label={[TROPHY_SHELF.x0 + TROPHY_SHELF.w / 2, 1.93, 0.15]}
        zones={[{ position: [TROPHY_SHELF.x0 + TROPHY_SHELF.w / 2, 1.69, 0.1], size: [TROPHY_SHELF.w + 0.04, 0.38, 0.2] }]}
      >
        <TrophyShelf />
      </Clickable>
      {/* 志工經歷 → the 志工經歷 book on /about. */}
      <Clickable href="/about#volunteer" title="志工經歷" label={[CORK.x, CORK.y + 0.29, 0.06]} zones={[{ position: [CORK.x, CORK.y, 0.04], size: [0.44, 0.5, 0.08] }]}>
        <CorkBoard />
      </Clickable>
      <DysonFan />
      {/* 滑雪經歷: skis and the trail map pinned behind them light up together → 興趣經歷 › 滑雪 on /about. */}
      <Clickable href="/about#interests-ski" title="興趣・滑雪" label={[SKIS_CX, 1.82, 0.12]} zones={[{ position: [SKIS_CX, 0.85, 0.16], size: [0.56, 1.72, 0.32] }]}>
        <TrailMap />
        <Skis />
      </Clickable>
      {/* Sheet-music cabinet + turntable, centred under the wall-hung guitars. */}
      <SheetCabinet x1={SHEET_CAB.x0 + SHEET_CAB.w} />
      <Clickable href={ROOM_LINKS.turntable} title="Instagram" label={[SHEET_CAB.x0 + 0.235, SHEET_CAB.h + 0.42, 0.25]}>
        <Turntable />
      </Clickable>
      {/* Math textbooks in the cabinet under the turntable → math notes. */}
      <Clickable href={ROOM_LINKS.math} title="數學" label={[SHEET_CAB.x0 + SHEET_CAB.w / 4, SHEET_CAB.h + 0.04, 0.45]}>
        <MathTextbooks />
      </Clickable>
      {/* Under the desk: NAS, football, classical-guitar footstool. */}
      <Clickable href={ROOM_LINKS.nas} title="後端與資料庫開發" label={[DESK.x1 - 0.32, 0.42, 0.5]}>
        <Nas position={[DESK.x1 - 0.32, 0, 0.3]} />
      </Clickable>
      <Football position={[DESK.x0 + 0.62, 0, 0.3]} />
      <GuitarFootstool position={[DESK_CX + 0.1, 0, 0.42]} yaw={0.15} />
      {/* 音樂經歷: both guitars, including the gap between them → 興趣經歷 › 音樂 on /about. */}
      <Clickable href="/about#music" title="音樂經歷" label={[SHEET_CAB_CX, 2.08, 0.2]} zones={[{ position: [SHEET_CAB_CX, 1.43, 0.11], size: [0.92, 1.06, 0.2] }]}>
        <Guitars />
      </Clickable>
      <GamingChair position={[DESK_CX - 0.05, 0, 1.12]} yaw={-0.8} />
      {/* Left-drag orbits, right-drag / shift-drag / two-finger drag pans, wheel / pinch zooms toward the cursor. */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={LOOK}
        enablePan
        screenSpacePanning
        zoomToCursor
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        panSpeed={0.8}
        zoomSpeed={0.9}
        minAzimuthAngle={0.18}
        maxAzimuthAngle={Math.PI / 2 - 0.18}
        minPolarAngle={MIN_POLAR}
        maxPolarAngle={1.45}
        onChange={clampTarget}
      />
      {/* Grounding shadows right under props, across the whole room floor. */}
      <ContactShadows position={[1.3, 0.001, 1.4]} opacity={0.5} scale={8} blur={2.6} far={1.2} resolution={1024} />
      <Optional>
        <Suspense fallback={null}>
          <Environment preset="apartment" environmentIntensity={0.28} />
        </Suspense>
      </Optional>
    </NightProvider>
  );
}

export default function RoomScene() {
  const resetRef = useRef<(() => void) | null>(null);
  const [night, setNight] = useState(readStoredNight);
  const toggleNight = () =>
    setNight((v) => {
      storeNight(!v);
      return !v;
    });
  return (
    <div className={styles.root}>
      <div className={styles.viewControls}>
        <span className={styles.hint}>拖曳旋轉 · 右鍵平移 · 滾輪縮放</span>
        <button type="button" className={styles.reset} aria-pressed={night} onClick={toggleNight}>
          {night ? "☀ 白天" : "☾ 夜間"}
        </button>
        <button type="button" className={styles.reset} onClick={() => resetRef.current?.()}>
          重設視角
        </button>
        <RoomGuide />
      </div>
      <Canvas
        className={styles.canvas}
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 35, position: [4.2, 2.8, 4.2], near: 0.08, far: 40 }}
        gl={{ antialias: true, stencil: true }}
      >
        <Room resetRef={resetRef} night={night} />
      </Canvas>
    </div>
  );
}
