"use client";

import { ContactShadows, Environment, RoundedBox } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Component, Suspense, useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { InstancedMesh, Object3D, PerspectiveCamera, Vector3, type DirectionalLight } from "three";
import { markBootReady } from "@/lib/boot";
import styles from "./Room.module.scss";

type Vec3 = [number, number, number];

class Optional extends Component<{ children: ReactNode }, { on: boolean }> {
  state = { on: true };
  static getDerivedStateFromError() {
    return { on: false };
  }
  render() {
    return this.state.on ? this.props.children : null;
  }
}

const DESK = { x0: -0.2, x1: 1.0, z0: 0.004, depth: 0.6, top: 0.75, slab: 0.03 };
const DESK_Z1 = DESK.z0 + DESK.depth;
const DESK_CX = (DESK.x0 + DESK.x1) / 2;
const WOOD = "#e8e4dc";
const SHELF_WOOD = "#e4d3b4";
const PLACEHOLDER = "#bdb6aa";

const CABINET_W = 0.4;
const PANEL_T = 0.016;
const PROUD = 0.005;
const SEAM = 0.004;
const UNDER = DESK.top - DESK.slab;
const DRAWER_H = (UNDER - SEAM * 3) / 4;
const PANEL_Z1 = DESK_Z1 + PROUD;
const PANEL_Z0 = PANEL_Z1 - PANEL_T;

const LEG_T = 0.02;
const LEG_X0 = DESK.x1 - LEG_T;
const MID_X0 = DESK.x0 + CABINET_W + SEAM;
const MID_X1 = LEG_X0 - SEAM;
const MID_W = MID_X1 - MID_X0;
const MID_H = 0.07;
const MID_Y0 = 0.02;

const SHELF_T = 0.018;
const SHELF_X0 = DESK.x0;
const SHELF_W = 0.5;
const SHELF_D = 0.18;

const PEG_W = 0.6;
const PEG_H = 0.45;
const PEG_X0 = DESK_CX;
const PEG_Y0 = 1.08;

const PLATE_W = 0.086;
const PLATE_H = 0.086;
const PLATE_GAP = 0.012;
const PLATE_Y = DESK.top + 0.15;

const LOOK: Vec3 = [DESK_CX, DESK.top, DESK.z0 + DESK.depth / 2];
const ELEVATION = (26 * Math.PI) / 180;
const AZIMUTH = Math.PI / 4;

const FRAME = [
  [-1.59, 0, 0.46],
  [-1.59, 0.86, 0.46],
  [1.58, 0, 0.4],
  [1.58, 1.08, 0.4],
  [0.06, 0, 1.39],
  [0.74, 1.22, 1.39],
  [-1.1, 1.95, 0.05],
  [-0.2, 0.8, 0.05],
  [-0.2, 1.3, 0.192],
  [1.0, 1.53, 0.016],
  [DESK.x0, DESK.top, DESK_Z1],
  [DESK.x1, DESK.top, DESK_Z1],
].map((p) => new Vector3(...(p as Vec3)));

function CameraRig() {
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);
  useLayoutEffect(() => {
    const camera = get().camera as PerspectiveCamera;
    const aspect = size.width / Math.max(size.height, 1);
    camera.fov = 35;
    camera.aspect = aspect;
    camera.near = 0.08;
    camera.far = 40;
    const offset = new Vector3(
      Math.sin(AZIMUTH) * Math.cos(ELEVATION),
      Math.sin(ELEVATION),
      Math.sin(AZIMUTH) * Math.cos(ELEVATION),
    ).normalize();
    const look = new Vector3(...LOOK);
    let dist = 3.2;
    for (; dist < 16; dist += 0.05) {
      camera.position.copy(look).addScaledVector(offset, dist);
      camera.lookAt(look);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      const inside = FRAME.every((corner) => {
        const ndc = corner.clone().project(camera);
        return Math.abs(ndc.x) < 0.9 && Math.abs(ndc.y) < 0.9 && ndc.z < 1;
      });
      if (inside) break;
    }
  }, [get, size]);
  return null;
}

