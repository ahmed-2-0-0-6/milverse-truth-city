// LAYER-1 — WebGL noir detective desk (three.js via r3f).
// Same stack as the hero (NoirCityScene). Lazy-loaded, pauses off-screen
// and when the tab is hidden. Presentation only.
//
// Composition: top-down 3/4 view of a circular walnut desk under a warm
// tungsten spotlight. Scattered case files, coffee mug with animated
// steam, brass magnifier, fountain pen, small brass clock with a ticking
// second hand, tiny raccoon paperweight. Whole tabletop drifts extremely
// slowly. Center of frame stays dark for headline legibility.

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

// ---------- helpers ----------
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// ---------- desk surface ----------
function Tabletop() {
  const grainTex = useMemo(() => {
    // Procedural walnut grain via canvas texture — cheap and cache-friendly.
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d")!;
    // base
    const g = ctx.createRadialGradient(256, 256, 40, 256, 256, 260);
    g.addColorStop(0, "#3a2617");
    g.addColorStop(0.55, "#26170d");
    g.addColorStop(1, "#0d0805");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    // concentric grain rings
    ctx.strokeStyle = "rgba(255,210,160,0.05)";
    for (let r = 20; r < 260; r += 4 + Math.random() * 6) {
      ctx.lineWidth = 0.6 + Math.random() * 0.6;
      ctx.beginPath();
      ctx.ellipse(256, 256, r, r * (0.94 + Math.random() * 0.06), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // fine noise
    const img = ctx.getImageData(0, 0, 512, 512);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 14;
      img.data[i] += n;
      img.data[i + 1] += n * 0.9;
      img.data[i + 2] += n * 0.6;
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <circleGeometry args={[16, 96]} />
      <meshStandardMaterial map={grainTex} roughness={0.85} metalness={0.05} />
    </mesh>
  );
}

// ---------- case files ----------
type File = { x: number; z: number; rot: number; w: number; h: number; color: string; stamp: boolean };

function CaseFiles() {
  const rand = useMemo(() => seeded(9), []);
  const files = useMemo<File[]>(() => {
    const arr: File[] = [];
    // cluster files in the four quadrants, keep the center clear
    const spots: Array<[number, number]> = [
      [-7.5, -5], [-8.5, -2], [-6, -6.5],
      [7.5, 5], [8.5, 2], [6, 6.5],
      [-8, 5.5], [8, -5.5],
    ];
    for (const [x, z] of spots) {
      arr.push({
        x: x + (rand() - 0.5) * 1.2,
        z: z + (rand() - 0.5) * 1.2,
        rot: (rand() - 0.5) * 0.9,
        w: 4.2 + rand() * 0.6,
        h: 5.6 + rand() * 0.8,
        color: rand() > 0.55 ? "#d6c9a5" : rand() > 0.5 ? "#c9a26a" : "#e8dcbf",
        stamp: rand() > 0.55,
      });
    }
    return arr;
  }, [rand]);

  return (
    <group>
      {files.map((f, i) => (
        <group key={i} position={[f.x, 0.02 + i * 0.006, f.z]} rotation={[0, f.rot, 0]}>
          {/* folder */}
          <mesh position={[0, 0, 0]} receiveShadow castShadow>
            <boxGeometry args={[f.w, 0.04, f.h]} />
            <meshStandardMaterial color={f.color} roughness={0.95} />
          </mesh>
          {/* typed label bar */}
          <mesh position={[0, 0.025, -f.h / 2 + 0.6]}>
            <planeGeometry args={[f.w * 0.6, 0.35]} />
            <meshBasicMaterial color="#1a120a" transparent opacity={0.55} />
          </mesh>
          {/* body text lines */}
          {[0, 1, 2, 3].map((k) => (
            <mesh key={k} position={[0, 0.025, -f.h / 2 + 1.4 + k * 0.5]}>
              <planeGeometry args={[f.w * 0.7, 0.08]} />
              <meshBasicMaterial color="#3a2a18" transparent opacity={0.35} />
            </mesh>
          ))}
          {/* redacted stamp */}
          {f.stamp && (
            <mesh position={[f.w * 0.22, 0.03, f.h * 0.28]} rotation={[-Math.PI / 2, 0, -0.4]}>
              <planeGeometry args={[1.6, 0.55]} />
              <meshBasicMaterial color="#8b1a1a" transparent opacity={0.7} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

// ---------- surveillance photo (paperclipped) ----------
function Photo() {
  return (
    <group position={[-4.5, 0.08, 1.5]} rotation={[0, 0.35, 0]}>
      {/* white border */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[2.4, 0.03, 3]} />
        <meshStandardMaterial color="#e8e2d4" roughness={0.9} />
      </mesh>
      {/* photo emulsion */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.0, 2.6]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      {/* silhouette figure */}
      <mesh position={[0, 0.021, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 24]} />
        <meshBasicMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[0, 0.021, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 1.2]} />
        <meshBasicMaterial color="#242424" />
      </mesh>
      {/* paperclip */}
      <mesh position={[0.4, 0.06, -1.35]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.03, 8, 20, Math.PI * 1.5]} />
        <meshStandardMaterial color="#c9c9c9" metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  );
}

// ---------- coffee mug + steam ----------
function CoffeeMug() {
  const steamRef = useRef<THREE.Points>(null);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 60;
    const pos = new Float32Array(n * 3);
    const seeds = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 1] = 1.2 + Math.random() * 2.4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      seeds[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("seed", new THREE.BufferAttribute(seeds, 1));
    return g;
  }, []);

  useFrame((_, dt) => {
    if (!steamRef.current) return;
    const pos = steamRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] += dt * 0.35;
      arr[i] += Math.sin(performance.now() * 0.0004 + i) * dt * 0.08;
      if (arr[i + 1] > 4) {
        arr[i + 1] = 1.2;
        arr[i] = (Math.random() - 0.5) * 0.5;
        arr[i + 2] = (Math.random() - 0.5) * 0.5;
      }
    }
    pos.needsUpdate = true;
  });

  return (
    <group position={[6.5, 0, -3.5]}>
      {/* mug body */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.85, 0.75, 1.2, 32]} />
        <meshStandardMaterial color="#151515" roughness={0.6} metalness={0.15} />
      </mesh>
      {/* rim */}
      <mesh position={[0, 1.2, 0]}>
        <torusGeometry args={[0.82, 0.04, 8, 32]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
      </mesh>
      {/* coffee surface */}
      <mesh position={[0, 1.19, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.78, 32]} />
        <meshStandardMaterial color="#1a0e05" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* handle */}
      <mesh position={[0.9, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.32, 0.09, 12, 24, Math.PI]} />
        <meshStandardMaterial color="#151515" roughness={0.6} />
      </mesh>
      {/* saucer */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[1.35, 1.35, 0.05, 40]} />
        <meshStandardMaterial color="#0f0f0f" roughness={0.7} />
      </mesh>
      {/* steam */}
      <points ref={steamRef} geometry={geom}>
        <pointsMaterial size={0.35} color="#e8dcc4" transparent opacity={0.18} depthWrite={false} sizeAttenuation />
      </points>
    </group>
  );
}

// ---------- brass magnifier ----------
function Magnifier() {
  return (
    <group position={[4.5, 0.05, 3.5]} rotation={[0, -0.5, 0]}>
      {/* handle */}
      <mesh position={[1.6, 0.08, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.08, 0.09, 2.4, 16]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.5} />
      </mesh>
      {/* brass ring */}
      <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.9, 0.09, 14, 40]} />
        <meshStandardMaterial color="#c48b3a" metalness={0.85} roughness={0.28} />
      </mesh>
      {/* glass */}
      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.85, 40]} />
        <meshPhysicalMaterial
          color="#ffddaa"
          transparent
          opacity={0.18}
          roughness={0.05}
          transmission={0.9}
          thickness={0.2}
        />
      </mesh>
    </group>
  );
}

