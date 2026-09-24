import AboutPanel from "@/components/AboutPanel/AboutPanel";
import ProjectCarouselWrapper from "@/components/ProjectCarousel/ProjectCarouselWrapper";
import { projects } from "@/lib/projects";
import styles from "./HomeContent.module.scss";

type Props = {
  activeProjectId?: string | null;
};

export default function HomeContent({ activeProjectId = null }: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.aboutWrap} data-about>
        <AboutPanel />
      </div>
      <ProjectCarouselWrapper
        projects={projects}
        activeProjectId={activeProjectId}
      />
      {!activeProjectId && (
        <nav className={styles.cornerNav} aria-label="Portfolio">
          <p className={styles.cornerTitle}>Portfolio</p>
          <hr className={styles.cornerRule} />
          <div className={styles.cornerLinks}>
            <a
              className={styles.cornerLink}
              href="https://hyc.eshachem.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Home
            </a>
            <a
              className={styles.cornerLink}
              href="https://hyc.eshachem.com/program/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Program
            </a>
            <a
              className={styles.cornerLink}
              href="https://course.hychen.space/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Course
            </a>
          </div>
        </nav>
      )}
      <span className={styles.brand}>Hy.C</span>
    </div>
  );
}
