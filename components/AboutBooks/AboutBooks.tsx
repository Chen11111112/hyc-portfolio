"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
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
 * About page: a stack of six 3D books works as the sidebar — click a book (or its tab) to pull it out
 * and read that story. All six stories are in the HTML; only the selected one is shown.
 */
export default function AboutBooks({ stories, intro }: { stories: Story[]; intro: string }) {
  const [active, setActive] = useState(stories[0]?.id ?? "");
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          ← 回到房間
        </Link>
        <h1 className={styles.title}>About</h1>
        {intro && <p className={styles.intro}>{intro}</p>}
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.stack}>
            <BookStack stories={stories} active={active} onSelect={setActive} />
          </div>
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
        </aside>

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
