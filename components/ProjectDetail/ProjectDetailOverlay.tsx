"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/projects";
import ProjectDetail from "./ProjectDetail";
import styles from "./ProjectDetail.module.scss";

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

  return (
    <>
      <button
        type="button"
        className={styles.dismiss}
        aria-label="回到初始畫面"
        tabIndex={-1}
        onClick={goHome}
      />
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
    </>
  );
}
