import type { Metadata } from "next";
import AboutBooks, { type Story } from "@/components/AboutBooks/AboutBooks";
import { getAboutSections, getProjectExperience, type ProjectExperienceRow } from "@/lib/about";

export const metadata: Metadata = {
  title: "About",
  description: "陳泓毓（Hy.C）的專案經歷、競賽經歷、教學經歷、志工經歷、興趣經歷與證照。",
  alternates: { canonical: "/about" },
};

/** A standalone four-digit year (19xx / 20xx); ROC years like the 115 in「115資訊月」don't match. */
const YEAR = /(?<!\d)(?:19|20)\d{2}(?!\d)/g;

/**
 * Splits an entry into its text and year tag: "活動 | 2025", or a year written inline
 * ("爵士樂社 創社社長 2026") — the last standalone year is pulled out of the text.
 */
function item(line: string) {
  const [head, tail] = line.split(/\s*\|\s*/);
  if (tail?.trim()) return { text: head.trim(), year: tail.trim() };
  const years = [...head.matchAll(YEAR)];
  const last = years[years.length - 1];
  if (!last || last.index === undefined) return { text: head.trim(), year: undefined };
  const text = (head.slice(0, last.index) + head.slice(last.index + last[0].length)).replace(/\s{2,}/g, " ").trim();
  return { text, year: last[0] };
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

/** Story photos are the square posters in public/ (1800 × 1800). */
function photo(n: number, story: string) {
  return { src: `/${n}.png`, alt: `${story}照片`, width: 1800, height: 1800 };
}

export default function AboutPage() {
  const sections = getAboutSections();
  const lines = (heading: string) => sections.find((s) => s.heading === heading)?.lines ?? [];
  const interests = lines("興趣經歷");
  const allLines = sections.flatMap((s) => s.lines);
  const isMusic = (l: string) => /音樂|馬林巴|爵士|樂社|獨奏/.test(l);
  const isSki = (l: string) => /滑雪|雪板|ski/i.test(l);
  const unique = (l: string, i: number, arr: string[]) => arr.indexOf(l) === i;

  const stories: Story[] = [
    { id: "projects", title: "專案經歷", en: "Projects", color: "#2f4858", rows: withOrgFilled(getProjectExperience()) },
    {
      id: "competitions",
      title: "競賽經歷",
      en: "Competitions",
      color: "#a8452f",
      images: [photo(11, "競賽經歷")],
      items: lines("競賽經歷").map(item),
    },
    {
      id: "teaching",
      title: "教學經歷",
      en: "Teaching",
      color: "#3f6a6d",
      images: [photo(2, "教學經歷"), photo(17, "教學經歷"), photo(21, "教學經歷")],
      items: [...lines("教學經歷"), ...lines("研習講師")].map(item),
    },
    {
      id: "volunteer",
      title: "志工經歷",
      en: "Volunteer",
      color: "#557a5d",
      images: [photo(12, "志工經歷"), photo(16, "志工經歷")],
      items: lines("志工經歷").map(item),
    },
    // Its own book; the room's guitars link here (/about#music). The LEGO piano opens the YouTube channel.
    {
      id: "music",
      title: "音樂經歷",
      en: "Music",
      color: "#6d3b5c",
      images: [photo(13, "音樂經歷"), photo(14, "音樂經歷")],
      items: interests.filter(isMusic).map(item),
    },
    {
      id: "interests",
      title: "興趣經歷",
      en: "Interests",
      color: "#b0832f",
      images: [photo(15, "興趣經歷")],
      // Accordion; `/about#interests-ski` etc. opens that fold (the room's skis link here). Music has its own book.
      folds: [
        // 興趣經歷 has no ski line yet; the CSIA instructor licence (證照) is the ski story so far.
        { id: "interests-ski", label: "滑雪", items: [...interests, ...allLines].filter(isSki).filter(unique).map(item) },
        { id: "interests-other", label: "其他", items: interests.filter((l) => !isMusic(l) && !isSki(l)).map(item) },
      ],
    },
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
