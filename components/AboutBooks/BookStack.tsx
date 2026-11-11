"use client";

import { ContactShadows, RoundedBox, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  CanvasTexture,
  CatmullRomCurve3,
  TubeGeometry,
  DoubleSide,
  SRGBColorSpace,
  Vector3,
  type DirectionalLight,
  type MeshStandardMaterial,
  type Group,
  type Object3D,
  type PerspectiveCamera,
} from "three";
import { CERTIFICATES, ROOM_LINKS } from "@/lib/roomContent";
import SafeSuspense from "@/components/Room/props/SafeSuspense";
import { CERT_FRAME, CertificateArt } from "@/components/Room/props/BackWallExtras";
import LegoPlant from "@/components/Room/props/LegoPlant";
import { Polaroid } from "@/components/Room/props/PegboardPhotos";
import { TurntableModel } from "@/components/Room/props/SheetCabinet";
import type { Story } from "./AboutBooks";

// The About page backdrop — a stretch of the room: the dark wood desk against the light wall, the six story
// books standing upright between bookends (spines toward you), a LEGO flower pot at the end.
// Real-world scale (metres), same palette and lighting feel as the room.
const DESK = { color: "#5a3a28", front: "#6e4a33" };
const WALL = "#dfe5ea";
const ROW_X0 = -0.21; // left bookend
const GAP = 0.004;

/** Per-book size variation so the row reads as real books. */
const SIZES = [
  { h: 0.27, t: 0.05, d: 0.2 },
  { h: 0.25, t: 0.042, d: 0.185 },
  { h: 0.28, t: 0.046, d: 0.2 },
  { h: 0.245, t: 0.04, d: 0.18 },
  { h: 0.265, t: 0.052, d: 0.195 },
  { h: 0.255, t: 0.044, d: 0.19 },
];

