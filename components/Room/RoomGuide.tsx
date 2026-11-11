"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ROOM_GUIDE } from "./guide";
import styles from "./Room.module.scss";

/** Bottom-right "導覽" button: a panel listing which room objects are clickable and where each one leads. */
export default function RoomGuide() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div className={styles.guide} ref={rootRef}>
      {open && (
        <div id={panelId} className={styles.guidePanel} role="dialog" aria-label="房間導覽">
          <p className={styles.guideIntro}>房間裡發光的物品都能點，以下是它們會帶你去的地方：</p>
          {ROOM_GUIDE.map((group) => (
            <section key={group.heading}>
              <h2 className={styles.guideHeading}>{group.heading}</h2>
              <ul className={styles.guideList}>
                {group.items.map((item) => {
                  const body = (
                    <>
                      <span className={styles.guideObject}>{item.object}</span>
                      <span className={styles.guideTitle}>
                        {item.title}
                        {item.href && !item.href.startsWith("/") && <span aria-label="（開新分頁）"> ↗</span>}
                      </span>
                    </>
                  );
                  return (
                    <li key={item.object}>
                      {!item.href ? (
                        <div className={styles.guideRow}>{body}</div>
                      ) : item.href.startsWith("/") ? (
                        <Link className={styles.guideRow} href={item.href} onClick={() => setOpen(false)}>
                          {body}
                        </Link>
                      ) : (
                        <a className={styles.guideRow} href={item.href} target="_blank" rel="noopener noreferrer">
                          {body}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
      <button
        type="button"
        className={styles.reset}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "✕ 關閉導覽" : "☰ 導覽"}
      </button>
    </div>
  );
}
