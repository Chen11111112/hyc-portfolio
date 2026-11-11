"use client";

import { useTexture } from "@react-three/drei";
import { useCallback } from "react";
import { SRGBColorSpace, type Texture } from "three";
import { CERTIFICATES, COMPETITIONS, VOLUNTEER_BOARD, type Certificate } from "@/lib/roomContent";
import { rng, type Vec3 } from "../layout";
import { useCanvasTexture, type Draw } from "./canvasTexture";
import { Box, Cyl } from "./primitives";
import { SKIS_CX } from "./Skis";
import SafeSuspense from "./SafeSuspense";

// Back-wall additions: certificate frames above the bookshelf, a corkboard between the bookshelf and
// the pegboard, a whiteboard right of the monitor, and a ski-resort trail map behind the skis. World coords.

const SANS = "Helvetica, Arial, sans-serif";

/* ------------------------------ Certificates ------------------------------ */

/** 田 grid (2×2) above the trophy shelf and corkboard; picture area at the certificates' 1.3 : 1. */
const CERT_PIC = { w: 0.286, h: 0.286 / 1.3 };
const CERT_GAP = 0.02;
const CERT_W = CERT_PIC.w + 0.03;
const CERT_H = CERT_PIC.h + 0.03;
/**
 * Grid sits ~0.13 m off the side wall and runs right toward the corkboard; bottom row clear of the
 * trophies (tops ≈ 1.85 m), top row level with the top of the window, short of the poster row (x 0.75).
 */
const CERT_GRID_W = CERT_W * 2 + CERT_GAP;
export const CERT_GRID = { cx: -0.08 + CERT_GRID_W / 2, cy: 1.9 + CERT_H + CERT_GAP / 2, w: CERT_GRID_W, h: CERT_H * 2 + CERT_GAP };
export const CERT_FRAME = {
  w: CERT_W,
  h: CERT_H,
  /** Row-major: top-left, top-right, bottom-left, bottom-right. */
  pos: CERTIFICATES.map((_, i) => [
    CERT_GRID.cx + (i % 2 === 0 ? -1 : 1) * (CERT_W + CERT_GAP) / 2,
    CERT_GRID.cy + (i < 2 ? 1 : -1) * (CERT_H + CERT_GAP) / 2,
  ]),
};

function certDraw(c: Certificate): Draw {
  return (ctx, w, h) => {
    const accent = c.accent ?? "#1f3b6e";
    ctx.fillStyle = "#fbfaf6";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, w - 60, h - 60);
    ctx.textAlign = "center";
    ctx.fillStyle = "#555";
    ctx.font = `600 20px ${SANS}`;
    ctx.fillText(c.issuer, w / 2, 84);
    ctx.fillStyle = accent;
    ctx.font = `bold 58px ${SANS}`;
    ctx.fillText(c.name, w / 2, 168);
    ctx.fillStyle = "#333";
    ctx.font = `26px ${SANS}`;
    ctx.fillText(c.title, w / 2, 216);
    ctx.font = `italic 34px ${SANS}`;
    ctx.fillStyle = "#111";
    ctx.fillText("Hung Yu Chen", w / 2, 290);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(w - 96, h - 92, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(84, h - 74);
    ctx.lineTo(260, h - 74);
    ctx.stroke();
  };
}

function CertPicture({ map }: { map: Texture }) {
  return (
    <mesh position={[0, 0, 0.0235]}>
      <planeGeometry args={[CERT_PIC.w, CERT_PIC.h]} />
      <meshStandardMaterial map={map} roughness={0.5} />
    </mesh>
  );
}

/** Drawn certificate: used when there is no scan, and while a scan loads. */
function DrawnCertificate({ index }: { index: number }) {
  const c = CERTIFICATES[index];
  const draw = useCallback<Draw>((ctx, w, h) => certDraw(c)(ctx, w, h), [c]);
  return <CertPicture map={useCanvasTexture(draw, 520, 400)} />;
}

/** The real certificate scan, via Next's image optimizer (keeps the text legible, ~10x smaller). */
function ScannedCertificate({ src }: { src: string }) {
  const map = useTexture(`/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75`, (t) => {
    (Array.isArray(t) ? t : [t]).forEach((tex) => {
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = 8;
    });
  });
  return <CertPicture map={map} />;
}

