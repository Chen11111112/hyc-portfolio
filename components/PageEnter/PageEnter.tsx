"use client";

import { useEffect, useState } from "react";
import styles from "./PageEnter.module.scss";

const ENTER_MS = 1800;

export default function PageEnter({ children }: { children: React.ReactNode }) {
  const [enter, setEnter] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => setEnter(false), ENTER_MS);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className={styles.root} data-enter={enter ? "" : undefined}>
      {children}
    </div>
  );
}
