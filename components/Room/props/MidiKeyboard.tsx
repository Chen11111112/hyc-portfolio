"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Euler, Matrix4, Object3D, Vector3, type InstancedMesh } from "three";
import { Box } from "./primitives";

// 88-key MIDI controller (A0–C8: 52 white, 36 black), stored upright on its bass end against the wall
// (no stand), keys facing the room. Modelled lying flat — length along x, keys on top — then stood up.
const MIDI_X1 = 0; // treble end (flat model)
const WHITE = 52;
const KEY_PITCH = 0.0235;
const KEYS_W = WHITE * KEY_PITCH;
const CHEEK = 0.04;
const MIDI_X0 = MIDI_X1 - KEYS_W - CHEEK * 2; // bass end
/** Footprint along the wall once stood up (the keyboard's depth). */
export const MIDI_WALL_W = 0.3;
const CX = (MIDI_X0 + MIDI_X1) / 2;
const Z0 = 0; // back edge
const DEPTH = 0.3;
const Y = 0; // underside of the keyboard body
const BODY_H = 0.07;
const KEYS_Z0 = Z0 + DEPTH - 0.15; // keys occupy the front 15 cm
const KEY_TOP = Y + BODY_H - 0.012;

// From A: sharps follow A, C, D, F, G (k mod 7 = 0, 2, 3, 5, 6).
const HAS_SHARP = new Set([0, 2, 3, 5, 6]);
const BLACK = Array.from({ length: WHITE - 1 }, (_, i) => i).filter((i) => HAS_SHARP.has(i % 7));

const BODY = { color: "#1d1e21", roughness: 0.45, metalness: 0.2 };

function Keys() {
  const white = useRef<InstancedMesh>(null);
  const black = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const dummy = new Object3D();
    const keysX0 = MIDI_X0 + CHEEK;
    if (white.current) {
      for (let i = 0; i < WHITE; i += 1) {
        dummy.position.set(keysX0 + KEY_PITCH * (i + 0.5), KEY_TOP + 0.009, KEYS_Z0 + 0.075);
        dummy.updateMatrix();
        white.current.setMatrixAt(i, dummy.matrix);
      }
      white.current.instanceMatrix.needsUpdate = true;
    }
    if (black.current) {
      BLACK.forEach((i, n) => {
        dummy.position.set(keysX0 + KEY_PITCH * (i + 1), KEY_TOP + 0.022, KEYS_Z0 + 0.045);
        dummy.updateMatrix();
        black.current!.setMatrixAt(n, dummy.matrix);
      });
      black.current.instanceMatrix.needsUpdate = true;
    }
  }, []);
  return (
    <group>
      <instancedMesh ref={white} args={[undefined, undefined, WHITE]} castShadow receiveShadow>
        <boxGeometry args={[KEY_PITCH - 0.0012, 0.018, 0.15]} />
        <meshStandardMaterial color="#f4f3ef" roughness={0.35} />
      </instancedMesh>
      <instancedMesh ref={black} args={[undefined, undefined, BLACK.length]} castShadow>
        <boxGeometry args={[KEY_PITCH * 0.56, 0.014, 0.09]} />
        <meshStandardMaterial color="#111113" roughness={0.3} />
      </instancedMesh>
    </group>
  );
}

function FlatKeyboard() {
  return (
    <group>
      {/* Body: raised control panel behind the keys, low key bed in front. */}
      <Box size={[KEYS_W + CHEEK * 2, BODY_H, KEYS_Z0 - Z0]} position={[CX, Y + BODY_H / 2, (Z0 + KEYS_Z0) / 2]} {...BODY} />
      <Box size={[KEYS_W + CHEEK * 2, BODY_H - 0.03, 0.15]} position={[CX, Y + (BODY_H - 0.03) / 2, KEYS_Z0 + 0.075]} {...BODY} />
      {[MIDI_X0 + CHEEK / 2, MIDI_X1 - CHEEK / 2].map((x) => (
        <Box key={x} size={[CHEEK, BODY_H + 0.006, 0.15]} position={[x, Y + (BODY_H + 0.006) / 2, KEYS_Z0 + 0.075]} {...BODY} />
      ))}
      <Keys />
      {/* Control panel: screen, knobs, faders, pitch/mod wheels. */}
      <Box size={[0.12, 0.002, 0.05]} position={[CX - 0.25, Y + BODY_H + 0.001, Z0 + 0.075]} color="#3d8bd9" emissive="#2a6fb8" emissiveIntensity={0.6} cast={false} />
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[CX + 0.05 + i * 0.035, Y + BODY_H + 0.006, Z0 + 0.06]} castShadow>
          <cylinderGeometry args={[0.009, 0.01, 0.012, 14]} />
          <meshStandardMaterial color="#2f3034" roughness={0.4} />
        </mesh>
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <Box key={`f${i}`} size={[0.008, 0.004, 0.04]} position={[CX + 0.42 + i * 0.024, Y + BODY_H + 0.002, Z0 + 0.075]} color="#5b5d62" cast={false} />
      ))}
      {[0, 1].map((i) => (
        <Box key={`w${i}`} size={[0.014, 0.03, 0.05]} position={[MIDI_X0 + 0.012 + i * 0.016, Y + BODY_H + 0.01, Z0 + 0.09]} color="#3a3b3f" roughness={0.5} />
      ))}
    </group>
  );
}

// Stand it up: length (x) → up (y), underside (y) → wall-normal (z, against the wall), depth (z) → along
// the wall (x). makeBasis takes where each local axis lands.
const STAND_UP = new Euler().setFromRotationMatrix(
  new Matrix4().makeBasis(new Vector3(0, 1, 0), new Vector3(0, 0, 1), new Vector3(1, 0, 0)),
);

/** Base sits this far off the wall so the keyboard clears the window frame and rests on the sill. */
const BASE_Z = 0.12;
/** Lean of the top toward the wall (rad). */
const LEAN = 0.045;

/** `x` is the edge nearest the window (side-wall-local); the keyboard extends toward −x. */
export default function MidiKeyboard({ x }: { x: number }) {
  const shift = useMemo<[number, number, number]>(() => [-MIDI_X0, -Y, -Z0], []);
  return (
    <group position={[x - MIDI_WALL_W, 0.004, BASE_Z]} rotation={[-LEAN, 0, 0]}>
      <group rotation={STAND_UP}>
        <group position={shift}>
          <FlatKeyboard />
        </group>
      </group>
    </group>
  );
}
