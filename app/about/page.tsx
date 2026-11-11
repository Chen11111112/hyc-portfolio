import type { Metadata } from "next";
import AboutBooks, { type Story } from "@/components/AboutBooks/AboutBooks";
import { getAboutSections, getProjectExperience, type ProjectExperienceRow } from "@/lib/about";

export const metadata: Metadata = {
  title: "About",
  description: "陳泓毓（Hy.C）的專案經歷、競賽經歷、教學經歷、志工經歷、興趣經歷與證照。",
  alternates: { canonical: "/about" },
};

/** Splits "活動 | 2025" into the text and its year tag. */
function item(line: string) {
  const [text, year] = line.split(/\s*\|\s*/);
  return { text: text.trim(), year: year?.trim() };
}

/**
 * The project table names each organisation only on its first row (like a merged cell); carry it down
 * so every project is grouped under the right one.
 */
function withOrgFilled(rows: ProjectExperienceRow[]) {
  let org = "";
  return rows.map((r) => {
    if (r.org.trim()) org = r.org.trim();
    return { ...r, org };
  });
}

export default function AboutPage() {
  const sections = getAboutSections();
  const lines = (heading: string) => sections.find((s) => s.heading === heading)?.lines ?? [];

  const stories: Story[] = [
    { id: "projects", title: "專案經歷", en: "Projects", color: "#2f4858", rows: withOrgFilled(getProjectExperience()) },
    { id: "competitions", title: "競賽經歷", en: "Competitions", color: "#a8452f", items: lines("競賽經歷").map(item) },
    {
      id: "teaching",
      title: "教學經歷",
      en: "Teaching",
      color: "#3f6a6d",
      items: [...lines("教學經歷"), ...lines("研習講師")].map(item),
    },
    { id: "volunteer", title: "志工經歷", en: "Volunteer", color: "#557a5d", items: lines("志工經歷").map(item) },
    { id: "interests", title: "興趣經歷", en: "Interests", color: "#b0832f", items: lines("興趣經歷").map(item) },
    {
      id: "certifications",
      title: "證照",
      en: "Certifications",
      color: "#3d3a4b",
      groups: [
        { label: "專業證照", items: lines("專業證照").map(item) },
        { label: "基礎證照", items: lines("基礎證照").map(item) },
      ],
    },
  ];

  return <AboutBooks stories={stories} intro={lines("自我介紹")[0] ?? ""} />;
}
