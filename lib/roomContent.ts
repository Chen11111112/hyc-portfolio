// Editable content for the room's wall props. Everything here is plain data — update freely.

export type Certificate = {
  name: string;
  title: string;
  issuer: string;
  /** Certificate scan in public/; without one a drawn certificate is shown. */
  src?: string;
  /** Verification page, if the issuer has one. */
  href?: string;
  /** Accent colour for the drawn version. */
  accent?: string;
};

/** Certificate wall above the bookshelf (證照). From about.md 專業證照. */
export const CERTIFICATES: Certificate[] = [
  {
    name: "PSM I",
    title: "Professional Scrum Master I",
    issuer: "Scrum.org",
    src: "/PSM.png",
    href: "https://scrum.org/certificates/1302714",
  },
  {
    name: "PSPO I",
    title: "Professional Scrum Product Owner I",
    issuer: "Scrum.org",
    src: "/PSPO.png",
    href: "https://scrum.org/certificates/1357186",
  },
  {
    name: "CSIA Level 1",
    title: "加拿大滑雪教練聯盟 一級指導員",
    issuer: "Canadian Ski Instructors' Alliance",
    accent: "#c8102e",
  },
  {
    name: "JLPT N3",
    title: "日本語能力試驗 N3 合格",
    issuer: "Japanese-Language Proficiency Test",
    accent: "#2f5aa8",
  },
];

/** Trophy shelf (競賽經歷). From about.md 競賽經歷; `place` 1–4 → trophy, anything else → medal. */
export const COMPETITIONS: { event: string; result: string; place: 1 | 2 | 3 | 4 | "honor" }[] = [
  { event: "115 資訊月 資訊應用技能競賽 團體組", result: "第一名", place: 1 },
  { event: "全國大專 Python 數據分析菁英挑戰賽 高中組", result: "第一名", place: 1 },
  { event: "九校聯盟程式設計競賽", result: "全校第二名", place: 2 },
  { event: "十校技職聯盟資安與程式設計競賽", result: "第三名", place: 3 },
  { event: "跨校聯盟程式設計競賽", result: "全校第四名", place: 4 },
  { event: "全國程式力競賽 高中組", result: "佳作", place: "honor" },
  { event: "全國大專 Python 數據分析菁英挑戰賽", result: "佳作", place: "honor" },
];

/** Corkboard (志工經歷). From about.md 志工經歷. */
export const VOLUNTEER_BOARD = {
  notes: [
    { text: "枋寮偏鄉\n暑期營隊\n2025", color: "#f7e26b" },
    { text: "華碩文教基金會\n志工計劃\n第一名", color: "#9fd8f0" },
    { text: "線上教學\n輔導枋寮孩童", color: "#f5a8c4" },
  ],
  thanks: { title: "志工服務感謝狀", from: "國立臺北商業大學", year: "2025" },
  badge: { title: "志工", org: "教育部青年發展處" },
} as const;

/** Where the handwritten scores above the marimba link to (your works). */
export const MUSIC_HREF = "https://www.youtube.com/@Hy.C";

/**
 * Polaroids on the string above the marimba (workshop photos). Put images in public/room/workshops/
 * and set `src` (e.g. "/room/workshops/2025-ai.jpg"); entries without `src` show a placeholder picture.
 */
export const WORKSHOP_PHOTOS: { src?: string }[] = [{}, {}, {}, {}, {}, {}];

/** Click-through destinations for room props. */
export const ROOM_LINKS = {
  whiteboard: "https://nextjs.hychen.space",
  bookshelf: "https://course.hychen.space",
  marimba: "https://www.youtube.com/@Hy.C",
  turntable: "https://www.instagram.com/hy.chen._.1029/",
  notebook: "https://eminent-glider-8c3.notion.site/3cb9def5443d804882e3e4e125207995?pvs=74",
  nas: "https://eminent-glider-8c3.notion.site/2b39def5443d80b9acfad70961d88589?pvs=74",
} as const;
