"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import type { Project } from "@/lib/projects";
import styles from "./ProjectDetail.module.scss";

type Props = {
  project: Project;
  projectIndex: number;
  projectTotal: number;
  prev: Project | null;
  next: Project | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  variant?: "modal" | "page";
};

const SWIPE_THRESHOLD = 24;
let detailWasOpen = false;
let detailCloseTimer = 0;

function ActionLink({
  href,
  label,
  variant,
}: {
  href?: string;
  label: string;
  variant: "primary" | "ghost";
}) {
  if (!href || href === "#") {
    return (
      <span className={styles.btnDisabled} aria-disabled>
        {label}
      </span>
    );
  }

  const className =
    variant === "primary" ? styles.btnPrimary : styles.btnGhost;

  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label}
    </a>
  );
}

function DetailPanel({ project }: { project: Project }) {
  return (
    <div className={styles.slideInner}>
      <div className={styles.visual}>
        <div
          className={styles.imageFrame}
          style={{ "--accent": project.accent } as React.CSSProperties}
        >
          <img
            className={styles.photo}
            src={project.image}
            alt=""
            draggable={false}
          />
        </div>
      </div>
      <div className={styles.content}>
        <h2 className={styles.title}>{project.title}</h2>
        <p className={styles.description}>{project.description}</p>
        <div className={styles.tech}>
          {project.tech.map((t) => (
            <span key={t} className={styles.chip}>
              {t}
            </span>
          ))}
        </div>
        <div className={styles.actions}>
          <ActionLink
            href={project.liveUrl}
            label="前往線上系統"
            variant="primary"
          />
          <ActionLink
            href={project.githubUrl}
            label="查看 GitHub Repo"
            variant="ghost"
          />
          <ActionLink
            href={project.docsUrl}
            label="查看系統文件"
            variant="ghost"
          />
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetail({
  project,
  prev,
  next,
  onClose,
  onPrev,
  onNext,
  variant = "modal",
}: Props) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const pointerId = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const axisRef = useRef<"x" | "y" | null>(null);

  useLayoutEffect(() => {
    window.clearTimeout(detailCloseTimer);
    const drawer = drawerRef.current;
    if (detailWasOpen && drawer) drawer.style.animation = "none";
    detailCloseTimer = window.setTimeout(() => {
      detailWasOpen = true;
    }, 0);
    return () => {
      window.clearTimeout(detailCloseTimer);
      detailCloseTimer = window.setTimeout(() => {
        detailWasOpen = false;
      }, 200);
    };
  }, []);

  const overlayClass =
    variant === "page" ? `${styles.overlay} ${styles.overlayPage}` : styles.overlay;

  const settleTrack = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transition = "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)";
    track.style.transform = "translate3d(-33.333%, 0, 0)";
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    pointerId.current = e.pointerId;
    startX.current = e.clientX;
    startY.current = e.clientY;
    axisRef.current = null;
    draggingRef.current = true;
    const track = trackRef.current;
    if (track) track.style.transition = "none";
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || pointerId.current !== e.pointerId) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (!axisRef.current) {
      if (Math.hypot(dx, dy) < 4) return;
      axisRef.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (axisRef.current === "y") {
        draggingRef.current = false;
        return;
      }
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (axisRef.current !== "x") return;
    const track = trackRef.current;
    if (!track) return;
    track.style.transform = `translate3d(calc(-33.333% + ${dx}px), 0, 0)`;
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (pointerId.current !== e.pointerId) return;
      const dx = e.clientX - startX.current;
      const horizontal = axisRef.current === "x";
      draggingRef.current = false;
      axisRef.current = null;
      pointerId.current = null;
      if (horizontal && dx > SWIPE_THRESHOLD && prev) {
        onPrev();
        return;
      }
      if (horizontal && dx < -SWIPE_THRESHOLD && next) {
        onNext();
        return;
      }
      settleTrack();
    },
    [next, onNext, onPrev, prev, settleTrack],
  );

  const onPointerCancel = useCallback(() => {
    draggingRef.current = false;
    axisRef.current = null;
    pointerId.current = null;
    settleTrack();
  }, [settleTrack]);

  return (
    <aside
      className={overlayClass}
      aria-labelledby="project-detail-title"
    >
      <div
        ref={drawerRef}
        className={styles.drawer}
        data-detail-drawer
        onClick={(e) => e.stopPropagation()}
      >
      <button
        type="button"
        className={styles.close}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="關閉"
      >
        ×
      </button>

      {prev ? (
        <Link
          href={`/projects/${prev.id}`}
          scroll={false}
          className={`${styles.nav} ${styles.navPrev}`}
          onClick={(e) => e.stopPropagation()}
          aria-label={`上一個專案：${prev.title}`}
        >
          ←
        </Link>
      ) : (
        <span className={`${styles.nav} ${styles.navPrev} ${styles.navDisabled}`}>
          ←
        </span>
      )}

      {next ? (
        <Link
          href={`/projects/${next.id}`}
          scroll={false}
          className={`${styles.nav} ${styles.navNext}`}
          onClick={(e) => e.stopPropagation()}
          aria-label={`下一個專案：${next.title}`}
        >
          →
        </Link>
      ) : (
        <span className={`${styles.nav} ${styles.navNext} ${styles.navDisabled}`}>
          →
        </span>
      )}

      <div
        className={styles.swipeViewport}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <div ref={trackRef} className={styles.swipeTrack}>
          <article className={styles.slide} aria-hidden={!prev}>
            {prev ? <DetailPanel project={prev} /> : null}
          </article>
          <article className={styles.slide}>
            <div className={styles.slideInner}>
              <div className={styles.visual}>
                <div
                  key={project.id}
                  className={styles.imageFrame}
                  style={{ "--accent": project.accent } as React.CSSProperties}
                >
                  <img
                    className={styles.photo}
                    src={project.image}
                    alt=""
                    draggable={false}
                  />
                </div>
              </div>
              <div className={styles.content}>
                <h2 id="project-detail-title" className={styles.title}>
                  {project.title}
                </h2>
                <p className={styles.description}>{project.description}</p>
                <div className={styles.tech}>
                  {project.tech.map((t) => (
                    <span key={t} className={styles.chip}>
                      {t}
                    </span>
                  ))}
                </div>
                <div className={styles.actions}>
                  <ActionLink
                    href={project.liveUrl}
                    label="前往線上系統"
                    variant="primary"
                  />
                  <ActionLink
                    href={project.githubUrl}
                    label="查看 GitHub Repo"
                    variant="ghost"
                  />
                  <ActionLink
                    href={project.docsUrl}
                    label="查看系統文件"
                    variant="ghost"
                  />
                </div>
              </div>
            </div>
          </article>
          <article className={styles.slide} aria-hidden={!next}>
            {next ? <DetailPanel project={next} /> : null}
          </article>
        </div>
      </div>
      </div>
    </aside>
  );
}
