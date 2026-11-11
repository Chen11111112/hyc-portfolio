/**
 * What hangs on the two Life cork boards. Positions are fractions of the board (top-left corner of the
 * print), `width` is the print's photo width as a fraction of the board, `rot` is degrees clockwise.
 */
export type Shot = { src: string; alt: string; ratio: [number, number]; left: number; top: number; width: number; rot: number };

/** Sticker drawing on an 80 × 80 grid: outlined paths, then dots [cx, cy, rx, ry, fill]. */
export type StickerArt = {
  label: string;
  left: number;
  top: number;
  rot: number;
  paths: { d: string; fill: string; outline?: boolean }[];
  dots: [number, number, number, number, string][];
};

export type Board = { label: string; photos: Shot[]; stickers: StickerArt[] };

const EYE = "#1d1d21";

const DINO: StickerArt = {
  label: "恐龍貼紙",
  left: 0.87,
  top: 0.3,
  rot: -8,
  paths: [
    {
      outline: true,
      fill: "#3f8f4e",
      d: "M16 50c-8 2-12 10-6 12 6-2 10-1 12 2l-2 12h8l2-12c6 4 14 2 18-2l2 14h8l-4-16c8-2 14-10 10-16 6-2 8-8 4-12-6-2-12 2-14 8-6-4-14 0-16 6-8-2-16 2-18 8-4-2-10 0-12 4z",
    },
  ],
  dots: [[58, 30, 1.6, 1.6, EYE]],
};

const HEDGEHOG: StickerArt = {
  label: "刺蝟貼紙",
  left: 0.34,
  top: 0.34,
  rot: 7,
  paths: [
    {
      outline: true,
      fill: "#c4844e",
      d: "M22 46l6-14 5 10 7-16 6 12 8-14 6 12 7-12 5 12 6-8 4 10c2 8-2 16-10 20-10 6-28 8-40 2-8-4-14-12-10-14z",
    },
  ],
  dots: [
    [58, 44, 1.5, 1.5, EYE],
    [66, 45, 1.5, 1.5, EYE],
    [68, 50, 2.4, 1.6, "#a85a68"],
  ],
};

const KITTEN: StickerArt = {
  label: "小貓貼紙",
  left: 0.86,
  top: 0.79,
  rot: 8,
  paths: [
    {
      outline: true,
      fill: "#f2a35e",
      d: "M28 22l-6-12 12 8 8-2 8 2 12-8-4 14c8 4 12 12 10 20-2 12-14 20-28 18-8 8-4 10 2 12 8 2 14-4 14-4-10 2-22-2-26-12-8 2-16-2-16-12 0-10 6-16 12-20z",
    },
    { fill: "#f6c7c0", d: "M26 16l4 6 5-4zM48 14l5 6 3-7z" },
  ],
  dots: [
    [36, 32, 1.5, 1.5, EYE],
    [46, 32, 1.5, 1.5, EYE],
    [41, 37, 1.8, 1.3, "#e07a8a"],
  ],
};

const PUPPY: StickerArt = {
  label: "小狗貼紙",
  left: 0.02,
  top: 0.36,
  rot: -10,
  paths: [
    {
      outline: true,
      fill: "#e6c7a2",
      d: "M34 24c-8 2-12 10-10 18 2 2-4 6-2 12 4 10 16 16 28 14 10-2 16-10 16-18 4-2 6-8 2-12-2-8-8-16-16-16-4-6-12-8-18 2z",
    },
  ],
  dots: [
    [50, 40, 7, 5, "#f7e6d4"],
    [40, 32, 1.5, 1.5, EYE],
    [50, 32, 1.5, 1.5, EYE],
    [54, 40, 2.2, 1.6, EYE],
  ],
};

export const BOARDS: Board[] = [
  {
    label: "第一面軟木板",
    photos: [
      { src: "/life/concert.webp", alt: "音樂廳裡的合影", ratio: [576, 768], left: 0.06, top: 0.03, width: 0.134, rot: -3 },
      { src: "/life/kimono.webp", alt: "和室裡穿和服", ratio: [576, 768], left: 0.217, top: 0.04, width: 0.134, rot: 2 },
      { src: "/life/street.webp", alt: "街上帶著相機", ratio: [1536, 864], left: 0.374, top: 0.03, width: 0.206, rot: -1 },
      { src: "/life/award.webp", alt: "Python 競賽第一名", ratio: [1024, 769], left: 0.603, top: 0.05, width: 0.179, rot: 2 },
      { src: "/life/donki.webp", alt: "唐吉訶德電扶梯", ratio: [576, 768], left: 0.805, top: 0.03, width: 0.134, rot: -4 },
      { src: "/life/shrine.webp", alt: "夜裡的神社", ratio: [1536, 864], left: 0.06, top: 0.5, width: 0.206, rot: 3 },
      { src: "/life/sunny-room.webp", alt: "窗邊的陽光", ratio: [1024, 768], left: 0.282, top: 0.52, width: 0.179, rot: -2 },
      { src: "/life/recital.webp", alt: "鋼琴演奏會場", ratio: [576, 768], left: 0.476, top: 0.48, width: 0.134, rot: 4 },
      { src: "/life/photo-booth.webp", alt: "拍貼機照片", ratio: [512, 768], left: 0.626, top: 0.46, width: 0.12, rot: -3 },
      { src: "/life/train.webp", alt: "車窗邊的自拍", ratio: [1024, 768], left: 0.761, top: 0.52, width: 0.179, rot: 2 },
    ],
    stickers: [DINO, HEDGEHOG],
  },
  {
    label: "第二面軟木板",
    photos: [
      { src: "/life/concert-seat.webp", alt: "音樂廳座位區", ratio: [576, 768], left: 0.06, top: 0.04, width: 0.128, rot: -4 },
      { src: "/life/mitsui.webp", alt: "三井的自拍", ratio: [1024, 768], left: 0.203, top: 0.06, width: 0.171, rot: 2 },
      { src: "/life/matching-blue.webp", alt: "同色藍衣服", ratio: [1024, 768], left: 0.39, top: 0.04, width: 0.171, rot: -2 },
      { src: "/life/warped-mirror.webp", alt: "曲面鏡自拍", ratio: [432, 768], left: 0.576, top: 0.03, width: 0.111, rot: 3 },
      { src: "/life/cat-mirror.webp", alt: "和橘貓的鏡子自拍", ratio: [432, 768], left: 0.703, top: 0.05, width: 0.111, rot: -3 },
      { src: "/life/cafe.webp", alt: "咖啡廳裡的玩偶", ratio: [432, 768], left: 0.829, top: 0.03, width: 0.111, rot: 4 },
      { src: "/life/close-selfie.webp", alt: "靠在一起的自拍", ratio: [576, 768], left: 0.08, top: 0.54, width: 0.122, rot: -2 },
      { src: "/life/convex-mirror.webp", alt: "路邊的凸面鏡", ratio: [576, 768], left: 0.415, top: 0.52, width: 0.122, rot: 3 },
      { src: "/life/night.webp", alt: "夜裡的身影", ratio: [1024, 768], left: 0.749, top: 0.56, width: 0.171, rot: -1 },
    ],
    stickers: [KITTEN, PUPPY],
  },
];
