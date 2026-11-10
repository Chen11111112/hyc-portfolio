"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, ExtrudeGeometry, RepeatWrapping, Shape, SRGBColorSpace } from "three";
import { SHEET_CAB_CX, type Vec3 } from "../layout";
import { Cyl } from "./primitives";

// Bladeless tower purifier fan (Dyson-style): tall narrow stadium-shaped loop on a tapered dark neck,
// perforated silver base band, dark nickel foot. ~1.05 m tall.
export const BASE_R = 0.115;
/** On the floor in front of the LEGO piano (which sits on the sheet cabinet). */
export const FAN_POS: Vec3 = [SHEET_CAB_CX + 0.24, 0, 0.95];
export const FAN_YAW = -0.45;
const FOOT_H = 0.04;
const MESH_H = 0.2;
const NECK_H = 0.075;
const LOOP_W = 0.23;
const LOOP_H = 0.72;
const LOOP_WALL = 0.05; // ring thickness seen from the front
const LOOP_D = 0.08; // front-to-back depth

const NICKEL = { color: "#3b3d42", roughness: 0.28, metalness: 0.85 };
const SILVER = { color: "#c8ccd1", roughness: 0.3, metalness: 0.8 };

/** Stadium (rounded-rectangle with semicircular ends) centred on the origin. */
function stadium(w: number, h: number) {
  const r = w / 2;
  const s = new Shape();
  s.moveTo(-r, -h / 2 + r);
  s.lineTo(-r, h / 2 - r);
  s.absarc(0, h / 2 - r, r, Math.PI, 0, true);
  s.lineTo(r, -h / 2 + r);
  s.absarc(0, -h / 2 + r, r, 0, Math.PI, true);
  return s;
}

function useLoopGeometry() {
  const geo = useMemo(() => {
    const outer = stadium(LOOP_W, LOOP_H);
    const inner = stadium(LOOP_W - LOOP_WALL * 2, LOOP_H - LOOP_WALL * 2);
    outer.holes.push(inner);
    const g = new ExtrudeGeometry(outer, {
      depth: LOOP_D - 0.012,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.006,
      bevelSegments: 3,
      curveSegments: 40,
    });
    g.translate(0, 0, -(LOOP_D - 0.012) / 2);
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}

/** Perforated-metal look for the intake band: dark holes on a silver ground, tiled around the base. */
function usePerforation() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#c9cdd2";
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = "#55595f";
      for (const [x, y] of [
        [8, 8],
        [24, 8],
        [16, 24],
        [0, 24],
        [32, 24],
      ]) {
        ctx.beginPath();
        ctx.arc(x, y, 4.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(40, 13);
    t.anisotropy = 4;
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

export default function DysonFan() {
  const loop = useLoopGeometry();
  const perf = usePerforation();
  const meshY0 = FOOT_H + 0.008;
  const neckY0 = meshY0 + MESH_H + 0.006;
  const loopCy = neckY0 + NECK_H + LOOP_H / 2 - 0.03;
  return (
    <group position={FAN_POS} rotation={[0, FAN_YAW, 0]}>
      {/* Dark nickel foot + thin silver trim. */}
      <Cyl r={BASE_R} h={FOOT_H} position={[0, FOOT_H / 2, 0]} seg={48} {...NICKEL} />
      <Cyl r={BASE_R + 0.001} h={0.008} position={[0, FOOT_H + 0.004, 0]} seg={48} {...SILVER} />
      {/* Perforated intake band. */}
      <mesh position={[0, meshY0 + MESH_H / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[BASE_R, BASE_R, MESH_H, 64, 1, true]} />
        <meshStandardMaterial map={perf} roughness={0.45} metalness={0.6} />
      </mesh>
      <Cyl r={BASE_R + 0.001} h={0.006} position={[0, neckY0 - 0.003, 0]} seg={48} {...SILVER} />
      {/* Tapered neck with the round display. */}
      <Cyl r={BASE_R} rTop={0.055} h={NECK_H} position={[0, neckY0 + NECK_H / 2, 0]} seg={48} {...NICKEL} />
      <mesh position={[0, neckY0 + 0.03, 0.098]} rotation={[-0.45, 0, 0]}>
        <circleGeometry args={[0.014, 24]} />
        <meshStandardMaterial color="#0b0c0e" roughness={0.1} emissive="#2a6b3a" emissiveIntensity={0.25} />
      </mesh>
      {/* Loop amplifier: white faces, silver sides. */}
      <mesh geometry={loop} position={[0, loopCy, 0]} castShadow receiveShadow>
        <meshStandardMaterial attach="material-0" color="#eef0f2" roughness={0.22} metalness={0.15} />
        <meshStandardMaterial attach="material-1" {...SILVER} />
      </mesh>
    </group>
  );
}