// ---------- fountain pen ----------
function Pen() {
  return (
    <group position={[-2, 0.06, 5]} rotation={[0, 0.9, 0]}>
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 2.8, 20]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.35} metalness={0.4} />
      </mesh>

      {/* nib */}
      <mesh position={[1.5, 0, 0]}>
        <coneGeometry args={[0.09, 0.35, 12]} />
        <meshStandardMaterial color="#c9a24a" metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  );
}

// ---------- desk clock with ticking hand ----------
function Clock() {
  const handRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!handRef.current) return;
    const s = new Date().getSeconds() + new Date().getMilliseconds() / 1000;
    handRef.current.rotation.y = -(s / 60) * Math.PI * 2;
  });
  return (
    <group position={[3.5, 0.05, -6]}>
      {/* body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.9, 0.9, 0.35, 40]} />
        <meshStandardMaterial color="#c48b3a" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* face */}
      <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.78, 40]} />
        <meshBasicMaterial color="#efe6d0" />
      </mesh>
      {/* second hand */}
      <mesh ref={handRef} position={[0, 0.185, 0]}>
        <boxGeometry args={[0.03, 0.005, 0.65]} />
        <meshBasicMaterial color="#8b1a1a" />
      </mesh>
      {/* hour ticks */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh
          key={i}
          position={[Math.sin((i / 12) * Math.PI * 2) * 0.65, 0.185, Math.cos((i / 12) * Math.PI * 2) * 0.65]}
        >
          <boxGeometry args={[0.04, 0.005, 0.1]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
      ))}
    </group>
  );
}

