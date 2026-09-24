"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import type { Project } from "@/lib/projects";
import styles from "./ProjectCarousel.module.scss";

type Props = {
  projects: Project[];
  activeId?: string | null;
};

const VISIBLE_SLOTS = 14.5;
const DRAG_GAIN = 0.0048;

function wrap(value: number, length: number) {
  return value - Math.floor(value / length) * length;
}

function positionAlongPath(t: number) {
  const x = 8 + t * 84;
  const y = 90 - t * 72;
  return { left: `${x}%`, top: `${y}%` };
}

function pose(t: number, activeId: string | null, id: string) {
  const z = 50;
  const depthNorm = (z + 120) / 280;
  const isActive = activeId === id;
  const scale = 0.92 + depthNorm * 0.14;
  const lift = isActive ? -42 : 0;

  return {
    // poseTransform 絕對不能更改
    poseTransform: `translate3d(0, ${lift}px, ${z}px) rotateY(40deg) rotateX(20deg) rotateZ(12deg) scale(${scale})`,
    opacity: 1,
    zIndex: Math.round((2 - t) * 100) + (isActive ? 50 : 0),
  };
}

export default function ProjectCarousel({
  projects,
  activeId = null,
}: Props) {
  const [phase, setPhase] = useState(0);
  const dragStart = useRef<{ x: number; y: number; phase: number } | null>(
    null,
  );
  const dragDistance = useRef(0);

  const slots = useMemo(
    () =>
      projects.map((project, stackIndex) => ({
        project,
        stackIndex,
      })),
    [projects],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLAnchorElement>) => {
      if (e.button !== 0) return;
      dragDistance.current = 0;
      dragStart.current = { x: e.clientX, y: e.clientY, phase };
      const pose = e.currentTarget.querySelector("[data-card-pose]");
      if (pose instanceof HTMLElement) pose.setPointerCapture(e.pointerId);
    },
    [phase],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLAnchorElement>) => {
      if (!dragStart.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      dragDistance.current = Math.hypot(dx, dy);
      setPhase(dragStart.current.phase + (dx - dy) * DRAG_GAIN);
    },
    [],
  );

  const onPointerUp = useCallback(() => {
    dragStart.current = null;
  }, []);

  const onLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (dragDistance.current > 8) e.preventDefault();
  }, []);

  const onDragStart = useCallback((e: React.DragEvent<HTMLAnchorElement>) => {
    e.preventDefault();
  }, []);

  const onWheel = useCallback((e: React.WheelEvent<HTMLAnchorElement>) => {
    const about = document.querySelector<HTMLElement>("[data-about]");
    if (!about) return;
    const bounds = about.getBoundingClientRect();
    if (
      e.clientX < bounds.left ||
      e.clientX > bounds.right ||
      e.clientY < bounds.top ||
      e.clientY > bounds.bottom
    ) {
      return;
    }
    const delta =
      e.deltaMode === 1
        ? e.deltaY * 16
        : e.deltaMode === 2
          ? e.deltaY * about.clientHeight
          : e.deltaY;
    about.scrollTop += delta;
  }, []);

  return (
    <section
      className={styles.section}
      aria-label="專案輪播"
    >
      <div className={styles.zone}>
        <div className={styles.stage}>
          {slots.map(({ project, stackIndex }) => {
            let pos = wrap(stackIndex + phase, projects.length);
            if (pos > projects.length - 0.85) pos -= projects.length;
            const t = pos / VISIBLE_SLOTS;
            if (t < -0.28 || t > 1.05) return null;

            const { left, top } = positionAlongPath(t);
            const { poseTransform, opacity, zIndex } = pose(
              t,
              activeId,
              project.id,
            );

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                scroll={false}
                className={styles.card}
              data-project-card
                draggable={false}
                onDragStart={onDragStart}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onClick={onLinkClick}
                onWheel={onWheel}
                style={
                  {
                    left,
                    top,
                    opacity,
                    zIndex,
                    "--accent": project.accent,
                    "--float-duration": `${5.2 + (stackIndex % 5) * 0.65}s`,
                    "--float-delay": `${(stackIndex % 7) * -0.4}s`,
                  } as React.CSSProperties
                }
                aria-label={`查看作品：${project.title}`}
              >
                <div
                  className={styles.cardPose}
                  data-card-pose
                  style={{ transform: poseTransform }}
                >
                  <div className={styles.cardInner}>
                    <img
                      className={styles.photo}
                      src={project.image}
                      alt=""
                      draggable={false}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
