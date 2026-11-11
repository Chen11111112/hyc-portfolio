"use client";

import { ContactShadows, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import {
  BufferGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Float32BufferAttribute,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  type MeshStandardMaterial,
  type PerspectiveCamera,
} from "three";
import { Desk, Pencil, PencilCup, Sun, WALL, WALL_Z, type WindowOpening } from "@/components/AboutBooks/BookStack";
import { Pin } from "@/components/Room/props/BackWallExtras";
import { useCanvasTexture, type Draw } from "@/components/Room/props/canvasTexture";
import { Cat, Dog } from "@/components/Room/props/DeskItems";
import SafeSuspense from "@/components/Room/props/SafeSuspense";
import { TurntableModel } from "@/components/Room/props/SheetCabinet";
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


/** Hand-made clay pieces: soft, slightly squashed lumps in the CSS version's colours. */
const CLAYS: { x: number; z: number; r: number; scale: [number, number, number]; color: string; yaw: number }[] = [
  { x: 1.36, z: 0.1, r: 0.03, scale: [1, 0.85, 0.9], color: "#d97862", yaw: 0.3 },
  { x: 1.74, z: 0.27, r: 0.024, scale: [1.2, 0.7, 1], color: "#e7c27a", yaw: -0.4 },
  { x: 0.42, z: 0.34, r: 0.028, scale: [1.15, 0.8, 0.95], color: "#7eafc6", yaw: 0.6 },
];

function DeskObjects() {
  return (
    <group>
      {/* Under board one: turntable (lid up, record showing), roses, mini pots, the peace lily, pencils. */}
      <group position={[-0.28, 0, 0.06]} rotation={[0, 0.12, 0]} scale={0.8}>
        <TurntableModel />
      </group>
      <group position={[0.06, 0, 0.18]} rotation={[0, 0.3, 0]}>
        <RoseBouquet />
      </group>
      <group position={[0.24, 0, 0.29]}>
        <MiniPlant kind="rosette" />
      </group>
      <group position={[0.3, 0, 0.23]}>
        <MiniPlant kind="cactus" />
      </group>
      <group position={[0.36, 0, 0.3]}>
        <MiniPlant kind="bloom" />
      </group>
      <group position={[0.56, 0, 0.14]} rotation={[0, -0.3, 0]}>
        <PeaceLily />
      </group>
      <Pencil position={[0.12, 0.0036, 0.36]} yaw={0.25} />
      <Pencil position={[0.24, 0.0036, 0.38]} yaw={-0.4} color="#2d6cdf" />
      {/* Between the boards: the orchid, its spray arching toward board two. */}
      <group position={[0.82, 0, 0.12]}>
        <Orchid />
      </group>
      {/* Under board two: tulips, clay cat and dog, wildflowers, mini pots, the pencil cup at the end. */}
      <group position={[1.04, 0, 0.18]} rotation={[0, -0.2, 0]}>
        <TulipBouquet />
      </group>
      <group position={[1.26, 0, 0.22]} scale={2.2}>
        <group position={[-0.035, 0, 0]} rotation={[0, 0.5, 0]}>
          <Cat />
        </group>
        <group position={[0.035, 0, 0.005]} rotation={[0, -0.5 - Math.PI / 2, 0]}>
          <Dog />
        </group>
      </group>
      <group position={[1.4, 0, 0.33]}>
        <MiniPlant kind="bloom" />
      </group>
      <group position={[1.46, 0, 0.27]}>
        <MiniPlant kind="rosette" />
      </group>
      <group position={[1.58, 0, 0.12]} rotation={[0, 0.2, 0]}>
        <WildflowerVase />
      </group>
      {CLAYS.map((c) => (
        <mesh key={c.color} position={[c.x, c.r * c.scale[1] * 0.9, c.z]} rotation={[0, c.yaw, 0]} scale={c.scale} castShadow receiveShadow>
          <sphereGeometry args={[c.r, 24, 18]} />
          <meshStandardMaterial color={c.color} roughness={0.85} />
        </mesh>
      ))}
      <PencilCup x={1.86} />
      <Pencil position={[1.66, 0.0036, 0.35]} yaw={0.6} color="#e2483d" />
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

/**
 * Faces the wall head-on, framed so the lights, the whole cork board and the desk below it fit; eases
 * sideways to the selected board. While a finger/mouse drags, `dragPx` slides the view with it.
 */
function CameraRig({ board, dragPx }: { board: number; dragPx: RefObject<number> }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const fit = useRef({ y: 0.6, d: 1.8, lookY: 0.4, pxToWorld: 0.001, peek: 0 });
  const still = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  useLayoutEffect(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const tanHalf = Math.tan(((camera.fov / 2) * Math.PI) / 180);
    const phone = window.matchMedia("(max-width: 760px)").matches;
    // Half the width/height that must stay in frame: the board plus a margin; from the lights down to the desk's front edge.
    const halfW = BOARD.w / 2 + (phone ? 0.03 : 0.12);
    const halfH = phone ? 0.46 : 0.56;
    const d = Math.max(halfW / (tanHalf * aspect), halfH / tanHalf);
    const lookY = phone ? 0.44 : 0.4;
    const visibleW = 2 * d * tanHalf * aspect;
    // Only shift toward the window when the board still fits with the shift (not on phones).
    const peek = visibleW / 2 - BOARD.w / 2 - 0.03 >= WINDOW_PEEK ? WINDOW_PEEK : 0;
    fit.current = { d, lookY, y: lookY + d * 0.14, pxToWorld: visibleW / Math.max(size.width, 1), peek };
    const x0 = BOARD_X[board] - (board === 0 ? peek : 0);
    camera.position.set(x0, fit.current.y, d);
    camera.lookAt(x0, lookY, 0);
    camera.updateProjectionMatrix();
    // Only re-fit on resize; board changes are animated below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, size]);

  useFrame((_, dt) => {
    // Dragging left moves the wall left (view goes right); past the end boards it gives with resistance.
    const views = BOARD_X.map((x, i) => x - (i === 0 ? fit.current.peek : 0));
    let goal = views[board] - dragPx.current * fit.current.pxToWorld;
    const lo = views[0];
    const hi = views[views.length - 1];
    if (goal < lo) goal = lo - (lo - goal) * 0.3;
    if (goal > hi) goal = hi + (goal - hi) * 0.3;
    const follow = dragPx.current !== 0 ? 20 : 6;
    const x = still ? goal : camera.position.x + (goal - camera.position.x) * Math.min(1, dt * follow);
    camera.position.set(x, fit.current.y, fit.current.d);
    camera.lookAt(x, fit.current.lookY, 0);
  });
  return null;
}

export default function LifeScene({ board, dragPx }: { board: number; dragPx: RefObject<number> }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [BOARD_X[0], 0.6, 1.8], fov: 34, near: 0.02, far: 10 }} style={{ width: "100%", height: "100%" }}>
      <color attach="background" args={[WALL]} />
      <CameraRig board={board} dragPx={dragPx} />
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
