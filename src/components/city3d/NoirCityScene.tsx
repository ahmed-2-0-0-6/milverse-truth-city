// LAYER-1 — WebGL noir city hero, optimized.
// Same vibe (moody skyline, drifting camera, warm/cyan window glints, rain)
// with a fraction of the runtime cost:
//   - Buildings: single InstancedMesh (was 120 meshes) with one shared
//     material that reads instanced attributes for window pattern + tint.
//   - Rain: CSS overlay (was 800 points updated on the CPU every frame).
//   - Frameloop: "demand" with a slow rAF invalidate — camera drifts at
//     ~30fps of GPU work instead of maxing the refresh rate.

import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import { useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// One shared shader material for every building. Reads instanced attributes:
//   aSize   (vec3) — building dimensions, used to scale UV window grid
//   aSeed   (float) — per-building RNG seed for on/off windows
//   aLit    (float) — warm vs cyan tint
class BuildingMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      transparent: true,
      uniforms: {},
      vertexShader: `
        attribute vec3 aSize;
        attribute float aSeed;
        attribute float aLit;
        varying vec2 vUv;
        varying float vSeed;
        varying float vLit;
        varying vec3 vSize;
        varying vec3 vLocal;
        void main() {
          vUv = uv;
          vSeed = aSeed;
          vLit = aLit;
          vSize = aSize;
          vLocal = position;
          vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying float vSeed;
        varying float vLit;
        varying vec3 vSize;
        varying vec3 vLocal;
        float rnd(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
        void main() {
          // Base facade — near-black.
          vec3 base = vec3(0.02, 0.028, 0.045);
          // Only draw window glow on the "front" faces (z close to +size/2)
          // to mimic the old planeGeometry overlay without a second mesh.
          float front = step(vSize.z * 0.5 - 0.02, vLocal.z);
          // Window grid in local UV space, biased toward the top of the building.
          vec2 cells = vec2(6.0, 12.0);
          vec2 cid = floor(vUv * cells);
          float on = step(0.55, rnd(cid + vSeed));
          vec2 g = fract(vUv * cells);
          float m = step(0.35, g.x) * step(g.x, 0.75) * step(0.55, g.y) * step(g.y, 0.85);
          vec3 warm = vec3(0.96, 0.72, 0.26);
          vec3 cyan = vec3(0.13, 0.83, 0.93);
          vec3 lit = mix(cyan, warm, step(0.55, vLit));
          float win = m * on * front;
          vec3 col = base + lit * 1.4 * win;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }
}
extend({ BuildingMaterial });

function Buildings() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const COUNT = 90;

  const { positions, sizes, seeds, lits } = useMemo(() => {
    const rand = seeded(42);
    const positions: THREE.Matrix4[] = [];
    const sizes = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    const lits = new Float32Array(COUNT);
    const m = new THREE.Matrix4();
    for (let i = 0; i < COUNT; i++) {
      const w = 1 + rand() * 2.5;
      const d = 1 + rand() * 2.5;
      const h = 2 + rand() * 14;
      const x = (rand() - 0.5) * 80;
      const z = (rand() - 0.5) * 80;
      m.compose(
        new THREE.Vector3(x, h / 2, z),
        new THREE.Quaternion(),
        new THREE.Vector3(w, h, d),
      );
      positions.push(m.clone());
      sizes[i * 3] = w;
      sizes[i * 3 + 1] = h;
      sizes[i * 3 + 2] = d;
      seeds[i] = rand() * 100;
      lits[i] = rand();
    }
    return { positions, sizes, seeds, lits };
  }, []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < COUNT; i++) mesh.setMatrixAt(i, positions[i]);
    mesh.instanceMatrix.needsUpdate = true;
    const geom = mesh.geometry as THREE.BufferGeometry;
    geom.setAttribute("aSize", new THREE.InstancedBufferAttribute(sizes, 3));
    geom.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
    geom.setAttribute("aLit", new THREE.InstancedBufferAttribute(lits, 1));
  }, [positions, sizes, seeds, lits]);

  const material = useMemo(() => new BuildingMaterial(), []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} material={material}>
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
}

function CameraRig() {
  const { camera, invalidate } = useThree();
  const t0 = useRef(performance.now());
  // Throttle to ~30fps of camera work.
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      if (now - last > 33) {
        const t = (now - t0.current) * 0.0001;
        camera.position.x = Math.sin(t) * 22;
        camera.position.z = 28 + Math.cos(t) * 8;
        camera.position.y = 10 + Math.sin(t * 0.6) * 2;
        camera.lookAt(0, 4, 0);
        invalidate();
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [camera, invalidate]);
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
      ? [1, 1.2]
      : [1, 1.6];

  return (
    <div ref={wrapRef} className="absolute inset-0" aria-hidden>
      <Canvas
        dpr={dpr}
        frameloop={visible ? "demand" : "never"}
        camera={{ position: [0, 10, 30], fov: 55 }}
        gl={{ antialias: false, powerPreference: "low-power", alpha: true }}
        style={{ background: "transparent" }}
      >
        <CameraRig />
        <fog attach="fog" args={["#04060a", 20, 90]} />
        <ambientLight intensity={0.15} />
        <directionalLight position={[10, 30, 10]} intensity={0.25} color="#4a7cff" />
        <hemisphereLight args={["#22d3ee", "#0a0f1a", 0.15]} />
        <Buildings />
        {/* ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#02040a" roughness={0.6} metalness={0.4} />
        </mesh>
      </Canvas>
      {/* CSS rain overlay — cheaper than 800 CPU-updated points. */}
      <div className="noir-rain pointer-events-none absolute inset-0" aria-hidden />
      <style>{`
        .noir-rain {
          background-image:
            repeating-linear-gradient(
              105deg,
              rgba(120,160,220,0.18) 0px,
              rgba(120,160,220,0.18) 1px,
              transparent 1px,
              transparent 6px
            );
          mix-blend-mode: screen;
          opacity: .35;
          animation: noirRain 0.9s linear infinite;
          will-change: background-position;
        }
        @keyframes noirRain {
          0%   { background-position: 0 0; }
          100% { background-position: -60px 200px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .noir-rain { animation: none; }
        }
      `}</style>
    </div>
  );
}