/** One framed certificate at its 田-grid cell on the back wall. */
export function Certificate({ index }: { index: number }) {
  return (
    <group position={[CERT_FRAME.pos[index][0], CERT_FRAME.pos[index][1], 0]}>
      <CertificateArt index={index} />
    </group>
  );
}

/** A framed certificate centred on the origin (back of the frame at z = 0), size CERT_FRAME.w × h. */
export function CertificateArt({ index }: { index: number }) {
  const { w, h } = CERT_FRAME;
  const src = CERTIFICATES[index].src;
  return (
    <group>
      <Box size={[w, h, 0.018]} position={[0, 0, 0.009]} color="#2a2420" roughness={0.45} />
      <Box size={[w - 0.012, h - 0.012, 0.004]} position={[0, 0, 0.0195]} color="#f4f2ec" roughness={0.9} cast={false} />
      {src ? (
        <SafeSuspense fallback={<DrawnCertificate index={index} />}>
          <ScannedCertificate src={src} />
        </SafeSuspense>
      ) : (
        <DrawnCertificate index={index} />
      )}
    </group>
  );
}

/* ------------------------- Corkboard (志工經歷) ------------------------- */

export const CORK = { x: 0.52, y: 1.57, w: 0.4, h: 0.44 };
const HAND = `"PingFang TC", "Heiti TC", "Microsoft JhengHei", "Bradley Hand", cursive`;

const drawCork: Draw = (ctx, w, h) => {
  ctx.fillStyle = "#c69c6d";
  ctx.fillRect(0, 0, w, h);
  const rand = rng(5);
  for (let i = 0; i < 2600; i += 1) {
    ctx.fillStyle = rand() > 0.5 ? "rgba(120,80,40,0.25)" : "rgba(240,210,170,0.25)";
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2);
  }
};

function noteDraw(text: string, color: string): Draw {
  return (ctx, w) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, w);
    ctx.fillStyle = "#2b2b2b";
    ctx.font = `bold 21px ${HAND}`;
    ctx.textAlign = "center";
    const lines = text.split("\n");
    lines.forEach((line, i) => ctx.fillText(line, w / 2, w / 2 - (lines.length - 1) * 13 + i * 27 + 6));
  };
}

const drawThanks: Draw = (ctx, w, h) => {
  const t = VOLUNTEER_BOARD.thanks;
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#b8862b";
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.fillStyle = "#8a1f1f";
  ctx.textAlign = "center";
  ctx.font = `bold 30px ${HAND}`;
  ctx.fillText(t.title, w / 2, 58);
  ctx.fillStyle = "#333";
  ctx.font = `18px ${HAND}`;
  ctx.fillText("Hung Yu Chen", w / 2, 96);
  ctx.fillText(`${t.from}  ${t.year}`, w / 2, h - 30);
  ctx.fillStyle = "#c23b2a";
  ctx.beginPath();
  ctx.arc(w - 46, h - 58, 16, 0, Math.PI * 2);
  ctx.fill();
};

const drawBadge: Draw = (ctx, w, h) => {
  const b = VOLUNTEER_BOARD.badge;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#2f8f5b";
  ctx.fillRect(0, 0, w, 40);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = `bold 22px ${HAND}`;
  ctx.fillText("VOLUNTEER", w / 2, 28);
  ctx.fillStyle = "#222";
  ctx.font = `bold 34px ${HAND}`;
  ctx.fillText(b.title, w / 2, 96);
  ctx.font = `15px ${HAND}`;
  ctx.fillText(b.org, w / 2, h - 18);
};

function Pin({ position, color }: { position: Vec3; color: string }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[0.006, 10, 8]} />
      <meshStandardMaterial color={color} roughness={0.3} />
    </mesh>
  );
}

function Note({ index }: { index: number }) {
  const n = VOLUNTEER_BOARD.notes[index];
  const draw = useCallback<Draw>((ctx, w, h) => noteDraw(n.text, n.color)(ctx, w, h), [n]);
  const map = useCanvasTexture(draw, 180, 180);
  const spots: [number, number, number][] = [
    [-0.12, 0.11, 0.06],
    [0.0, 0.12, -0.05],
    [0.12, 0.1, 0.04],
  ];
  const [x, y, tilt] = spots[index % spots.length];
  return (
    <group position={[x, y, 0.016]} rotation={[0, 0, tilt]}>
      <mesh>
        <planeGeometry args={[0.095, 0.095]} />
        <meshStandardMaterial map={map} roughness={0.85} />
      </mesh>
      <Pin position={[0, 0.038, 0.004]} color="#d64545" />
    </group>
  );
}

