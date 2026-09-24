export type Project = {
  id: string;
  title: string;
  description: string;
  tech: string[];
  accent: string;
  image: string;
  liveUrl?: string;
  githubUrl?: string;
  docsUrl?: string;
};

export const projects: Project[] = [
  {
    id: "veterans-emr",
    title: "臺北榮民總醫院智慧病歷",
    description:
      "生成式人工智慧輔助優化及擴充急診版資訊服務專案，使用 Next.js 進行全端開發。",
    tech: ["Next.js", "MySQL", "LLM", "DB2", "Python"],
    accent: "#3d5a80",
    image: "/1.png",
    liveUrl: "#",
    docsUrl: "#",
  },
  {
    id: "cytopathology",
    title: "細胞病理管理平臺",
    description: "細胞病理流程與資料管理之全端系統。",
    tech: ["Next.js", "Spring Boot"],
    accent: "#6a4c93",
    image: "/2.png",
    githubUrl: "#",
  },
  {
    id: "smart-news",
    title: "智慧新聞 · 英文學習平臺",
    description: "國立臺北商業大學英文學習與新聞整合平台。",
    tech: ["Next.js", "MongoDB", "Nvidia NIM", "Google SSO", "Python"],
    accent: "#1982c4",
    image: "/3.png",
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    id: "3d-print-rental",
    title: "3D 列印租借系統",
    description: "校園 3D 列印設備租借與排程管理。",
    tech: ["Next.js", "MySQL", "Google SSO", "Python"],
    accent: "#ff595e",
    image: "/4.png",
    liveUrl: "#",
  },
  {
    id: "lab-practice",
    title: "機房練習申請系統",
    description: "機房練習時段申請與審核流程。",
    tech: ["Next.js", "MySQL", "Google SSO", "Python"],
    accent: "#ffca3a",
    image: "/5.png",
  },
  {
    id: "competition-admin",
    title: "競賽行政支援系統",
    description: "競賽活動行政作業與資料管理。",
    tech: ["Next.js", "MySQL", "Python"],
    accent: "#8ac926",
    image: "/6.png",
    githubUrl: "#",
  },
  {
    id: "event-checkin",
    title: "研習、活動線上簽到系統",
    description: "研習與活動現場 QR 簽到與報表。",
    tech: ["Next.js", "MySQL"],
    accent: "#52b788",
    image: "/7.png",
    liveUrl: "#",
  },
  {
    id: "bic-website",
    title: "商業智慧研究中心 · 官方網站",
    description: "研究中心對外形象與內容網站。",
    tech: ["Next.js"],
    accent: "#457b9d",
    image: "/8.png",
    liveUrl: "#",
  },
  {
    id: "lost-found",
    title: "失物招領系統",
    description: "使用 Django 進行全端開發的失物招領平台。",
    tech: ["Django"],
    accent: "#e07a5f",
    image: "/9.png",
    githubUrl: "#",
  },
  {
    id: "scrum-assistant",
    title: "Scrum 助理 · RAG 個人助理",
    description: "使用 RAG 打造之 Scrum 協作個人助理。",
    tech: ["Next.js", "Nvidia NIM", "RAG", "PostgreSQL"],
    accent: "#7209b7",
    image: "/10.png",
    liveUrl: "#",
    docsUrl: "#",
    githubUrl: "#",
  },
  {
    id: "fullstack-demo",
    title: "Next.js 全端開發示範專案",
    description: "Next.js App Router 框架下的全端開發示範。",
    tech: ["Next.js"],
    accent: "#4361ee",
    image: "/11.png",
    githubUrl: "#",
    docsUrl: "#",
  },
  {
    id: "kiwi-bird",
    title: "KiWi BiRD · e起來Fun聊",
    description: "校園教學與互動活動紀錄。",
    tech: ["教學活動"],
    accent: "#2b2b2b",
    image: "/12.png",
  },
  {
    id: "server-action-crud",
    title: "Server Action CRUD",
    description: "以 Server Action 完成新增、讀取、更新與刪除的示範。",
    tech: ["Next.js", "Server Action"],
    accent: "#6b7280",
    image: "/13.png",
  },
  {
    id: "birc-home",
    title: "商業智慧研究中心 · 首頁",
    description: "研究中心官方網站首頁。",
    tech: ["Next.js"],
    accent: "#1d3557",
    image: "/14.png",
  },
  {
    id: "psm-i",
    title: "Professional Scrum Master I",
    description: "Scrum.org PSM I 專業認證。",
    tech: ["Scrum"],
    accent: "#1d6f8a",
    image: "/15.png",
  },
];

export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export function getProjectNeighbors(id: string): {
  prev: Project | null;
  next: Project | null;
} {
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? projects[index - 1]! : null,
    next: index < projects.length - 1 ? projects[index + 1]! : null,
  };
}
