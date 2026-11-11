"use client";

import { RoundedBox, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, DoubleSide, SRGBColorSpace, type MeshStandardMaterial, type PointLight } from "three";
import { DESK, DESK_CX, SHELF_W, SHELF_X0, type Vec3 } from "../layout";
import { lerp, useNightMix } from "../nightMode";
import { useCanvasTexture, type Draw } from "./canvasTexture";
import { Box, Cyl, Rod } from "./primitives";
import SafeSuspense from "./SafeSuspense";

const TOP = DESK.top;
const ALU = { color: "#a9aeb3", roughness: 0.32, metalness: 0.65 };
const CHROME = { color: "#d4d7da", roughness: 0.18, metalness: 0.95 };

/** Warm table lamp with a linen drum shade — the desk's mood light, on the bookshelf side just past the shelf. */
export function DeskLamp() {
  const light = useRef<PointLight>(null);
  const shade = useRef<MeshStandardMaterial>(null);
  const mix = useNightMix();
  // At night the lamp becomes the room's main light.
  useFrame(() => {
    const m = mix.current;
    if (light.current) {
      light.current.intensity = lerp(0.9, 3.2, m);
      light.current.distance = lerp(1.8, 3.2, m);
    }
    if (shade.current) shade.current.emissiveIntensity = lerp(0.42, 1.15, m);
  });
  return (
    <group position={[SHELF_X0 + SHELF_W + 0.1, TOP, 0.13]}>
      <Cyl r={0.055} rTop={0.05} h={0.016} position={[0, 0.008, 0]} {...CHROME} />
      <Cyl r={0.006} h={0.2} position={[0, 0.11, 0]} {...CHROME} />
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.024, 16, 12]} />
        <meshStandardMaterial color="#fff3dc" emissive="#ffcf87" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.215, 0]} castShadow>
        <cylinderGeometry args={[0.072, 0.092, 0.14, 40, 1, true]} />
        <meshStandardMaterial
          ref={shade}
          color="#efe6d6"
          roughness={0.95}
          side={DoubleSide}
          emissive="#ffc674"
          emissiveIntensity={0.42}
        />
      </mesh>
      <pointLight ref={light} position={[0, 0.19, 0]} color="#ffc27a" intensity={0.9} distance={1.8} decay={2} />
    </group>
  );
}

