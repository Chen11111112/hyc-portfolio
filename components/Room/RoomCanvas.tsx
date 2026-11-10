"use client";

import dynamic from "next/dynamic";
import IconWhite from "@/components/Brand/IconWhite";
import TerminalCard from "@/components/Terminal/TerminalCard";
import styles from "./Room.module.scss";

const RoomScene = dynamic(() => import("./RoomScene"), {
  ssr: false,
  loading: () => (
    <div className={styles.loading} role="status" aria-label="正在載入">
      <IconWhite className={styles.mark} />
    </div>
  ),
});

export default function RoomCanvas() {
  return (
    <div className={styles.root}>
      <RoomScene />
      {/* Rendered outside the dynamic (client-only) scene so the intro + links are in the SSR HTML. */}
      <TerminalCard />
    </div>
  );
}