export function CorkBoard() {
  const cork = useCanvasTexture(drawCork, 256, 280);
  const thanks = useCanvasTexture(drawThanks, 320, 200);
  const badge = useCanvasTexture(drawBadge, 160, 200);
  return (
    <group position={[CORK.x, CORK.y, 0]}>
      <Box size={[CORK.w + 0.03, CORK.h + 0.03, 0.02]} position={[0, 0, 0.01]} color="#a37a4f" roughness={0.6} />
      <mesh position={[0, 0, 0.0205]} receiveShadow>
        <planeGeometry args={[CORK.w, CORK.h]} />
        <meshStandardMaterial map={cork} roughness={0.95} />
      </mesh>
      <group position={[0, 0, 0.006]}>
        {VOLUNTEER_BOARD.notes.map((n, i) => (
          <Note key={n.text} index={i} />
        ))}
        {/* Thank-you certificate. */}
        <group position={[-0.06, -0.1, 0.016]} rotation={[0, 0, -0.03]}>
          <mesh>
            <planeGeometry args={[0.2, 0.125]} />
            <meshStandardMaterial map={thanks} roughness={0.7} />
          </mesh>
          <Pin position={[-0.088, 0.052, 0.004]} color="#2f6fd6" />
          <Pin position={[0.088, 0.052, 0.004]} color="#2f6fd6" />
        </group>
        {/* Volunteer badge on a lanyard, hung from a pin. */}
        <group position={[0.13, -0.06, 0.018]} rotation={[0, 0, 0.06]}>
          <Box size={[0.012, 0.09, 0.002]} position={[-0.018, 0.075, 0]} rotation={[0, 0, -0.25]} color="#2f8f5b" cast={false} />
          <Box size={[0.012, 0.09, 0.002]} position={[0.018, 0.075, 0]} rotation={[0, 0, 0.25]} color="#2f8f5b" cast={false} />
          <mesh>
            <planeGeometry args={[0.07, 0.0875]} />
            <meshStandardMaterial map={badge} roughness={0.4} />
          </mesh>
          <Pin position={[0, 0.118, 0.004]} color="#f2c230" />
        </group>
      </group>
    </group>
  );
}

/* --------------------------- Trophy shelf (競賽經歷) --------------------------- */

/** Third board above the bookshelf, under the certificate row. World coords. */
export const TROPHY_SHELF = { x0: -0.2, w: 0.5, d: 0.17, y: 1.6, t: 0.018 };

const METAL: Record<string, string> = { gold: "#d4af37", silver: "#c0c4c8", bronze: "#b0763f" };

function plaqueDraw(event: string, result: string): Draw {
  return (ctx, w, h) => {
    ctx.fillStyle = "#c9a24a";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#2b2412";
    ctx.textAlign = "center";
    ctx.font = `bold 30px ${SANS}`;
    ctx.fillText(result, w / 2, h * 0.48);
    ctx.font = `15px ${SANS}`;
    const short = event.length > 18 ? `${event.slice(0, 17)}…` : event;
    ctx.fillText(short, w / 2, h * 0.82);
  };
}

function Plaque({ event, result, width, position }: { event: string; result: string; width: number; position: Vec3 }) {
  const draw = useCallback<Draw>((ctx, w, h) => plaqueDraw(event, result)(ctx, w, h), [event, result]);
  const map = useCanvasTexture(draw, 256, 96);
  return (
    <mesh position={position}>
      <planeGeometry args={[width, width * (96 / 256)]} />
      <meshStandardMaterial map={map} roughness={0.35} metalness={0.4} />
    </mesh>
  );
}

function Trophy({ x, height, metal, event, result }: { x: number; height: number; metal: string; event: string; result: string }) {
  const m = { color: METAL[metal], roughness: 0.22, metalness: 0.95 };
  const z = TROPHY_SHELF.d / 2 + 0.01;
  const baseH = height * 0.22;
  const stemH = height * 0.28;
  const cupH = height * 0.4;
  return (
    <group position={[x, TROPHY_SHELF.y, z]}>
      <Box size={[0.075, baseH, 0.06]} position={[0, baseH / 2, 0]} color="#3a2a1e" roughness={0.5} />
      <Plaque event={event} result={result} width={0.066} position={[0, baseH / 2, 0.0305]} />
      <Cyl r={0.012} rTop={0.008} h={stemH} position={[0, baseH + stemH / 2, 0]} {...m} />
      <Cyl r={0.014} rTop={0.038} h={cupH} seg={28} position={[0, baseH + stemH + cupH / 2, 0]} {...m} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.04, baseH + stemH + cupH * 0.6, 0]} rotation={[0, 0, s * Math.PI / 2]} castShadow>
          <torusGeometry args={[0.014, 0.003, 8, 16, Math.PI]} />
          <meshStandardMaterial {...m} />
        </mesh>
      ))}
    </group>
  );
}

