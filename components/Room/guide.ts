import { ROOM_LINKS, SCORE_VIDEOS } from "@/lib/roomContent";

/** One clickable prop in the room: what it is, where it leads. Keep in sync with the <Clickable>s in RoomScene. */
export type GuideItem = { object: string; title: string; href: string };
export type GuideGroup = { heading: string; items: GuideItem[] };

export const ROOM_GUIDE: GuideGroup[] = [
  {
    heading: "關於我",
    items: [
      { object: "書桌上的電腦與手機", title: "自我介紹", href: "/about" },
      { object: "Dyson 電風扇", title: "個人主站", href: ROOM_LINKS.fan },
      { object: "海報牆", title: "專案經歷", href: "/about#projects" },
      { object: "洞洞板照片・照片串", title: "教學經歷", href: "/about#teaching" },
      { object: "證書牆", title: "證照", href: "/about#certifications" },
      { object: "獎盃架", title: "競賽經歷", href: "/about#competitions" },
      { object: "軟木板", title: "志工經歷", href: "/about#volunteer" },
      { object: "吉他・樂高鋼琴", title: "音樂經歷", href: "/about#music" },
      { object: "滑雪板與雪場地圖", title: "興趣・滑雪", href: "/about#interests-ski" },
    ],
  },
  {
    heading: "作品與學習",
    items: [
      { object: "白板", title: "Next.js 開發", href: ROOM_LINKS.whiteboard },
      { object: "書架", title: "Course 課程", href: ROOM_LINKS.bookshelf },
      { object: "窗下便條紙", title: "Program 程式", href: ROOM_LINKS.program },
      { object: "綠色筆記本", title: "Blog 部落格", href: ROOM_LINKS.blog },
      { object: "唱盤下的數學課本", title: "數學", href: ROOM_LINKS.math },
      { object: "桌下的 NAS", title: "後端與資料庫開發", href: ROOM_LINKS.nas },
      { object: "盆栽", title: "GitHub / GitLab", href: ROOM_LINKS.github },
    ],
  },
  {
    heading: "創作與社群",
    items: [
      { object: "馬林巴琴・MIDI 鍵盤", title: "興趣・作曲", href: ROOM_LINKS.marimba },
      { object: "麥克風", title: "興趣・作曲", href: ROOM_LINKS.microphone },
      ...SCORE_VIDEOS.map((v) => ({ object: `牆上樂譜「${v.title}」`, title: "YouTube", href: v.href })),
      { object: "黑膠唱盤", title: "Instagram", href: ROOM_LINKS.turntable },
      { object: "時鐘", title: "切換台北／當地時間", href: "" },
      { object: "書桌抽屜", title: "打開看看裡面的小東西", href: "" },
    ],
  },
];
