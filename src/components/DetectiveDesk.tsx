// LAYER-1 — WebGL noir detective desk. Presentation only.
//
// Rewritten in the NoirCityScene style: one lean scene, minimal useFrame
// subscriptions (2 total), shader-driven surfaces instead of large 2D
// canvas repaints, instanced meshes for the file scatter, and hard
// pause when off-screen or the tab is hidden. Zero per-frame CPU work
// besides the camera drift and candle flicker.

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

// A single shared "paper" canvas texture: typed lines + red CLASSIFIED
// stamp. Built once, reused across every case-file mesh via UV offsets.
function buildPaperAtlas() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext("2d")!;
  const rand = seeded(7);
  // 4 tile variants in a 2x2 grid so we can pick one per file via UV offset.
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      const ox = tx * 512;
      const oy = ty * 512;
      // aged paper
      const g = ctx.createRadialGradient(ox + 256, oy + 256, 40, ox + 256, oy + 256, 380);
      g.addColorStop(0, "#efe4c8");
      g.addColorStop(0.7, "#d9c69a");
      g.addColorStop(1, "#8a7346");
      ctx.fillStyle = g;
      ctx.fillRect(ox, oy, 512, 512);
      // stains
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = `rgba(70,40,15,${0.04 + rand() * 0.06})`;
        ctx.beginPath();
        ctx.arc(ox + rand() * 512, oy + rand() * 512, 20 + rand() * 60, 0, Math.PI * 2);
        ctx.fill();
      }
      // header block
      ctx.fillStyle = "#1a120a";
      ctx.font = "bold 34px monospace";
      ctx.fillText(["CASE 041", "CASE 108", "CASE 217", "CASE 003"][ty * 2 + tx], ox + 44, oy + 76);
      ctx.font = "18px monospace";
      ctx.fillStyle = "#3a2a18";
      ctx.fillText("MILVERSE COUNTER-SCAM DESK", ox + 44, oy + 102);
      // typed lines
      ctx.fillStyle = "#241812";
      for (let l = 0; l < 14; l++) {
        const y = oy + 150 + l * 22;
        const w = 380 - rand() * 120;
        ctx.fillRect(ox + 44, y, w, 3);
      }
      // redactions
      ctx.fillStyle = "#0a0806";
      for (let r = 0; r < 3; r++) {
        ctx.fillRect(ox + 44 + rand() * 200, oy + 180 + rand() * 260, 60 + rand() * 120, 14);
      }
      // CLASSIFIED stamp (only on 2 of 4 variants)
      if ((tx + ty) % 2 === 0) {
        ctx.save();
        ctx.translate(ox + 320, oy + 380);
        ctx.rotate(-0.28);
        ctx.strokeStyle = "rgba(180,20,20,0.85)";
        ctx.lineWidth = 4;
        ctx.strokeRect(-110, -34, 220, 68);
        ctx.fillStyle = "rgba(180,20,20,0.9)";
        ctx.font = "bold 36px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("CLASSIFIED", 0, 0);
        ctx.restore();
      }
      // torn edge shadow
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(ox + 4, oy + 4, 504, 504);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

