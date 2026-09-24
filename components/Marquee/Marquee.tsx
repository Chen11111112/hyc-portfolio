import Link from "next/link";
import styles from "./Marquee.module.scss";

const REPEAT = 12;
const items = Array.from({ length: REPEAT * 2 }, () => "HyC.");

export default function Marquee() {
  return (
    <div className={styles.wrap}>
      <Link href="/" className={styles.homeLink} data-marquee aria-label="回到首頁">
        <div className={styles.track}>
          {items.map((text, i) => (
            <span key={i} className={styles.item} aria-hidden={i > 0}>
              {text}
            </span>
          ))}
        </div>
      </Link>
    </div>
  );
}
