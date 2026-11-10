"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { rng } from "../layout";

// Sheet music on the marimba's stand: Eric Sammut, "4 Rotations Pour Marimba — Rotation 4".
// The title block is real; the notation is procedurally drawn (grand-staff systems with beamed
// notes and slurs), not a copy of the published score.
const W = 600;
const H = 820;
const INK = "#1c1c1c";

function staff(ctx: CanvasRenderingContext2D, x0: number, x1: number, top: number, gap: number) {
  ctx.strokeStyle = "#3a3a3a";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x0, top + i * gap);
    ctx.lineTo(x1, top + i * gap);
    ctx.stroke();
  }
}

/** One grand-staff system: brace, treble + bass staves, barlines, beamed note groups and a slur. */
function system(ctx: CanvasRenderingContext2D, rand: () => number, x0: number, x1: number, top: number) {
  const gap = 7;
  const trebleTop = top;
  const bassTop = top + 70;
  staff(ctx, x0, x1, trebleTop, gap);
  staff(ctx, x0, x1, bassTop, gap);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  // Brace + system barline.
  ctx.beginPath();
  ctx.moveTo(x0, trebleTop);
  ctx.lineTo(x0, bassTop + gap * 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x0 - 6, trebleTop);
  ctx.quadraticCurveTo(x0 - 14, (trebleTop + bassTop + gap * 4) / 2, x0 - 6, bassTop + gap * 4);
  ctx.stroke();
  // Clefs (stylised).
  ctx.fillStyle = INK;
  ctx.font = "bold 30px serif";
  ctx.fillText("𝄞", x0 + 4, trebleTop + gap * 4 + 2);
  ctx.font = "bold 24px serif";
  ctx.fillText("𝄢", x0 + 6, bassTop + gap * 3);
  const bars = 2;
  const barW = (x1 - x0 - 40) / bars;
  for (let b = 0; b < bars; b += 1) {
    const bx = x0 + 40 + b * barW;
    for (const t of [trebleTop, bassTop]) {
      ctx.beginPath();
      ctx.moveTo(bx + barW, t);
      ctx.lineTo(bx + barW, t + gap * 4);
      ctx.stroke();
    }
    // Treble: two beamed groups of four sixteenths.
    for (let g = 0; g < 2; g += 1) {
      const gx = bx + 10 + g * (barW / 2);
      const heads: [number, number][] = [];
      for (let n = 0; n < 4; n += 1) {
        const hx = gx + n * (barW / 10);
        const hy = trebleTop + gap * (4 - Math.floor(rand() * 9) / 2);
        heads.push([hx, hy]);
        ctx.beginPath();
        ctx.ellipse(hx, hy, 3.6, 2.6, -0.4, 0, Math.PI * 2);
        ctx.fill();
        if (rand() > 0.75) ctx.fillText("♭", hx - 11, hy + 4);
      }
      const beamY = Math.min(...heads.map((h) => h[1])) - 22;
      ctx.lineWidth = 1.2;
      heads.forEach(([hx, hy]) => {
        ctx.beginPath();
        ctx.moveTo(hx + 3.3, hy);
        ctx.lineTo(hx + 3.3, beamY);
        ctx.stroke();
      });
      ctx.lineWidth = 3;
      for (const off of [0, 5]) {
        ctx.beginPath();
        ctx.moveTo(heads[0][0] + 3.3, beamY + off);
        ctx.lineTo(heads[3][0] + 3.3, beamY + off);
        ctx.stroke();
      }
      ctx.lineWidth = 1.4;
    }
    // Bass: a low double-stop pair per half bar.
    for (let g = 0; g < 2; g += 1) {
      const hx = bx + 14 + g * (barW / 2);
      for (const dy of [gap * (4 + rand() * 2), gap * (1 + rand())]) {
        ctx.beginPath();
        ctx.ellipse(hx, bassTop + dy, 3.6, 2.6, -0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(hx + 3.3, bassTop + gap);
      ctx.lineTo(hx + 3.3, bassTop - 18);
      ctx.stroke();
    }
    // Slur over the bar.
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx + 8, trebleTop - 26);
    ctx.quadraticCurveTo(bx + barW / 2, trebleTop - 52, bx + barW - 8, trebleTop - 26);
    ctx.stroke();
    ctx.lineWidth = 1.4;
  }
  // Dynamic marking.
  ctx.font = "italic bold 14px serif";
  ctx.fillText(rand() > 0.5 ? "mp" : "mf", x0 + 44, bassTop + gap * 4 + 22);
}

function drawPage(page: 1 | 2) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  ctx.fillStyle = "#f8f6f0";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = INK;
  const rand = rng(page === 1 ? 401 : 402);
  let top = 90;
  if (page === 1) {
    ctx.textAlign = "center";
    ctx.font = "32px Helvetica, Arial, sans-serif";
    ctx.fillText("4 Rotations Pour Marimba", W / 2, 70);
    ctx.font = "26px Helvetica, Arial, sans-serif";
    ctx.fillText("Rotation 4", W / 2, 112);
    ctx.textAlign = "right";
    ctx.font = "16px Helvetica, Arial, sans-serif";
    ctx.fillText("Eric Sammut", W - 40, 142);
    ctx.textAlign = "left";
    ctx.font = "italic 14px serif";
    ctx.fillText("♩= 88", 110, 168);
    ctx.font = "14px Helvetica, Arial, sans-serif";
    ctx.fillText("Marimba", 22, 238);
    top = 210;
  }
  for (let y = top; y + 110 < H - 50; y += 150) system(ctx, rand, 90, W - 30, y);
  ctx.textAlign = "center";
  ctx.font = "13px Helvetica, Arial, sans-serif";
  ctx.fillText(page === 1 ? "" : "- 2 -", W / 2, H - 22);
  return c;
}

export default function ScorePage({ page, width, height }: { page: 1 | 2; width: number; height: number }) {
  const tex = useMemo(() => {
    const t = new CanvasTexture(drawPage(page));
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [page]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={tex} roughness={0.9} />
    </mesh>
  );
}
