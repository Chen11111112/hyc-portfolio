import { notFound } from "next/navigation";
import HomeContent from "@/components/HomeContent/HomeContent";
import { getProjectById } from "@/lib/projects";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  if (!getProjectById(id)) notFound();

  return <HomeContent activeProjectId={id} />;
}
