"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const pointerId = useRef<number | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    setDragX(0);
    draggingRef.current = false;
    setDragging(false);
  }, [project.id]);

  const overlayClass =
    variant === "page" ? `${styles.overlay} ${styles.overlayPage}` : styles.overlay;

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    pointerId.current = e.pointerId;
    startX.current = e.clientX;
    draggingRef.current = true;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || pointerId.current !== e.pointerId) return;
    setDragX(e.clientX - startX.current);
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (pointerId.current !== e.pointerId) return;
      const delta = e.clientX - startX.current;
      draggingRef.current = false;
      setDragging(false);
      setDragX(0);
      pointerId.current = null;
      if (delta > 72) onPrev();
      else if (delta < -72) onNext();
    },
    [onNext, onPrev],
  );

  const onPointerCancel = useCallback(() => {
    draggingRef.current = false;
    setDragging(false);
    setDragX(0);
    pointerId.current = null;
  }, []);

  const trackTransform = dragging
    ? `translate3d(calc(-33.333% + ${dragX}px), 0, 0)`
    : "translate3d(-33.333%, 0, 0)";

  return (
    <aside
      className={overlayClass}
      aria-labelledby="project-detail-title"
    >
      <div
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
        <div
          className={`${styles.swipeTrack} ${dragging ? styles.swipeTrackDragging : ""}`}
          style={{ transform: trackTransform }}
        >
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
