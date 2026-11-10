"use client";

import { useState, type CSSProperties } from "react";
import { PROFILE_INTRO, PROFILE_LINKS } from "@/lib/profile";
import styles from "./TerminalCard.module.scss";

/** Seconds at which each line appears; commands "type" over their own duration. */
const CMD_SPEED = 0.045;

function Prompt({ cmd, at }: { cmd: string; at: number }) {
  return (
    <p className={styles.line} style={{ "--d": `${at}s` } as CSSProperties}>
      <span className={styles.user}>hyc@room</span>
      <span className={styles.sep}>:</span>
      <span className={styles.path}>~</span>
      <span className={styles.sep}>$ </span>
      <span
        className={styles.cmd}
        style={{ "--n": cmd.length, "--d": `${at}s`, "--dur": `${cmd.length * CMD_SPEED}s` } as CSSProperties}
      >
        {cmd}
      </span>
    </p>
  );
}

/**
 * Floating terminal over the 3D room: `whoami` prints the intro, `ls ~/links` lists outbound links.
 * All text is in the server-rendered HTML; the typing is CSS-only (and off for reduced motion).
 */
export default function TerminalCard() {
  const [open, setOpen] = useState(true);
  const intro = 0.35 + "whoami".length * CMD_SPEED + 0.15;
  const lsAt = intro + 0.9;
  const links = lsAt + "ls ~/links".length * CMD_SPEED + 0.15;
  const out = (i: number, base: number) => ({ "--d": `${base + i * 0.12}s` }) as CSSProperties;

  return (
    <section className={styles.card} data-open={open} aria-label="About Hy.C">
      <header className={styles.bar}>
        <span className={styles.dots} aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span className={styles.title}>hyc@room: ~</span>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls="hyc-terminal-body"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "–" : "+"}
          <span className={styles.srOnly}>{open ? "Minimize terminal" : "Expand terminal"}</span>
        </button>
      </header>
      <div id="hyc-terminal-body" className={styles.body} hidden={!open}>
        <Prompt cmd="whoami" at={0.35} />
        <h1 className={`${styles.line} ${styles.headline}`} style={out(0, intro)}>
          {PROFILE_INTRO.headline}
        </h1>
        {PROFILE_INTRO.roles.map((r, i) => (
          <p key={r} className={`${styles.line} ${styles.role}`} style={out(i + 1, intro)}>
            {r}
          </p>
        ))}
        <p className={`${styles.line} ${styles.tagline}`} style={out(3, intro)}>
          {PROFILE_INTRO.tagline}
        </p>
        <p className={`${styles.line} ${styles.muted}`} style={out(4, intro)}>
          {PROFILE_INTRO.note}
        </p>

        <Prompt cmd="ls ~/links" at={lsAt} />
        <ul className={styles.links}>
          {PROFILE_LINKS.map((l, i) => (
            <li key={l.label} className={styles.line} style={out(i, links)}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" className={styles.link}>
                <span className={styles.arrow} aria-hidden>
                  →
                </span>
                <span className={styles.label}>{l.label}</span>
                <span className={styles.display}>{l.display}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className={styles.line} style={out(PROFILE_LINKS.length, links)}>
          <span className={styles.user}>hyc@room</span>
          <span className={styles.sep}>:</span>
          <span className={styles.path}>~</span>
          <span className={styles.sep}>$ </span>
          <span className={styles.cursor} aria-hidden />
        </p>
      </div>
    </section>
  );
}