/** Medal hanging from the shelf's front edge on a V ribbon. */
function Medal({ x, metal, ribbon }: { x: number; metal: string; ribbon: string }) {
  const y = TROPHY_SHELF.y - TROPHY_SHELF.t;
  const z = TROPHY_SHELF.d + 0.006;
  return (
    <group position={[x, y, z]}>
      <Box size={[0.012, 0.06, 0.001]} position={[-0.008, -0.028, 0]} rotation={[0, 0, -0.25]} color={ribbon} roughness={0.7} cast={false} />
      <Box size={[0.012, 0.06, 0.001]} position={[0.008, -0.028, 0]} rotation={[0, 0, 0.25]} color={ribbon} roughness={0.7} cast={false} />
      <Cyl r={0.022} h={0.004} seg={28} position={[0, -0.075, 0.002]} rotation={[Math.PI / 2, 0, 0]} color={METAL[metal]} roughness={0.25} metalness={0.95} />
    </group>
  );
}

export function TrophyShelf() {
  const trophies = COMPETITIONS.filter((c) => c.place !== 4 && c.place !== "honor");
  const medals = COMPETITIONS.filter((c) => c.place === 4 || c.place === "honor");
  const metalFor = (p: (typeof COMPETITIONS)[number]["place"]) => (p === 1 ? "gold" : p === 2 ? "silver" : "bronze");
  const heightFor = (p: (typeof COMPETITIONS)[number]["place"]) => (p === 1 ? 0.25 : p === 2 ? 0.215 : 0.19);
  const { x0, w, d, y, t } = TROPHY_SHELF;
  return (
    <group>
      <Box size={[w, t, d]} position={[x0 + w / 2, y - t / 2, 0.012 + d / 2]} color="#e4d3b4" roughness={0.74} />
      {trophies.map((c, i) => (
        <Trophy
          key={c.event}
          x={x0 + 0.06 + i * ((w - 0.12) / Math.max(1, trophies.length - 1))}
          height={heightFor(c.place)}
          metal={metalFor(c.place)}
          event={c.event}
          result={c.result}
        />
      ))}
      {medals.map((c, i) => (
        <Medal
          key={c.event}
          x={x0 + 0.12 + i * 0.13}
          metal={c.place === 4 ? "bronze" : "silver"}
          ribbon={c.place === 4 ? "#c8102e" : "#2f5aa8"}
        />
      ))}
    </group>
  );
}

/* -------------------------------- Trail map ------------------------------- */

