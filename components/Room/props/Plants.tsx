"use client";

import { ROOM_LINKS } from "@/lib/roomContent";
import Clickable from "../Clickable";
import { DESK, type Vec3 } from "../layout";
import LegoPlant from "./LegoPlant";

// LEGO flower pots on the window end of the desk (front-left, beside the desk books). Kept ~0.1 m off the
// side wall so pots and flowers clear the window sill and frame (sill reaches world x ≈ −0.12).
// Each pot is its own link: the terracotta and sage pots go to GitHub, the white one to GitLab.
const TOP = DESK.top;

type Pot = {
  position: Vec3;
  yaw: number;
  scale: number;
  link: { href: string; title: string };
  plant?: Parameters<typeof LegoPlant>[0];
};

const POTS: Pot[] = [
  { position: [-0.02, TOP, 0.33], yaw: 0.3, scale: 1, link: { href: ROOM_LINKS.github, title: "GitHub" } },
  {
    position: [-0.025, TOP, 0.5],
    yaw: -0.4,
    scale: 0.85,
    link: { href: ROOM_LINKS.gitlab, title: "GitLab" },
    plant: {
      pot: "#eeece6",
      rim: "#dcd9d0",
      blooms: [
        { petal: "#e2483d", center: "#1b1b1d" },
        { petal: "#f7d154", center: "#c4772b" },
        { petal: "#e2483d", center: "#f7d154" },
      ],
    },
  },
  {
    position: [0.085, TOP, 0.62],
    yaw: 0.9,
    scale: 0.75,
    link: { href: ROOM_LINKS.github, title: "GitHub" },
    plant: {
      pot: "#9db59a",
      rim: "#86a083",
      blooms: [
        { petal: "#7fb2f0", center: "#f5f1e6" },
        { petal: "#f7a35c", center: "#f7d154" },
        { petal: "#f5f1e6", center: "#f7d154" },
      ],
    },
  },
];

export default function Plants() {
  return (
    <group>
      {POTS.map((p) => (
        <Clickable
          key={p.position.join()}
          href={p.link.href}
          title={p.link.title}
          label={[p.position[0], p.position[1] + 0.36 * p.scale, p.position[2]]}
          zones={[{ position: [p.position[0], p.position[1] + 0.15 * p.scale, p.position[2]], size: [0.15 * p.scale, 0.3 * p.scale, 0.15 * p.scale] }]}
        >
          <group position={p.position} rotation={[0, p.yaw, 0]} scale={p.scale}>
            <LegoPlant {...p.plant} />
          </group>
        </Clickable>
      ))}
    </group>
  );
}
