"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/projects";
import ProjectDetail from "./ProjectDetail";

type Props = {
  project: Project;
  projects: Project[];
  variant?: "modal" | "page";
};

export default function ProjectDetailOverlay({
  project,
  projects,
  variant = "modal",
}: Props) {
  const router = useRouter();
  const index = projects.findIndex((p) => p.id === project.id);
  const prev = index > 0 ? projects[index - 1]! : null;
  const next = index < projects.length - 1 ? projects[index + 1]! : null;

  const goHome = useCallback(() => {
    router.push("/", { scroll: false });
  }, [router]);

  const goPrev = useCallback(() => {
    if (prev) router.push(`/projects/${prev.id}`, { scroll: false });
  }, [prev, router]);

  const goNext = useCallback(() => {
    if (next) router.push(`/projects/${next.id}`, { scroll: false });
  }, [next, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") goHome();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [goHome, goPrev, goNext, variant]);

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let armed = false;

    const keepOpen = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      if (target.closest("[data-about], [data-project-card]")) return true;
      if (target.closest("a, button")) return true;
      return false;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      armed = !keepOpen(e.target);
      startX = e.clientX;
      startY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!armed) return;
      armed = false;
      if (keepOpen(e.target)) return;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > 8) return;
      goHome();
    };

    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("pointerup", onPointerUp, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointerup", onPointerUp, true);
    };
  }, [goHome]);

  return (
    <ProjectDetail
      project={project}
      projectIndex={index}
      projectTotal={projects.length}
      prev={prev}
      next={next}
      onClose={goHome}
      onPrev={goPrev}
      onNext={goNext}
      variant={variant}
    />
  );
}
