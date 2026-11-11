import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./LifeWall.module.scss";

const PHOTOS: { color: string; pin: string; place: string }[] = [
  { color: "#e07a5f", pin: "#d64545", place: styles.p1 },
  { color: "#3d5a80", pin: "#3d6ea8", place: styles.p2 },
  { color: "#81b29a", pin: "#d4a017", place: styles.p3 },
  { color: "#6d597a", pin: "#d64545", place: styles.p4 },
  { color: "#f2cc8f", pin: "#3d6ea8", place: styles.p5 },
  { color: "#e9c46a", pin: "#2f8f5b", place: styles.p6 },
  { color: "#2a9d8f", pin: "#d4a017", place: styles.p7 },
  { color: "#e76f51", pin: "#d64545", place: styles.p8 },
];

const CLAYS: { color: string; left: string; bottom: string; width: string; height: string; radius: string }[] = [
  { color: "#d97862", left: "8%", bottom: "18%", width: "clamp(52px, 6vw, 84px)", height: "clamp(44px, 7vh, 72px)", radius: "46% 42% 36% 40% / 48% 44% 34% 40%" },
  { color: "#e7c27a", left: "26%", bottom: "42%", width: "clamp(40px, 4.5vw, 64px)", height: "clamp(36px, 5vh, 52px)", radius: "14px" },
  { color: "#8eaa86", left: "42%", bottom: "12%", width: "clamp(56px, 6.5vw, 96px)", height: "clamp(48px, 8vh, 80px)", radius: "38% 42% 28% 32% / 30% 36% 44% 40%" },
  { color: "#d9b39a", left: "62%", bottom: "36%", width: "clamp(44px, 5vw, 70px)", height: "clamp(44px, 5vw, 70px)", radius: "50%" },
  { color: "#7eafc6", left: "78%", bottom: "16%", width: "clamp(50px, 5.5vw, 78px)", height: "clamp(42px, 7vh, 68px)", radius: "10px 26px 12px 22px" },
];

function Photo({ color, pin, place }: (typeof PHOTOS)[number]) {
  return (
    <figure className={`${styles.photo} ${place}`} aria-label="照片">
      <span className={styles.pin} style={{ background: pin }} aria-hidden />
      <span className={styles.swatch} style={{ background: color }} />
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

export default function LifeWall() {
  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>生活</h1>
      <Link href="/" className={styles.back}>
        ← 回到房間
      </Link>

      <div className={styles.board}>
        {PHOTOS.map((photo) => (
          <Photo key={photo.color} {...photo} />
        ))}

        <Sticker label="恐龍貼紙" className={styles.dino}>
          <path
            {...stroke}
            fill="#3f8f4e"
            d="M16 50c-8 2-12 10-6 12 6-2 10-1 12 2l-2 12h8l2-12c6 4 14 2 18-2l2 14h8l-4-16c8-2 14-10 10-16 6-2 8-8 4-12-6-2-12 2-14 8-6-4-14 0-16 6-8-2-16 2-18 8-4-2-10 0-12 4z"
          />
          <circle cx="58" cy="30" r="1.6" fill="#1d1d21" />
        </Sticker>

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
