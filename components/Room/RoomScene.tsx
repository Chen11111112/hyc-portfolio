"use client";

import { ContactShadows, Environment, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from "react";
import { CanvasTexture, DoubleSide, InstancedMesh, Object3D, PerspectiveCamera, SRGBColorSpace, Vector3, type DirectionalLight } from "three";
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
  rng,
  type Vec3,
} from "./layout";
import { DeskBooks, ShelfContents } from "./props/Books";
import {
  DeskLamp,
  Figurines,
  Laptop,
  MacMini,
  Mug,
  Microphone,
  Monitor,
  MonitorRiser,
  Notebook,
  PenHolder,
  Phone,
  Speaker,
  Tablet,
} from "./props/DeskItems";
import GamingChair from "./props/GamingChair";
import { CAB_TOP, Guitars, PianoCorner } from "./props/Instruments";
import Marimba, { MARIMBA_X0, MARIMBA_X1 } from "./props/Marimba";
import DysonFan from "./props/DysonFan";
import MidiKeyboard from "./props/MidiKeyboard";
import { Box } from "./props/primitives";
import SheetCabinet, { SHEET_CABINET_W } from "./props/SheetCabinet";
import Skis, { SKIS_CX } from "./props/Skis";
import Outlets from "./props/Cables";
import PegboardPhotos from "./props/PegboardPhotos";
import Plants from "./props/Plants";
import Posters from "./props/Posters";
import Clickable from "./Clickable";
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

const WOOD = "#e8e4dc";
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


const LOOK: Vec3 = [DESK_CX + 0.3, DESK.top + 0.2, DESK.z0 + DESK.depth / 2];
const ELEVATION = (26 * Math.PI) / 180;
const AZIMUTH = Math.PI / 4;
/** After fitting the whole corner in view, pull the camera in by this factor so the desk dominates. */
const CLOSE_UP = 0.78;

