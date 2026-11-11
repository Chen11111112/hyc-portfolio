import type { Metadata } from "next";
import LifeWall from "@/components/Life/LifeWall";

export const metadata: Metadata = {
  title: "Life",
  description: "陳泓毓（Hy.C）的生活：軟木板照片牆、貼紙，和書桌上的黏土。",
  alternates: { canonical: "/life" },
};

export default function LifePage() {
  return <LifeWall />;
}
