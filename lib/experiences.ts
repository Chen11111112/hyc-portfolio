export const experiences = [
  { slug: "snowboard", label: "雪板" },
  { slug: "marimba", label: "馬林巴琴" },
  { slug: "desk", label: "書桌" },
  { slug: "books", label: "書櫃" },
  { slug: "computer", label: "電腦" },
  { slug: "photos", label: "照片牆" },
  { slug: "piano", label: "樂高鋼琴" },
  { slug: "guitars", label: "吉他" },
] as const;

export type ExperienceSlug = (typeof experiences)[number]["slug"];

export function experienceHref(slug: ExperienceSlug) {
  return `/experience/${slug}`;
}

export function getExperience(slug: string) {
  return experiences.find((item) => item.slug === slug);
}
