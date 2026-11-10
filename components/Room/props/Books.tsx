"use client";

import { useMemo } from "react";
import { DESK, SHELF_SURFACES, SHELF_W, SHELF_X0, SHELF_Z0, rng, type Vec3 } from "../layout";
import { Box } from "./primitives";

const SPINES = ["#2f4858", "#b5523b", "#d9c9a3", "#4a6c6f", "#8c6a4f", "#e8e4da", "#3d3a4b", "#c49a45", "#6b8f71", "#1f2a36", "#a33b3b", "#f0d9a8"];

type Book = { position: Vec3; rotation: Vec3; size: Vec3; color: string; band: string; bandY: number };

type RowOpts = {
  seed: number;
  x0: number;
  x1: number;
  y: number;
  z0: number;
  h: [number, number];
  d: [number, number];
  w: [number, number];
  leanLast?: boolean;
};

function bookRow({ seed, x0, x1, y, z0, h, d, w, leanLast }: RowOpts): Book[] {
  const rand = rng(seed);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const books: Book[] = [];
  let x = x0;
  while (true) {
    const bw = w[0] + rand() * (w[1] - w[0]);
    if (x + bw > x1) break;
    const bh = h[0] + rand() * (h[1] - h[0]);
    const bd = d[0] + rand() * (d[1] - d[0]);
    books.push({
      position: [x + bw / 2, y + bh / 2, z0 + bd / 2],
      rotation: [0, 0, 0],
      size: [bw, bh, bd],
      color: pick(SPINES),
      band: pick(SPINES),
      bandY: 0.25 + rand() * 0.5,
    });
    x += bw + 0.0015;
  }
  if (leanLast && books.length > 1) {
    // Tip the last book so its top rests on its neighbour: rotate CCW by `a`, then place it so the
    // lowest corner (bottom-left) sits on the board and the top-left corner touches the neighbour.
    const last = books[books.length - 1];
    const [bw, bh] = last.size;
    const prev = books[books.length - 2];
    const neighbour = prev.position[0] + prev.size[0] / 2 + 0.001;
    const a = 0.3;
    const cx = neighbour + (bw / 2) * Math.cos(a) + (bh / 2) * Math.sin(a);
    const cy = y + (bw / 2) * Math.sin(a) + (bh / 2) * Math.cos(a);
    last.rotation = [0, 0, a];
    last.position = [cx, cy, last.position[2]];
  }
  return books;
}

function BookMesh({ book }: { book: Book }) {
  const [w, h, d] = book.size;
  return (
    <group position={book.position} rotation={book.rotation}>
      <Box size={[w, h, d]} color={book.color} roughness={0.78} />
      {/* Page block peeking out the top edge. */}
      <Box size={[w * 0.82, 0.002, d * 0.96]} position={[0, h / 2 + 0.0005, -0.002]} color="#f3efe4" roughness={0.9} cast={false} />
      {/* Spine label band. */}
      <Box size={[w * 1.02, h * 0.07, 0.002]} position={[0, h * (book.bandY - 0.5), d / 2]} color={book.band} roughness={0.6} cast={false} />
    </group>
  );
}

/** Wall shelves left of the desk lamp: both boards packed end to end with books. */
export function ShelfContents() {
  const [lower, upper] = SHELF_SURFACES;
  const lowerBooks = useMemo(
    () =>
      bookRow({
        seed: 7,
        x0: SHELF_X0 + 0.004,
        x1: SHELF_X0 + SHELF_W - 0.004,
        y: lower,
        z0: SHELF_Z0 + 0.008,
        h: [0.15, 0.21],
        d: [0.12, 0.16],
        w: [0.016, 0.034],
      }),
    [lower],
  );
  const upperBooks = useMemo(
    () =>
      bookRow({
        seed: 23,
        x0: SHELF_X0 + 0.004,
        x1: SHELF_X0 + SHELF_W - 0.004,
        y: upper,
        z0: SHELF_Z0 + 0.008,
        h: [0.14, 0.19],
        d: [0.11, 0.14],
        w: [0.014, 0.026],
      }),
    [upper],
  );
  return (
    <group>
      {upperBooks.map((b) => (
        <BookMesh key={b.position.join()} book={b} />
      ))}
      {lowerBooks.map((b) => (
        <BookMesh key={b.position.join()} book={b} />
      ))}
    </group>
  );
}

/** Bottom tier: books standing on the desk under the shelves, packed across the full shelf width. */
export function DeskBooks() {
  const x0 = SHELF_X0 + 0.004;
  const x1 = SHELF_X0 + SHELF_W - 0.004;
  const books = useMemo(
    () => bookRow({ seed: 41, x0, x1, y: DESK.top, z0: 0.016, h: [0.2, 0.26], d: [0.15, 0.19], w: [0.018, 0.036] }),
    [x0, x1],
  );
  return (
    <group>
      {books.map((b) => (
        <BookMesh key={b.position.join()} book={b} />
      ))}
    </group>
  );
}