/** Spine with the title written vertically (one character per line), number on top, English at the foot. */
function spineTexture(title: string, en: string, color: string, index: number) {
  const c = document.createElement("canvas");
  c.width = 160;
  c.height = 900;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fillRect(0, 56, c.width, 8);
    ctx.fillRect(0, c.height - 64, c.width, 8);
    ctx.fillStyle = "#f3e2b4";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 34px Helvetica, Arial, sans-serif`;
    ctx.fillText(String(index + 1).padStart(2, "0"), c.width / 2, 30);
    ctx.font = `bold 84px "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif`;
    const chars = [...title];
    const top = 150;
    const step = Math.min(108, 560 / Math.max(1, chars.length));
    chars.forEach((ch, i) => ctx.fillText(ch, c.width / 2, top + i * step));
    // English, rotated along the spine near the foot.
    ctx.save();
    ctx.translate(c.width / 2, c.height - 150);
    ctx.rotate(-Math.PI / 2);
    ctx.font = `600 26px Helvetica, Arial, sans-serif`;
    ctx.fillStyle = "rgba(243,226,180,0.8)";
    ctx.fillText(en.toUpperCase(), 0, 0);
    ctx.restore();
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function Book({
  story,
  index,
  x,
  selected,
  onSelect,
}: {
  story: Story;
  index: number;
  x: number;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const size = SIZES[index % SIZES.length];
  const spine = useMemo(() => spineTexture(story.title, story.en, story.color, index), [story, index]);
  useEffect(() => () => spine.dispose(), [spine]);
  const homeZ = -0.12 + size.d / 2;

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const k = Math.min(1, dt * 10);
    // Pulled toward you when selected; nudged on hover.
    const z = homeZ + (selected ? 0.11 : hovered ? 0.035 : 0);
    g.position.z += (z - g.position.z) * k;
    g.position.y += ((selected ? 0.012 : 0) - g.position.y) * k;
    g.rotation.x += ((selected ? -0.06 : 0) - g.rotation.x) * k;
  });

  return (
    <group ref={ref} position={[x, 0, homeZ]}>
      <mesh
        position={[0, size.h / 2, 0]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(story.id);
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[size.t, size.h, size.d]} />
        {/* Faces: +x, −x (covers), +y (page tops), −y, +z (spine), −z (fore-edge). */}
        <meshStandardMaterial attach="material-0" color={story.color} roughness={0.6} />
        <meshStandardMaterial attach="material-1" color={story.color} roughness={0.6} />
        <meshStandardMaterial attach="material-2" color="#f1ead8" roughness={0.9} />
        <meshStandardMaterial attach="material-3" color="#f1ead8" roughness={0.9} />
        <meshStandardMaterial
          attach="material-4"
          map={spine}
          roughness={0.5}
          emissive={selected || hovered ? "#ffb04a" : "#000000"}
          emissiveIntensity={selected ? 0.14 : 0.07}
        />
        <meshStandardMaterial attach="material-5" color="#f1ead8" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Bookend({ x, flip }: { x: number; flip?: boolean }) {
  const metal = { color: "#2b2f33", roughness: 0.4, metalness: 0.6 };
  return (
    <group position={[x, 0, -0.03]} scale={[flip ? -1 : 1, 1, 1]}>
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[0.004, 0.16, 0.13]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      <mesh position={[-0.045, 0.002, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.09, 0.004, 0.13]} />
        <meshStandardMaterial {...metal} />
      </mesh>
    </group>
  );
}

function Desk() {
  return (
    <group>
      <RoundedBox args={[2.2 - SIDE_X, 0.03, 0.55]} radius={0.006} smoothness={3} position={[(SIDE_X + 2.2) / 2, -0.015, 0.13]} receiveShadow castShadow>
        <meshStandardMaterial color={DESK.color} roughness={0.72} />
      </RoundedBox>
      {/* Drawer row under the desktop, with a bar pull. */}
      <mesh position={[(SIDE_X + 2.2) / 2, -0.075, 0.395]} receiveShadow>
        <boxGeometry args={[2.18 - SIDE_X, 0.085, 0.016]} />
        <meshStandardMaterial color={DESK.front} roughness={0.66} />
      </mesh>
      <mesh position={[0.02, -0.06, 0.41]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.0055, 0.0055, 0.14, 12]} />
        <meshStandardMaterial color="#c3c6ca" roughness={0.3} metalness={0.85} />
      </mesh>
      {/* Second pull for the right-hand drawer. */}
      <mesh position={[1.1, -0.06, 0.41]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.0055, 0.0055, 0.14, 12]} />
        <meshStandardMaterial color="#c3c6ca" roughness={0.3} metalness={0.85} />
      </mesh>
      <WallWithWindow />
      {/* Floor at real desk height below (0.75 m), light wood like the room. */}
      <mesh position={[(SIDE_X + 3.6) / 2, -0.75, 1.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.6 - SIDE_X, 3]} />
        <meshStandardMaterial color="#d7b88b" roughness={0.75} />
      </mesh>
    </group>
  );
}

/** L-shaped corner like the room: the side wall (plane x = SIDE_X, facing +x) carries the window. */
const SIDE_X = -0.72;
const WALL_T = 0.04;
const BACK_Z = -0.15; // back wall front face
/** Window opening on the side wall (z along the wall, y up). */
const WIN = { z0: 0.0, z1: 0.3, y0: 0.16, y1: 0.53 };
const SPAN = { y0: -0.7, y1: 2.3, zFar: 2.6, xFar: 3.6 };

function WallBox({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={WALL} roughness={0.9} />
    </mesh>
  );
}

