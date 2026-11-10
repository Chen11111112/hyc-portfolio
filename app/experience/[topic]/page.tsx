import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { experiences, getExperience } from "@/lib/experiences";
import styles from "./page.module.scss";

type Props = {
  params: Promise<{ topic: string }>;
};

export function generateStaticParams() {
  return experiences.map((item) => ({ topic: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const experience = getExperience(topic);
  if (!experience) return {};
  return { title: experience.label };
}

export default async function ExperiencePage({ params }: Props) {
  const { topic } = await params;
  const experience = getExperience(topic);
  if (!experience) notFound();

  return (
    <main className={styles.page}>
      <p className={styles.kicker}>Experience</p>
      <h1 className={styles.title}>{experience.label}</h1>
      <Link className={styles.back} href="/">
        回到房間
      </Link>
    </main>
  );
}
