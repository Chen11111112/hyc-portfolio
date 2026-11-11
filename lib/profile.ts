// Intro + outbound links shown in the homepage terminal.

export const PROFILE_INTRO = {
  headline: "I am HungYu Chen, born in 2007.",
  roles: ["Full-stack Engineer | CSIA Ski Instructor", "PSM-I Scrum Master | Musician"],
  tagline: "I work with logic, motion, and sound.",
  note: "Holder of several professional certifications. with distinctions earned in programming competitions",
} as const;

/** `internal` links stay in this site (same tab); the rest open in a new tab. */
/** `featured` shows the link in its highlighted (selected) style by default. */
export type ProfileLink = { label: string; href: string; display: string; internal?: boolean; featured?: boolean };

export const PROFILE_LINKS: ProfileLink[] = [
  { label: "About", href: "/about", display: "專案・競賽・教學・志工・興趣・證照", internal: true },
  { label: "Course", href: "https://course.hychen.space/", display: "course.hychen.space", featured: true },
  { label: "Program", href: "https://hyc.eshachem.com/program", display: "hyc.eshachem.com/program" },
];
