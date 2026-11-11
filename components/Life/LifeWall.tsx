"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
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
 * trackpad, or the arrow keys move between views: one per board on wide screens, several across each
 * board on phones, where the camera stays close so the photos are bigger.
 */
export default function LifeWall() {
  const [stop, setStop] = useState(0);
  const sceneRef = useRef<HTMLDivElement>(null);
  /** Live drag distance in px, read by the camera every frame (no re-render while dragging). */
  const dragPx = useRef(0);
  const drag = useRef<{ id: number; x: number; y: number; horizontal: boolean | null } | null>(null);
  const stopRef = useRef(0);
  /** How many views the scene has for this screen size (it reports it on every resize). */
  const stopCount = useRef(BOARDS.length);
  const go = (i: number) => {
    const next = Math.max(0, Math.min(stopCount.current - 1, i));
    stopRef.current = next;
    setStop(next);
  };
  const onStops = useCallback((n: number) => {
    stopCount.current = n;
    if (stopRef.current > n - 1) {
      stopRef.current = n - 1;
      setStop(n - 1);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(stopRef.current + 1);
      if (e.key === "ArrowLeft") go(stopRef.current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
     
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
        go(stopRef.current + (acc > 0 ? 1 : -1));
        acc = 0;
        lockedUntil = now + WHEEL_COOLDOWN_MS;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
     
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // No pointer capture yet: a plain click must still reach the 3D scene (the mini cat and dog).
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, horizontal: null };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    // Decide once whether this gesture is sideways; vertical ones are left alone.
    if (d.horizontal === null && Math.hypot(dx, dy) > 8) {
      d.horizontal = Math.abs(dx) > Math.abs(dy);
      // Now it's a swipe: keep getting its moves even if the pointer leaves the page.
      if (d.horizontal) e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (d.horizontal) dragPx.current = dx;
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const dx = dragPx.current;
    dragPx.current = 0;
    // Drag the wall left to see the board on the right.
    if (d.horizontal && Math.abs(dx) >= SWIPE_PX) go(stopRef.current + (dx < 0 ? 1 : -1));
  };

  return (
    <main className={styles.page}>
      <div
        ref={sceneRef}
        data-life-scene
        className={styles.scene}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        aria-hidden
      >
        <LifeScene stop={stop} dragPx={dragPx} onStops={onStops} />
      </div>

      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          ← 回到房間
        </Link>
        <h1 className={styles.title}>Life</h1>
      </header>


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