function makeTexture(canvas: HTMLCanvasElement) {
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function useScreenTexture() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 420;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#11151d";
      ctx.fillRect(0, 0, 640, 420);
      ctx.fillStyle = "#1a2030";
      ctx.fillRect(0, 0, 640, 26);
      ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(18 + i * 18, 13, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = "#161b26";
      ctx.fillRect(0, 26, 130, 394);
      ctx.fillStyle = "#4a5568";
      for (let i = 0; i < 12; i += 1) ctx.fillRect(16, 46 + i * 26, 60 + ((i * 37) % 44), 8);
      const palette = ["#7aa2f7", "#bb9af7", "#9ece6a", "#e0af68", "#7dcfff", "#f7768e", "#a9b1d6"];
      let seed = 3;
      for (let line = 0; line < 22; line += 1) {
        let x = 160 + ((line * 7) % 4) * 22;
        const y = 48 + line * 16;
        const tokens = 1 + (line % 5);
        for (let t = 0; t < tokens; t += 1) {
          seed = (seed * 9301 + 49297) % 233280;
          const w = 24 + (seed % 90);
          ctx.fillStyle = palette[(seed + t) % palette.length];
          ctx.fillRect(x, y, w, 7);
          x += w + 8;
        }
      }
    }
    return makeTexture(canvas);
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

/** Open laptop right of the monitor, angled toward the chair; kept left of the speaker figurines' sightline. */
export function Laptop() {
  const screen = useScreenTexture();
  const w = 0.31;
  const d = 0.215;
  const t = 0.012;
  return (
    <group position={[DESK.x1 - 0.58, TOP, 0.47]} rotation={[0, -0.4, 0]}>
      <Box size={[w, t, d]} position={[0, t / 2, 0]} {...ALU} />
      <Box size={[w * 0.86, 0.0012, d * 0.42]} position={[0, t + 0.0003, -d * 0.1]} color="#1c1e21" roughness={0.6} cast={false} />
      <Box size={[w * 0.36, 0.001, d * 0.27]} position={[0, t + 0.0002, d * 0.29]} color="#959ba0" roughness={0.25} metalness={0.5} cast={false} />
      <group position={[0, t, -d / 2 + 0.004]} rotation={[-0.3, 0, 0]}>
        <Box size={[w, d, 0.006]} position={[0, d / 2, -0.003]} {...ALU} />
        <Box size={[w * 0.985, d * 0.975, 0.001]} position={[0, d / 2, 0.0006]} color="#0b0c0e" roughness={0.2} cast={false} />
        <mesh position={[0, d / 2 + 0.003, 0.0013]}>
          <planeGeometry args={[w * 0.93, d * 0.86]} />
          <meshBasicMaterial map={screen} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/** Green notebook with a pencil, in front of the speaker. */
export const NOTEBOOK_POS: Vec3 = [DESK.x1 - 0.24, TOP, 0.56];

export function Notebook() {
  return (
    <group position={NOTEBOOK_POS} rotation={[0, 0.28, 0]}>
      <Box size={[0.15, 0.009, 0.21]} position={[0, 0.0045, 0]} color="#1f5a3c" roughness={0.7} />
      <Box size={[0.144, 0.007, 0.204]} position={[0.002, 0.0045, 0]} color="#f2eee3" roughness={0.9} cast={false} />
      <Box size={[0.152, 0.0012, 0.01]} position={[0, 0.0095, -0.06]} color="#123825" roughness={0.6} cast={false} />
      <Box size={[0.006, 0.0012, 0.212]} position={[0.055, 0.0095, 0]} color="#111111" roughness={0.5} cast={false} />
      <Rod from={[-0.03, 0.013, 0.08]} to={[0.05, 0.013, -0.09]} r={0.0035} color="#f2c230" roughness={0.5} />
    </group>
  );
}

/** Silver Sony-style portable speaker against the wall. */
export function Speaker() {
  const w = 0.26;
  const h = 0.12;
  const d = 0.07;
  return (
    <group position={[DESK.x1 - 0.32, TOP, 0.1]} rotation={[0, -0.1, 0]}>
      <Box size={[w, h, d]} position={[0, h / 2, 0]} color="#c3c6c9" roughness={0.3} metalness={0.75} />
      <Box size={[w - 0.01, h - 0.014, 0.002]} position={[0, h / 2 - 0.002, d / 2 + 0.001]} color="#26282b" roughness={0.92} cast={false} />
      {[-0.045, -0.025, -0.005, 0.015].map((x) => (
        <Box key={x} size={[0.012, 0.002, 0.008]} position={[x + 0.07, h + 0.001, 0.01]} color="#2b2d30" roughness={0.4} cast={false} />
      ))}
      <Box size={[0.03, 0.004, 0.002]} position={[-w / 2 + 0.03, h - 0.012, d / 2 + 0.0025]} color="#d8dadc" roughness={0.3} metalness={0.8} cast={false} />
    </group>
  );
}

/** Ceramic pen holder with pencils, right beside the speaker. */
export function PenHolder() {
  const pencils = [
    { tip: [0.012, 0.18, 0.01], color: "#f2c230" },
    { tip: [-0.02, 0.16, 0.018], color: "#f2c230" },
    { tip: [0.026, 0.15, -0.016], color: "#2d6cdf" },
    { tip: [-0.008, 0.17, -0.024], color: "#1d1d1f" },
    { tip: [0.03, 0.165, 0.012], color: "#e2483d" },
    { tip: [-0.026, 0.155, -0.006], color: "#f2c230" },
    { tip: [0.004, 0.19, -0.002], color: "#3c9a5f" },
  ] as const;
  return (
    <group position={[DESK.x1 - 0.13, TOP, 0.11]}>
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.038, 0.036, 0.1, 28, 1, true]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.35} side={DoubleSide} />
      </mesh>
      <Cyl r={0.036} h={0.004} position={[0, 0.004, 0]} color="#e9e5dc" roughness={0.4} />
      {pencils.map((p) => (
        <Rod key={p.tip.join()} from={[p.tip[0] * 0.3, 0.01, p.tip[2] * 0.3]} to={[p.tip[0], p.tip[1], p.tip[2]]} r={0.0036} color={p.color} roughness={0.5} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Monitor on a riser, tablet, phone, USB microphone.                  */
/* ------------------------------------------------------------------ */

export const RISER = { x0: DESK_CX - 0.26, x1: DESK_CX + 0.34, z0: 0.02, z1: 0.27, h: 0.1 };
const RISER_CX = (RISER.x0 + RISER.x1) / 2;
const OAK = { color: "#c9a77c", roughness: 0.6 };

/** Small wooden table that lifts the monitor; the outlets hide behind it. */
export function MonitorRiser() {
  const d = RISER.z1 - RISER.z0;
  const w = RISER.x1 - RISER.x0;
  const cz = (RISER.z0 + RISER.z1) / 2;
  return (
    <group position={[0, TOP, 0]}>
      <Box size={[w, 0.018, d]} position={[RISER_CX, RISER.h - 0.009, cz]} {...OAK} />
      {[RISER.x0 + 0.01, RISER.x1 - 0.01].map((x) => (
        <Box key={x} size={[0.02, RISER.h - 0.018, d]} position={[x, (RISER.h - 0.018) / 2, cz]} {...OAK} />
      ))}
    </group>
  );
}

/** Screenshot of hyc.eshachem.com (public/room/monitor-site.jpg). Re-capture at 16:9 to update it. */
const SITE_SCREEN = "/room/monitor-site.jpg";

function SiteScreen({ w, h }: { w: number; h: number }) {
  const map = useTexture(SITE_SCREEN, (t) => {
    (Array.isArray(t) ? t : [t]).forEach((tex) => {
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = 4;
    });
  });
  return (
    <mesh position={[0, 0.006, 0.0095]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={map} toneMapped={false} />
    </mesh>
  );
}

/** 27-inch desktop monitor standing on the riser, showing the personal site. */
export function Monitor() {
  const w = 0.615;
  const h = 0.365;
  const base = TOP + RISER.h;
  const panelY = base + 0.09 + h / 2;
  return (
    <group position={[RISER_CX, 0, 0.13]} rotation={[0, -0.05, 0]}>
      <Box size={[0.24, 0.008, 0.17]} position={[0, base + 0.004, 0]} color="#2a2b2e" roughness={0.4} metalness={0.5} />
      <Box size={[0.05, 0.27, 0.025]} position={[0, base + 0.135, -0.05]} rotation={[-0.08, 0, 0]} color="#2a2b2e" roughness={0.4} metalness={0.5} />
      <group position={[0, panelY, -0.01]}>
        <Box size={[w, h, 0.018]} color="#1b1c1f" roughness={0.45} />
        <Box size={[w * 0.5, h * 0.5, 0.03]} position={[0, -0.02, -0.02]} color="#1b1c1f" roughness={0.45} />
        <SafeSuspense fallback={<Box size={[w - 0.016, h - 0.03, 0.001]} position={[0, 0.006, 0.0095]} color="#0b0c0e" cast={false} />}>
          <SiteScreen w={w - 0.016} h={(w - 0.016) * (9 / 16)} />
        </SafeSuspense>
      </group>
    </group>
  );
}

const STAND_METAL = { color: "#5c6066", roughness: 0.35, metalness: 0.8 };

/** Tablet in landscape on an adjustable stand, in front of the monitor. */
export function Tablet() {
  const tilt = -0.36;
  return (
    <group position={[RISER_CX - 0.1, TOP, 0.46]} rotation={[0, 0.05, 0]}>
      {/* Stand: base plate, hinge arm, back plate and front lip. */}
      <Box size={[0.15, 0.008, 0.12]} position={[0, 0.004, 0]} {...STAND_METAL} />
      <Box size={[0.03, 0.1, 0.012]} position={[0, 0.055, -0.045]} rotation={[0.35, 0, 0]} {...STAND_METAL} />
      <Box size={[0.14, 0.012, 0.02]} position={[0, 0.02, 0.045]} {...STAND_METAL} />
      <group position={[0, 0.022, 0.04]} rotation={[tilt, 0, 0]}>
        <Box size={[0.1, 0.11, 0.006]} position={[0, 0.07, -0.008]} {...STAND_METAL} />
        <Box size={[0.25, 0.178, 0.007]} position={[0, 0.089, 0]} color="#8e9399" roughness={0.3} metalness={0.7} />
        <Box size={[0.244, 0.172, 0.0012]} position={[0, 0.089, 0.0036]} color="#0c0d10" roughness={0.12} cast={false} />
        <mesh position={[0, 0.089, 0.0044]}>
          <planeGeometry args={[0.226, 0.156]} />
          <meshBasicMaterial color="#34507f" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/** Phone in portrait on a small stand, on the right end of the monitor riser. */
export function Phone() {
  const tilt = -0.3;
  return (
    <group position={[RISER.x1 - 0.07, TOP + RISER.h, 0.2]} rotation={[0, -0.25, 0]}>
      <Box size={[0.07, 0.006, 0.08]} position={[0, 0.003, 0]} {...STAND_METAL} />
      <Box size={[0.06, 0.01, 0.012]} position={[0, 0.011, 0.03]} {...STAND_METAL} />
      <group position={[0, 0.012, 0.024]} rotation={[tilt, 0, 0]}>
        <Box size={[0.05, 0.09, 0.005]} position={[0, 0.05, -0.01]} {...STAND_METAL} />
        <Box size={[0.072, 0.148, 0.008]} position={[0, 0.074, 0]} color="#2c2e33" roughness={0.3} metalness={0.6} />
        <Box size={[0.068, 0.144, 0.001]} position={[0, 0.074, 0.0045]} color="#08090b" roughness={0.08} cast={false} />
        <mesh position={[0, 0.074, 0.0052]}>
          <planeGeometry args={[0.062, 0.134]} />
          <meshBasicMaterial color="#2c3e5c" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/** Mac mini on the left end of the monitor riser, tucked under the panel's overhang. */
export function MacMini() {
  const s = 0.127;
  const h = 0.05;
  return (
    <group position={[RISER.x0 + 0.09, TOP + RISER.h, 0.17]} rotation={[0, 0.08, 0]}>
      <RoundedBox args={[s, h - 0.004, s]} radius={0.012} smoothness={4} position={[0, 0.004 + (h - 0.004) / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#c9ccd0" roughness={0.3} metalness={0.8} />
      </RoundedBox>
      <Cyl r={s * 0.38} h={0.004} position={[0, 0.002, 0]} seg={32} color="#1d1e21" roughness={0.6} />
      {/* Front power LED and ports. */}
      <mesh position={[s / 2 - 0.012, 0.012, s / 2 + 0.0004]}>
        <circleGeometry args={[0.0016, 10]} />
        <meshBasicMaterial color="#e9fff0" toneMapped={false} />
      </mesh>
      {[-0.02, -0.008].map((x) => (
        <Box key={x} size={[0.009, 0.004, 0.001]} position={[x, 0.02, s / 2 + 0.0004]} color="#2a2b2e" cast={false} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Mug with the Hy.C lockup printed on it, on a cork coaster.          */
/* ------------------------------------------------------------------ */

const MUG = { r: 0.04, h: 0.095 };
/** Direction the logo faces (radians around +y from +z): toward the default camera. */
const LOGO_FACING = Math.PI / 4;
const LOGO_H = 0.026;
const LOGO_ARC = (LOGO_H * (800 / 193)) / MUG.r; // keep the lockup's aspect ratio around the curve

function MugLogo() {
  const map = useTexture("/room/mug-logo.png", (t) => {
    (Array.isArray(t) ? t : [t]).forEach((tex) => {
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = 4;
    });
  });
  return (
    <mesh position={[0, MUG.h * 0.52, 0]}>
      <cylinderGeometry args={[MUG.r + 0.0008, MUG.r + 0.0008, LOGO_H, 48, 1, true, LOGO_FACING - LOGO_ARC / 2, LOGO_ARC]} />
      <meshStandardMaterial map={map} transparent alphaTest={0.25} roughness={0.3} depthWrite={false} />
    </mesh>
  );
}

export function Mug() {
  const handleAt = LOGO_FACING - Math.PI / 2;
  return (
    <group position={[0.45, TOP, 0.56]}>
      <Cyl r={0.052} h={0.005} position={[0, 0.0025, 0]} seg={32} color="#b98c5a" roughness={0.9} />
      <group position={[0, 0.005, 0]}>
        <mesh position={[0, MUG.h / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[MUG.r, MUG.r * 0.96, MUG.h, 40, 1, true]} />
          <meshStandardMaterial color="#f7f6f2" roughness={0.28} side={DoubleSide} />
        </mesh>
        <Cyl r={MUG.r * 0.96} h={0.006} position={[0, 0.003, 0]} seg={32} color="#f7f6f2" roughness={0.3} />
        {/* Coffee. */}
        <mesh position={[0, MUG.h - 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[MUG.r - 0.002, 32]} />
          <meshStandardMaterial color="#3b2416" roughness={0.15} />
        </mesh>
        {/* Handle: half torus standing out from the side. */}
        <group position={[0, MUG.h * 0.5, 0]} rotation={[0, handleAt - Math.PI / 2, 0]}>
          <mesh position={[MUG.r - 0.002, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
            <torusGeometry args={[0.026, 0.0065, 10, 20, Math.PI]} />
            <meshStandardMaterial color="#f7f6f2" roughness={0.28} />
          </mesh>
        </group>
        <SafeSuspense fallback={null}>
          <MugLogo />
        </SafeSuspense>
      </group>
    </group>
  );
}

/** Blue Yeti-style USB mic, blackout finish, on its own desktop stand (yoke + weighted base, no boom arm). */
export function Microphone() {
  const body = { color: "#1e1f22", roughness: 0.42, metalness: 0.55 };
  const dark = { color: "#2a2c30", roughness: 0.35, metalness: 0.6 };
  const pivotY = 0.15;
  return (
    <group position={[0.22, TOP, 0.4]} rotation={[0, 0.5, 0]}>
      {/* Weighted base. */}
      <Cyl r={0.068} rTop={0.06} h={0.022} position={[0, 0.011, 0]} {...dark} />
      <Box size={[0.03, 0.03, 0.03]} position={[0, 0.035, 0]} {...dark} />
      {/* Yoke. */}
      <Box size={[0.124, 0.012, 0.024]} position={[0, 0.05, 0]} {...dark} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box size={[0.012, 0.11, 0.024]} position={[s * 0.056, 0.1, 0]} {...dark} />
          <Cyl r={0.013} h={0.014} position={[s * 0.066, pivotY, 0]} rotation={[0, 0, Math.PI / 2]} color="#4a4c50" roughness={0.4} metalness={0.7} />
        </group>
      ))}
      {/* Body: solid lower half, grille capsule on top, tilted slightly toward the user. */}
      <group position={[0, pivotY, 0]} rotation={[0.12, 0, 0]}>
        <Cyl r={0.042} h={0.12} position={[0, -0.01, 0]} seg={32} {...body} />
        <Cyl r={0.043} h={0.09} position={[0, 0.095, 0]} seg={32} color="#2b2c30" roughness={0.65} metalness={0.6} />
        <mesh position={[0, 0.14, 0]} castShadow>
          <sphereGeometry args={[0.043, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#2b2c30" roughness={0.65} metalness={0.6} />
        </mesh>
        {/* Mute button with red LED, gain knob. */}
        <Cyl r={0.011} h={0.006} position={[0, 0.03, 0.042]} rotation={[Math.PI / 2, 0, 0]} color="#d7262b" emissive="#ff2a2a" emissiveIntensity={0.6} cast={false} />
        <Cyl r={0.009} h={0.008} position={[0, -0.025, 0.042]} rotation={[Math.PI / 2, 0, 0]} color="#3a3c40" metalness={0.6} roughness={0.3} cast={false} />
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Tiny cat and dog figurines in front of the speaker.                 */
/* ------------------------------------------------------------------ */

function Ball({ r, position, scale, color, roughness = 0.5 }: { r: number; position: Vec3; scale?: Vec3; color: string; roughness?: number }) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <sphereGeometry args={[r, 16, 12]} />
      <meshStandardMaterial color={color} roughness={roughness} />
    </mesh>
  );
}

function Cat() {
  const fur = "#9a9da3";
  const belly = "#f1efe9";
  return (
    <group>
      <Ball r={0.014} position={[0, 0.013, 0]} scale={[1, 1.15, 0.9]} color={fur} />
      <Ball r={0.009} position={[0, 0.012, 0.009]} scale={[0.8, 1, 0.6]} color={belly} />
      <Ball r={0.0105} position={[0, 0.034, 0.002]} color={fur} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.0055, 0.045, 0.001]} rotation={[0, 0, -s * 0.35]} castShadow>
          <coneGeometry args={[0.0042, 0.008, 4]} />
          <meshStandardMaterial color={fur} roughness={0.5} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <Ball key={`e${s}`} r={0.0013} position={[s * 0.0042, 0.036, 0.0098]} color="#1b1b1b" roughness={0.2} />
      ))}
      <Rod from={[0.008, 0.004, -0.008]} to={[0.017, 0.018, -0.012]} r={0.0022} color={fur} />
    </group>
  );
}

function Dog() {
  const fur = "#d49a5a";
  const cream = "#f4e6d0";
  return (
    <group>
      <Ball r={0.012} position={[0, 0.018, 0]} scale={[1.6, 0.9, 1]} color={fur} />
      {[
        [-0.012, 0.006],
        [0.012, 0.006],
        [-0.012, -0.006],
        [0.012, -0.006],
      ].map(([x, z]) => (
        <Box key={`${x}${z}`} size={[0.005, 0.012, 0.005]} position={[x, 0.006, z]} color={cream} roughness={0.5} />
      ))}
      <Ball r={0.0105} position={[0.02, 0.03, 0]} color={fur} />
      <Ball r={0.0055} position={[0.029, 0.027, 0]} scale={[1.2, 0.8, 0.9]} color={cream} />
      <Ball r={0.0018} position={[0.035, 0.028, 0]} color="#1b1b1b" roughness={0.2} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.017, 0.04, s * 0.006]} rotation={[s * 0.3, 0, 0.2]} castShadow>
          <coneGeometry args={[0.0038, 0.008, 4]} />
          <meshStandardMaterial color={fur} roughness={0.5} />
        </mesh>
      ))}
      <Rod from={[-0.018, 0.022, 0]} to={[-0.024, 0.033, 0]} r={0.0022} color={fur} />
    </group>
  );
}

export function Figurines() {
  const x = DESK.x1 - 0.32;
  return (
    <group position={[x, TOP, 0.18]}>
      <group position={[-0.035, 0, 0]} rotation={[0, 0.5, 0]}>
        <Cat />
      </group>
      <group position={[0.035, 0, 0.005]} rotation={[0, -0.5 - Math.PI / 2, 0]}>
        <Dog />
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* MUJI-style divided stationery box between the monitor riser and the speaker. */
/* ------------------------------------------------------------------ */

const ORG = { w: 0.16, d: 0.12, h: 0.06, t: 0.003 };
/** Back compartment depth (full width); the front is split left/right. */
const ORG_BACK = 0.05;
const ORG_SPLIT_X = -ORG.w / 2 + 0.09;

/** Frosted translucent polypropylene, like MUJI's PP organisers. */
function FrostedPP({ size, position }: { size: Vec3; position: Vec3 }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshPhysicalMaterial color="#f6f7f8" roughness={0.55} transparent opacity={0.78} />
    </mesh>
  );
}

function BinderClip({ position, rotation, color = "#1b1b1d" }: { position: Vec3; rotation?: Vec3; color?: string }) {
  return (
    <group position={position} rotation={rotation}>
      <Box size={[0.025, 0.014, 0.012]} position={[0, 0.007, 0]} color={color} roughness={0.35} metalness={0.4} />
      {[-1, 1].map((s) => (
        <Rod key={s} from={[s * 0.009, 0.013, s * 0.005]} to={[s * 0.009, 0.028, s * 0.012]} r={0.0009} color="#c9ccd0" metalness={0.9} roughness={0.25} />
      ))}
      <Rod from={[-0.009, 0.028, 0.012]} to={[0.009, 0.028, 0.012]} r={0.0009} color="#c9ccd0" metalness={0.9} roughness={0.25} />
    </group>
  );
}

function MiniStapler({ position, rotation }: { position: Vec3; rotation?: Vec3 }) {
  return (
    <group position={position} rotation={rotation}>
      <Box size={[0.07, 0.008, 0.022]} position={[0, 0.004, 0]} color="#2b2c30" roughness={0.4} metalness={0.3} />
      <Box size={[0.066, 0.014, 0.02]} position={[0.001, 0.016, 0]} rotation={[0, 0, 0.05]} color="#e9e8e4" roughness={0.35} />
      <Cyl r={0.006} h={0.022} position={[-0.032, 0.012, 0]} rotation={[Math.PI / 2, 0, 0]} color="#2b2c30" roughness={0.4} metalness={0.3} />
    </group>
  );
}

function CorrectionTape({ position, rotation }: { position: Vec3; rotation?: Vec3 }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.055, 0.032, 0.016]} radius={0.006} smoothness={3} position={[0, 0.016, 0]} castShadow>
        <meshStandardMaterial color="#e6eef7" roughness={0.3} />
      </RoundedBox>
      <Cyl r={0.011} h={0.0165} position={[-0.006, 0.016, 0]} rotation={[Math.PI / 2, 0, 0]} color="#2f6fd6" roughness={0.4} cast={false} />
      <Box size={[0.012, 0.008, 0.008]} position={[0.03, 0.006, 0]} color="#f2a03b" roughness={0.4} />
    </group>
  );
}

export function StationeryBasket() {
  const { w, d, h, t } = ORG;
  const backZ = -d / 2 + ORG_BACK;
  const frontMidZ = (backZ + d / 2) / 2;
  return (
    <group position={[(RISER.x1 + DESK.x1 - 0.45) / 2, TOP, 0.1]} rotation={[0, -0.06, 0]}>
      {/* Tray: base, outer walls, one long divider, one cross divider in front. */}
      <FrostedPP size={[w, t, d]} position={[0, t / 2, 0]} />
      <FrostedPP size={[w, h, t]} position={[0, h / 2, d / 2 - t / 2]} />
      <FrostedPP size={[w, h, t]} position={[0, h / 2, -d / 2 + t / 2]} />
      <FrostedPP size={[t, h, d]} position={[w / 2 - t / 2, h / 2, 0]} />
      <FrostedPP size={[t, h, d]} position={[-w / 2 + t / 2, h / 2, 0]} />
      <FrostedPP size={[w - t * 2, h * 0.9, t]} position={[0, (h * 0.9) / 2, backZ]} />
      <FrostedPP size={[t, h * 0.9, d / 2 - backZ - t]} position={[ORG_SPLIT_X, (h * 0.9) / 2, frontMidZ]} />

      {/* Back: scissors and a clear ruler standing up. */}
      <group position={[-0.05, 0.004, (backZ - d / 2) / 2]} rotation={[0.05, 0.2, 0.12]}>
        <Box size={[0.008, 0.075, 0.003]} position={[0.002, 0.04, 0]} rotation={[0, 0, 0.06]} color="#c9ccd0" metalness={0.9} roughness={0.2} />
        <Box size={[0.008, 0.075, 0.003]} position={[-0.002, 0.04, 0.002]} rotation={[0, 0, -0.06]} color="#c9ccd0" metalness={0.9} roughness={0.2} />
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.012, 0.09, 0]} castShadow>
            <torusGeometry args={[0.011, 0.0035, 8, 18]} />
            <meshStandardMaterial color="#2f6fd6" roughness={0.4} />
          </mesh>
        ))}
      </group>
      <group position={[0.035, 0.004, (backZ - d / 2) / 2]} rotation={[0.06, 0, -0.18]}>
        <mesh position={[0, 0.08, 0]} castShadow>
          <boxGeometry args={[0.022, 0.16, 0.002]} />
          <meshPhysicalMaterial color="#dff1ff" roughness={0.1} transparent opacity={0.55} />
        </mesh>
        {Array.from({ length: 15 }, (_, i) => (
          <Box key={i} size={[i % 5 === 0 ? 0.008 : 0.005, 0.0006, 0.0004]} position={[-0.007, 0.005 + i * 0.01, 0.0013]} color="#2b2b2b" cast={false} />
        ))}
      </group>

      {/* Front left: mini stapler and a roll of tape. */}
      <MiniStapler position={[ORG_SPLIT_X - 0.046, t, backZ + 0.013]} />
      <mesh position={[ORG_SPLIT_X - 0.045, t + 0.007, d / 2 - 0.024]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.015, 0.006, 8, 20]} />
        <meshPhysicalMaterial color="#eef2f5" roughness={0.2} transparent opacity={0.85} />
      </mesh>

      {/* Front right: correction tape standing up, sticky notes, eraser, binder clips. */}
      <CorrectionTape position={[ORG_SPLIT_X + 0.035, t, backZ + 0.012]} />
      <Box size={[0.05, 0.012, 0.04]} position={[ORG_SPLIT_X + 0.036, t + 0.006, d / 2 - 0.024]} color="#f7e26b" roughness={0.85} />
      <Box size={[0.026, 0.01, 0.012]} position={[ORG_SPLIT_X + 0.022, t + 0.017, d / 2 - 0.026]} rotation={[0, -0.3, 0]} color="#f5f5f2" roughness={0.9} />
      <BinderClip position={[ORG_SPLIT_X + 0.05, t + 0.012, d / 2 - 0.022]} rotation={[0, 0.5, 0]} />
      <BinderClip position={[ORG_SPLIT_X + 0.025, t + 0.012, d / 2 - 0.016]} rotation={[0, -0.7, 0]} color="#d64545" />
      {/* One clip pinched onto the front rim. */}
      <BinderClip position={[0.045, h - 0.012, d / 2 + 0.004]} color="#2f6fd6" />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Math scratch paper fanned out under the green notebook.            */
/* ------------------------------------------------------------------ */

function mathDraw(variant: number): Draw {
  return (ctx, w, h) => {
    ctx.fillStyle = "#fbfbf7";
    ctx.fillRect(0, 0, w, h);
    // Blue grid.
    ctx.strokeStyle = "rgba(90,140,200,0.28)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 15) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 15) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    const pencil = "rgba(40,40,52,0.9)";
    ctx.fillStyle = pencil;
    ctx.strokeStyle = pencil;
    ctx.lineWidth = 2;
    ctx.font = `20px "Bradley Hand", "Segoe Print", "Comic Sans MS", cursive`;
    const lines: string[][] = [
      ["f(x) = ax² + bx + c", "Δ = b² − 4ac", "x = (−b ± √Δ) / 2a", "", "x² − 5x + 6 = 0", "(x − 2)(x − 3) = 0", "x = 2, 3 ✓"],
      ["∫ x² dx = x³/3 + C", "", "∫₀¹ (2x + 1) dx", "= [x² + x]₀¹", "= 2", "", "d/dx sin x = cos x"],
      ["sin²θ + cos²θ = 1", "", "a² + b² = c²", "3² + 4² = 5²", "", "Σ k = n(n+1)/2", "n = 10 → 55"],
    ];
    lines[variant % lines.length].forEach((t, i) => ctx.fillText(t, 22, 46 + i * 34));
    if (variant % 3 === 0) {
      // Parabola sketch with axes.
      const ox = w - 90;
      const oy = h - 70;
      ctx.beginPath();
      ctx.moveTo(ox - 60, oy);
      ctx.lineTo(ox + 60, oy);
      ctx.moveTo(ox, oy + 20);
      ctx.lineTo(ox, oy - 110);
      ctx.stroke();
      ctx.strokeStyle = "rgba(200,60,60,0.85)";
      ctx.beginPath();
      for (let x = -50; x <= 50; x += 4) {
        const y = (x * x) / 28 - 40;
        if (x === -50) ctx.moveTo(ox + x, oy + y);
        else ctx.lineTo(ox + x, oy + y);
      }
      ctx.stroke();
    } else if (variant % 3 === 2) {
      // Right triangle with labels.
      ctx.beginPath();
      ctx.moveTo(w - 160, h - 40);
      ctx.lineTo(w - 40, h - 40);
      ctx.lineTo(w - 40, h - 130);
      ctx.closePath();
      ctx.stroke();
      ctx.fillText("θ", w - 145, h - 48);
      ctx.fillText("c", w - 110, h - 95);
    } else {
      // Boxed answer.
      ctx.strokeStyle = "rgba(200,60,60,0.85)";
      ctx.strokeRect(16, 46 + 3 * 34 - 24, 70, 32);
    }
  };
}

const SHEETS: { offset: Vec3; yaw: number; variant: number }[] = [
  // Offsets keep every sheet on the desktop (front edge z ≈ 0.70, right edge x = DESK.x1).
  { offset: [0.07, 0.0004, 0.02], yaw: 0.65, variant: 0 },
  { offset: [-0.06, 0.0008, 0.0], yaw: -0.25, variant: 1 },
  { offset: [0.02, 0.0012, -0.08], yaw: 0.1, variant: 2 },
];

function MathSheet({ offset, yaw, variant }: (typeof SHEETS)[number]) {
  const draw = useMemo(() => mathDraw(variant), [variant]);
  const map = useCanvasTexture(draw, 300, 420);
  return (
    <mesh position={offset} rotation={[-Math.PI / 2, 0, yaw]} receiveShadow>
      <planeGeometry args={[0.14, 0.196]} />
      <meshStandardMaterial map={map} roughness={0.9} />
    </mesh>
  );
}

/** A few sheets of calculation paper fanned out under the green notebook. */
export function MathPapers() {
  return (
    <group position={NOTEBOOK_POS}>
      {SHEETS.map((s) => (
        <MathSheet key={s.variant} {...s} />
      ))}
    </group>
  );
}
