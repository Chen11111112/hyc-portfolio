"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { BOARDS } from "./lifeContent";
import styles from "./LifeWall.module.scss";

/** The 3D desk and cork boards are client-only, like the About page's book stack. */
const LifeScene = dynamic(() => import("./LifeScene"), { ssr: false, loading: () => <div className={styles.loading} /> });

/** Horizontal travel (px) that counts as a swipe to the other board. */
const SWIPE_PX = 50;
/** Accumulated trackpad/wheel sideways scroll (px) that flips the board, and the pause before the next flip. */
const WHEEL_PX = 60;
const WHEEL_COOLDOWN_MS = 700;

/**
 * Life page: the room's desk against the wall (same scene as About) with two cork boards of photos and
 * stickers. Drag or swipe sideways (the wall follows your finger, then snaps), two-finger swipe on a
 * trackpad, the arrow keys, or the board buttons move between the boards.
 */
export default function LifeWall() {
  const [board, setBoard] = useState(0);
  const sceneRef = useRef<HTMLDivElement>(null);
  /** Live drag distance in px, read by the camera every frame (no re-render while dragging). */
  const dragPx = useRef(0);
  const drag = useRef<{ id: number; x: number; y: number; horizontal: boolean | null } | null>(null);
  const boardRef = useRef(0);
  const last = BOARDS.length - 1;
  const go = (i: number) => {
    const next = Math.max(0, Math.min(last, i));
    boardRef.current = next;
    setBoard(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(boardRef.current + 1);
      if (e.key === "ArrowLeft") go(boardRef.current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trackpad two-finger swipe / shift+wheel: sideways scroll flips the board. Non-passive so the
  // browser's swipe-to-go-back doesn't fire instead.
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    let acc = 0;
    let lockedUntil = 0;
    const onWheel = (e: WheelEvent) => {
      const dx = e.deltaX || (e.shiftKey ? e.deltaY : 0);
      if (Math.abs(dx) <= Math.abs(e.deltaY) && !e.shiftKey) return;
      e.preventDefault();
      const now = performance.now();
      if (now < lockedUntil) return;
      acc += dx;
      if (Math.abs(acc) >= WHEEL_PX) {
        go(boardRef.current + (acc > 0 ? 1 : -1));
        acc = 0;
        lockedUntil = now + WHEEL_COOLDOWN_MS;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, horizontal: null };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    // Decide once whether this gesture is sideways; vertical ones are left alone.
    if (d.horizontal === null && Math.hypot(dx, dy) > 8) d.horizontal = Math.abs(dx) > Math.abs(dy);
    if (d.horizontal) dragPx.current = dx;
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const dx = dragPx.current;
    dragPx.current = 0;
    // Drag the wall left to see the board on the right.
    if (d.horizontal && Math.abs(dx) >= SWIPE_PX) go(boardRef.current + (dx < 0 ? 1 : -1));
  };

  return (
    <main className={styles.page}>
      <div
        ref={sceneRef}
        className={styles.scene}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        aria-hidden
      >
        <LifeScene board={board} dragPx={dragPx} />
      </div>

      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          ← 回到房間
        </Link>
        <h1 className={styles.title}>Life</h1>
      </header>

      <nav className={styles.boards} aria-label="切換軟木板">
        {BOARDS.map((b, i) => (
          <button key={b.label} type="button" className={styles.boardButton} aria-pressed={board === i} onClick={() => go(i)}>
            {b.label}
          </button>
        ))}
      </nav>

      {/* What the boards show, for screen readers and search (the 3D scene itself is hidden from them). */}
      <div className={styles.srOnly}>
        {BOARDS.map((b) => (
          <section key={b.label} aria-label={b.label}>
            <ul>
              {b.photos.map((p) => (
                <li key={p.src}>{p.alt}</li>
              ))}
              {b.stickers.map((s) => (
                <li key={s.label}>{s.label}</li>
              ))}
            </ul>
          </section>
        ))}
        <p>書桌上有黑膠唱盤、樂高花、筆筒和鉛筆，還有黏土做的小貓、小狗。</p>
      </div>
    </main>
  );
}