const drawTrailMap: Draw = (ctx, w, h) => {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.4);
  sky.addColorStop(0, "#5b8fd6");
  sky.addColorStop(1, "#cfe2f6");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // Mountains.
  ctx.fillStyle = "#e9f1f8";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.55);
  ctx.lineTo(w * 0.22, h * 0.25);
  ctx.lineTo(w * 0.42, h * 0.4);
  ctx.lineTo(w * 0.62, h * 0.16);
  ctx.lineTo(w * 0.85, h * 0.36);
  ctx.lineTo(w, h * 0.3);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();
  // Forest patches.
  const rand = rng(9);
  ctx.fillStyle = "#4f7d55";
  for (let i = 0; i < 260; i += 1) {
    const x = rand() * w;
    const y = h * (0.5 + rand() * 0.4);
    if (Math.abs(x - w * 0.5) < w * 0.08) continue;
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x - 4, y + 4);
    ctx.lineTo(x + 4, y + 4);
    ctx.fill();
  }
  // Runs (green / red / black) from the peaks down.
  const run = (pts: [number, number][], color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h)));
    ctx.stroke();
  };
  run([[0.62, 0.17], [0.55, 0.4], [0.48, 0.62], [0.45, 0.88]], "#2f9a4a");
  run([[0.62, 0.17], [0.7, 0.42], [0.66, 0.7], [0.6, 0.9]], "#d33b3b");
  run([[0.22, 0.26], [0.26, 0.5], [0.3, 0.75], [0.38, 0.9]], "#1b1b1b");
  run([[0.85, 0.37], [0.82, 0.6], [0.78, 0.88]], "#2f6fd6");
  // Lifts.
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  for (const [a, b] of [
    [[0.5, 0.9], [0.62, 0.18]],
    [[0.34, 0.9], [0.22, 0.27]],
  ] as [number, number][][]) {
    ctx.beginPath();
    ctx.moveTo(a[0] * w, a[1] * h);
    ctx.lineTo(b[0] * w, b[1] * h);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // Title band + legend.
  ctx.fillStyle = "rgba(20,30,50,0.85)";
  ctx.fillRect(0, 0, w, 64);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = `bold 30px ${SANS}`;
  ctx.fillText("TRAIL MAP", w / 2, 42);
  ctx.textAlign = "left";
  ctx.font = `14px ${SANS}`;
  [
    ["#2f9a4a", "Beginner"],
    ["#d33b3b", "Intermediate"],
    ["#1b1b1b", "Advanced"],
  ].forEach(([c, t], i) => {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(14, h - 86 + i * 24, 128, 20);
    ctx.fillStyle = c;
    ctx.fillRect(20, h - 80 + i * 24, 12, 8);
    ctx.fillStyle = "#222";
    ctx.fillText(t, 40, h - 71 + i * 24);
  });
};

/** Pinned on the wall directly behind the crossed skis (narrow enough to clear the lower poster row). */
export const TRAIL_MAP = { x: SKIS_CX, y: 1.2, w: 0.42, h: 0.6 };

export function TrailMap() {
  const map = useCanvasTexture(drawTrailMap, 400, 560);
  return (
    <group position={[TRAIL_MAP.x, TRAIL_MAP.y, 0]} rotation={[0, 0, 0.015]}>
      <Box size={[TRAIL_MAP.w + 0.02, TRAIL_MAP.h + 0.02, 0.003]} position={[0, 0, 0.0015]} color="#f7f5ef" roughness={0.8} cast={false} />
      <mesh position={[0, 0, 0.0035]}>
        <planeGeometry args={[TRAIL_MAP.w, TRAIL_MAP.h]} />
        <meshStandardMaterial map={map} roughness={0.6} />
      </mesh>
      {[-1, 1].map((s) => (
        <Cyl key={s} r={0.006} h={0.006} position={[s * (TRAIL_MAP.w / 2 - 0.02), TRAIL_MAP.h / 2 - 0.02, 0.006]} rotation={[Math.PI / 2, 0, 0]} color="#c9a24a" metalness={0.8} roughness={0.3} />
      ))}
    </group>
  );
}

/* -------------------------------- Whiteboard ------------------------------ */

/** Right of the monitor, under the pegboard / poster row, above the speaker. */
export const WHITEBOARD = { x: 1.5, y: 1.145, w: 0.6, h: 0.36 };