const FRAME = [
  // Side wall: upright MIDI keyboard, marimba, sheet cabinet + turntable
  [0.7, 0, 3.0],
  [0.7, 0.9, 3.6],
  [-0.21, 1.4, 3.45],
  // Guitars (right of piano)
  [DESK.x1 + 1.8, 0.75, 0.15],
  [DESK.x1 + 1.9, 1.98, 0.1],
  [DESK.x1 + 1.9, 0, 0.5],
  // Posters above the guitars
  [DESK.x1 + 2.2, 2.3, 0.0],
  // Gaming chair
  [0.2, 0, 1.5],
  [0.5, 1.3, 1.35],
  // Window on the side wall
  [-0.21, 2.15, 1.65],
  [-0.21, 2.15, 0.0],
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
    camera.position.copy(look).addScaledVector(offset, dist);
    camera.lookAt(look);
    camera.updateMatrixWorld();
    const controls = get().controls as OrbitControlsImpl | null;
    if (controls) {
      // Zoom heads toward the cursor, so allow getting right up close to any prop.
      controls.minDistance = 0.25;
      controls.maxDistance = dist * 1.35;
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

function Sun() {
  const light = useRef<DirectionalLight>(null);
  const target = useRef<Object3D>(null);
  useLayoutEffect(() => {
    if (light.current && target.current) light.current.target = target.current;
  }, []);
  return (
    <>
      <directionalLight
        ref={light}
        position={[-4.48, 5.55, 2.4]}
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
      <object3D ref={target} position={[0.4, 0.75, 0.4]} />
    </>
  );
}

/**
 * The room is an L-shaped corner: the back wall (z = 0) holds the desk, shelves, pegboard, piano and
 * guitars; the side wall (x = SIDE_X) holds the window and the marimba.
 *
 * Side-wall props are authored as if on a back wall (wall face z = 0, room toward +z, window opening
 * WIN) and then rotated a quarter turn into place by <SideWallGroup>: local x → world −z,
 * local z → world +x. So the window lands at world z ∈ [0.15, 1.65], starting right above the desk's left end.
 */
const SIDE_X = DESK.x0 - 0.01;
/** Window opening on the side wall, in side-wall-local coords. */
const WIN = { x0: -1.65, x1: -0.15, y0: 0.8, y1: 2.15 };
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

/**
 * Invisible lid over the room: writes into the sun's shadow map only, so daylight enters through the
 * window rather than over the top of the open-topped walls.
 */
function ShadowCeiling() {
  return (
    <mesh position={[SIDE_X + 6, 4.03, 7]} castShadow>
      <boxGeometry args={[12, 0.05, 14]} />
      <meshBasicMaterial colorWrite={false} depthWrite={false} />
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

/** Daytime view behind the window: soft sky gradient with a hazy skyline. */
function Outdoors() {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, "#8fc3ec");
      g.addColorStop(0.55, "#d3e9f7");
      g.addColorStop(1, "#f6f0e2");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      [[60, 52, 34], [150, 70, 26], [205, 40, 20]].forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.ellipse(x, y, r * 1.8, r * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      const rand = rng(5);
      ctx.fillStyle = "rgba(150,170,185,0.55)";
      for (let x = 0; x < 256; ) {
        const w = 14 + rand() * 26;
        const h = 30 + rand() * 70;
        ctx.fillRect(x, 256 - h, w, h);
        x += w + 2;
      }
    }
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={[(WIN.x0 + WIN.x1) / 2, 1.5, -1.8]}>
      <planeGeometry args={[4.4, 3.3]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
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
      {drawers.map((y) => (
        <mesh key={y} position={[DESK.x0 + CABINET_W / 2, y, (PANEL_Z0 + PANEL_Z1) / 2]} castShadow receiveShadow>
          <boxGeometry args={[CABINET_W - SEAM * 2, DRAWER_H, PANEL_T]} />
          <meshStandardMaterial color={WOOD} roughness={0.7} metalness={0} />
        </mesh>
      ))}
      {/* Knee space between the drawer cabinet and the right leg is left open. */}
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
const TARGET_MIN = new Vector3(SIDE_X + 0.1, 0.15, 0.05);
const TARGET_MAX = new Vector3(DESK.x1 + 2.2, 2.0, 2.6);

function Room({ resetRef }: { resetRef: MutableRefObject<(() => void) | null> }) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  useEffect(() => {
    markBootReady();
  }, []);
  const clampTarget = () => {
    const c = controlsRef.current;
    if (!c) return;
    const before = c.target.clone();
    c.target.clamp(TARGET_MIN, TARGET_MAX);
    // Shift the camera by the same amount so clamping doesn't swing the view.
    c.object.position.add(c.target.clone().sub(before));
  };
  return (
    <>
      <color attach="background" args={["#dfe5ea"]} />
      <CameraRig resetRef={resetRef} />
      <Sun />
      {/* Daylight bouncing around the room — keeps shaded faces readable without the HDR environment. */}
      <hemisphereLight args={["#f3f6fb", "#7b5b45", 1.1]} />
      <directionalLight position={[3.5, 2.6, 4.5]} color="#f6f1ea" intensity={0.55} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[SIDE_X + 6, 0, 7]} receiveShadow>
        <planeGeometry args={[12, 14]} />
        <meshStandardMaterial color="#5a3a28" roughness={0.86} metalness={0} />
      </mesh>
      <BackWall />
      <ShadowCeiling />
      <SideWallGroup>
        <Wall />
        <Window />
        <Outdoors />
        {/* Stood up in front of the window's left edge, leaning on the sill. */}
        <MidiKeyboard x={WIN.x0 + 0.2} />
        {/* Pulled off the wall so the music stand fits behind the bars. */}
        <group position={[0, 0, 0.25]}>
          <Clickable slug="marimba" label={[(MARIMBA_X0 + MARIMBA_X1) / 2, 1.5, 0.3]}>
            <Marimba />
          </Clickable>
        </group>
      </SideWallGroup>
      <Desk />
      <Shelves />
      <Pegboard />
      <Outlets />
      <Clickable slug="books" label={[0.05, 1.58, 0.12]}>
        <ShelfContents />
        <DeskBooks />
      </Clickable>
      <DeskLamp />
      <MonitorRiser />
      <Clickable slug="computer" label={[DESK_CX + 0.04, 1.42, 0.2]}>
        <Monitor />
        <MacMini />
        <Laptop />
      </Clickable>
      <Tablet />
      <Phone />
      <Microphone />
      <Figurines />
      <Mug />
      <Plants />
      <Notebook />
      <Speaker />
      <PenHolder />
      <Clickable slug="photos" label={[PEG_X0 + PEG_W / 2, PEG_Y0 + PEG_H + 0.06, 0.05]}>
        <PegboardPhotos />
      </Clickable>
      <PianoCorner>
        {(piano) => (
          <Clickable slug="piano" label={[DESK.x1 + 0.26, CAB_TOP + 0.36, 0.35]}>
            {piano}
          </Clickable>
        )}
      </PianoCorner>
      <Posters />
      <DysonFan />
      <Clickable slug="snowboard" label={[SKIS_CX, 1.82, 0.12]}>
        <Skis />
      </Clickable>
      {/* Sheet-music cabinet + turntable, centred under the wall-hung guitars. */}
      <SheetCabinet x1={DESK.x1 + 1.375 + SHEET_CABINET_W / 2} />
      <Clickable slug="guitars" label={[DESK.x1 + 1.375, 2.08, 0.2]}>
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
        minAzimuthAngle={0.05}
        maxAzimuthAngle={Math.PI / 2 - 0.05}
        minPolarAngle={0.3}
        maxPolarAngle={1.5}
        onChange={clampTarget}
      />
      <ContactShadows position={[0.4, 0.001, 0.85]} opacity={0.38} scale={6} blur={2.2} far={1.4} resolution={512} />
      <Optional>
        <Suspense fallback={null}>
          <Environment preset="apartment" environmentIntensity={0.28} />
        </Suspense>
      </Optional>
    </>
  );
}

export default function RoomScene() {
  const resetRef = useRef<(() => void) | null>(null);
  return (
    <div className={styles.root}>
      <div className={styles.viewControls}>
        <span className={styles.hint}>拖曳旋轉 · 右鍵平移 · 滾輪縮放</span>
        <button type="button" className={styles.reset} onClick={() => resetRef.current?.()}>
          重設視角
        </button>
      </div>
      <Canvas
        className={styles.canvas}
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 35, position: [4.2, 2.8, 4.2], near: 0.08, far: 40 }}
        gl={{ antialias: true }}
      >
        <Room resetRef={resetRef} />
      </Canvas>
    </div>
  );
}
