"use client";

import { Fragment, useEffect, useState, useSyncExternalStore } from "react";
import { isBootDone, isBootDoneOnServer, subscribeBootDone } from "@/lib/boot";
import styles from "./RoomHint.module.scss";

type Segment = { text: string; accent?: boolean };

/** Seconds before the first character once the boot screen has gone, and per character after that. */
const START_DELAY = 0.6;
const SPEED = 0.055;
/** Extra pause after each line break, so the three lines read as separate sentences. */
const LINE_PAUSE = 0.35;

/** `corner` is where the 導覽 button sits: bottom right, or top right on phones. */
const hint = (corner: string): Segment[] => [
  { text: "點房間裡任何一樣物品，都會帶你認識不一樣的我。\n想先看自我介紹？點" },
  { text: "書桌上的電腦", accent: true },
  { text: "。\n或點" + corner + "的" },
  { text: "「☰ 導覽」", accent: true },
  { text: "，看全部清單。" },
];

const phoneQuery = "(max-width: 600px)";
const subscribePhone = (onChange: () => void) => {
  const mq = window.matchMedia(phoneQuery);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const isPhone = () => window.matchMedia(phoneQuery).matches;

/**
 * Caption beside the room's view controls that types out how to get around:
 * click any object, the desk computer for the intro, or 導覽 for the full list.
 * Typing starts once the boot screen has gone; the untyped rest is laid out
 * invisibly so the box doesn't grow while it types.
 */
export default function RoomHint() {
  const run = useSyncExternalStore(subscribeBootDone, isBootDone, isBootDoneOnServer);
  const phone = useSyncExternalStore(subscribePhone, isPhone, () => false);
  const segments = hint(phone ? "右上角" : "右下角");
  const total = segments.reduce((n, s) => n + [...s.text].length, 0);
  const [count, setCount] = useState(0);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!run) return;
    const all = segments.map((s) => s.text).join("");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let n = 0;
    const tick = () => {
      n = still ? total : n + 1;
      setCount(n);
      if (n < total) timer = window.setTimeout(tick, (SPEED + ([...all][n - 1] === "\n" ? LINE_PAUSE : 0)) * 1000);
    };
    let timer = window.setTimeout(tick, still ? 0 : START_DELAY * 1000);
    return () => window.clearTimeout(timer);
    // `segments` only changes with `phone`, and the corner word keeps the same length.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, total]);

  if (closed) return null;

  let left = count;
  const typed: Segment[] = [];
  const rest: Segment[] = [];
  for (const s of segments) {
    const chars = [...s.text];
    const take = Math.min(left, chars.length);
    left -= take;
    if (take) typed.push({ ...s, text: chars.slice(0, take).join("") });
    if (take < chars.length) rest.push({ ...s, text: chars.slice(take).join("") });
  }
  const render = (list: Segment[]) =>
    list.map((s, i) =>
      s.accent ? (
        <strong key={i} className={styles.accent}>
          {s.text}
        </strong>
      ) : (
        <Fragment key={i}>{s.text}</Fragment>
      ),
    );

  return (
    <div className={styles.hint} data-show={run} role="note">
      <p className={styles.text}>
        <span className={styles.srOnly}>{segments.map((s) => s.text).join("")}</span>
        <span aria-hidden>
          {render(typed)}
          <span className={styles.caret} data-done={count >= total} />
          <span className={styles.untyped}>{render(rest)}</span>
        </span>
      </p>
      <button type="button" className={styles.close} aria-label="關閉提示" onClick={() => setClosed(true)}>
        ✕
      </button>
    </div>
  );
}
