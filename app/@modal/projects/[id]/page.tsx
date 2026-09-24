import { notFound } from "next/navigation";
import ProjectDetailOverlay from "@/components/ProjectDetail/ProjectDetailOverlay";
import { getProjectById, projects } from "@/lib/projects";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProjectModalPage({ params }: Props) {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) notFound();

  return (
    <ProjectDetailOverlay
      project={project}
      projects={projects}
      variant="modal"
    />
  );
}
