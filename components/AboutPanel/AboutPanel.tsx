import {
  getAboutSections,
  getIntroLead,
  getProjectExperience,
  getTechStack,
  type AboutSection,
} from "@/lib/about";
import styles from "./AboutPanel.module.scss";

function ProjectExperienceTable() {
  const rows = getProjectExperience();
  if (rows.length === 0) return null;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>單位</th>
            <th>專案名稱</th>
            <th>內容</th>
            <th>技術說明</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>{row.org}</td>
              <td>{row.name}</td>
              <td>{row.detail}</td>
              <td>{row.tech}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionBlock({ section }: { section: AboutSection }) {
  if (section.heading === "自我介紹") return null;

  if (section.heading === "專案經歷") {
    return (
      <div className={styles.section}>
        <h3 className={styles.heading}>{section.heading}</h3>
        <ProjectExperienceTable />
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.heading}>{section.heading}</h3>
      <ul className={styles.lines}>
        {section.lines.map((line, i) => (
          <li key={i} className={styles.line}>
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AboutPanel() {
  const lead = getIntroLead();
  const tech = getTechStack();
  const sections = getAboutSections();

  const nameMatch = lead.match(/我是(.+?)。/);
  const displayLead = nameMatch ? (
    <>
      我是<span className={styles.name}>{nameMatch[1]}</span>。
      {lead.slice(nameMatch[0].length)}
    </>
  ) : (
    lead
  );

  return (
    <aside className={styles.panel}>
      <p className={styles.mark}>Hy.C</p>
      <p className={styles.lead}>{displayLead}</p>
      {tech.length > 0 && (
        <p className={styles.roles}>{tech.join(" · ")}</p>
      )}
      {sections.map((section) => (
        <SectionBlock key={section.heading} section={section} />
      ))}
    </aside>
  );
}
