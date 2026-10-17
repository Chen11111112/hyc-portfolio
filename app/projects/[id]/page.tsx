import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomeContent from "@/components/HomeContent/HomeContent";
import { getProjectById, getProjects } from "@/lib/projects";

type Props = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return getProjects().map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) return {};
  const title = `${project.title}`;
  const description = `${project.description}（陳泓毓 Hy.C / HyC 作品，技術：${project.tech.join("、")}）`;
  return {
    title,
    description,
    alternates: { canonical: `/projects/${project.id}` },
    openGraph: {
      title,
      description,
      url: `/projects/${project.id}`,
      images: [{ url: project.image, alt: project.title }],
    },
    twitter: { title, description, images: [project.image] },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  if (!getProjectById(id)) notFound();

  return <HomeContent activeProjectId={id} />;
}
