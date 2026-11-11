"use client";

import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { CanvasTexture, SRGBColorSpace, type Group } from "three";
import type { Story } from "./AboutBooks";

// A pile of six books lying flat, spines toward the viewer — the About page's sidebar.
// Hover nudges a book out; the selected book slides further out and lifts slightly.
const BOOK = { w: 1.7, t: 0.22, d: 1.15 };
const GAP = 0.012;

function spineTexture(title: string, en: string, color: string, index: number) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 132;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, c.width, c.height);
    // Head and tail bands.
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(40, 0, 10, c.height);
    ctx.fillRect(c.width - 50, 0, 10, c.height);
    ctx.fillStyle = "#f3e2b4";
    ctx.textBaseline = "middle";
    ctx.font = `bold 58px "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif`;
    ctx.fillText(title, 96, c.height / 2 + 2);
    ctx.font = `600 30px Helvetica, Arial, sans-serif`;
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(243,226,180,0.8)";
    ctx.fillText(`${String(index + 1).padStart(2, "0")} · ${en.toUpperCase()}`, c.width - 84, c.height / 2 + 2);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function Book({ story, index, count, selected, onSelect }: { story: Story; index: number; count: number; selected: boolean; onSelect: (id: string) => void }) {
  const ref = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const spine = useMemo(() => spineTexture(story.title, story.en, story.color, index), [story, index]);
  useEffect(() => () => spine.dispose(), [spine]);
  // Top of the pile is the first story; small offsets so it reads as a hand-stacked pile.
  const baseY = (count - 1 - index) * (BOOK.t + GAP);
  const jitterX = ((index * 37) % 7) * 0.012 - 0.03;
  const jitterYaw = (((index * 53) % 5) - 2) * 0.012;

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const out = selected ? 0.42 : hovered ? 0.12 : 0;
    const k = Math.min(1, dt * 10);
    g.position.x += (jitterX + out - g.position.x) * k;
    g.position.z += ((selected ? 0.12 : 0) - g.position.z) * k;
    g.position.y += (baseY + (selected ? 0.03 : 0) - g.position.y) * k;
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    setHovered(false);
    document.body.style.cursor = "";
  };

  return (
    <group ref={ref} position={[jitterX, baseY, 0]} rotation={[0, jitterYaw, 0]}>
      <mesh
        onPointerOver={over}
        onPointerOut={out}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(story.id);
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[BOOK.w, BOOK.t, BOOK.d]} />
        {/* Box faces: +x, −x, +y, −y, +z (spine), −z. */}
        <meshStandardMaterial attach="material-0" color="#f1ead8" roughness={0.9} />
        <meshStandardMaterial attach="material-1" color={story.color} roughness={0.6} />
        <meshStandardMaterial attach="material-2" color={story.color} roughness={0.6} />
        <meshStandardMaterial attach="material-3" color={story.color} roughness={0.6} />
        <meshStandardMaterial
          attach="material-4"
          map={spine}
          roughness={0.5}
          emissive={selected || hovered ? "#ffb04a" : "#000000"}
          emissiveIntensity={selected ? 0.12 : 0.06}
        />
        <meshStandardMaterial attach="material-5" color="#f1ead8" roughness={0.9} />
      </mesh>
    </group>
  );
}

export default function BookStack({ stories, active, onSelect }: { stories: Story[]; active: string; onSelect: (id: string) => void }) {
  const height = stories.length * (BOOK.t + GAP);
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      // Framed for the narrow sidebar: whole spines visible, with room on the right for the slide-out.
      camera={{ position: [0.55, height * 0.68, 5.6], fov: 34, near: 0.1, far: 30 }}
      onCreated={({ camera }) => camera.lookAt(0.12, height * 0.42, 0)}
      style={{ width: "100%", height: "100%" }}
    >
      <hemisphereLight args={["#f6f1e8", "#2a2420", 0.9]} />
      <directionalLight position={[3, 5, 4]} intensity={1.4} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <group position={[-0.08, 0, 0]}>
        {stories.map((s, i) => (
          <Book key={s.id} story={s} index={i} count={stories.length} selected={s.id === active} onSelect={onSelect} />
        ))}
        {/* Surface the pile sits on. */}
        <mesh position={[0.2, -BOOK.t / 2 - 0.01, 0]} receiveShadow>
          <boxGeometry args={[2.6, 0.02, 1.6]} />
          <meshStandardMaterial color="#3a2a1f" roughness={0.8} />
        </mesh>
      </group>
    </Canvas>
  );
}