// ---------- desk surface (shader, no big canvas) ----------
function Tabletop() {
  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uWarm: { value: new THREE.Color("#6a3a1a") },
        uDeep: { value: new THREE.Color("#120a04") },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `
        varying vec2 vUv; uniform vec3 uWarm; uniform vec3 uDeep;
        float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
        float noise(vec2 p){
          vec2 i=floor(p), f=fract(p);
          float a=rnd(i), b=rnd(i+vec2(1,0)), c=rnd(i+vec2(0,1)), d=rnd(i+vec2(1,1));
          vec2 u=f*f*(3.-2.*f);
          return mix(a,b,u.x)+ (c-a)*u.y*(1.-u.x)+ (d-b)*u.x*u.y;
        }
        void main(){
          vec2 p = vUv - 0.5;
          float r = length(p);
          // radial lamp hotspot
          float hot = smoothstep(0.7, 0.0, r);
          // wood grain: stretched noise + concentric rings
          float grain = noise(vec2(vUv.x*40.0, vUv.y*6.0));
          float rings = 0.5 + 0.5*sin(r*80.0 + noise(vUv*4.0)*6.0);
          vec3 col = mix(uDeep, uWarm, hot);
          col += vec3(0.05, 0.03, 0.015) * grain;
          col += vec3(0.03, 0.02, 0.01) * rings * hot;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }, []);
  return (
    <group>
      {/* Massive tabletop that reaches beyond the viewport so no bg shows */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={mat}>
        <planeGeometry args={[120, 90]} />
      </mesh>
      {/* Dark leather blotter under the central pool of files */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0.5]}>
        <planeGeometry args={[26, 16]} />
        <meshStandardMaterial color="#1a0d06" roughness={0.9} metalness={0} />
      </mesh>
      {/* Brass trim around the blotter */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0.5]}>
        <ringGeometry args={[12.6, 13.0, 64]} />
        <meshStandardMaterial color="#8a6420" roughness={0.35} metalness={0.9} />
      </mesh>
    </group>
  );
}

// ---------- instanced case files ----------
function CaseFiles() {
  const paper = useMemo(buildPaperAtlas, []);
  const files = useMemo(() => {
    const rand = seeded(19);
    const arr: { x: number; z: number; r: number; s: number; tile: number }[] = [];
    // scatter around a clean center pool (radius 4) so the headline stays readable
    for (let i = 0; i < 16; i++) {
      let x = 0, z = 0;
      for (let t = 0; t < 20; t++) {
        x = (rand() - 0.5) * 26;
        z = (rand() - 0.5) * 16;
        if (Math.hypot(x, z * 1.4) > 4.5) break;
      }
      arr.push({ x, z, r: (rand() - 0.5) * 1.6, s: 0.85 + rand() * 0.5, tile: Math.floor(rand() * 4) });
    }
    return arr;
  }, []);

  return (
    <group>
      {files.map((f, i) => {
        // Per-file UV offset selects one of the 4 atlas tiles.
        const tx = f.tile % 2;
        const ty = Math.floor(f.tile / 2);
        return (
          <mesh
            key={i}
            position={[f.x, 0.02 + (i % 3) * 0.015, f.z]}
            rotation={[-Math.PI / 2, 0, f.r]}
            scale={[f.s * 3, f.s * 3, 1]}
          >
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial
              map={paper}
              roughness={0.95}
              metalness={0}
              onUpdate={(m) => {
                m.map!.repeat.set(0.5, 0.5);
                m.map!.offset.set(tx * 0.5, ty * 0.5);
                m.needsUpdate = true;
              }}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ---------- brass magnifier ----------
function Magnifier() {
  return (
    <group position={[-6, 0.15, 3.2]} rotation={[-Math.PI / 2, 0, 0.4]}>
      {/* rim */}
      <mesh>
        <torusGeometry args={[1.1, 0.08, 12, 40]} />
        <meshStandardMaterial color="#b8892c" roughness={0.3} metalness={0.9} />
      </mesh>
      {/* glass */}
      <mesh>
        <circleGeometry args={[1.05, 40]} />
        <meshPhysicalMaterial
          color="#cfe5f0"
          transparent
          opacity={0.28}
          roughness={0.05}
          metalness={0}
          transmission={0.9}
        />
      </mesh>
      {/* handle */}
      <mesh position={[1.9, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 1.8, 12]} />
        <meshStandardMaterial color="#6a4622" roughness={0.6} metalness={0.3} />
      </mesh>
    </group>
  );
}

// ---------- candle ----------
function Candle() {
  const flameRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const flick = 0.9 + Math.sin(t * 11) * 0.06 + Math.sin(t * 23.3) * 0.04;
    if (flameRef.current) {
      flameRef.current.scale.set(flick, 1 + Math.sin(t * 9) * 0.08, flick);
    }
    if (lightRef.current) {
      lightRef.current.intensity = 2.4 * flick;
    }
  });
  return (
    <group position={[6.4, 0, -2.6]}>
      {/* brass holder */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.55, 0.7, 0.1, 20]} />
        <meshStandardMaterial color="#a8792a" roughness={0.35} metalness={0.85} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.5, 16]} />
        <meshStandardMaterial color="#8a6420" roughness={0.4} metalness={0.85} />
      </mesh>
      {/* wax */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.24, 0.28, 1.3, 18]} />
        <meshStandardMaterial color="#f2e6c8" roughness={0.7} emissive="#3a2410" emissiveIntensity={0.15} />
      </mesh>
      {/* flame */}
      <mesh ref={flameRef} position={[0, 1.85, 0]}>
        <coneGeometry args={[0.12, 0.4, 12]} />
        <meshBasicMaterial color="#ffcf70" transparent opacity={0.95} />
      </mesh>
      <mesh position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshBasicMaterial color="#ff8a1a" transparent opacity={0.18} />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, 2.0, 0]}
        color="#ffb060"
        intensity={2.4}
        distance={14}
        decay={2}
      />
    </group>
  );
}

// ---------- evidence photo ----------
function Photo() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 320;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#e9dcc0";
    ctx.fillRect(0, 0, 256, 320);
    // photo panel
    const g = ctx.createLinearGradient(0, 0, 0, 240);
    g.addColorStop(0, "#0a0f14");
    g.addColorStop(1, "#1a222c");
    ctx.fillStyle = g;
    ctx.fillRect(18, 18, 220, 240);
    // silhouette figure
    ctx.fillStyle = "#0a0806";
    ctx.beginPath();
    ctx.arc(128, 130, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(88, 160, 80, 90);
    // handwriting caption
    ctx.fillStyle = "#241812";
    ctx.font = "italic 20px serif";
    ctx.fillText("subject — 03:14", 30, 290);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }, []);
  return (
    <mesh position={[5, 0.08, 3]} rotation={[-Math.PI / 2, 0, -0.3]}>
      <planeGeometry args={[2.2, 2.75]} />
      <meshStandardMaterial map={tex} roughness={0.9} />
    </mesh>
  );
}

// ---------- dust motes ----------
function Dust() {
  const ref = useRef<THREE.Points>(null);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 220;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = 0.5 + Math.random() * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] += dt * 0.12;
      if (arr[i + 1] > 8.5) arr[i + 1] = 0.5;
    }
    pos.needsUpdate = true;
  });
  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial size={0.05} color="#f5c483" transparent opacity={0.35} sizeAttenuation />
    </points>
  );
}

// ---------- camera drift ----------
function CameraRig() {
  const { camera } = useThree();
  const t0 = useRef(performance.now());
  useFrame(() => {
    const t = (performance.now() - t0.current) * 0.00008;
    camera.position.x = Math.sin(t) * 1.6;
    camera.position.z = 17 + Math.cos(t * 0.7) * 0.6;
    camera.position.y = 11 + Math.sin(t * 0.5) * 0.4;
    camera.lookAt(0, 0.4, 0);
  });
  return null;
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
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      threshold: 0.01,
      rootMargin: "200px",
    });
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
      ? [1, 1.25]
      : [1, 1.5];

  return (
    <div
      ref={wrapRef}
      className={`detective-desk pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <div className="desk-lamp-pool" />
      {visible && (
        <Suspense fallback={null}>
          <Canvas
            dpr={dpr}
            frameloop={visible && !reduced ? "always" : "demand"}
            camera={{ position: [0, 11, 17], fov: 42 }}
            gl={{
              antialias: false,
              powerPreference: "low-power",
              alpha: true,
              stencil: false,
              depth: true,
            }}
            style={{ background: "transparent" }}
          >
            <PauseWhenHidden />
            <CameraRig />
            <fog attach="fog" args={["#0a0603", 18, 42]} />
            <ambientLight intensity={0.25} color="#6a3a1a" />
            <hemisphereLight args={["#8a5424", "#000000", 0.35]} />
            <directionalLight position={[0, 12, 6]} intensity={0.6} color="#ffb060" />
            <Tabletop />
            <CaseFiles />
            <Photo />
            <Magnifier />
            <Candle />
            <Dust />
          </Canvas>
        </Suspense>
      )}
      <div className="desk-vignette" />
    </div>
  );
}

export default DetectiveDesk;
