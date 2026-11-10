"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { AlwaysStencilFunc, Color, EqualStencilFunc, KeepStencilOp, ReplaceStencilOp, type MeshBasicMaterial } from "three";
import { useNightMix } from "../nightMode";

// Plain blue sky behind the window. Authored in side-wall-local coords (outside is −z).
//
// A stencil "portal" at the window opening marks the pixels seen through it, and the sky plane only
// draws there, so however the camera orbits it can never show up over the wall tops or beside the room.
const STENCIL_REF = 1;
const SKY = new Color("#a9cde8");
const NIGHT_SKY = new Color("#141b33");

export default function SkyView({ opening }: { opening: { x0: number; x1: number; y0: number; y1: number } }) {
  const cx = (opening.x0 + opening.x1) / 2;
  const cy = (opening.y0 + opening.y1) / 2;
  const mat = useRef<MeshBasicMaterial>(null);
  const mix = useNightMix();
  useFrame(() => {
    mat.current?.color.lerpColors(SKY, NIGHT_SKY, mix.current);
  });
  return (
    <group>
      <mesh position={[cx, cy, -0.001]} renderOrder={-10}>
        <planeGeometry args={[opening.x1 - opening.x0, opening.y1 - opening.y0]} />
        <meshBasicMaterial
          colorWrite={false}
          depthWrite={false}
          stencilWrite
          stencilRef={STENCIL_REF}
          stencilFunc={AlwaysStencilFunc}
          stencilZPass={ReplaceStencilOp}
        />
      </mesh>
      <mesh position={[cx, cy, -2]} renderOrder={1}>
        <planeGeometry args={[30, 20]} />
        <meshBasicMaterial
          ref={mat}
          color={SKY}
          toneMapped={false}
          depthWrite={false}
          stencilWrite
          stencilRef={STENCIL_REF}
          stencilFunc={EqualStencilFunc}
          stencilFail={KeepStencilOp}
          stencilZFail={KeepStencilOp}
          stencilZPass={KeepStencilOp}
        />
      </mesh>
    </group>
  );
}
