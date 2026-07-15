// LAYER-1 — WebGL noir city hero (three.js via r3f). Lazy-loaded.
// Runs behind the interactive 2D map as atmosphere. Pauses when tab hidden.

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

function Buildings() {
  const rand = useMemo(() => seeded(42), []);
  const buildings = useMemo(() => {
    const arr: { x: number; z: number; w: number; d: number; h: number; lit: number }[] = [];
    for (let i = 0; i < 120; i++) {
      arr.push({
        x: (rand() - 0.5) * 80,
        z: (rand() - 0.5) * 80,
        w: 1 + rand() * 2.5,
        d: 1 + rand() * 2.5,
        h: 2 + rand() * 14,
        lit: rand(),
      });
    }
    return arr;
  }, [rand]);

  return (
    <group>
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, b.h / 2, b.z]}>
          <mesh castShadow={false} receiveShadow={false}>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color="#05070d" roughness={0.9} metalness={0.1} />
          </mesh>
          {/* window glow strip */}
          <mesh position={[0, 0, b.d / 2 + 0.01]}>
            <planeGeometry args={[b.w * 0.9, b.h * 0.9]} />
            <shaderMaterial
              transparent
              uniforms={{ uColor: { value: new THREE.Color(b.lit > 0.55 ? "#f5b942" : "#22d3ee") }, uSeed: { value: b.lit * 100 } }}
              vertexShader={`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`}
              fragmentShader={`
                varying vec2 vUv; uniform vec3 uColor; uniform float uSeed;
                float grid(vec2 uv, vec2 cells){
                  vec2 g = fract(uv*cells);
                  float m = step(0.35,g.x)*step(g.x,0.75)*step(0.55,g.y)*step(g.y,0.85);
                  return m;
                }
                float rnd(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
                void main(){
                  vec2 cells = vec2(6.0, 12.0);
                  vec2 cid = floor(vUv*cells);
                  float on = step(0.55, rnd(cid+uSeed));
                  float m = grid(vUv, cells) * on;
                  gl_FragColor = vec4(uColor*1.4, m*0.9);
                }
              `}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Rain() {
  const ref = useRef<THREE.Points>(null);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 800;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = Math.random() * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] -= dt * 22;
      if (arr[i + 1] < 0) arr[i + 1] = 40;
    }
    pos.needsUpdate = true;
  });
  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial size={0.06} color="#4a6a9a" transparent opacity={0.5} />
    </points>
  );
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
    const on = () => { if (!document.hidden) invalidate(); };
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

  const dpr: [number, number] = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches
    ? [1, 1.5] : [1, 2];

  return (
    <div ref={wrapRef} className="absolute inset-0" aria-hidden>
      <Canvas
        dpr={dpr}
        frameloop={visible ? "always" : "never"}
        camera={{ position: [0, 10, 30], fov: 55 }}
        gl={{ antialias: false, powerPreference: "low-power", alpha: true }}
        style={{ background: "transparent" }}
      >
        <PauseWhenHidden />
        <CameraRig />
        <fog attach="fog" args={["#04060a", 20, 90]} />
        <ambientLight intensity={0.15} />
        <directionalLight position={[10, 30, 10]} intensity={0.25} color="#4a7cff" />
        <hemisphereLight args={["#22d3ee", "#0a0f1a", 0.15]} />
        <Buildings />
        <Rain />
        {/* ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#02040a" roughness={0.6} metalness={0.4} />
        </mesh>
      </Canvas>
    </div>
  );
}
