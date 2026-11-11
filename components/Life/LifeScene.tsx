"use client";

import { ContactShadows, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  BufferGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Float32BufferAttribute,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  type Group,
  type MeshStandardMaterial,
  type PerspectiveCamera,
} from "three";
import { Desk, Pencil, PencilCup, Sun, WALL, WALL_Z, type WindowOpening } from "@/components/AboutBooks/BookStack";
import { Pin } from "@/components/Room/props/BackWallExtras";
import { useCanvasTexture, type Draw } from "@/components/Room/props/canvasTexture";
import SafeSuspense from "@/components/Room/props/SafeSuspense";
import { TurntableModel } from "@/components/Room/props/SheetCabinet";
import type { Vec3 } from "@/components/Room/layout";
import { ClayDiorama, DIORAMA_SEATS, MiniCat, MiniDog } from "./ClayDiorama";
import { MiniPlant, Orchid, PeaceLily, RoseBouquet, TulipBouquet, WildflowerVase } from "./LegoFlowers";
import { BOARDS, type Shot, type StickerArt } from "./lifeContent";

// The Life page backdrop: the same stretch of room as About (dark wood desk, light wall, corner window,
// late sun), with two cork boards side by side on the wall. Swiping pans the camera from one to the other.
const BOARD = { w: 1.0, h: 0.58, y: 0.43, frame: 0.022 };
/** Board centres along the back wall; the camera pans between them. */
export const BOARD_X = [0.18, 1.3] as const;
/**
 * The side-wall window, much bigger than About's: from just off the back corner to past the desk's front
 * edge, nearly floor-of-desk to ceiling of the view, so it shows at the left of the first board.
 */
const LIFE_WIN: WindowOpening = { z0: -0.1, z1: 0.75, y0: 0.06, y1: 0.98 };
/** On wider screens the first board's view sits this far left of the board, bringing the window into frame. */
const WINDOW_PEEK = 0.16;
const PINS = ["#d64545", "#3d6ea8", "#d4a017", "#2f8f5b"];

/* ------------------------------ Cork boards ------------------------------ */

/** Cork speckle, same recipe as the room's cork board. */
const drawCork: Draw = (ctx, w, h) => {
  ctx.fillStyle = "#c69c6d";
  ctx.fillRect(0, 0, w, h);
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 9000; i += 1) {
    ctx.fillStyle = rand() > 0.5 ? "rgba(120,80,40,0.25)" : "rgba(240,210,170,0.25)";
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2);
  }
};

function PhotoImage({ src, w, h }: { src: string; w: number; h: number }) {
  const map = useTexture(`/_next/image?url=${encodeURIComponent(src)}&w=640&q=75`, (t) => {
    (Array.isArray(t) ? t : [t]).forEach((tex) => {
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = 8;
    });
  });
  return (
    <mesh position={[0, 0, 0.0012]}>
      <planeGeometry args={[w, h]} />
      {/* Unlit and not tone-mapped: the photo keeps its own colours instead of taking on the warm sun. */}
      <meshBasicMaterial map={map} toneMapped={false} />
    </mesh>
  );
}

/** Photo print with a white border (wider at the foot, like the CSS version), pinned at the top. */
function PinnedPhoto({ shot, pin }: { shot: Shot; pin: string }) {
  const [rw, rh] = shot.ratio;
  const w = shot.width * BOARD.w;
  const h = (w * rh) / rw;
  const side = w * 0.05;
  const foot = w * 0.12;
  const pw = w + side * 2;
  const ph = h + side + foot;
  // CSS placement is the print's top-left corner as a fraction of the board.
  const x = -BOARD.w / 2 + shot.left * BOARD.w + pw / 2;
  const y = BOARD.h / 2 - shot.top * BOARD.h - ph / 2;
  return (
    <group position={[x, y, 0.003]} rotation={[0, 0, (-shot.rot * Math.PI) / 180]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[pw, ph, 0.0015]} />
        <meshStandardMaterial color="#f7f3ea" roughness={0.75} />
      </mesh>
      <group position={[0, (foot - side) / 2, 0]}>
        <SafeSuspense
          fallback={
            <mesh position={[0, 0, 0.0012]}>
              <planeGeometry args={[w, h]} />
              <meshStandardMaterial color="#d9d3c6" roughness={0.8} />
            </mesh>
          }
        >
          <PhotoImage src={shot.src} w={w} h={h} />
        </SafeSuspense>
      </group>
      <Pin position={[0, ph / 2 - 0.012, 0.005]} color={pin} />
    </group>
  );
}

