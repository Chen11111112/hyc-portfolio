"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import IconWhite from "@/components/Brand/IconWhite";
import WordmarkWhite from "@/components/Brand/WordmarkWhite";
import { BOOT_READY, isBootReady, markBootDone } from "@/lib/boot";
import styles from "./BootScreen.module.scss";

// Length of the intro in BootScreen.module.scss; only used where the browser
// cannot report when the animations have finished.
const INTRO_MS = 1280;
const HOLD_MS = 360;
const MAX_MS = 10000;

export default function BootScreen() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"show" | "leave" | "done">("show");
  const screen = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== "show") return;

    let introDone = false;
    let appDone = pathname !== "/" || isBootReady();
    let left = false;
    let cancelled = false;
    let holdTimer = 0;

    const hide = () => {
      if (left || !introDone || !appDone) return;
      left = true;
      // Without motion there is no fade, so no transition end to wait for.
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setPhase(still ? "done" : "leave");
      markBootDone();
    };

    const onReady = () => {
      appDone = true;
      hide();
    };

    // The intro starts with the first paint, before this effect runs, so wait
    // for whatever is left of it and then keep the finished lockup up briefly.
    const hold = (wait: number) => {
      if (cancelled) return;
      holdTimer = window.setTimeout(() => {
        introDone = true;
        hide();
      }, wait);
    };

    const node = screen.current;
    if (node && typeof node.getAnimations === "function") {
      const running = node.getAnimations({ subtree: true }).map((animation) => animation.finished);
      void Promise.allSettled(running).then(() => hold(HOLD_MS));
    } else {
      hold(INTRO_MS + HOLD_MS);
    }

    const maxTimer = window.setTimeout(() => {
      appDone = true;
      introDone = true;
      hide();
    }, MAX_MS);

    window.addEventListener(BOOT_READY, onReady);

    return () => {
      cancelled = true;
      window.clearTimeout(holdTimer);
      window.clearTimeout(maxTimer);
      window.removeEventListener(BOOT_READY, onReady);
    };
  }, [pathname, phase]);

  if (phase === "done") return null;

  return (
    <div
      ref={screen}
      className={styles.screen}
      data-leave={phase === "leave" ? "" : undefined}
      role="status"
      aria-live="polite"
      aria-label="正在載入"
      onTransitionEnd={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.propertyName !== "opacity") return;
        setPhase("done");
      }}
    >
      <div className={styles.lockup}>
        <div className={styles.rise}>
          <div className={styles.shift}>
            <div className={styles.slide}>
              <WordmarkWhite className={styles.word} />
            </div>
            <div className={styles.cover} />
            <IconWhite className={styles.icon} />
          </div>
        </div>
      </div>
    </div>
  );
}
