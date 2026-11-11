"use client";

import { Box, Cyl } from "./primitives";

// LEGO-style potted plant: studded brick pot, square stems, studded plate leaves, and flowers
// built from stacked round plates. Origin at the bottom centre of the pot.
const PLASTIC = { roughness: 0.3, metalness: 0 };
const STUD_R = 0.0048;
const STUD_H = 0.0034;
const POT = { w: 0.12, h: 0.085, color: "#6e3b24" };
const GREEN = "#4b9b3c";
const DARK_GREEN = "#2f6e2a";

function Studs({ cols, rows, pitch, y, color }: { cols: number; rows: number; pitch: number; y: number; color: string }) {
  const out = [];
  for (let i = 0; i < cols; i += 1) {
    for (let j = 0; j < rows; j += 1) {
      out.push(
        <Cyl
          key={`${i}-${j}`}
          r={STUD_R}
          h={STUD_H}
          seg={12}
          position={[(i - (cols - 1) / 2) * pitch, y + STUD_H / 2, (j - (rows - 1) / 2) * pitch]}
          color={color}
          {...PLASTIC}
          cast={false}
        />,
      );
    }
  }
  return <>{out}</>;
}

function Leaf({ position, rotation, length = 0.05 }: { position: [number, number, number]; rotation: [number, number, number]; length?: number }) {
  return (
    <group position={position} rotation={rotation}>
      <Box size={[length, 0.004, 0.024]} position={[length / 2, 0, 0]} color={GREEN} {...PLASTIC} />
      <Studs cols={2} rows={1} pitch={0.016} y={0.002} color={GREEN} />
    </group>
  );
}

function Flower({ position, petal, center }: { position: [number, number, number]; petal: string; center: string }) {
  return (
    <group position={position}>
      {Array.from({ length: 5 }, (_, k) => {
        const a = (k / 5) * Math.PI * 2;
        return (
          <Cyl key={k} r={0.012} h={0.004} seg={16} position={[Math.cos(a) * 0.014, 0, Math.sin(a) * 0.014]} color={petal} {...PLASTIC} />
        );
      })}
      <Cyl r={0.009} h={0.008} seg={16} position={[0, 0.004, 0]} color={center} {...PLASTIC} />
      <Cyl r={STUD_R} h={STUD_H} seg={12} position={[0, 0.008 + STUD_H / 2, 0]} color={center} {...PLASTIC} cast={false} />
    </group>
  );
}

type Bloom = { petal: string; center: string };

const DEFAULT_BLOOMS: [Bloom, Bloom, Bloom] = [
  { petal: "#f28cb1", center: "#f7d154" },
  { petal: "#f5f1e6", center: "#f2a93b" },
  { petal: "#c45bd0", center: "#f7d154" },
];

/** `blooms` colours the three flowers (tallest is the second); `pot` / `rim` colour the brick pot. */
export default function LegoPlant({
  blooms = DEFAULT_BLOOMS,
  pot = POT.color,
  rim = "#7d4630",
}: {
  blooms?: [Bloom, Bloom, Bloom];
  pot?: string;
  rim?: string;
}) {
  const soilY = POT.h - 0.008;
  const stems: { x: number; z: number; h: number; bloom: Bloom; tilt: [number, number, number] }[] = [
    { x: -0.02, z: 0.01, h: 0.2, bloom: blooms[0], tilt: [0.06, 0, 0.12] },
    { x: 0.022, z: -0.012, h: 0.24, bloom: blooms[1], tilt: [-0.08, 0, -0.1] },
    { x: 0.004, z: 0.025, h: 0.16, bloom: blooms[2], tilt: [0.18, 0, 0.02] },
  ];
  return (
    <group>
      {/* Brick pot with a rim and studded soil plate. */}
      {/* Tops are deliberately at three different heights: coplanar faces z-fight and flicker. */}
      <Box size={[POT.w, POT.h - 0.006, POT.w]} position={[0, (POT.h - 0.006) / 2, 0]} color={pot} {...PLASTIC} />
      <Box size={[POT.w + 0.008, 0.016, POT.w + 0.008]} position={[0, POT.h - 0.008, 0]} color={rim} {...PLASTIC} />
      <Box size={[POT.w - 0.012, 0.006, POT.w - 0.012]} position={[0, POT.h, 0]} color="#3b2a1e" {...PLASTIC} cast={false} />
      <Studs cols={5} rows={5} pitch={0.02} y={POT.h + 0.003} color="#3b2a1e" />
      {/* Stems, leaves and flowers. */}
      {stems.map((s) => (
        <group key={`${s.x}${s.z}`} position={[s.x, soilY + 0.008, s.z]} rotation={s.tilt}>
          <Box size={[0.007, s.h, 0.007]} position={[0, s.h / 2, 0]} color={DARK_GREEN} {...PLASTIC} />
          <Flower position={[0, s.h, 0]} petal={s.bloom.petal} center={s.bloom.center} />
        </group>
      ))}
      <Leaf position={[0.004, soilY + 0.03, 0]} rotation={[0, 0.3, 0.45]} length={0.06} />
      <Leaf position={[-0.004, soilY + 0.045, 0.004]} rotation={[0, Math.PI - 0.2, 0.4]} length={0.055} />
      <Leaf position={[0, soilY + 0.07, -0.004]} rotation={[0, Math.PI / 2 + 0.3, 0.5]} />
      <Leaf position={[0, soilY + 0.09, 0.004]} rotation={[0, -Math.PI / 2 - 0.2, 0.45]} length={0.045} />
    </group>
  );
}