/** Die-cut sticker: the drawing with a thick white outline, on a transparent plane. */
function Sticker({ art }: { art: StickerArt }) {
  const draw = useMemo<Draw>(
    () => (ctx, w) => {
      const k = w / 80;
      ctx.scale(k, k);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (const p of art.paths) {
        const path = new Path2D(p.d);
        if (p.outline) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 8;
          ctx.stroke(path);
        }
        ctx.fillStyle = p.fill;
        ctx.fill(path);
      }
      for (const [cx, cy, rx, ry, fill] of art.dots) {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [art],
  );
  const map = useCanvasTexture(draw, 256, 256);
  const size = 0.11;
  const x = -BOARD.w / 2 + art.left * BOARD.w + size / 2;
  const y = BOARD.h / 2 - art.top * BOARD.h - size / 2;
  return (
    <mesh position={[x, y, 0.0065]} rotation={[0, 0, (-art.rot * Math.PI) / 180]}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={map} transparent alphaTest={0.05} roughness={0.6} />
    </mesh>
  );
}

function CorkBoard({ index }: { index: number }) {
  const cork = useCanvasTexture(drawCork, 1024, 600);
  const board = BOARDS[index];
  return (
    <group position={[BOARD_X[index], BOARD.y, WALL_Z]}>
      <mesh position={[0, 0, 0.009]} castShadow receiveShadow>
        <boxGeometry args={[BOARD.w + BOARD.frame * 2, BOARD.h + BOARD.frame * 2, 0.018]} />
        <meshStandardMaterial color="#a37a4f" roughness={0.6} />
      </mesh>
      <group position={[0, 0, 0.0185]}>
        <mesh receiveShadow>
          <planeGeometry args={[BOARD.w, BOARD.h]} />
          <meshStandardMaterial map={cork} roughness={0.95} />
        </mesh>
        {board.photos.map((shot, i) => (
          <PinnedPhoto key={shot.src} shot={shot} pin={PINS[i % PINS.length]} />
        ))}
        {board.stickers.map((art) => (
          <Sticker key={art.label} art={art} />
        ))}
      </group>
    </group>
  );
}

/* ------------------------------ Desk ------------------------------ */

type Friend = "cat" | "dog";
type Place = { x: number; z: number; yaw?: number; scale?: number };

/** The diorama is the desk's centrepiece, scaled up a little so the mini cat and dog read on a phone. */
const DIORAMA: Place = { x: 0.17, z: 0.2, yaw: -0.15, scale: 1.35 };
const TURNTABLE: Place = { x: -0.28, z: 0.06, yaw: 0.12, scale: 0.8 };
const MINI_POTS: (Place & { kind: "rosette" | "cactus" | "bloom" })[] = [
  { x: 1.22, z: 0.29, kind: "rosette" },
  { x: 1.29, z: 0.21, kind: "cactus" },
  { x: 1.36, z: 0.3, kind: "bloom" },
  { x: 1.44, z: 0.24, kind: "rosette" },
];

/** A point given in a placed object's own coordinates, in world (desk) coordinates. */
function toWorld({ x, z, yaw = 0, scale = 1 }: Place, [lx, ly, lz]: Vec3): Vec3 {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return [x + (lx * c + lz * s) * scale, ly * scale, z + (-lx * s + lz * c) * scale];
}

/** Per-place seats for the cat and dog: on the diorama rim, the turntable's front corner, each mini pot's rim. */
const SEATS: Record<string, Record<Friend, Vec3>> = {
  diorama: { cat: toWorld(DIORAMA, DIORAMA_SEATS.cat), dog: toWorld(DIORAMA, DIORAMA_SEATS.dog) },
  turntable: { cat: toWorld(TURNTABLE, [0.15, 0.07, 0.14]), dog: toWorld(TURNTABLE, [0.185, 0.07, 0.12]) },
  ...Object.fromEntries(
    MINI_POTS.map((p, i) => [`pot${i}`, { cat: toWorld(p, [-0.009, 0.037, 0.013]), dog: toWorld(p, [0.009, 0.037, 0.013]) }]),
  ),
};
const FIGURE_SCALE = DIORAMA.scale ?? 1;
/** Cursor over the scene ("" restores the container's grab hand); the scene wrapper is tagged `data-life-scene`. */
function setCursor(c: string) {
  const el = document.querySelector<HTMLElement>("[data-life-scene]");
  if (el) el.style.cursor = c;
}

/** Pointer travel (px) beyond which a press counts as a swipe, not a click. */
const CLICK_PX = 6;

/**
 * The mini cat and dog: click one to pick it up (it floats and glows), then click the diorama, the
 * turntable, a mini pot or anywhere on the desk to set it down there. Click it again to put it back on the diorama.
 */
function useFriends() {
  const [held, setHeld] = useState<Friend | null>(null);
  const [spots, setSpots] = useState<Record<Friend, Vec3>>({ cat: SEATS.diorama.cat, dog: SEATS.diorama.dog });
  const pick = (f: Friend) => {
    if (held === f) {
      // Second click on the one you're holding: home to the diorama.
      setSpots((s) => ({ ...s, [f]: SEATS.diorama[f] }));
      setHeld(null);
    } else setHeld(f);
  };
  const putAt = (p: Vec3) => {
    if (!held) return;
    setSpots((s) => ({ ...s, [held]: p }));
    setHeld(null);
  };
  const seat = (place: string) => () => held && putAt(SEATS[place][held]);
  return { held, spots, pick, putAt, seat };
}

function FriendFigure({ who, at, held, onPick }: { who: Friend; at: Vec3; held: boolean; onPick: () => void }) {
  const ref = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  useFrame(({ clock }, dt) => {
    const g = ref.current;
    if (!g) return;
    const k = Math.min(1, dt * 8);
    const y = at[1] + (held ? 0.05 + Math.sin(clock.elapsedTime * 3) * 0.004 : 0);
    g.position.x += (at[0] - g.position.x) * k;
    g.position.y += (y - g.position.y) * k;
    g.position.z += (at[2] - g.position.z) * k;
  });
  return (
    <group
      ref={ref}
      position={at}
      scale={FIGURE_SCALE}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        setCursor("pointer");
      }}
      onPointerOut={() => {
        setHovered(false);
        setCursor("");
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta > CLICK_PX) return;
        onPick();
      }}
    >
      {who === "cat" ? <MiniCat glow={held || hovered} /> : <MiniDog glow={held || hovered} />}
      {/* Bigger invisible hit area: the figures are only ~2.5 cm tall. */}
      <mesh position={[0, 0.013, 0]}>
        <sphereGeometry args={[0.02, 8, 6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </group>
  );
}

