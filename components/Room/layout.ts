// Shared room dimensions (metres). Wall face is the z = 0 plane, room extends toward +z.

export type Vec3 = [number, number, number];

export const DESK = { x0: -0.2, x1: 1.8, z0: 0.004, depth: 0.7, top: 0.75, slab: 0.03 };
export const DESK_Z1 = DESK.z0 + DESK.depth;
export const DESK_CX = (DESK.x0 + DESK.x1) / 2;

export const SHELF_T = 0.018;
export const SHELF_X0 = DESK.x0;
export const SHELF_W = 0.5;
export const SHELF_D = 0.18;
export const SHELF_Z0 = 0.012;
/** Top surfaces of the two wall shelves (lower, upper). */
export const SHELF_SURFACES = [DESK.top + 0.3, DESK.top + 0.55] as const;

export const PEG_W = 0.7;
export const PEG_H = 0.45;
export const PEG_X0 = DESK_CX - 0.05;
/** Raised so the desktop monitor (top ≈ 1.31 m) sits below it. */
export const PEG_Y0 = 1.36;
export const PEG_FACE_Z = 0.016;

/**
 * Back wall, right of the desk: the sheet-music cabinet (turntable, LEGO piano and LEGO plant on top,
 * guitars hung above), then the crossed skis.
 */
export const SHEET_CAB = { x0: DESK.x1 + 0.06, w: 0.95, h: 0.45, d: 0.42 };
export const SHEET_CAB_CX = SHEET_CAB.x0 + SHEET_CAB.w / 2;

/** Deterministic PRNG so procedural props look the same on every load. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
