"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";

export type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

/** Texture painted once on a canvas. Pass a stable (module-level) `draw` so it is not repainted. */
export function useCanvasTexture(draw: Draw, w: number, h: number) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (ctx) draw(ctx, w, h);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [draw, w, h]);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}
