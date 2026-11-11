"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type PointerEvent, type ReactNode } from "react";
import styles from "./LifeWall.module.scss";

const PINS = ["#d64545", "#3d6ea8", "#d4a017", "#2f8f5b"];

type Shot = { src: string; alt: string; place: string; ratio: string };

const BOARD_ONE: Shot[] = [
  { src: "/life/concert.webp", alt: "音樂廳裡的合影", place: styles.a1, ratio: "576 / 768" },
  { src: "/life/kimono.webp", alt: "和室裡穿和服", place: styles.a2, ratio: "576 / 768" },
  { src: "/life/street.webp", alt: "街上帶著相機", place: styles.a3, ratio: "1536 / 864" },
  { src: "/life/award.webp", alt: "Python 競賽第一名", place: styles.a4, ratio: "1024 / 769" },
  { src: "/life/donki.webp", alt: "唐吉訶德電扶梯", place: styles.a5, ratio: "576 / 768" },
  { src: "/life/shrine.webp", alt: "夜裡的神社", place: styles.a6, ratio: "1536 / 864" },
  { src: "/life/sunny-room.webp", alt: "窗邊的陽光", place: styles.a7, ratio: "1024 / 768" },
  { src: "/life/recital.webp", alt: "鋼琴演奏會場", place: styles.a8, ratio: "576 / 768" },
  { src: "/life/photo-booth.webp", alt: "拍貼機照片", place: styles.a9, ratio: "512 / 768" },
  { src: "/life/train.webp", alt: "車窗邊的自拍", place: styles.a10, ratio: "1024 / 768" },
];

const BOARD_TWO: Shot[] = [
  { src: "/life/concert-seat.webp", alt: "音樂廳座位區", place: styles.b1, ratio: "576 / 768" },
  { src: "/life/mitsui.webp", alt: "三井的自拍", place: styles.b2, ratio: "1024 / 768" },
  { src: "/life/matching-blue.webp", alt: "同色藍衣服", place: styles.b3, ratio: "1024 / 768" },
  { src: "/life/warped-mirror.webp", alt: "曲面鏡自拍", place: styles.b4, ratio: "432 / 768" },
  { src: "/life/cat-mirror.webp", alt: "和橘貓的鏡子自拍", place: styles.b5, ratio: "432 / 768" },
  { src: "/life/cafe.webp", alt: "咖啡廳裡的玩偶", place: styles.b6, ratio: "432 / 768" },
  { src: "/life/close-selfie.webp", alt: "靠在一起的自拍", place: styles.b7, ratio: "576 / 768" },
  { src: "/life/convex-mirror.webp", alt: "路邊的凸面鏡", place: styles.b8, ratio: "576 / 768" },
  { src: "/life/night.webp", alt: "夜裡的身影", place: styles.b9, ratio: "1024 / 768" },
];

const CLAYS: { color: string; left: string; bottom: string; width: string; height: string; radius: string }[] = [
  { color: "#d97862", left: "8%", bottom: "18%", width: "clamp(52px, 6vw, 84px)", height: "clamp(44px, 7vh, 72px)", radius: "46% 42% 36% 40% / 48% 44% 34% 40%" },
  { color: "#e7c27a", left: "26%", bottom: "42%", width: "clamp(40px, 4.5vw, 64px)", height: "clamp(36px, 5vh, 52px)", radius: "14px" },
  { color: "#8eaa86", left: "42%", bottom: "12%", width: "clamp(56px, 6.5vw, 96px)", height: "clamp(48px, 8vh, 80px)", radius: "38% 42% 28% 32% / 30% 36% 44% 40%" },
  { color: "#d9b39a", left: "62%", bottom: "36%", width: "clamp(44px, 5vw, 70px)", height: "clamp(44px, 5vw, 70px)", radius: "50%" },
  { color: "#7eafc6", left: "78%", bottom: "16%", width: "clamp(50px, 5.5vw, 78px)", height: "clamp(42px, 7vh, 68px)", radius: "10px 26px 12px 22px" },
];

function Photo({ src, alt, place, pin, ratio }: Shot & { pin: string }) {
  return (
    <figure className={`${styles.photo} ${place}`}>
      <span className={styles.pin} style={{ background: pin }} aria-hidden />
      <span className={styles.frame} style={{ aspectRatio: ratio }}>
        <Image src={src} alt={alt} fill sizes="(max-width: 760px) 46vw, 24vw" className={styles.shot} draggable={false} />
      </span>
    </figure>
  );
}

function Sticker({ label, className, children }: { label: string; className: string; children: ReactNode }) {
  return (
    <div className={`${styles.sticker} ${className}`} role="img" aria-label={label}>
      <svg viewBox="0 0 80 80" aria-hidden>
        {children}
      </svg>
    </div>
  );
}

