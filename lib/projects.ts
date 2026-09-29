import fs from "fs";
import path from "path";

export type ProjectLink = {
  label: string;
  href: string;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  tech: string[];
  accent: string;
  image: string;
  links: ProjectLink[];
};

type PhotoCopy = {
  title: string;
  description: string;
  tech?: string[];
  linkHeading?: string;
};

type LinkSection = {
  heading: string;
  links: ProjectLink[];
};

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

const ACCENTS = [
  "#3d5a80",
  "#6a4c93",
  "#1982c4",
  "#ff595e",
  "#ffca3a",
  "#8ac926",
  "#52b788",
  "#457b9d",
  "#e07a5f",
  "#7209b7",
  "#4361ee",
  "#2b2b2b",
  "#6b7280",
  "#1d3557",
  "#1d6f8a",
  "#c77dff",
  "#f4a261",
  "#2a9d8f",
  "#e9c46a",
  "#264653",
];

const PHOTO_COPY: Record<string, PhotoCopy> = {
  "1": {
    title: "第一屆 BIRC Hackathon",
    description:
      "2026 年 9 月 12–13 日舉行的第一屆 BIRC Hackathon，主辦單位為國立臺北商業大學資訊管理系與商業智慧研究中心。",
    linkHeading: "第一屆 商智中心盃黑客松競賽",
  },
  "2": {
    title: "打造個人 Agent 協作 Next.js 全端專案",
    description:
      "LLM & Agent 課程：深入理解 LLM 與 AI Agent，運用 Ollama 與 Dify 建構個人 AI 助理，剖析資安威脅，並實作 Next.js App Router 與 MySQL。課程為 7/6–7/10、7/13–7/17 18:30–21:00，講師陳泓毓與商業智慧研究中心助教群。",
    tech: ["LLM", "Ollama", "Dify", "Next.js", "MySQL"],
    linkHeading: "打造個人 Agent 協作 Next.js 全端專案 暑期研習",
  },
  "3": {
    title: "失物招領 Lost Corner",
    description:
      "國立臺北商業大學資訊管理系失物招領平台。使用 Google 帳戶登入、刊登尋獲失物，並發布遺失物協尋文章，尋獲者與失主可直接留言聯繫。",
    tech: ["Google 登入"],
    linkHeading: "失誤招領/協尋系統",
  },
  "4": {
    title: "3D 列印",
    description:
      "BIRC Support 3D 列印服務。以 Google 帳戶登入並填寫班級學號，詳閱聲明與流程後上傳切片檔提出申請，完成後至藝 402 教室取件。",
    tech: ["Google 登入"],
    linkHeading: "3D列印租借系統",
  },
  "5": {
    title: "機房練習",
    description:
      "BIRC Support 機房練習服務。Google 帳戶登入並上傳機房安全研習證明，審核通過後預約時段；當日至藝 402 教室掃學生證領取門禁卡，結束前歸還。",
    tech: ["Google 登入"],
    linkHeading: "機房練習申請系統",
  },
  "6": {
    title: "智取食光",
    description:
      "國立臺北商業大學資訊管理系智取食光，於 BIRC Support 選購零食與餐點。海報說明以 Google 帳戶登入，畫面列出樂事洋芋片、海鮮烏龍麵與維力炸醬麵等商品。",
    tech: ["Google 登入"],
    linkHeading: "智取食光",
  },
  "7": {
    title: "Scrum Assistant",
    description:
      "Scrum 助理以檢索增強生成，只依文件內容回答。整合《Scrum Guide》、敏捷宣言與權威文獻，提供精準知識檢索、智慧助理問答與專案決策支援。",
    tech: ["LiteLLM", "PostgreSQL", "LangChain", "Next.js", "RAG"],
    linkHeading: "使用 RAG 打造個人助理 – Scrum 助理",
  },
  "8": {
    title: "Intelligence News",
    description:
      "智慧新聞結合 AI，打造專屬英文家教。支援多元新聞瀏覽、自動生成中英文摘要與關鍵重點、字彙測驗，並可透過文字或語音與 AI 對話。",
    tech: ["AI"],
    linkHeading: "intelligence-news",
  },
  "9": {
    title: "智慧病歷生成式人工智慧輔助優化及擴充急診版資訊服務專案",
    description:
      "臺北榮民總醫院急診系統。以生成式 AI 輔助病歷撰寫、ICD-10 建議與主訴推論，並整合 Whisper 語音。",
    tech: ["Next.js", "TypeScript", "MySQL", "DB2", "Python", "LLM", "Whisper"],
    linkHeading: "智慧病歷生成式人工智慧輔助優化及擴充急診版資訊服務專案",
  },
  "10": {
    title: "細胞病理平臺升級專案",
    description:
      "臺北榮民總醫院細胞病理平臺升級，管理病歷號、檢查單、判別與事件狀態，支援查詢、新增、編輯與報到。",
    tech: ["Next.js", "TypeScript", "MySQL", "Spring Boot"],
    linkHeading: "細胞病理升級專案",
  },
  "11": {
    title: "程式競賽",
    description: "Competitive Programming。程式競賽現場實作紀錄。",
  },
  "12": {
    title: "華碩數位志工計畫",
    description: "ASUS i-Taiwan Digital Volunteer Program，華碩數位志工計畫。",
  },
  "13": {
    title: "馬林巴獨奏競賽",
    description: "Marimba Solo Competition。馬林巴獨奏競賽演出。",
  },
  "14": {
    title: "北商爵士樂社創社社長",
    description: "Charter President of the NTUB Jazz Club。國立臺北商業大學爵士樂社創社社長。",
  },
  "15": {
    title: "雙板滑雪教練證照",
    description: "Canadian Ski Instructors' Alliance Level 1 雙板滑雪教練證照。",
  },
  "16": {
    title: "KiWi BiRD · e起來Fun聊",
    description: "KiWi BiRD「e起來Fun聊」教學與社區活動紀錄。",
  },
  "17": {
    title: "專題實作研習營",
    description:
      "國立臺北商業大學資訊管理系 114 學年第一學期夜間專題實作研習營。1/12–1/23、18:30–21:00 於行政大樓資 401，由商智中心 TA 群授課，內容涵蓋 Linux、Docker、HTML、MySQL 與 Flask。",
    tech: ["Linux", "Docker", "HTML", "MySQL", "Flask"],
  },
  "18": {
    title: "BIRC Hackathon 官方網站",
    description:
      "第一屆商智黑客松官方網站，2026 年 9 月 12–13 日。在約 1.5 天內從零打造具應用價值的 Prototype，以創新行動回應 SDGs。",
    linkHeading: "BIRC Hackathon 官方網站",
  },
  "19": {
    title: "商業智慧研究中心",
    description:
      "國立臺北商業大學資訊管理系商業智慧研究中心官方網站，介紹中心、成員、智慧校園、訓練課程與產學合作。",
    linkHeading: "商業智慧研究中心 官方網站",
  },
  "20": {
    title: "PSM I 專業敏捷式管理教練證照",
    description:
      "Scrum.org Professional Scrum Master I。Hung Yu Chen 於 2026 年 3 月 10 日取得認證。",
    tech: ["Scrum"],
  },
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[\s\-–—·・.。,，/／]+/g, "");
}

