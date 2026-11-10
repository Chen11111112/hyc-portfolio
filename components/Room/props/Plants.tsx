"use client";

import { DESK } from "../layout";
import LegoPlant from "./LegoPlant";

// LEGO flower pots on the window end of the desk (front-left, beside the desk books). Kept ~0.1 m off the
// side wall so pots and flowers clear the window sill and frame (sill reaches world x ≈ −0.12).
const TOP = DESK.top;

export default function Plants() {
  return (
    <group>
      <group position={[-0.02, TOP, 0.33]} rotation={[0, 0.3, 0]}>
        <LegoPlant />
      </group>
      <group position={[-0.025, TOP, 0.5]} rotation={[0, -0.4, 0]} scale={0.85}>
        <LegoPlant
          pot="#eeece6"
          rim="#dcd9d0"
          blooms={[
            { petal: "#e2483d", center: "#1b1b1d" },
            { petal: "#f7d154", center: "#c4772b" },
            { petal: "#e2483d", center: "#f7d154" },
          ]}
        />
      </group>
      <group position={[0.085, TOP, 0.62]} rotation={[0, 0.9, 0]} scale={0.75}>
        <LegoPlant
          pot="#9db59a"
          rim="#86a083"
          blooms={[
            { petal: "#7fb2f0", center: "#f5f1e6" },
            { petal: "#f7a35c", center: "#f7d154" },
            { petal: "#f5f1e6", center: "#f7d154" },
          ]}
        />
      </group>
    </group>
  );
}
