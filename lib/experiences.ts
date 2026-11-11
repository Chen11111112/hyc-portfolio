export const experiences = [
  { slug: "snowboard", label: "興趣・滑雪" },
  { slug: "teaching", label: "教學經歷" },
  { slug: "projects", label: "專案經歷" },
  { slug: "volunteer", label: "志工經歷" },
  { slug: "music", label: "興趣・音樂" },
  { slug: "composition", label: "興趣・作曲" },
  { slug: "competitions", label: "競賽經歷" },
  { slug: "certifications", label: "證照" },
  { slug: "math", label: "數學" },
  { slug: "marimba", label: "馬林巴琴" },
  { slug: "desk", label: "書桌" },
  { slug: "books", label: "興趣・閱讀" },
  { slug: "computer", label: "電腦" },
  { slug: "photos", label: "照片牆" },
  { slug: "piano", label: "興趣・樂高" },
  { slug: "guitars", label: "吉他" },
  { slug: "workshops", label: "工作坊" },
] as const;

export type ExperienceSlug = (typeof experiences)[number]["slug"];

export function experienceHref(slug: ExperienceSlug) {
  return `/experience/${slug}`;
}

export function getExperience(slug: string) {
  return experiences.find((item) => item.slug === slug);
}
