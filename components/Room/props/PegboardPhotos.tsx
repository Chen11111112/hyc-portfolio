"use client";

import { useTexture } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace, type Texture } from "three";
import { PEG_FACE_Z, PEG_H, PEG_W, PEG_X0, PEG_Y0 } from "../layout";
import { ROOM_PHOTOS } from "../photos";
import { Box, Cyl } from "./primitives";
import SafeSuspense from "./SafeSuspense";

const HOLE = 0.05;
const FRAME_W = 0.086;
const FRAME_H = 0.102;
const PIC = 0.074;

const SKIES: [string, string, string][] = [
  ["#f6c28b", "#f7e3c4", "#5b7d5a"],
  ["#8ec5e8", "#e3f1f8", "#3e6b4f"],
  ["#c9a7d8", "#f5d7c8", "#4f4a6b"],
  ["#7fb6c9", "#dcefe9", "#c9b58a"],
  ["#f2a07b", "#fde2c2", "#7a4e3d"],
  ["#9cc3a0", "#eef3dd", "#4d6a3f"],
  ["#89a7d8", "#f0e6d6", "#2e3d59"],
];

function usePlaceholder(index: number) {
  const tex = useMemo(() => {
    const [sky, haze, land] = SKIES[index % SKIES.length];
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, 128);
      g.addColorStop(0, sky);
      g.addColorStop(0.7, haze);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = "rgba(255,250,235,0.9)";
      ctx.beginPath();
      ctx.arc(30 + ((index * 23) % 70), 38, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = land;
      ctx.beginPath();
      ctx.moveTo(0, 128);
      ctx.lineTo(0, 92);
      ctx.quadraticCurveTo(32, 64 + (index % 3) * 6, 64, 88);
      ctx.quadraticCurveTo(96, 106, 128, 76);
      ctx.lineTo(128, 128);
      ctx.fill();
    }
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, [index]);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

function Picture({ map }: { map: Texture }) {
  return (
    // Polaroid: even margins on top and sides, wider strip at the bottom.
    <mesh position={[0, FRAME_H / 2 - (FRAME_W - PIC) / 2 - PIC / 2, 0.0016]}>
      <planeGeometry args={[PIC, PIC]} />
      <meshStandardMaterial map={map} roughness={0.35} />
    </mesh>
  );
}

function PlaceholderPicture({ index }: { index: number }) {
  return <Picture map={usePlaceholder(index)} />;
}

function LoadedPicture({ src }: { src: string }) {
  const map = useTexture(src, (t) => {
    (Array.isArray(t) ? t : [t]).forEach((tex) => (tex.colorSpace = SRGBColorSpace));
  });
  return <Picture map={map} />;
}

/** Polaroid-style photos hung from pegboard hooks with tiny wooden clips. */
export default function PegboardPhotos() {
  const cx = PEG_X0 + PEG_W / 2;
  const cy = PEG_Y0 + PEG_H / 2;
  return (
    <group position={[cx, cy, PEG_FACE_Z]}>
      {ROOM_PHOTOS.map((photo, i) => {
        const x = photo.col * HOLE;
        const y = photo.row * HOLE;
        const hookY = y + FRAME_H / 2 + 0.012;
        return (
          <group key={`${photo.col},${photo.row}`}>
            {/* Hook peg + clip. */}
            <Cyl r={0.003} h={0.022} seg={8} position={[x, hookY, 0.011]} rotation={[Math.PI / 2, 0, 0]} color="#8f9aa1" metalness={0.8} roughness={0.3} />
            <Box size={[0.012, 0.03, 0.006]} position={[x, hookY - 0.008, 0.02]} color="#d7b98a" roughness={0.7} />
            <group position={[x, y, 0.014]} rotation={[0, 0, photo.tilt]}>
              <Box size={[FRAME_W, FRAME_H, 0.002]} color="#fbfaf6" roughness={0.6} />
              {photo.src ? (
                <SafeSuspense fallback={<PlaceholderPicture index={i} />}>
                  <LoadedPicture src={photo.src} />
                </SafeSuspense>
              ) : (
                <PlaceholderPicture index={i} />
              )}
            </group>
          </group>
        );
      })}
    </group>
  );
}
