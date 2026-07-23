// LAYER-1 — WebGL noir city hero (three.js via r3f). Lazy-loaded.
// Runs behind the interactive 2D map as atmosphere. Pauses when tab hidden.
//
// PERF: buildings + window-glow strips are rendered as two InstancedMeshes
// (2 draw calls instead of 240), rain uses a lean shader that animates on
// the GPU (no per-frame JS BufferAttribute uploads). Same look, ~1/10th
// the CPU cost and materially smaller JS heap.

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const COUNT = 90;

function CityInstances() {
  const boxRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);

  const { boxColor, glowColors } = useMemo(() => {
    const rand = seeded(42);
    const dummy = new THREE.Object3D();
    const warm = new THREE.Color("#f5b942");
    const cool = new THREE.Color("#22d3ee");
    const glowColors: THREE.Color[] = [];
    // Prepare matrices for both instanced meshes.
    const boxMatrices: THREE.Matrix4[] = [];
    const glowMatrices: THREE.Matrix4[] = [];

    for (let i = 0; i < COUNT; i++) {
      const x = (rand() - 0.5) * 80;
      const z = (rand() - 0.5) * 80;
      const w = 1 + rand() * 2.5;
      const d = 1 + rand() * 2.5;
      const h = 2 + rand() * 14;
      const lit = rand();

      dummy.position.set(x, h / 2, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(w, h, d);
      dummy.updateMatrix();
      boxMatrices.push(dummy.matrix.clone());

      // Glow plane sits on the +Z face of the box. Unit plane scaled to
      // 0.9 × w and 0.9 × h; offset by d/2 + a hair to avoid z-fighting.
      dummy.position.set(x, h / 2, z + d / 2 + 0.01);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(w * 0.9, h * 0.9, 1);
      dummy.updateMatrix();
      glowMatrices.push(dummy.matrix.clone());

      glowColors.push(lit > 0.55 ? warm : cool);
    }

    // Stash matrices on refs after mount via effect below.
    (CityInstances as unknown as { _bm: THREE.Matrix4[]; _gm: THREE.Matrix4[] })._bm = boxMatrices;
    (CityInstances as unknown as { _bm: THREE.Matrix4[]; _gm: THREE.Matrix4[] })._gm = glowMatrices;

    return { boxColor: new THREE.Color("#05070d"), glowColors };
  }, []);

  useEffect(() => {
    const boxes = boxRef.current;
    const glows = glowRef.current;
    if (!boxes || !glows) return;
    const bm = (CityInstances as unknown as { _bm: THREE.Matrix4[] })._bm;
    const gm = (CityInstances as unknown as { _gm: THREE.Matrix4[] })._gm;
    for (let i = 0; i < COUNT; i++) {
      boxes.setMatrixAt(i, bm[i]);
      glows.setMatrixAt(i, gm[i]);
      glows.setColorAt(i, glowColors[i]);
    }
    boxes.instanceMatrix.needsUpdate = true;
    glows.instanceMatrix.needsUpdate = true;
    if (glows.instanceColor) glows.instanceColor.needsUpdate = true;
  }, [glowColors]);

  return (
    <group>
      <instancedMesh ref={boxRef} args={[undefined, undefined, COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={boxColor} />
      </instancedMesh>
      <instancedMesh ref={glowRef} args={[undefined, undefined, COUNT]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent opacity={0.75} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

function Rain() {
  const ref = useRef<THREE.Points>(null);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 400;
    const pos = new Float32Array(n * 3);
    const off = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = Math.random() * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
      off[i] = Math.random() * 40;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aOff", new THREE.BufferAttribute(off, 1));
    return g;
  }, []);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
          attribute float aOff;
          uniform float uTime;
          void main(){
            vec3 p = position;
            p.y = mod(p.y - uTime * 22.0 + aOff, 40.0);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = 2.0;
          }`,
        fragmentShader: `
          void main(){
            gl_FragColor = vec4(0.29, 0.42, 0.60, 0.5);
          }`,
      }),
    [],
  );

  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
    if (ref.current) ref.current.geometry = geom;
  });

  return <points ref={ref} geometry={geom} material={mat} />;
}

function CameraRig() {
  const { camera } = useThree();
  const t0 = useRef(performance.now());
  useFrame(() => {
    const t = (performance.now() - t0.current) * 0.0001;
    camera.position.x = Math.sin(t) * 22;
    camera.position.z = 28 + Math.cos(t) * 8;
    camera.position.y = 10 + Math.sin(t * 0.6) * 2;
    camera.lookAt(0, 4, 0);
  });
  return null;
}

function PauseWhenHidden() {
  const { gl, invalidate } = useThree();
  useEffect(() => {
    const on = () => {
      if (!document.hidden) invalidate();
    };
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, [gl, invalidate]);
  return null;
}

export default function NoirCityScene() {
  const [visible, setVisible] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.01 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const dpr: [number, number] =
    typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches
      ? [1, 1.25]
      : [1, 1.75];

  return (
    <div ref={wrapRef} className="absolute inset-0" aria-hidden>
      <Canvas
        dpr={dpr}
        frameloop={visible ? "always" : "never"}
        camera={{ position: [0, 10, 30], fov: 55 }}
        gl={{ antialias: false, powerPreference: "low-power", alpha: true, stencil: false, depth: true }}
        style={{ background: "transparent" }}
      >
        <PauseWhenHidden />
        <CameraRig />
        <fog attach="fog" args={["#04060a", 20, 90]} />
        <CityInstances />
        <Rain />
        {/* ground — unlit, single draw */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[200, 200]} />
          <meshBasicMaterial color="#02040a" />
        </mesh>
      </Canvas>
    </div>
  );
}