function Sun() {
  const light = useRef<DirectionalLight>(null);
  const target = useRef<Object3D>(null);
  useLayoutEffect(() => {
    if (light.current && target.current) light.current.target = target.current;
  }, []);
  return (
    <>
      <directionalLight
        ref={light}
        position={[-4.8, 6.23, -2.33]}
        color="#fff4e0"
        intensity={3.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={18}
        shadow-camera-left={-4.5}
        shadow-camera-right={4.5}
        shadow-camera-top={4.5}
        shadow-camera-bottom={-4.5}
        shadow-bias={-0.0004}
        shadow-normalBias={0.012}
      />
      <object3D ref={target} position={[0.4, 0.75, 0.3]} />
    </>
  );
}

function Wall() {
  const t = 0.06;
  const y1 = 4;
  const x0 = -22;
  const x1 = 6;
  const parts: { position: Vec3; size: Vec3 }[] = [
    { position: [(x0 + -1.1) / 2, y1 / 2, -t / 2], size: [-1.1 - x0, y1, t] },
    { position: [(-0.2 + x1) / 2, y1 / 2, -t / 2], size: [x1 - -0.2, y1, t] },
    { position: [-0.65, 0.4, -t / 2], size: [0.9, 0.8, t] },
    { position: [-0.65, (1.9 + y1) / 2, -t / 2], size: [0.9, y1 - 1.9, t] },
  ];
  return (
    <group>
      {parts.map((part) => (
        <mesh key={part.position.join(",")} position={part.position} castShadow receiveShadow>
          <boxGeometry args={part.size} />
          <meshStandardMaterial color="#dfe5ea" roughness={0.9} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

function Window() {
  const z = 0.025;
  const d = 0.05;
  const members: { position: Vec3; size: Vec3 }[] = [
    { position: [-1.075, 1.35, z], size: [0.05, 1.1, d] },
    { position: [-0.225, 1.35, z], size: [0.05, 1.1, d] },
    { position: [-0.65, 0.825, z], size: [0.8, 0.05, d] },
    { position: [-0.65, 1.875, z], size: [0.8, 0.05, d] },
  ];
  return (
    <group>
      {members.map((member) => (
        <mesh key={member.position.join(",")} position={member.position} castShadow receiveShadow>
          <boxGeometry args={member.size} />
          <meshStandardMaterial color="#f4f5f6" roughness={0.55} metalness={0} />
        </mesh>
      ))}
      <mesh position={[-0.65, 1.35, 0.02]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[0.8, 1.0, 0.008]} />
        <meshPhysicalMaterial
          color="#d4e6f2"
          roughness={0.04}
          metalness={0}
          transmission={0.9}
          thickness={0.02}
          ior={1.45}
        />
      </mesh>
    </group>
  );
}

function Desk() {
  const drawers = [0, 1, 2, 3].map((i) => {
    const y0 = i * (DRAWER_H + SEAM);
    return y0 + DRAWER_H / 2;
  });
  return (
    <group>
      <RoundedBox
        args={[1.2, DESK.slab, DESK.depth]}
        radius={0.008}
        smoothness={4}
        position={[DESK_CX, DESK.top - DESK.slab / 2, DESK.z0 + DESK.depth / 2]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={WOOD} roughness={0.72} metalness={0} />
      </RoundedBox>
      <mesh position={[DESK.x0 + CABINET_W / 2, UNDER / 2, (DESK.z0 + PANEL_Z0 - 0.001) / 2]} castShadow receiveShadow>
        <boxGeometry args={[CABINET_W, UNDER, PANEL_Z0 - 0.001 - DESK.z0]} />
        <meshStandardMaterial color={WOOD} roughness={0.74} metalness={0} />
      </mesh>
      {drawers.map((y) => (
        <mesh key={y} position={[DESK.x0 + CABINET_W / 2, y, (PANEL_Z0 + PANEL_Z1) / 2]} castShadow receiveShadow>
          <boxGeometry args={[CABINET_W - SEAM * 2, DRAWER_H, PANEL_T]} />
          <meshStandardMaterial color={WOOD} roughness={0.7} metalness={0} />
        </mesh>
      ))}
      <mesh
        position={[(MID_X0 + MID_X1) / 2, MID_Y0 + MID_H / 2, (DESK.z0 + 0.22 + PANEL_Z0 - 0.001) / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[MID_W, MID_H, PANEL_Z0 - 0.001 - (DESK.z0 + 0.22)]} />
        <meshStandardMaterial color={WOOD} roughness={0.74} metalness={0} />
      </mesh>
      <mesh position={[(MID_X0 + MID_X1) / 2, MID_Y0 + MID_H / 2, (PANEL_Z0 + PANEL_Z1) / 2]} castShadow receiveShadow>
        <boxGeometry args={[MID_W, MID_H, PANEL_T]} />
        <meshStandardMaterial color={WOOD} roughness={0.7} metalness={0} />
      </mesh>
      <mesh position={[(MID_X0 + MID_X1) / 2, MID_Y0 + MID_H / 2, PANEL_Z1 + 0.003]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.0065, 0.0065, 0.006, 16]} />
        <meshStandardMaterial color="#2a2e32" roughness={0.45} metalness={0.35} />
      </mesh>
      <mesh position={[(LEG_X0 + DESK.x1) / 2, UNDER / 2, DESK.z0 + 0.28]} castShadow receiveShadow>
        <boxGeometry args={[LEG_T, UNDER, 0.56]} />
        <meshStandardMaterial color={WOOD} roughness={0.74} metalness={0} />
      </mesh>
    </group>
  );
}

function Shelves() {
  const boards = [DESK.top + 0.3, DESK.top + 0.55];
  return (
    <group>
      {boards.map((surface) => (
        <mesh
          key={surface}
          position={[SHELF_X0 + SHELF_W / 2, surface - SHELF_T / 2, 0.012 + SHELF_D / 2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[SHELF_W, SHELF_T, SHELF_D]} />
          <meshStandardMaterial color={SHELF_WOOD} roughness={0.74} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

function Pegboard() {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new Object3D();
    const cols = 11;
    const rows = 8;
    let i = 0;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        dummy.position.set((col - (cols - 1) / 2) * 0.05, (row - (rows - 1) / 2) * 0.05, 0.008);
        dummy.rotation.set(Math.PI / 2, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        i += 1;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <group position={[PEG_X0 + PEG_W / 2, PEG_Y0 + PEG_H / 2, 0.01]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[PEG_W, PEG_H, 0.012]} />
        <meshStandardMaterial color="#f5f7f8" roughness={0.82} metalness={0} />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, 88]}>
        <cylinderGeometry args={[0.0065, 0.0065, 0.014, 10]} />
        <meshStandardMaterial color="#9eacb4" roughness={0.7} metalness={0} />
      </instancedMesh>
    </group>
  );
}

function Outlets() {
  const step = PLATE_W + PLATE_GAP;
  const origin = DESK_CX - step;
  return (
    <group>
      {[0, 1, 2].map((i) => {
        const x = origin + i * step;
        return (
          <group key={i} position={[x, PLATE_Y, 0.008]}>
            <mesh receiveShadow>
              <boxGeometry args={[PLATE_W, PLATE_H, 0.012]} />
              <meshStandardMaterial color="#f7f7f5" roughness={0.55} metalness={0} />
            </mesh>
            {[-0.012, 0.012].map((dx) => (
              <mesh key={dx} position={[dx, 0, 0.008]}>
                <boxGeometry args={[0.004, 0.014, 0.004]} />
                <meshStandardMaterial color="#2c3134" roughness={0.4} metalness={0.2} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function Placeholders() {
  return (
    <group>
      <mesh position={[-1.35, 0.43, 0.24]} castShadow receiveShadow>
        <boxGeometry args={[0.48, 0.86, 0.44]} />
        <meshStandardMaterial color={PLACEHOLDER} roughness={0.86} metalness={0} />
      </mesh>
      <mesh position={[1.3, 0.54, 0.21]} castShadow receiveShadow>
        <boxGeometry args={[0.56, 1.08, 0.38]} />
        <meshStandardMaterial color={PLACEHOLDER} roughness={0.86} metalness={0} />
      </mesh>
      <mesh position={[DESK_CX, 0.61, 1.06]} castShadow receiveShadow>
        <boxGeometry args={[0.68, 1.22, 0.66]} />
        <meshStandardMaterial color={PLACEHOLDER} roughness={0.86} metalness={0} />
      </mesh>
    </group>
  );
}

function Room() {
  useEffect(() => {
    markBootReady();
  }, []);
  return (
    <>
      <color attach="background" args={["#dfe5ea"]} />
      <CameraRig />
      <Sun />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, 0, 3.2]} receiveShadow>
        <planeGeometry args={[16, 14]} />
        <meshStandardMaterial color="#5a3a28" roughness={0.86} metalness={0} />
      </mesh>
      <Wall />
      <Window />
      <Desk />
      <Shelves />
      <Pegboard />
      <Outlets />
      <Placeholders />
      <ContactShadows position={[0.4, 0.001, 0.85]} opacity={0.38} scale={6} blur={2.2} far={1.4} resolution={512} />
      <Optional>
        <Suspense fallback={null}>
          <Environment preset="apartment" environmentIntensity={0.28} />
        </Suspense>
      </Optional>
    </>
  );
}

export default function RoomScene() {
  return (
    <div className={styles.root}>
      <Canvas
        className={styles.canvas}
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 35, position: [4.2, 2.8, 4.2], near: 0.08, far: 40 }}
        gl={{ antialias: true }}
      >
        <Room />
      </Canvas>
    </div>
  );
}
