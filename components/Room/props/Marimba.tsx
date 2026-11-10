"use client";

import { Box, Cyl, Rod } from "./primitives";
import ScorePage from "./ScorePage";

// 4⅓-octave concert marimba, A2–C7: 31 naturals + 21 accidentals = 52 bars.
// Authored in side-wall-local coords (see SideWallGroup): wall face z = 0, room toward +z,
// bass end on the player's left (−x). Leave ~0.25 m behind it for the music stand.
export const MARIMBA_X1 = -1.92; // treble end, just past the upright MIDI keyboard
const NATURALS = 31;
const PITCH = 0.044;
export const MARIMBA_X0 = MARIMBA_X1 - NATURALS * PITCH; // bass end
const BAR_W = PITCH * 0.86;
const BAR_Y = 0.86;
const NAT_Z = 0.46;
const ACC_Z = 0.19;
const ACC_RAISE = 0.026;
const POSTS = [0.05, 0.68];

const ROSEWOOD = ["#8a4128", "#7c3a23", "#93492d", "#84402a"];
const FRAME = "#3a2418";
const TUBE = "#b8955a";

// Starting on A: natural k (mod 7) is A B C D E F G; sharps follow A, C, D, F, G.
const HAS_SHARP = new Set([0, 2, 3, 5, 6]);

type Bar = { x: number; len: number; thick: number; z: number; y: number; tube: number; color: string };

const BARS: Bar[] = (() => {
  const bars: Bar[] = [];
  for (let i = 0; i < NATURALS; i += 1) {
    const t = i / (NATURALS - 1);
    bars.push({
      x: MARIMBA_X0 + PITCH * (i + 0.5),
      len: 0.4 - 0.21 * t,
      thick: 0.024 - 0.009 * t,
      z: NAT_Z,
      y: BAR_Y,
      tube: 0.62 - 0.5 * t,
      color: ROSEWOOD[i % ROSEWOOD.length],
    });
    if (i < NATURALS - 1 && HAS_SHARP.has(i % 7)) {
      bars.push({
        x: MARIMBA_X0 + PITCH * (i + 1),
        len: 0.34 - 0.17 * t,
        thick: 0.022 - 0.008 * t,
        z: ACC_Z,
        y: BAR_Y + ACC_RAISE,
        tube: 0.56 - 0.45 * t,
        color: ROSEWOOD[(i + 2) % ROSEWOOD.length],
      });
    }
  }
  return bars;
})();

function EndFrame({ x }: { x: number }) {
  const depth = POSTS[1] - POSTS[0];
  const mid = (POSTS[0] + POSTS[1]) / 2;
  return (
    <group>
      {POSTS.map((z) => (
        <Box key={z} size={[0.045, BAR_Y - 0.06, 0.045]} position={[x, (BAR_Y - 0.06) / 2 + 0.05, z]} color={FRAME} roughness={0.6} />
      ))}
      <Box size={[0.05, 0.05, depth + 0.04]} position={[x, 0.07, mid]} color={FRAME} roughness={0.6} />
      <Box size={[0.05, 0.07, depth]} position={[x, BAR_Y - 0.06, mid]} color={FRAME} roughness={0.6} />
      {POSTS.map((z) => (
        <mesh key={`w${z}`} position={[x, 0.025, z]} castShadow>
          <sphereGeometry args={[0.025, 12, 10]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/** Tripod music stand behind the bars (wall side), its desk raised above them facing the player. */
function MusicStand({ x }: { x: number }) {
  const z = -0.13;
  const black = { color: "#1c1d20", roughness: 0.45, metalness: 0.5 };
  const hub: [number, number, number] = [x, 0.3, z];
  return (
    <group>
      {[
        [x - 0.16, z - 0.07],
        [x + 0.16, z - 0.07],
        [x, z + 0.17],
      ].map(([fx, fz]) => (
        <Rod key={`${fx}${fz}`} from={[fx, 0.01, fz]} to={hub} r={0.006} {...black} />
      ))}
      <Rod from={[x, 0.28, z]} to={[x, 1.1, z]} r={0.008} {...black} />
      <group position={[x, 1.24, z]} rotation={[-0.32, 0, 0]}>
        <Box size={[0.5, 0.32, 0.008]} {...black} />
        <Box size={[0.5, 0.012, 0.04]} position={[0, -0.16, 0.02]} {...black} />
        {/* Open score: Eric Sammut, "Rotation 4" — pages 1 and 2. */}
        {([1, 2] as const).map((page) => (
          <group key={page} position={[page === 1 ? -0.115 : 0.115, 0.01, 0.006]}>
            <Box size={[0.215, 0.29, 0.002]} color="#f7f4ec" roughness={0.9} cast={false} />
            <group position={[0, 0, 0.0012]}>
              <ScorePage page={page} width={0.21} height={0.287} />
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}

export default function Marimba() {
  const span = MARIMBA_X1 - MARIMBA_X0 + 0.06;
  const cx = (MARIMBA_X0 + MARIMBA_X1) / 2;
  return (
    <group>
      <EndFrame x={MARIMBA_X0 - 0.04} />
      <EndFrame x={MARIMBA_X1 + 0.04} />
      {/* Floor stretcher and the rails the bars rest on. */}
      <Box size={[span, 0.045, 0.045]} position={[cx, 0.1, (POSTS[0] + POSTS[1]) / 2]} color={FRAME} roughness={0.6} />
      {[NAT_Z - 0.09, NAT_Z + 0.09].map((z) => (
        <Box key={z} size={[span, 0.022, 0.03]} position={[cx, BAR_Y - 0.018, z]} color={FRAME} roughness={0.6} />
      ))}
      {[ACC_Z - 0.08, ACC_Z + 0.08].map((z) => (
        <Box key={z} size={[span, 0.022, 0.03]} position={[cx, BAR_Y + ACC_RAISE - 0.018, z]} color={FRAME} roughness={0.6} />
      ))}
      {BARS.map((bar) => (
        <group key={`${bar.x.toFixed(4)}-${bar.z}`}>
          <Box
            size={[BAR_W, bar.thick, bar.len]}
            position={[bar.x, bar.y + bar.thick / 2 - 0.005, bar.z]}
            color={bar.color}
            roughness={0.45}
          />
          <Cyl
            r={BAR_W * 0.38}
            h={bar.tube}
            seg={12}
            position={[bar.x, bar.y - 0.05 - bar.tube / 2, bar.z]}
            color={TUBE}
            roughness={0.32}
            metalness={0.75}
          />
        </group>
      ))}
      <MusicStand x={cx} />
    </group>
  );
}