/** UI/UX planning board for a Next.js build: wireframes, App Router tree, and a user flow. */
const drawWhiteboard: Draw = (ctx, w, h) => {
  ctx.fillStyle = "#fbfcfd";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(120,130,150,0.05)"; // ghosting from old erased notes
  ctx.fillRect(w * 0.6, h * 0.62, w * 0.3, h * 0.2);
  const hand = `"Bradley Hand", "Segoe Print", "Comic Sans MS", cursive`;
  const marker = (color: string, width = 2.4) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };
  const rect = (x: number, y: number, rw: number, rh: number) => ctx.strokeRect(x, y, rw, rh);
  const line = (x0: number, y0: number, x1: number, y1: number) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };
  const arrow = (x0: number, y0: number, x1: number, y1: number) => {
    line(x0, y0, x1, y1);
    const a = Math.atan2(y1 - y0, x1 - x0);
    line(x1, y1, x1 - 9 * Math.cos(a - 0.45), y1 - 9 * Math.sin(a - 0.45));
    line(x1, y1, x1 - 9 * Math.cos(a + 0.45), y1 - 9 * Math.sin(a + 0.45));
  };

  // Desktop wireframe.
  marker("#222");
  rect(18, 16, 268, 200);
  line(18, 32, 286, 32);
  [26, 36, 46].forEach((x) => {
    ctx.beginPath();
    ctx.arc(x, 24, 3, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.font = `bold 13px ${hand}`;
  ctx.fillText("Hy.C", 28, 50);
  [180, 212, 244].forEach((x) => line(x, 46, x + 22, 46));
  rect(28, 60, 248, 70); // hero
  line(28, 60, 276, 130);
  line(276, 60, 28, 130);
  marker("#1f4fbf", 3);
  line(40, 146, 170, 146);
  marker("#222", 2);
  line(40, 158, 140, 158);
  marker("#1f4fbf", 2.4);
  ctx.beginPath();
  ctx.roundRect(196, 140, 72, 22, 11);
  ctx.stroke();
  marker("#222", 2);
  [28, 112, 196].forEach((x) => {
    rect(x, 172, 76, 36);
    line(x + 8, 198, x + 50, 198);
  });

  // Mobile wireframe + responsive arrow.
  marker("#222");
  ctx.beginPath();
  ctx.roundRect(318, 24, 86, 176, 12);
  ctx.stroke();
  line(348, 32, 374, 32);
  rect(328, 44, 66, 32);
  line(328, 44, 394, 76);
  [88, 112, 136, 160].forEach((y) => {
    rect(328, y, 18, 16);
    line(352, y + 8, 392, y + 8);
  });
  line(318, 182, 404, 182);
  marker("#d23b3b", 2.4);
  arrow(288, 110, 314, 110);
  ctx.font = `14px ${hand}`;
  ctx.fillText("responsive", 290, 222);

  // Next.js App Router tree.
  marker("#111", 2.6);
  ctx.font = `bold 28px ${hand}`;
  ctx.fillText("Next.js", 428, 44);
  marker("#2f9a4a", 2);
  ctx.font = `15px ${hand}`;
  ["app/", "├ layout.tsx", "├ page.tsx", "└ projects/[id]/", "     page.tsx"].forEach((t, i) => ctx.fillText(t, 430, 74 + i * 20));
  marker("#1f4fbf", 2);
  ctx.font = `15px ${hand}`;
  ["RSC ✓   SSG ✓", "next/image ✓"].forEach((t, i) => ctx.fillText(t, 430, 186 + i * 20));

  // User flow along the bottom.
  marker("#d23b3b", 2.6);
  ctx.font = `bold 16px ${hand}`;
  ctx.fillText("UI/UX flow", 22, 252);
  marker("#222", 2.2);
  ctx.font = `15px ${hand}`;
  const steps = ["Home", "Projects", "Detail"];
  steps.forEach((t, i) => {
    const x = 130 + i * 150;
    rect(x, 236, 92, 34);
    ctx.fillText(t, x + 14, 258);
    if (i < steps.length - 1) arrow(x + 96, 253, x + 146, 253);
  });
  marker("#2f9a4a", 2);
  ctx.font = `13px ${hand}`;
  ctx.fillText("click card → modal", 300, 300);
  ctx.beginPath();
  ctx.arc(w - 40, h - 42, 18, 0, Math.PI * 2); // a little smiley
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w - 40, h - 40, 9, 0.2, Math.PI - 0.2);
  ctx.stroke();
};

export function Whiteboard() {
  const map = useCanvasTexture(drawWhiteboard, 600, 360);
  const { w, h } = WHITEBOARD;
  const alu = { color: "#c9ccd0", roughness: 0.3, metalness: 0.8 };
  return (
    <group position={[WHITEBOARD.x, WHITEBOARD.y, 0]}>
      <Box size={[w + 0.024, h + 0.024, 0.016]} position={[0, 0, 0.008]} {...alu} />
      <mesh position={[0, 0, 0.0165]} receiveShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={map} roughness={0.25} />
      </mesh>
      {/* Marker tray with two markers and an eraser. */}
      <Box size={[w * 0.6, 0.012, 0.04]} position={[0, -h / 2 - 0.016, 0.026]} {...alu} />
      {[
        { x: -0.1, c: "#1f4fbf" },
        { x: -0.04, c: "#d23b3b" },
      ].map((m) => (
        <Cyl key={m.x} r={0.007} h={0.12} position={[m.x, -h / 2 - 0.003, 0.03]} rotation={[0, 0, Math.PI / 2]} color={m.c} roughness={0.4} />
      ))}
      <Box size={[0.1, 0.022, 0.035]} position={[0.1, -h / 2 + 0.001, 0.028]} color="#2b2c30" roughness={0.6} />
    </group>
  );
}
