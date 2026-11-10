"use client";

import { useTexture } from "@react-three/drei";
import { Suspense } from "react";
import { SRGBColorSpace } from "three";
import { PEG_H, PEG_W, PEG_X0, PEG_Y0, rng, type Vec3 } from "../layout";
import { Box } from "./primitives";

// Nine posters (public/1.png … 9.png) wrapped around the pegboard photo wall, starting at its left edge:
// a top row of 5 above the pegboard, then a row of 4 beside it at the pegboard's height, running right
// over the guitars.
const SOURCES = Array.from({ length: 9 }, (_, i) => `/${i + 1}.png`);
const SIZE = 0.42;
const GAP = 0.04;
const BORDER = 0.014;
const TOP_START_X = PEG_X0;
const SIDE_START_X = PEG_X0 + PEG_W + 0.07;
const LOW_Y = PEG_Y0 + PEG_H / 2;
const HIGH_Y = LOW_Y + SIZE + GAP;

/** Route through Next's image optimizer: ~30 KB webp at 640px instead of multi-MB PNGs. */
function optimized(src: string) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=640&q=75`;
}

function PosterArt({ src }: { src: string }) {
  const map = useTexture(optimized(src), (t) => {
    (Array.isArray(t) ? t : [t]).forEach((tex) => (tex.colorSpace = SRGBColorSpace));
  });
  return (
    <mesh position={[0, 0, 0.0021]} receiveShadow>
      <planeGeometry args={[SIZE - BORDER * 2, SIZE - BORDER * 2]} />
      <meshStandardMaterial map={map} roughness={0.55} />
    </mesh>
  );
}

const LAYOUT = (() => {
  const rand = rng(17);
  return SOURCES.map((src, i) => {
    const top = i < 5;
    const x0 = top ? TOP_START_X : SIDE_START_X;
    const col = top ? i : i - 5;
    return {
      src,
      position: [
        x0 + SIZE / 2 + col * (SIZE + GAP) + (rand() - 0.5) * 0.02,
        (top ? HIGH_Y : LOW_Y) + (rand() - 0.5) * 0.02,
        0.002,
      ] as Vec3,
      tilt: (rand() - 0.5) * 0.04,
    };
  });
})();

export default function Posters() {
  return (
    <group>
      {LAYOUT.map((p) => (
        <group key={p.src} position={p.position} rotation={[0, 0, p.tilt]}>
          <Box size={[SIZE, SIZE, 0.002]} color="#f7f5ef" roughness={0.8} cast={false} />
          <Suspense fallback={null}>
            <PosterArt src={p.src} />
          </Suspense>
          {/* Masking tape on the top corners. */}
          {[-1, 1].map((s) => (
            <Box
              key={s}
              size={[0.07, 0.02, 0.001]}
              position={[s * (SIZE / 2 - 0.012), SIZE / 2 - 0.004, 0.0035]}
              rotation={[0, 0, s * -0.6]}
              color="#efe4c4"
              roughness={0.9}
              cast={false}
            />
          ))}
        </group>
      ))}
    </group>
  );
}