/** Wraps a desk object as a place to set a held figure down (only reacts while one is held). */
function Seat({ active, onSeat, children }: { active: boolean; onSeat: () => void; children: ReactNode }) {
  return (
    <group
      onPointerOver={(e) => {
        if (!active) return;
        e.stopPropagation();
        setCursor("copy");
      }}
      onPointerOut={() => active && setCursor("")}
      onClick={(e) => {
        if (!active || e.delta > CLICK_PX) return;
        e.stopPropagation();
        onSeat();
      }}
    >
      {children}
    </group>
  );
}

function DeskObjects() {
  const { held, spots, pick, putAt, seat } = useFriends();
  const holding = held !== null;
  return (
    <group>
      {/* Anywhere on the desk top: set the held figure down where you click. */}
      {holding && (
        <mesh
          position={[0.74, 0.0006, 0.13]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerOver={() => setCursor("copy")}
          onPointerOut={() => setCursor("")}
          onClick={(e) => {
            if (e.delta > CLICK_PX) return;
            e.stopPropagation();
            putAt([e.point.x, 0, e.point.z]);
          }}
        >
          <planeGeometry args={[2.9, 0.54]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      )}

      {/* Under board one: turntable, the clay diorama front and centre, roses, the peace lily, pencils. */}
      <Seat active={holding} onSeat={seat("turntable")}>
        <group position={[TURNTABLE.x, 0, TURNTABLE.z]} rotation={[0, TURNTABLE.yaw ?? 0, 0]} scale={TURNTABLE.scale}>
          <TurntableModel />
        </group>
      </Seat>
      <Seat active={holding} onSeat={seat("diorama")}>
        <group position={[DIORAMA.x, 0, DIORAMA.z]} rotation={[0, DIORAMA.yaw ?? 0, 0]} scale={DIORAMA.scale}>
          <ClayDiorama />
        </group>
      </Seat>
      <FriendFigure who="cat" at={spots.cat} held={held === "cat"} onPick={() => pick("cat")} />
      <FriendFigure who="dog" at={spots.dog} held={held === "dog"} onPick={() => pick("dog")} />
      <group position={[0.46, 0, 0.12]} rotation={[0, 0.3, 0]}>
        <RoseBouquet />
      </group>
      <group position={[0.67, 0, 0.14]} rotation={[0, -0.3, 0]}>
        <PeaceLily />
      </group>
      <Pencil position={[0.1, 0.0036, 0.37]} yaw={0.25} />
      <Pencil position={[0.24, 0.0036, 0.385]} yaw={-0.4} color="#2d6cdf" />
      {/* Between the boards: the orchid, its spray arching toward board two. */}
      <group position={[0.87, 0, 0.12]}>
        <Orchid />
      </group>
      {/* Under board two: tulips, mini pots, wildflowers, the pencil cup at the end. */}
      <group position={[1.06, 0, 0.18]} rotation={[0, -0.2, 0]}>
        <TulipBouquet />
      </group>
      {MINI_POTS.map((p, i) => (
        <Seat key={`${p.x}`} active={holding} onSeat={seat(`pot${i}`)}>
          <group position={[p.x, 0, p.z]}>
            <MiniPlant kind={p.kind} />
          </group>
        </Seat>
      ))}
      <group position={[1.6, 0, 0.12]} rotation={[0, 0.2, 0]}>
        <WildflowerVase />
      </group>
      <PencilCup x={1.86} />
      <Pencil position={[1.68, 0.0036, 0.35]} yaw={0.6} color="#e2483d" />
    </group>
  );
}

/* ------------------------------ Wall decorations ------------------------------ */

/** Height of a scalloped strand at x: hung from pins every `every`, sagging `sag` between them. */
function scallop(x: number, x0: number, pinY: number, sag: number, every: number) {
  const t = (((x - x0) % every) + every) % every / every;
  return pinY - sag * 4 * t * (1 - t);
}

const WIRE_X = { x0: -0.5, x1: 2.0 };
const LIGHTS = { pinY: 0.93, sag: 0.07, every: 0.42, bulbEvery: 0.06, z: WALL_Z + 0.006 };
const BUNTING = { pinY: 0.87, sag: 0.045, every: 0.31, flagEvery: 0.062, z: WALL_Z + 0.01 };
const FLAG_COLORS = ["#e2604f", "#f2c230", "#5aa6c9", "#8eaa86", "#f28cb1", "#f4f1ea"];

function Strand({ y, z }: { y: (x: number) => number; z: number }) {
  const geo = useMemo(() => {
    const pts: Vector3[] = [];
    for (let x = WIRE_X.x0; x <= WIRE_X.x1; x += 0.01) pts.push(new Vector3(x, y(x), z));
    return new TubeGeometry(new CatmullRomCurve3(pts), 600, 0.0012, 4, false);
  }, [y, z]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color="#3a3530" roughness={0.6} />
    </mesh>
  );
}

const lightY = (x: number) => scallop(x, WIRE_X.x0, LIGHTS.pinY, LIGHTS.sag, LIGHTS.every);
const buntingY = (x: number) => scallop(x, WIRE_X.x0, BUNTING.pinY, BUNTING.sag, BUNTING.every);

/** Warm fairy lights in scallops across the top of the wall, twinkling a little, like About's strand. */
function StringLights() {
  const bulbs = useMemo(() => {
    const out: number[] = [];
    for (let x = WIRE_X.x0 + LIGHTS.bulbEvery / 2; x < WIRE_X.x1; x += LIGHTS.bulbEvery) out.push(x);
    return out;
  }, []);
  const mats = useRef<(MeshStandardMaterial | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    mats.current.forEach((m, i) => {
      if (m) m.emissiveIntensity = 2.4 + Math.sin(t * 1.3 + i * 2.1) * 0.5;
    });
  });
  return (
    <group>
      <Strand y={lightY} z={LIGHTS.z} />
      {bulbs.map((x, i) => (
        <group key={x} position={[x, lightY(x) - 0.012, LIGHTS.z + 0.006]}>
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
      {[0, 0.6, 1.2, 1.8].map((x) => (
        <pointLight key={x} position={[x - 0.2, LIGHTS.pinY - 0.06, 0.05]} color="#ffc27a" intensity={0.22} distance={1.1} decay={2} />
      ))}
    </group>
  );
}

/** Paper pennant bunting on its own string just under the lights, flags in a repeating colour run. */
function Bunting() {
  const flags = useMemo(() => {
    const out: { x: number; y: number; tilt: number; color: string }[] = [];
    let i = 0;
    for (let x = WIRE_X.x0 + BUNTING.flagEvery / 2; x < WIRE_X.x1; x += BUNTING.flagEvery, i += 1) {
      // Follow the string's slope so each flag hangs square to it.
      const slope = (buntingY(x + 0.005) - buntingY(x - 0.005)) / 0.01;
      out.push({ x, y: buntingY(x), tilt: Math.atan(slope), color: FLAG_COLORS[i % FLAG_COLORS.length] });
    }
    return out;
  }, []);
  const tri = useMemo(() => {
    const g = new BufferGeometry();
    const w = 0.024;
    const h = 0.05;
    g.setAttribute("position", new Float32BufferAttribute([-w, 0, 0, w, 0, 0, 0, -h, 0], 3));
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => tri.dispose(), [tri]);
  return (
    <group>
      <Strand y={buntingY} z={BUNTING.z} />
      {flags.map((f) => (
        // A slight forward sway so the flags catch the light and cast a soft shadow on the wall.
        <mesh key={f.x} geometry={tri} position={[f.x, f.y, BUNTING.z + 0.001]} rotation={[0.12, 0, f.tilt]} castShadow>
          <meshStandardMaterial color={f.color} roughness={0.85} side={DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------ Camera ------------------------------ */

/** Gap kept between neighbouring stops' views so a swipe always reveals something new. */
const STOP_MARGIN = 0.03;

/**
 * Faces the wall head-on, close in. Where the screen is wide enough the whole board fits and each board is
 * one stop; on narrow screens (phones) the camera stays close for bigger photos and each board is split
 * into several stops left to right, so swiping walks across it. `stop` picks one; `onStops` reports how
 * many there are. While a finger/mouse drags, `dragPx` slides the view with it.
 */
function CameraRig({ stop, dragPx, onStops }: { stop: number; dragPx: RefObject<number>; onStops: (n: number) => void }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const fit = useRef({ y: 0.6, d: 1.5, lookY: 0.44, pxToWorld: 0.001, stops: [BOARD_X[0]] as number[] });
  const still = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  useLayoutEffect(() => {
    // Not laid out yet (or a hidden tab): nothing to frame, and a zero-wide view would need endless stops.
    if (size.width < 1 || size.height < 1) return;
    const aspect = size.width / size.height;
    const tanHalf = Math.tan(((camera.fov / 2) * Math.PI) / 180);
    const phone = window.matchMedia("(max-width: 760px)").matches;
    // Vertical framing only: the board with the bunting above it and the desk's tall pieces below.
    const halfH = phone ? 0.4 : 0.46;
    const lookY = 0.44;
    let d = halfH / tanHalf;
    // Wide screens: back off only as far as needed to fit the whole board with a small margin.
    const fullBoard = (BOARD.w / 2 + BOARD.frame + 0.04) / (tanHalf * aspect);
    if (!phone) d = Math.max(d, fullBoard);
    const visibleW = 2 * d * tanHalf * aspect;
    const half = BOARD.w / 2 + BOARD.frame;
    const stops: number[] = [];
    BOARD_X.forEach((cx, i) => {
      const room = visibleW - STOP_MARGIN * 2;
      if (room >= half * 2) {
        // Whole board in view; the first one shifts left to show the window when there's room.
        const spare = visibleW / 2 - half - STOP_MARGIN;
        stops.push(cx - (i === 0 ? Math.min(WINDOW_PEEK, Math.max(0, spare)) : 0));
        return;
      }
      // Board wider than the view: evenly spaced stops from its left edge to its right edge.
      // As few stops as cover the board (views may just touch); phones get three per board.
      const n = Math.ceil((half * 2) / visibleW);
      const first = cx - half + visibleW / 2 - STOP_MARGIN;
      const lastX = cx + half - visibleW / 2 + STOP_MARGIN;
      for (let k = 0; k < n; k += 1) stops.push(n === 1 ? cx : first + ((lastX - first) * k) / (n - 1));
    });
    fit.current = { d, lookY, y: lookY + d * 0.12, pxToWorld: visibleW / Math.max(size.width, 1), stops };
    onStops(stops.length);
    const x0 = stops[Math.min(stop, stops.length - 1)];
    camera.position.set(x0, fit.current.y, d);
    camera.lookAt(x0, lookY, 0);
    camera.updateProjectionMatrix();
    // Only re-fit on resize; stop changes are animated below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, size]);

  useFrame((_, dt) => {
    // Dragging left moves the wall left (view goes right); past the end stops it gives with resistance.
    const { stops } = fit.current;
    let goal = stops[Math.min(stop, stops.length - 1)] - dragPx.current * fit.current.pxToWorld;
    const lo = stops[0];
    const hi = stops[stops.length - 1];
    if (goal < lo) goal = lo - (lo - goal) * 0.3;
    if (goal > hi) goal = hi + (goal - hi) * 0.3;
    const follow = dragPx.current !== 0 ? 20 : 6;
    const x = still ? goal : camera.position.x + (goal - camera.position.x) * Math.min(1, dt * follow);
    camera.position.set(x, fit.current.y, fit.current.d);
    camera.lookAt(x, fit.current.lookY, 0);
  });
  return null;
}

export default function LifeScene({ stop, dragPx, onStops }: { stop: number; dragPx: RefObject<number>; onStops: (n: number) => void }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [BOARD_X[0], 0.6, 1.5], fov: 34, near: 0.02, far: 10 }} style={{ width: "100%", height: "100%" }}>
      <color attach="background" args={[WALL]} />
      <CameraRig stop={stop} dragPx={dragPx} onStops={onStops} />
      {/* Same lighting as About: sky/bounce fill, window light from the left, late sun, soft front fill. */}
      <hemisphereLight args={["#f3f6fb", "#7b5b45", 1.25]} />
      <directionalLight position={[-1.2, 1.4, 0.8]} color="#fff4e0" intensity={1.0} />
      <Sun />
      <directionalLight position={[1, 0.8, 1.5]} intensity={0.6} />
      <Desk win={LIFE_WIN} />
      <StringLights />
      <Bunting />
      <CorkBoard index={0} />
      <CorkBoard index={1} />
      <DeskObjects />
      <ContactShadows position={[0.7, 0.001, 0.1]} opacity={0.45} scale={3} blur={2.2} far={0.4} resolution={1024} />
    </Canvas>
  );
}
