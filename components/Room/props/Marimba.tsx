"use client";

import { Box, Cyl, Rod } from "./primitives";
import ScorePage from "./ScorePage";

// 5-octave concert marimba, C2–C7: 36 naturals + 25 accidentals = 61 bars. Modelled on a classic
// concert frame: honey-wood rails and end caps, black resonators (round in the treble, flat
// rectangular boxes in the bass), black X-shaped scissor stands on casters at each end.
// Authored in side-wall-local coords (see SideWallGroup): wall face z = 0, room toward +z,
// bass end on the player's left (−x). Leave ~0.25 m behind it for the music stand.
export const MARIMBA_X1 = -2.17; // treble end, just past the upright MIDI keyboard
const NATURALS = 36;
const PITCH = 0.044;
export const MARIMBA_X0 = MARIMBA_X1 - NATURALS * PITCH; // bass end
const BAR_W = PITCH * 0.86;
const BAR_Y = 0.86;
const NAT_Z = 0.46;
const ACC_Z = 0.19;
const ACC_RAISE = 0.026;
/** Back / front rail centres (z). */
const RAIL_Z = [-0.005, 0.69];

const ROSEWOOD = ["#8a4128", "#7c3a23", "#93492d", "#84402a"];
const WOOD = { color: "#c8702e", roughness: 0.45 };
const WOOD_DARK = { color: "#b5622a", roughness: 0.5 };
const RESONATOR = { color: "#151518", roughness: 0.45, metalness: 0.3 };
const STEEL = { color: "#1c1c1f", roughness: 0.4, metalness: 0.6 };
const BRASS = { color: "#c9a24a", roughness: 0.3, metalness: 0.85 };

// Starting on C: natural k (mod 7) is C D E F G A B; sharps follow C, D, F, G, A.
const HAS_SHARP = new Set([0, 1, 3, 4, 5]);
/** Below this fraction of the range (from the bass), resonators are flat rectangular boxes. */
const BOX_RESONATORS = 0.3;

type Bar = { x: number; len: number; t: number; thick: number; z: number; y: number; tube: number; color: string };

const BARS: Bar[] = (() => {
  const bars: Bar[] = [];
  for (let i = 0; i < NATURALS; i += 1) {
    const t = i / (NATURALS - 1);
    bars.push({
      x: MARIMBA_X0 + PITCH * (i + 0.5),
      len: 0.42 - 0.23 * t,
      t,
      thick: 0.025 - 0.01 * t,
      z: NAT_Z,
      y: BAR_Y,
      tube: 0.7 - 0.6 * t,
      color: ROSEWOOD[i % ROSEWOOD.length],
    });
    if (i < NATURALS - 1 && HAS_SHARP.has(i % 7)) {
      bars.push({
        x: MARIMBA_X0 + PITCH * (i + 1),
        len: 0.36 - 0.19 * t,
        t,
        thick: 0.023 - 0.009 * t,
        z: ACC_Z,
        y: BAR_Y + ACC_RAISE,
        tube: 0.64 - 0.55 * t,
        color: ROSEWOOD[(i + 2) % ROSEWOOD.length],
      });
    }
  }
  return bars;
})();

function Caster({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Box size={[0.03, 0.03, 0.03]} position={[0, 0.07, 0]} {...STEEL} />
      <mesh position={[0, 0.035, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.026, 18]} />
        <meshStandardMaterial color="#111" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Black scissor stand: two legs crossing in an X under the frame end, a foot bar with casters. */
function XStand({ x }: { x: number }) {
  const [zb, zf] = [0.05, 0.64];
  const top = BAR_Y - 0.1;
  return (
    <group>
      <Rod from={[x, 0.1, zf]} to={[x, top, zb + 0.08]} r={0.014} {...STEEL} />
      <Rod from={[x, 0.1, zb]} to={[x, top, zf - 0.08]} r={0.014} {...STEEL} />
      <Box size={[0.04, 0.03, zf - zb + 0.06]} position={[x, 0.095, (zb + zf) / 2]} {...STEEL} />
      <Box size={[0.05, 0.03, zf - zb - 0.06]} position={[x, top + 0.02, (zb + zf) / 2]} {...STEEL} />
      <Cyl r={0.018} h={0.05} position={[x, (0.1 + top) / 2, (zb + zf) / 2]} rotation={[0, 0, Math.PI / 2]} {...STEEL} />
      <Caster x={x} z={zb - 0.02} />
      <Caster x={x} z={zf + 0.02} />
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
  const span = MARIMBA_X1 - MARIMBA_X0;
  const cx = (MARIMBA_X0 + MARIMBA_X1) / 2;
  const railH = 0.085;
  const railY = BAR_Y - 0.012 - railH / 2;
  const depth = RAIL_Z[1] - RAIL_Z[0];
  return (
    <group>
      {/* Wooden frame: back and front rails, end caps, inner cord rails the bars rest on. */}
      {RAIL_Z.map((z) => (
        <Box key={z} size={[span + 0.02, railH, 0.034]} position={[cx, railY, z]} {...WOOD} />
      ))}
      {[MARIMBA_X0 - 0.03, MARIMBA_X1 + 0.03].map((x) => (
        <Box key={x} size={[0.06, railH + 0.03, depth + 0.05]} position={[x, railY + 0.012, (RAIL_Z[0] + RAIL_Z[1]) / 2]} {...WOOD_DARK} />
      ))}
      {[NAT_Z - 0.1, NAT_Z + 0.1].map((z) => (
        <Box key={z} size={[span, 0.02, 0.026]} position={[cx, BAR_Y - 0.016, z]} {...WOOD_DARK} />
      ))}
      {[ACC_Z - 0.09, ACC_Z + 0.09].map((z) => (
        <Box key={z} size={[span, 0.02, 0.026]} position={[cx, BAR_Y + ACC_RAISE - 0.016, z]} {...WOOD_DARK} />
      ))}
      {/* Small brass nameplates on the front rail (left blank). */}
      <Box size={[0.07, 0.03, 0.003]} position={[MARIMBA_X0 + 0.12, railY + 0.012, RAIL_Z[1] + 0.018]} {...BRASS} />
      <Box size={[0.08, 0.04, 0.003]} position={[MARIMBA_X1 - 0.3, railY, RAIL_Z[1] + 0.018]} {...BRASS} />

      {/* Bars and resonators. */}
      {BARS.map((bar) => {
        const boxy = bar.t < BOX_RESONATORS;
        const tubeY = bar.y - 0.05 - bar.tube / 2;
        return (
          <group key={`${bar.x.toFixed(4)}-${bar.z}`}>
            <Box
              size={[BAR_W, bar.thick, bar.len]}
              position={[bar.x, bar.y + bar.thick / 2 - 0.005, bar.z]}
              color={bar.color}
              roughness={0.45}
            />
            {boxy ? (
              <Box size={[BAR_W * 0.98, bar.tube, 0.1]} position={[bar.x, tubeY, bar.z]} {...RESONATOR} />
            ) : (
              <Cyl r={BAR_W * 0.4} h={bar.tube} seg={12} position={[bar.x, tubeY, bar.z]} {...RESONATOR} />
            )}
          </group>
        );
      })}

      {/* Scissor stands at both ends, tied together by a low crossbar. */}
      <XStand x={MARIMBA_X0 - 0.03} />
      <XStand x={MARIMBA_X1 + 0.03} />
      <Box size={[span + 0.06, 0.03, 0.03]} position={[cx, 0.32, 0.12]} {...STEEL} />

      <MusicStand x={cx} />
    </group>
  );
}
