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
    title: "第一屆商智黑客松",
    description:
      "國立臺北商業大學資訊管理系與商業智慧研究中心主辦，2026 年 9 月 12–13 日舉行的第一屆 BIRC Hackathon。",
    tech: ["Next.js", "MySQL", "LLM", "DB2", "Python"],
    accent: "#3d5a80",
    image: "/1.png",
    liveUrl: "#",
    docsUrl: "#",
  },
  {
    id: "cytopathology",
    title: "打造個人 Agent 協作 Next.js 全端專案",
    description:
      "講授 LLM、AI Agent、Ollama、Dify 與 Next.js App Router 全端開發，帶領學員建構個人 AI 助理。",
    tech: ["Next.js", "Spring Boot"],
    accent: "#6a4c93",
    image: "/2.png",
    githubUrl: "#",
  },
  {
    id: "smart-news",
    title: "失物招領系統",
    description:
      "國立臺北商業大學資訊管理系失物招領平台 LostCornerer，支援 Google 登入、刊登尋獲物與發布協尋文。",
    tech: ["Next.js", "MongoDB", "Nvidia NIM", "Google SSO", "Python"],
    accent: "#1982c4",
    image: "/3.png",
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    id: "3d-print-rental",
    title: "3D列印租借系統",
    description:
      "BIRC Support 校園 3D 列印服務：Google 登入後提交列印申請、上傳切片檔，完成後至 402 教室取件。",
    tech: ["Next.js", "MySQL", "Google SSO", "Python"],
    accent: "#ff595e",
    image: "/4.png",
    liveUrl: "#",
  },
  {
    id: "lab-practice",
    title: "機房練習申請系統",
    description:
      "BIRC Support 機房練習服務：Google 登入並核發權限後預約時段，當日至 402 教室領取並歸還門禁卡。",
    tech: ["Next.js", "MySQL", "Google SSO", "Python"],
    accent: "#ffca3a",
    image: "/5.png",
  },
  {
    id: "competition-admin",
    title: "智取食光 - 與三商家購合作",
    description:
      "與三商家購合作的校園智慧取餐／零食選購服務，於 BIRC Support 瀏覽商品並完成訂購。",
    tech: ["Next.js", "MySQL", "Python"],
    accent: "#8ac926",
    image: "/6.png",
    githubUrl: "#",
  },
  {
    id: "event-checkin",
    title: "使用 RAG 打造個人助理 – Scrum 助理",
    description:
      "以 LiteLLM、PostgreSQL、LangChain 與 Next.js 實作 RAG，提供 Scrum 知識檢索、即時問答與決策支援。",
    tech: ["Next.js", "MySQL"],
    accent: "#52b788",
    image: "/7.png",
    liveUrl: "#",
  },
  {
    id: "bic-website",
    title: "競賽行政支援系統",
    description:
      "第一屆商智黑客松官方網站，提供賽事介紹、流程規則、報名與歷屆資訊，主題為 1.5 日原型開發與 SDGs。",
    tech: ["Next.js"],
    accent: "#457b9d",
    image: "/8.png",
    liveUrl: "#",
  },
  {
    id: "lost-found",
    title: "智慧新聞 - 英文學習平臺",
    description:
      "結合 AI 的英文學習平台：瀏覽新聞、自動摘要關鍵點、字彙測驗，並可與 AI 對話深化閱讀。",
    tech: ["Django"],
    accent: "#e07a5f",
    image: "/9.png",
    githubUrl: "#",
  },
  {
    id: "scrum-assistant",
    title: "智慧病歷生成式人工智慧輔助優化及擴充急診版資訊服務專案",
    description:
      "臺北榮民總醫院急診智慧病歷系統，以生成式 AI 輔助病歷撰寫、ICD-10 建議與語音轉寫。",
    tech: ["Next.js", "Nvidia NIM", "RAG", "PostgreSQL"],
    accent: "#7209b7",
    image: "/10.png",
    liveUrl: "#",
    docsUrl: "#",
    githubUrl: "#",
  },
  {
    id: "fullstack-demo",
    title: "細胞病理管理平臺",
    description:
      "臺北榮民總醫院細胞病理平臺升級專案，整合病歷資料、診斷流程與 AI 輔助作業。",
    tech: ["Next.js"],
    accent: "#4361ee",
    image: "/11.png",
    githubUrl: "#",
    docsUrl: "#",
  },
  {
    id: "kiwi-bird",
    title: "KiWi BiRD · e起來Fun聊",
    description:
      "枋寮偏鄉社區暑期營隊「e起來Fun聊」教學紀錄，帶領孩童進行課堂互動與活動。",
    tech: ["教學活動"],
    accent: "#2b2b2b",
    image: "/12.png",
  },
  {
    id: "server-action-crud",
    title: "Next.js 框架下的全端開發示範專案",
    description:
      "以 Next.js Server Action 示範新增、讀取、更新與刪除，表單直接綁定 action、無需另寫 fetch。",
    tech: ["Next.js", "Server Action"],
    accent: "#6b7280",
    image: "/13.png",
  },
  {
    id: "birc-home",
    title: "商業智慧研究中心 - 官方網站",
    description:
      "國立臺北商業大學資訊管理系商業智慧研究中心官方網站，介紹中心、成員、課程與產學合作。",
    tech: ["Next.js"],
    accent: "#1d3557",
    image: "/14.png",
  },
  {
    id: "psm-i",
    title: "Professional Scrum Master I",
    description:
      "2026 年 3 月取得 Scrum.org Professional Scrum Master I（PSM I）專業認證。",
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