// ---------- raccoon paperweight ----------
function Raccoon() {
  return (
    <group position={[-6.5, 0.04, -5.5]} rotation={[0, 0.6, 0]}>
      {/* body */}
      <mesh castShadow>
        <sphereGeometry args={[0.35, 20, 16]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* head */}
      <mesh position={[0, 0.28, 0.28]}>
        <sphereGeometry args={[0.24, 20, 16]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* ears */}
      <mesh position={[-0.14, 0.5, 0.28]}>
        <coneGeometry args={[0.07, 0.12, 12]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0.14, 0.5, 0.28]}>
        <coneGeometry args={[0.07, 0.12, 12]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* mask stripe */}
      <mesh position={[0, 0.28, 0.5]}>
        <boxGeometry args={[0.38, 0.06, 0.02]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>
    </group>
  );
}

// ---------- dust motes floating in the light cone ----------
function DustMotes() {
  const ref = useRef<THREE.Points>(null);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 90;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = 1 + Math.random() * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] += dt * 0.15;
      arr[i] += Math.sin(performance.now() * 0.0002 + i) * dt * 0.05;
      if (arr[i + 1] > 9) arr[i + 1] = 1;
    }
    pos.needsUpdate = true;
  });
  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial size={0.06} color="#ffcf88" transparent opacity={0.55} depthWrite={false} />
    </points>
  );
}

// ---------- camera + lamp behaviour ----------
function DeskRig() {
  const { camera } = useThree();
  const t0 = useRef(performance.now());
  useFrame(() => {
    const t = (performance.now() - t0.current) * 0.00005;
    // slight lateral drift, keeps composition alive without disorienting
    camera.position.x = Math.sin(t) * 1.2;
    camera.position.z = 14 + Math.cos(t) * 0.6;
    camera.position.y = 13;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function LampBreath() {
  const ref = useRef<THREE.SpotLight>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.0006;
    ref.current.intensity = 4.2 + Math.sin(t) * 0.35;
  });
  return (
    <spotLight
      ref={ref}
      position={[0, 10, 0]}
      angle={0.9}
      penumbra={0.9}
      intensity={4.2}
      color="#ffb060"
      distance={26}
      decay={1.6}
      castShadow={false}
    />
  );
}

function SpinningDesk({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.008; // ~13 min per full turn
  });
  return <group ref={ref}>{children}</group>;
}

function PauseWhenHidden() {
  const { invalidate } = useThree();
  useEffect(() => {
    const on = () => {
      if (!document.hidden) invalidate();
    };
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, [invalidate]);
  return null;
}

// ---------- scene root ----------
type Props = { className?: string };

export function DetectiveDesk({ className = "" }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.01 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);

  const dpr: [number, number] =
    typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches
      ? [1, 1.4]
      : [1, 1.8];

  return (
    <div
      ref={wrapRef}
      className={`detective-desk pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      {/* Warm ambient wash bleeding through the ink */}
      <div className="desk-lamp-pool" />
      <Suspense fallback={null}>
        <Canvas
          dpr={dpr}
          frameloop={visible && !reduced ? "always" : "demand"}
          camera={{ position: [0, 13, 14], fov: 45 }}
          gl={{ antialias: true, powerPreference: "low-power", alpha: true }}
          style={{ background: "transparent" }}
        >
          <PauseWhenHidden />
          <DeskRig />
          <fog attach="fog" args={["#050301", 16, 40]} />
          <ambientLight intensity={0.08} color="#3a2010" />
          <hemisphereLight args={["#4a2a10", "#000000", 0.12]} />
          <LampBreath />
          <SpinningDesk>
            <Tabletop />
            <CaseFiles />
            <Photo />
            <CoffeeMug />
            <Magnifier />
            <Pen />
            <Clock />
            <Raccoon />
          </SpinningDesk>
          <DustMotes />
        </Canvas>
      </Suspense>
      {/* Vignette on top — keeps the headline legible */}
      <div className="desk-vignette" />
    </div>
  );
}

export default DetectiveDesk;
