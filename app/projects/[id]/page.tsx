import { notFound } from "next/navigation";
import HomeContent from "@/components/HomeContent/HomeContent";
import ProjectDetailOverlay from "@/components/ProjectDetail/ProjectDetailOverlay";
import { getProjectById, projects } from "@/lib/projects";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) notFound();

  return (
    <>
      <HomeContent activeProjectId={id} />
      <ProjectDetailOverlay
        project={project}
        projects={projects}
        variant="modal"
      />
    </>
  );
}
