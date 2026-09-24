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
      <span className={styles.brand}>Hy.C</span>
    </div>
  );
}