const stroke = { stroke: "#fff", strokeWidth: 4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

function Dino() {
  return (
    <Sticker label="恐龍貼紙" className={styles.dino}>
      <path
        {...stroke}
        fill="#3f8f4e"
        d="M16 50c-8 2-12 10-6 12 6-2 10-1 12 2l-2 12h8l2-12c6 4 14 2 18-2l2 14h8l-4-16c8-2 14-10 10-16 6-2 8-8 4-12-6-2-12 2-14 8-6-4-14 0-16 6-8-2-16 2-18 8-4-2-10 0-12 4z"
      />
      <circle cx="58" cy="30" r="1.6" fill="#1d1d21" />
    </Sticker>
  );
}

function Hedgehog() {
  return (
    <Sticker label="刺蝟貼紙" className={styles.hedgehog}>
      <path
        {...stroke}
        fill="#c4844e"
        d="M22 46l6-14 5 10 7-16 6 12 8-14 6 12 7-12 5 12 6-8 4 10c2 8-2 16-10 20-10 6-28 8-40 2-8-4-14-12-10-14z"
      />
      <circle cx="58" cy="44" r="1.5" fill="#1d1d21" />
      <circle cx="66" cy="45" r="1.5" fill="#1d1d21" />
      <ellipse cx="68" cy="50" rx="2.4" ry="1.6" fill="#a85a68" />
    </Sticker>
  );
}

function Kitten() {
  return (
    <Sticker label="小貓貼紙" className={styles.kitten}>
      <path
        {...stroke}
        fill="#f2a35e"
        d="M28 22l-6-12 12 8 8-2 8 2 12-8-4 14c8 4 12 12 10 20-2 12-14 20-28 18-8 8-4 10 2 12 8 2 14-4 14-4-10 2-22-2-26-12-8 2-16-2-16-12 0-10 6-16 12-20z"
      />
      <path fill="#f6c7c0" d="M26 16l4 6 5-4zM48 14l5 6 3-7z" />
      <circle cx="36" cy="32" r="1.5" fill="#1d1d21" />
      <circle cx="46" cy="32" r="1.5" fill="#1d1d21" />
      <ellipse cx="41" cy="37" rx="1.8" ry="1.3" fill="#e07a8a" />
    </Sticker>
  );
}

function Puppy() {
  return (
    <Sticker label="小狗貼紙" className={styles.puppy}>
      <path
        {...stroke}
        fill="#e6c7a2"
        d="M34 24c-8 2-12 10-10 18 2 2-4 6-2 12 4 10 16 16 28 14 10-2 16-10 16-18 4-2 6-8 2-12-2-8-8-16-16-16-4-6-12-8-18 2z"
      />
      <ellipse cx="50" cy="40" rx="7" ry="5" fill="#f7e6d4" />
      <circle cx="40" cy="32" r="1.5" fill="#1d1d21" />
      <circle cx="50" cy="32" r="1.5" fill="#1d1d21" />
      <ellipse cx="54" cy="40" rx="2.2" ry="1.6" fill="#1d1d21" />
    </Sticker>
  );
}

export default function LifeWall() {
  const wallRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ x: 0, left: 0, active: false });

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = wallRef.current;
    if (!el) return;
    drag.current = { x: e.clientX, left: el.scrollLeft, active: true };
    el.setPointerCapture(e.pointerId);
    el.style.scrollSnapType = "none";
    el.style.scrollBehavior = "auto";
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = wallRef.current;
    if (!el || !drag.current.active) return;
    el.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
  };

  const onPointerUp = () => {
    const el = wallRef.current;
    if (!el || !drag.current.active) return;
    drag.current.active = false;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    el.style.scrollSnapType = "";
    el.style.scrollBehavior = "";
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>生活</h1>
      <Link href="/" className={styles.back}>
        ← 回到房間
      </Link>

      <div
        ref={wallRef}
        className={styles.wall}
        aria-label="軟木板照片牆，往左滑到第二面"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <section className={styles.board} aria-label="第一面軟木板">
          <div className={styles.cork}>
            {BOARD_ONE.map((photo, i) => (
              <Photo key={photo.src} {...photo} pin={PINS[i % PINS.length]} />
            ))}
            <Dino />
            <Hedgehog />
          </div>
        </section>
        <section className={styles.board} aria-label="第二面軟木板">
          <div className={styles.cork}>
            {BOARD_TWO.map((photo, i) => (
              <Photo key={photo.src} {...photo} pin={PINS[i % PINS.length]} />
            ))}
            <Kitten />
            <Puppy />
          </div>
        </section>
      </div>

      <div className={styles.desk}>
        <div className={styles.surface}>
          {CLAYS.map((clay) => (
            <span key={clay.color} className={styles.clay} style={clay} role="img" aria-label="黏土模型" />
          ))}
        </div>
        <div className={styles.front} />
      </div>
    </main>
  );
}
