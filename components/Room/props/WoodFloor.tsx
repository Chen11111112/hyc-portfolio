"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { rng, type Vec3 } from "../layout";

// Light oak plank floor, generated on a canvas: planks ~18 cm × 1.2 m running parallel to the back
// wall (along x), staggered end joints, per-plank tone variation and faint grain.
const PLANK_W = 0.18;
const PLANK_L = 1.2;
const ROWS = 8; // planks across one tile
const TILE_U = PLANK_L * 2.4; // tile length along the planks (m)
const TILE_V = PLANK_W * ROWS; // tile width across the planks (m)
const PX_U = 1024;
const PX_V = 512;

const TONES = ["#dcbc8f", "#d6b585", "#e1c399", "#d2af7f", "#dab98a", "#e4c89f"];
const SEAM = "rgba(120, 88, 52, 0.55)";

function drawPlanks(ctx: CanvasRenderingContext2D) {
  const rand = rng(23);
  const rowH = PX_V / ROWS;
  const plankPx = (PLANK_L / TILE_U) * PX_U;
  for (let r = 0; r < ROWS; r += 1) {
    const y = r * rowH;
    // Stagger each row's joints; wrap so the tile repeats seamlessly along u.
    const offset = rand() * plankPx;
    for (let x = offset - plankPx; x < PX_U; x += plankPx) {
      const tone = TONES[Math.floor(rand() * TONES.length)];
      const draw = (sx: number) => {
        ctx.fillStyle = tone;
        ctx.fillRect(sx, y, plankPx, rowH);
        // Grain: a few long, slightly wavy darker/lighter streaks.
        for (let g = 0; g < 7; g += 1) {
          const gy = y + 3 + rand() * (rowH - 6);
          ctx.strokeStyle = rand() > 0.5 ? "rgba(140,100,60,0.12)" : "rgba(255,240,215,0.14)";
          ctx.lineWidth = 0.6 + rand() * 1.2;
          ctx.beginPath();
          ctx.moveTo(sx, gy);
          ctx.bezierCurveTo(sx + plankPx * 0.3, gy + (rand() - 0.5) * 4, sx + plankPx * 0.7, gy + (rand() - 0.5) * 4, sx + plankPx, gy);
          ctx.stroke();
        }
        // End joint.
        ctx.fillStyle = SEAM;
        ctx.fillRect(sx, y, 1.5, rowH);
      };
      draw(x);
      if (x < 0) draw(x + PX_U);
      if (x + plankPx > PX_U) draw(x - PX_U);
    }
    // Long seam between rows.
    ctx.fillStyle = SEAM;
    ctx.fillRect(0, y, PX_U, 1.5);
  }
}

export default function WoodFloor({ position, size }: { position: Vec3; size: [number, number] }) {
  const map = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = PX_U;
    c.height = PX_V;
    const ctx = c.getContext("2d");
    if (ctx) drawPlanks(ctx);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(size[0] / TILE_U, size[1] / TILE_V);
    t.anisotropy = 8;
    return t;
  }, [size]);
  useEffect(() => () => map.dispose(), [map]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial map={map} roughness={0.72} metalness={0} />
    </mesh>
  );
}
