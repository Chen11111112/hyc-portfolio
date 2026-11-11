"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProjectExperienceRow } from "@/lib/about";
import styles from "./AboutBooks.module.scss";

export type StoryItem = { text: string; year?: string };

export type Story = {
  id: string;
  title: string;
  en: string;
  /** Spine colour of this story's book. */
  color: string;
  rows?: ProjectExperienceRow[];
  items?: StoryItem[];
  groups?: { label: string; items: StoryItem[] }[];
  /** Accordion sections; each `id` is also a URL hash (`/about#<id>`) that opens it. */
  folds?: { id: string; label: string; items: StoryItem[] }[];
};

/** The 3D book stack is client-only; the text tabs below it work without WebGL. */
const BookStack = dynamic(() => import("./BookStack"), { ssr: false, loading: () => <div className={styles.stackLoading} /> });

function Items({ items }: { items: StoryItem[] }) {
  return (
    <ul className={styles.items}>
      {items.map((it) => (
        <li key={it.text + (it.year ?? "")} className={styles.item}>
          <span>{it.text}</span>
          {it.year && <span className={styles.year}>{it.year}</span>}
        </li>
      ))}
    </ul>
  );
}

/** One fold open at a time; clicking the open one closes it. */
function Folds({ folds, open, onToggle }: { folds: NonNullable<Story["folds"]>; open: string | null; onToggle: (id: string) => void }) {
  return (
    <div className={styles.folds}>
      {folds.map((f) => {
        const expanded = open === f.id;
        return (
          <div key={f.id} className={styles.fold}>
            <h3 className={styles.foldHeading}>
              <button
                type="button"
                id={`fold-${f.id}`}
                className={styles.foldButton}
                aria-expanded={expanded}
                aria-controls={`fold-panel-${f.id}`}
                onClick={() => onToggle(f.id)}
              >
                <span>{f.label}</span>
                <span className={styles.foldCount}>{f.items.length}</span>
                <span className={styles.foldChevron} aria-hidden />
              </button>
            </h3>
            <div id={`fold-panel-${f.id}`} role="region" aria-labelledby={`fold-${f.id}`} hidden={!expanded} className={styles.foldPanel}>
              <Items items={f.items} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Projects({ rows }: { rows: ProjectExperienceRow[] }) {
  const orgs = [...new Set(rows.map((r) => r.org))];
  return (
    <div className={styles.orgs}>
      {orgs.map((org) => (
        <section key={org} className={styles.org}>
          <h3 className={styles.orgName}>{org}</h3>
          <ul className={styles.projects}>
            {rows
              .filter((r) => r.org === org)
              .map((r) => (
                <li key={r.name} className={styles.project}>
                  <p className={styles.projectName}>{r.name}</p>
                  {r.detail && <p className={styles.projectDetail}>{r.detail}</p>}
                  {r.tech && (
                    <p className={styles.chips}>
                      {r.tech
                        .split("、")
                        .filter(Boolean)
                        .map((t) => (
                          <span key={t} className={styles.chip}>
                            {t}
                          </span>
                        ))}
                    </p>
                  )}
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/**
 * About page: the room's desk fills the page and the six story books standing on it are the navigation —
 * click a book (or its tab) to pull it out and read that story in the panel on the right. All six stories are in the HTML; only the selected one is shown.
 */
export default function AboutBooks({ stories, intro }: { stories: Story[]; intro: string }) {
  const [active, setActive] = useState(stories[0]?.id ?? "");
  const [openFold, setOpenFold] = useState<string | null>(null);
  // `/about#competitions` (e.g. from the room's trophy shelf) opens that book;
  // `/about#interests-music` opens the book holding that fold, with the fold expanded.
  useEffect(() => {
    const fromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (stories.some((s) => s.id === id)) return setActive(id);
      const owner = stories.find((s) => s.folds?.some((f) => f.id === id));
      if (owner) {
        setActive(owner.id);
        setOpenFold(id);
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [stories]);
  return (
    <main className={styles.page}>
      {/* The room's desk fills the page; the books on it are the navigation. */}
      <div className={styles.scene}>
        <BookStack stories={stories} active={active} onSelect={setActive} />
      </div>

      <div className={styles.overlay}>
        <header className={styles.header}>
          <Link href="/" className={styles.back}>
            ← 回到房間
          </Link>
          <h1 className={styles.title}>About</h1>
          {intro && <p className={styles.intro}>{intro}</p>}
          <nav className={styles.tabs} role="tablist" aria-label="About sections">
            {stories.map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                id={`tab-${s.id}`}
                aria-selected={active === s.id}
                aria-controls={`panel-${s.id}`}
                className={styles.tab}
                style={{ "--book": s.color } as React.CSSProperties}
                onClick={() => setActive(s.id)}
              >
                <span className={styles.swatch} aria-hidden />
                {s.title}
              </button>
            ))}
          </nav>
          <p className={styles.hint}>點擊桌上的書，翻開那段經歷</p>
        </header>

        <div className={styles.content}>
          {stories.map((s) => (
            <section
              key={s.id}
              id={`panel-${s.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${s.id}`}
              hidden={active !== s.id}
              className={styles.panel}
              style={{ "--book": s.color } as React.CSSProperties}
            >
              <p className={styles.kicker}>{s.en}</p>
              <h2 className={styles.panelTitle}>{s.title}</h2>
              {s.rows && <Projects rows={s.rows} />}
              {s.items && <Items items={s.items} />}
              {s.folds && <Folds folds={s.folds} open={openFold} onToggle={(id) => setOpenFold((cur) => (cur === id ? null : id))} />}
              {s.groups?.map((g) => (
                <div key={g.label} className={styles.group}>
                  <h3 className={styles.groupLabel}>{g.label}</h3>
                  <Items items={g.items} />
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