function WallWithWindow() {
  const { y0, y1, zFar, xFar } = SPAN;
  const sx = SIDE_X - WALL_T / 2;
  const zBack = BACK_Z - WALL_T;
  const wz = WIN.z1 - WIN.z0;
  const wh = WIN.y1 - WIN.y0;
  const cz = (WIN.z0 + WIN.z1) / 2;
  const cy = (WIN.y0 + WIN.y1) / 2;
  const f = 0.02;
  const frame = { color: "#f4f5f6", roughness: 0.45 };
  return (
    <group>
      {/* Back wall, solid. */}
      <WallBox position={[(SIDE_X - WALL_T + xFar) / 2, (y0 + y1) / 2, BACK_Z - WALL_T / 2]} size={[xFar - SIDE_X + WALL_T, y1 - y0, WALL_T]} />
      {/* Side wall around the window opening. */}
      <WallBox position={[sx, (y0 + y1) / 2, (zBack + WIN.z0) / 2]} size={[WALL_T, y1 - y0, WIN.z0 - zBack]} />
      <WallBox position={[sx, (y0 + y1) / 2, (WIN.z1 + zFar) / 2]} size={[WALL_T, y1 - y0, zFar - WIN.z1]} />
      <WallBox position={[sx, (y0 + WIN.y0) / 2, cz]} size={[WALL_T, WIN.y0 - y0, wz]} />
      <WallBox position={[sx, (WIN.y1 + y1) / 2, cz]} size={[WALL_T, y1 - WIN.y1, wz]} />
      {/* Frame, centre mullion, sill. */}
      {[
        { p: [SIDE_X - 0.01, WIN.y1 - f / 2, cz], s: [0.05, f, wz] },
        { p: [SIDE_X - 0.01, WIN.y0 + f / 2, cz], s: [0.05, f, wz] },
        { p: [SIDE_X - 0.01, cy, WIN.z0 + f / 2], s: [0.05, wh, f] },
        { p: [SIDE_X - 0.01, cy, WIN.z1 - f / 2], s: [0.05, wh, f] },
        { p: [SIDE_X - 0.005, cy, cz], s: [0.03, wh, 0.012] },
        { p: [SIDE_X + 0.02, WIN.y0 - 0.008, cz], s: [0.07, 0.016, wz + 0.04] },
      ].map((m) => (
        <mesh key={m.p.join()} position={m.p as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={m.s as [number, number, number]} />
          <meshStandardMaterial {...frame} />
        </mesh>
      ))}
      <mesh position={[SIDE_X - 0.002, cy, cz]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[wz - f * 2, wh - f * 2]} />
        <meshPhysicalMaterial color="#cfe3f0" roughness={0.05} transparent opacity={0.16} depthWrite={false} />
      </mesh>
      {/* Sky outside. */}
      <mesh position={[SIDE_X - 0.9, cy + 0.3, cz]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3, 2.4]} />
        <meshBasicMaterial color="#a9cde8" toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Late sun from outside the side-wall window, aimed so its patch falls across the desk. */
/**
 * Low late-afternoon sun (~14°) running along the desk parallel to the back wall: it clears the tops of
 * the books (≤ 0.28 m) and lands on the LEGO flowers at the end of the row.
 */
const SUN_TARGET = new Vector3(0.23, 0.11, 0.15);
const WIN_CENTRE = new Vector3(SIDE_X, (WIN.y0 + WIN.y1) / 2, (WIN.z0 + WIN.z1) / 2);
const SUN_POS = WIN_CENTRE.clone().addScaledVector(SUN_TARGET.clone().sub(WIN_CENTRE).normalize(), -3);

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
        position={SUN_POS.toArray()}
        color="#ffdcaa"
        intensity={5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={6}
        shadow-camera-left={-1.6}
        shadow-camera-right={1.6}
        shadow-camera-top={1.6}
        shadow-camera-bottom={-1.6}
        shadow-bias={-0.0005}
        shadow-normalBias={0.01}
      />
      <object3D ref={target} position={SUN_TARGET.toArray()} />
    </>
  );
}

/**
 * Frames the L-shaped corner for the viewport, facing the back wall head-on: on wide screens the books sit ~33% across (the panel floats
 * over the right), solved from the actual aspect ratio; on narrow screens the books are centred.
 */
function CameraRig() {
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);
  useLayoutEffect(() => {
    const camera = get().camera as PerspectiveCamera;
    const aspect = size.width / Math.max(size.height, 1);
    const wide = aspect >= 1.1;
    // Camera sits straight in front of the book row (so a pulled-out book moves straight toward you and
    // never slides over its neighbours). On wide screens the frame is lens-shifted, not rotated, so the
    // row lands ~33% across, clear of the panel; on phones it stays centred.
    const booksX = -0.06;
    camera.position.set(booksX, wide ? 0.72 : 0.64, wide ? 2.0 : 1.6);
    camera.lookAt(booksX, 0.3, 0);
    const tanHalf = Math.tan(((camera.fov / 2) * Math.PI) / 180);
    const shift = wide ? 0.5 - 0.33 : 0; // fraction of screen width to move the row left
    // three.js shifts the frustum by near·filmOffset/filmWidth, and the near plane is
    // near·2·tan(fov/2)·aspect wide, so this moves everything left by `shift` of the screen width.
    camera.filmOffset = shift * 2 * tanHalf * aspect * camera.getFilmWidth();
    camera.updateProjectionMatrix();
  }, [get, size]);
  return null;
}

