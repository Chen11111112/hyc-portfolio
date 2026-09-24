"use client";

import { usePathname } from "next/navigation";
import type { Project } from "@/lib/projects";
import ProjectCarousel from "./ProjectCarousel";

type Props = {
  projects: Project[];
  activeProjectId?: string | null;
};

export default function ProjectCarouselWrapper({
  projects,
  activeProjectId: activeProjectIdProp = null,
}: Props) {
  const pathname = usePathname();
  const match = pathname.match(/^\/projects\/([^/]+)/);
  const activeProjectId = activeProjectIdProp ?? match?.[1] ?? null;

  return <ProjectCarousel projects={projects} activeId={activeProjectId} />;
}
