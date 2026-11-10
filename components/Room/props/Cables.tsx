"use client";

import { useEffect, useMemo } from "react";
import { CatmullRomCurve3, TubeGeometry, Vector3 } from "three";
import { DESK, DESK_CX, type Vec3 } from "../layout";
import { RISER } from "./DeskItems";
import { CAB } from "./Instruments";
import { Box } from "./primitives";

// Wall outlets and the power cables running to them.
const PLATE = { w: 0.086, h: 0.086, gap: 0.012, t: 0.012, z: 0.008 };
const FACE_Z = PLATE.z + PLATE.t / 2;
const PLUG_Z = FACE_Z + 0.012;

const STEP = PLATE.w + PLATE.gap;
/** Three plates behind the monitor riser, plus one low on the wall under the LEGO piano cabinet. */
const DESK_OUTLETS: Vec3[] = [0, 1, 2].map((i) => [DESK_CX - STEP + i * STEP, DESK.top + 0.15, PLATE.z]);
const PIANO_OUTLET: Vec3 = [(CAB.x0 + CAB.x1) / 2, 0.065, PLATE.z];
const OUTLETS = [...DESK_OUTLETS, PIANO_OUTLET];

function OutletPlate({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh receiveShadow>
        <boxGeometry args={[PLATE.w, PLATE.h, PLATE.t]} />
        <meshStandardMaterial color="#f7f7f5" roughness={0.55} />
      </mesh>
      {[-0.012, 0.012].map((dx) => (
        <mesh key={dx} position={[dx, 0, PLATE.t / 2 + 0.002]}>
          <boxGeometry args={[0.004, 0.014, 0.004]} />
          <meshStandardMaterial color="#2c3134" roughness={0.4} metalness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

/** Smooth cable through `points`, ending in a plug seated in the outlet at `outlet`. */
function Cable({ points, outlet, color = "#1d1e20" }: { points: Vec3[]; outlet: Vec3; color?: string }) {
  const plug: Vec3 = [outlet[0], outlet[1], PLUG_Z];
  // `points` / `outlet` come from module-level ROUTES, so they're referentially stable.
  const geo = useMemo(() => {
    const path = [...points, [outlet[0], outlet[1] - 0.016, PLUG_Z] as Vec3].map((p) => new Vector3(...p));
    return new TubeGeometry(new CatmullRomCurve3(path, false, "catmullrom", 0.3), 96, 0.0026, 6, false);
  }, [points, outlet]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      <Box size={[0.02, 0.028, 0.022]} position={plug} color={color} roughness={0.5} />
    </group>
  );
}

const T = DESK.top;
const [O_MIC, O_MINI, O_SPEAKER] = DESK_OUTLETS;

// Routes hug the desk's back edge and pass behind the riser legs (z < 0.02), clear of the lamp base.
const ROUTES: { points: Vec3[]; outlet: Vec3; color?: string }[] = [
  {
    // Microphone (left of the desk) → left plate.
    outlet: O_MIC,
    points: [
      [0.189, T + 0.004, 0.343],
      [0.26, T + 0.0028, 0.3],
      [0.5, T + 0.0028, 0.25],
      [0.505, T + 0.0028, 0.06],
      [0.53, T + 0.004, 0.012],
      [O_MIC[0] - 0.06, T + 0.03, 0.012],
      [O_MIC[0] - 0.012, T + 0.11, 0.016],
    ],
  },
  {
    // Mac mini (left end of the riser) → middle plate. White cable.
    outlet: O_MINI,
    color: "#ececec",
    points: [
      [RISER.x0 + 0.085, T + RISER.h + 0.02, 0.107],
      [RISER.x0 + 0.115, T + RISER.h + 0.015, 0.06],
      [O_MINI[0] - 0.04, T + RISER.h + 0.012, 0.03],
    ],
  },
  {
    // Speaker → right plate, along the wall behind the riser.
    outlet: O_SPEAKER,
    points: [
      [DESK.x1 - 0.227, T + 0.03, 0.074],
      [DESK.x1 - 0.25, T + 0.005, 0.03],
      [DESK.x1 - 0.5, T + 0.0028, 0.013],
      [RISER.x1 + 0.02, T + 0.0028, 0.013],
      [O_SPEAKER[0] + 0.03, T + 0.03, 0.013],
      [O_SPEAKER[0] + 0.006, T + 0.11, 0.018],
    ],
  },
  {
    // Dyson tower fan → outlet under the LEGO piano cabinet, along the floor between the cabinet legs.
    outlet: PIANO_OUTLET,
    points: [
      [DESK.x1 + 0.31, 0.012, 0.847],
      [DESK.x1 + 0.3, 0.003, 0.6],
      [DESK.x1 + 0.27, 0.003, 0.2],
      [PIANO_OUTLET[0], 0.006, 0.06],
    ],
  },
];

export default function Outlets() {
  return (
    <group>
      {OUTLETS.map((o) => (
        <OutletPlate key={o.join()} position={o} />
      ))}
      {ROUTES.map((r) => (
        <Cable key={r.outlet.join()} {...r} />
      ))}
    </group>
  );
}