const WALL_Z = -0.148;
const CERT_SCALE = 0.5;

/** The four certificates in a small 田 grid on the wall above the books; click → 證照. */
function WallCertificates({ onSelect }: { onSelect: (id: string) => void }) {
  const w = CERT_FRAME.w * CERT_SCALE;
  const h = CERT_FRAME.h * CERT_SCALE;
  const gap = 0.012;
  const cx = -0.075;
  const cy = 0.43;
  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => (document.body.style.cursor = "")}
      onClick={(e) => {
        e.stopPropagation();
        onSelect("certifications");
      }}
    >
      {CERTIFICATES.map((c, i) => (
        <group
          key={c.name}
          position={[cx + (i % 2 === 0 ? -1 : 1) * (w + gap) / 2, cy + (i < 2 ? 1 : -1) * (h + gap) / 2, WALL_Z]}
          scale={CERT_SCALE}
        >
          <CertificateArt index={i} />
        </group>
      ))}
    </group>
  );
}

/** Three taped polaroids beside the certificates. */
function WallPhotos() {
  // Two between the window and the certificates, one to their right.
  const spots: [number, number, number][] = [
    [-0.3, 0.47, 0.06],
    [-0.3, 0.33, -0.05],
    [0.17, 0.42, 0.04],
  ];
  return (
    <group>
      {spots.map(([x, y, tilt], i) => (
        <group key={i} position={[x, y, WALL_Z + 0.002]} rotation={[0, 0, tilt]}>
          <Polaroid index={i + 2} />
          <mesh position={[0, 0.05, 0.002]} rotation={[0, 0, -tilt * 2]}>
            <boxGeometry args={[0.04, 0.013, 0.001]} />
            <meshStandardMaterial color="#efe4c4" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Pencil({ position, yaw, color = "#f2c230" }: { position: [number, number, number]; yaw: number; color?: string }) {
  return (
    <group position={position} rotation={[0, yaw, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.0036, 0.0036, 0.17, 6]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.093, 0]} castShadow>
        <coneGeometry args={[0.0036, 0.016, 6]} />
        <meshStandardMaterial color="#e8c9a0" roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.089, 0]}>
        <cylinderGeometry args={[0.0037, 0.0037, 0.008, 8]} />
        <meshStandardMaterial color="#e28aa0" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Ceramic cup with a few pencils standing in it. */
function PencilCup({ x }: { x: number }) {
  const tips: [number, number, number, string][] = [
    [0.012, 0.17, 0.01, "#f2c230"],
    [-0.016, 0.16, 0.014, "#2d6cdf"],
    [0.02, 0.15, -0.014, "#e2483d"],
    [-0.006, 0.175, -0.018, "#f2c230"],
  ];
  return (
    <group position={[x, 0, 0.0]}>
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.036, 0.034, 0.1, 28, 1, true]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.35} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0.003, 0]}>
        <cylinderGeometry args={[0.034, 0.034, 0.006, 24]} />
        <meshStandardMaterial color="#e9e5dc" roughness={0.4} />
      </mesh>
      {tips.map(([tx, ty, tz, c]) => {
        const len = Math.hypot(tx * 0.7, ty, tz * 0.7);
        return (
          <mesh
            key={`${tx}${tz}`}
            position={[tx * 0.65, ty / 2 + 0.01, tz * 0.65]}
            rotation={[Math.atan2(tz * 0.7, ty), 0, -Math.atan2(tx * 0.7, ty)]}
            castShadow
          >
            <cylinderGeometry args={[0.0034, 0.0034, len, 6]} />
            <meshStandardMaterial color={c} roughness={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

const PHOTO = { src: "/withGrilFriend.jpg", aspect: 1477 / 1108, w: 0.13 };

function PhotoPicture() {
  const map = useTexture(`/_next/image?url=${encodeURIComponent(PHOTO.src)}&w=640&q=75`, (t) => {
    (Array.isArray(t) ? t : [t]).forEach((tex) => {
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = 8;
    });
  });
  return (
    <mesh position={[0, 0, 0.0065]}>
      <planeGeometry args={[PHOTO.w, PHOTO.w / PHOTO.aspect]} />
      <meshStandardMaterial map={map} roughness={0.4} />
    </mesh>
  );
}

/** Framed photo standing on a fold-out easel, in front of the turntable. */
function PhotoStand() {
  const ph = PHOTO.w / PHOTO.aspect;
  const fw = PHOTO.w + 0.022;
  const fh = ph + 0.022;
  const tilt = -0.2;
  return (
    <group position={[-0.44, 0, 0.31]} rotation={[0, 0.3, 0]}>
      <group position={[0, (fh / 2) * Math.cos(tilt) + 0.002, 0]} rotation={[tilt, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[fw, fh, 0.012]} />
          <meshStandardMaterial color="#e9e3d8" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.0062]}>
          <planeGeometry args={[PHOTO.w + 0.006, ph + 0.006]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
        <SafeSuspense fallback={null}>
          <PhotoPicture />
        </SafeSuspense>
        {/* Easel leg folded out behind. */}
        <mesh position={[0, -fh * 0.15, -0.035]} rotation={[0.55, 0, 0]} castShadow>
          <boxGeometry args={[0.02, fh * 0.8, 0.004]} />
          <meshStandardMaterial color="#d8d1c4" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------ String lights ------------------------------ */

const STRING = { x0: -0.28, x1: 1.45, pinY: 0.69, sag: 0.07, z: -0.143, pinEvery: 0.36, bulbEvery: 0.065 };

/** Height of the scalloped strand at x: hangs from pins every `pinEvery`, sagging between them. */
function strandY(x: number) {
  const t = ((x - STRING.x0) % STRING.pinEvery) / STRING.pinEvery;
  return STRING.pinY - STRING.sag * 4 * t * (1 - t);
}

/**
 * Fairy lights across the back wall, above the certificates: a thin wire in scallops with warm bulbs
 * that twinkle a little, plus a few soft point lights so the strand actually lights the room.
 */
function StringLights() {
  const wire = useMemo(() => {
    const pts: Vector3[] = [];
    for (let x = STRING.x0; x <= STRING.x1; x += 0.01) pts.push(new Vector3(x, strandY(x), STRING.z));
    return new TubeGeometry(new CatmullRomCurve3(pts), 400, 0.0012, 4, false);
  }, []);
  useEffect(() => () => wire.dispose(), [wire]);
  const bulbs = useMemo(() => {
    const out: number[] = [];
    for (let x = STRING.x0 + STRING.bulbEvery / 2; x < STRING.x1; x += STRING.bulbEvery) out.push(x);
    return out;
  }, []);
  // Three bulb materials with offset phases so neighbours twinkle at different times.
  const mats = useRef<(MeshStandardMaterial | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    mats.current.forEach((m, i) => {
      if (m) m.emissiveIntensity = 2.4 + Math.sin(t * 1.3 + i * 2.1) * 0.5;
    });
  });
  const lamps = [0.0, 0.55, 1.1];
  return (
    <group>
      <mesh geometry={wire}>
        <meshStandardMaterial color="#3a3530" roughness={0.6} />
      </mesh>
      {bulbs.map((x, i) => (
        <group key={x} position={[x, strandY(x) - 0.012, STRING.z + 0.006]}>
          <mesh position={[0, 0.007, 0]}>
            <cylinderGeometry args={[0.003, 0.003, 0.006, 6]} />
            <meshStandardMaterial color="#2b2b2b" roughness={0.5} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.0075, 12, 10]} />
            <meshStandardMaterial
              ref={(m) => {
                mats.current[i % 3] = m;
              }}
              color="#fff3d6"
              emissive="#ffc46b"
              emissiveIntensity={2.4}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
      {lamps.map((x) => (
        <pointLight key={x} position={[x, STRING.pinY - 0.05, 0.05]} color="#ffc27a" intensity={0.22} distance={1.1} decay={2} />
      ))}
    </group>
  );
}

export default function BookStack({ stories, active, onSelect }: { stories: Story[]; active: string; onSelect: (id: string) => void }) {
  // Lay the books out left to right from the left bookend.
  const xs = useMemo(() => {
    const out: number[] = [];
    let x = ROW_X0 + 0.004;
    stories.forEach((_, i) => {
      const t = SIZES[i % SIZES.length].t;
      out.push(x + t / 2);
      x += t + GAP;
    });
    return { centers: out, end: x };
  }, [stories]);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0.58, 0.44, 1.32], fov: 34, near: 0.02, far: 10 }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={[WALL]} />
      <CameraRig />
      <hemisphereLight args={["#f3f6fb", "#7b5b45", 1.25]} />
      {/* Warm window light from the left, like the room's afternoon sun. */}
      <directionalLight position={[-1.2, 1.4, 0.8]} color="#fff4e0" intensity={1.0} />
      <Sun />
      <directionalLight position={[1, 0.8, 1.5]} intensity={0.6} />
      <Desk />
      <Bookend x={ROW_X0} />
      {stories.map((s, i) => (
        <Book key={s.id} story={s} index={i} x={xs.centers[i]} selected={s.id === active} onSelect={onSelect} />
      ))}
      <Bookend x={xs.end + 0.002} flip />
      <group position={[xs.end + 0.14, 0, 0.02]} rotation={[0, -0.4, 0]}>
        <LegoPlant />
      </group>
      {/* Wall: certificates (click → 證照) and polaroids. Desk: turntable (lid down), pencils, pencil cup. */}
      <StringLights />
      <WallCertificates onSelect={onSelect} />
      <WallPhotos />
      <group
        position={[-0.48, 0, 0.05]}
        rotation={[0, 0.1, 0]}
        scale={0.8}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => (document.body.style.cursor = "")}
        onClick={(e) => {
          e.stopPropagation();
          window.open(ROOM_LINKS.turntable, "_blank", "noopener,noreferrer");
        }}
      >
        <TurntableModel lidOpen={false} />
      </group>
      <PhotoStand />
      <Pencil position={[-0.08, 0.0036, 0.25]} yaw={0.25} />
      <Pencil position={[0.02, 0.0036, 0.27]} yaw={-0.4} color="#2d6cdf" />
      <PencilCup x={xs.end + 0.3} />
      <ContactShadows position={[0, 0.001, 0.1]} opacity={0.45} scale={1.2} blur={2.2} far={0.4} resolution={512} />
    </Canvas>
  );
}
