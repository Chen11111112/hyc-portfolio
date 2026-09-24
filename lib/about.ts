import fs from "fs";
import path from "path";

const HEADINGS = new Set([
  "自我介紹",
  "經歷",
  "專案經歷",
  "競賽經歷",
  "教學經歷",
  "志工經歷",
  "興趣經歷",
  "證照",
  "專業證照",
  "興趣證照",
  "基礎證照",
  "研習講師",
]);

export type AboutSection = {
  heading: string;
  lines: string[];
};

export function getAboutRaw(): string {
  const filePath = path.join(process.cwd(), "about.md");
  return fs.readFileSync(filePath, "utf-8");
}

export function parseAboutSections(raw: string): AboutSection[] {
  const lines = raw.split(/\r?\n/);
  const sections: AboutSection[] = [];
  let current: AboutSection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (HEADINGS.has(trimmed)) {
      current = { heading: trimmed, lines: [] };
      sections.push(current);
      continue;
    }

    if (!current) {
      current = { heading: "自我介紹", lines: [] };
      sections.push(current);
    }
    current.lines.push(trimmed);
  }

  return sections;
}

export function getAboutSections(): AboutSection[] {
  return parseAboutSections(getAboutRaw());
}

export function getIntroLead(): string {
  const sections = getAboutSections();
  const intro = sections.find((s) => s.heading === "自我介紹");
  return intro?.lines[0] ?? "";
}

export function getTechStack(): string[] {
  const sections = getAboutSections();
  const intro = sections.find((s) => s.heading === "自我介紹");
  if (!intro) return [];
  return intro.lines.slice(1);
}

export type ProjectExperienceRow = {
  org: string;
  name: string;
  detail: string;
  tech: string;
};

const ORG_NAMES = ["臺北榮民總醫院", "國立臺北商業大學"];

const PROJECT_NAMES = [
  "智慧病歷",
  "細胞病理管理平臺",
  "智慧新聞 - 英文學習平臺",
  "3D列印租借系統",
  "機房練習申請系統",
  "競賽行政支援系統",
  "研習、活動線上簽到系統",
  "商業智慧研究中心 - 官方網站",
  "失誤招領系統",
  "商業智慧研究中心 - 後臺管理系統",
  "校園活動系統",
  "智取時光 - 與三商家購合作",
  "使用 RAG 打造個人助理 – Scrum 助理",
  "Next.j s框架下的全端開發示範專案",
];

function splitDetailAndTech(rest: string): { detail: string; tech: string } {
  const built = rest.match(/^(使用.+?進行全端開發)(.*)$/);
  if (built) return { detail: built[1] ?? "", tech: built[2] ?? "" };

  const stackAt = rest.indexOf("Next.js（");
  if (stackAt >= 0) {
    return { detail: rest.slice(0, stackAt), tech: rest.slice(stackAt) };
  }

  return { detail: rest, tech: "" };
}

export function parseProjectExperience(raw: string): ProjectExperienceRow[] {
  const marker = "單位活動名稱內容技術說明";
  const start = raw.indexOf(marker);
  if (start === -1) return [];
  const body = raw.slice(start + marker.length).split(/\r?\n/)[0] ?? "";

  const rows: ProjectExperienceRow[] = [];
  let cursor = 0;

  for (const name of PROJECT_NAMES) {
    const at = body.indexOf(name, cursor);
    if (at === -1) continue;
    const org = body.slice(cursor, at).trim();
    const from = at + name.length;
    const bounds = [
      ...PROJECT_NAMES.map((next) => body.indexOf(next, from)),
      ...ORG_NAMES.map((orgName) => body.indexOf(orgName, from)),
    ].filter((index) => index >= 0);
    const end = bounds.length > 0 ? Math.min(...bounds) : body.length;
    const { detail, tech } = splitDetailAndTech(
      body.slice(at + name.length, end).trim(),
    );
    rows.push({ org, name, detail, tech });
    cursor = end;
  }

  return rows;
}

export function getProjectExperience(): ProjectExperienceRow[] {
  return parseProjectExperience(getAboutRaw());
}