function linkLabel(raw: string, href: string) {
  const label = raw.replace(/[：:\s]+$/g, "").trim();
  if (/^github$/i.test(label) || (!label && /github\.com/i.test(href))) {
    return "GitHub";
  }
  return label || "系統連結";
}

export function parseProjectLinks(raw: string): LinkSection[] {
  const sections: LinkSection[] = [];
  let current: LinkSection | null = null;
  let pendingLabel = "";

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("#")) {
      const heading = trimmed.replace(/^#+\s*/, "").trim();
      current = { heading, links: [] };
      sections.push(current);
      pendingLabel = "";
      continue;
    }

    if (!current || current.heading.includes("所有連結")) continue;

    const urls = trimmed.match(/https?:\/\/\S+/g);
    if (!urls) {
      pendingLabel = trimmed;
      continue;
    }

    const inline = trimmed.replace(urls[0]!, "").trim();
    const labelSource = inline || pendingLabel;
    pendingLabel = "";
    urls.forEach((href, index) => {
      current!.links.push({
        label: linkLabel(index === 0 ? labelSource : "", href),
        href,
      });
    });
  }

  return sections.filter((section) => section.links.length > 0);
}

function readLinkSections() {
  const filePath = path.join(process.cwd(), "projectData.md");
  if (!fs.existsSync(filePath)) return [];
  return parseProjectLinks(fs.readFileSync(filePath, "utf-8"));
}

function listImageFiles() {
  const dir = path.join(process.cwd(), "public");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => IMAGE_EXT.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
}

function takeSection(sections: LinkSection[], heading: string, used: Set<number>) {
  const key = normalize(heading);
  const index = sections.findIndex(
    (section, i) => !used.has(i) && normalize(section.heading) === key,
  );
  if (index === -1) return [];
  used.add(index);
  return sections[index]!.links;
}

function matchSection(title: string, sections: LinkSection[], used: Set<number>) {
  const key = normalize(title);
  if (key.length < 2) return [];

  let best = -1;
  let bestScore = 0;
  sections.forEach((section, index) => {
    if (used.has(index)) return;
    const heading = normalize(section.heading);
    if (heading.length < 2) return;
    const shared = key.includes(heading) || heading.includes(key);
    const score = shared ? Math.min(key.length, heading.length) : 0;
    if (score > bestScore) {
      best = index;
      bestScore = score;
    }
  });

  if (best === -1 || bestScore < 4) return [];
  used.add(best);
  return sections[best]!.links;
}

export function getProjects(): Project[] {
  const sections = readLinkSections();
  const used = new Set<number>();
  const files = listImageFiles();

  const drafted = files.map((file, index) => {
    const id = path.basename(file, path.extname(file));
    const copy = PHOTO_COPY[id];
    return {
      id,
      file,
      index,
      title: copy?.title ?? id,
      description: copy?.description ?? "",
      tech: copy?.tech ?? [],
      linkHeading: copy?.linkHeading,
    };
  });

  const linked = new Map<string, ProjectLink[]>();
  for (const item of drafted) {
    if (!item.linkHeading) continue;
    linked.set(item.id, takeSection(sections, item.linkHeading, used));
  }
  for (const item of drafted) {
    if (linked.has(item.id)) continue;
    linked.set(item.id, matchSection(item.title, sections, used));
  }

  return drafted.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    tech: item.tech,
    accent: ACCENTS[item.index % ACCENTS.length]!,
    image: `/${item.file}`,
    links: linked.get(item.id) ?? [],
  }));
}

export function getProjectById(id: string): Project | undefined {
  return getProjects().find((project) => project.id === id);
}

export function getProjectNeighbors(id: string): {
  prev: Project | null;
  next: Project | null;
} {
  const projects = getProjects();
  const index = projects.findIndex((project) => project.id === id);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? projects[index - 1]! : null,
    next: index < projects.length - 1 ? projects[index + 1]! : null,
  };
}
