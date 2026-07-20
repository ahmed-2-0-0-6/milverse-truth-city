// LAYER-1 — WebGL noir detective desk. Presentation only.
//
// Rewritten in the NoirCityScene style: one lean scene, minimal useFrame
// subscriptions (3 total — camera drift, candle flicker, dust rise),
// shader-driven tabletop, instanced small props, shared materials.
// Zero per-frame CPU work besides those three loops.

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

// Shared materials — one allocation, reused across every mesh.
const BRASS_HI = new THREE.MeshStandardMaterial({ color: "#c9a24a", roughness: 0.22, metalness: 0.95 });
const BRASS_LO = new THREE.MeshStandardMaterial({ color: "#8a6420", roughness: 0.45, metalness: 0.85 });
const WALNUT   = new THREE.MeshStandardMaterial({ color: "#3a2010", roughness: 0.7,  metalness: 0.1  });
const BLACK_METAL = new THREE.MeshStandardMaterial({ color: "#141010", roughness: 0.35, metalness: 0.6 });
const IVORY   = new THREE.MeshStandardMaterial({ color: "#efe6d4", roughness: 0.55, metalness: 0.05 });
const MANILA  = new THREE.MeshStandardMaterial({ color: "#c8a259", roughness: 0.9,  metalness: 0    });
const DEEP_RED = new THREE.MeshBasicMaterial({ color: "#a41818" });
const INK_BLUE = new THREE.MeshStandardMaterial({ color: "#1a2a48", roughness: 0.85 });

// A single shared "paper" canvas atlas: 4 typed-page variants with
// stamps, tables, photo-strip. Picked per-file via UV offset.
function buildPaperAtlas() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext("2d")!;
  const rand = seeded(7);
  const titles = ["CASE 041 — NAWAZ", "CASE 108 — MIRPUR", "CASE 217 — LAHORE-N", "CASE 003 — KHI"];
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      const ox = tx * 512;
      const oy = ty * 512;
      // aged paper base
      const g = ctx.createRadialGradient(ox + 256, oy + 256, 40, ox + 256, oy + 256, 380);
      g.addColorStop(0, "#efe4c8");
      g.addColorStop(0.7, "#d9c69a");
      g.addColorStop(1, "#8a7346");
      ctx.fillStyle = g;
      ctx.fillRect(ox, oy, 512, 512);
      // coffee ring stain
      if ((tx + ty) % 3 !== 0) {
        ctx.strokeStyle = "rgba(90,50,20,0.35)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(ox + 400, oy + 80, 42, 0, Math.PI * 2);
        ctx.stroke();
      }
      // stains
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = `rgba(70,40,15,${0.04 + rand() * 0.06})`;
        ctx.beginPath();
        ctx.arc(ox + rand() * 512, oy + rand() * 512, 12 + rand() * 60, 0, Math.PI * 2);
        ctx.fill();
      }
      // header
      ctx.fillStyle = "#1a120a";
      ctx.font = "bold 30px monospace";
      ctx.fillText(titles[ty * 2 + tx], ox + 44, oy + 74);
      ctx.font = "16px monospace";
      ctx.fillStyle = "#3a2a18";
      ctx.fillText("MILVERSE — COUNTER-SCAM DESK / EYES ONLY", ox + 44, oy + 100);
      // typed lines
      ctx.fillStyle = "#241812";
      for (let l = 0; l < 14; l++) {
        const y = oy + 138 + l * 22;
        const w = 380 - rand() * 120;
        ctx.fillRect(ox + 44, y, w, 3);
      }
      // redactions
      ctx.fillStyle = "#0a0806";
      for (let r = 0; r < 4; r++) {
        ctx.fillRect(ox + 44 + rand() * 200, oy + 160 + rand() * 260, 60 + rand() * 120, 12);
      }
      // signature scrawl bottom-right
      ctx.strokeStyle = "#12233f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ox + 320, oy + 470);
      for (let k = 0; k < 40; k++) {
        ctx.lineTo(ox + 320 + k * 3, oy + 470 + Math.sin(k * 0.6) * 6 - k * 0.2);
      }
      ctx.stroke();
      // tile-specific extra
      if (tx === 0 && ty === 0) {
        // table grid
        ctx.strokeStyle = "#3a2a18";
        ctx.lineWidth = 1;
        for (let r = 0; r <= 5; r++) {
          ctx.beginPath();
          ctx.moveTo(ox + 44, oy + 340 + r * 22);
          ctx.lineTo(ox + 460, oy + 340 + r * 22);
          ctx.stroke();
        }
        for (let cc = 0; cc <= 4; cc++) {
          ctx.beginPath();
          ctx.moveTo(ox + 44 + cc * 104, oy + 340);
          ctx.lineTo(ox + 44 + cc * 104, oy + 450);
          ctx.stroke();
        }
      }
      if (tx === 1 && ty === 1) {
        // photo strip: 3 dark cells
        for (let p = 0; p < 3; p++) {
          ctx.fillStyle = "#0a0f14";
          ctx.fillRect(ox + 60 + p * 130, oy + 340, 110, 110);
          ctx.fillStyle = "#3a2a18";
          ctx.fillRect(ox + 60 + p * 130, oy + 455, 110, 8);
        }
      }
      // CLASSIFIED stamp on half the variants
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
      } else {
        // EVIDENCE stamp variant
        ctx.save();
        ctx.translate(ox + 140, oy + 400);
        ctx.rotate(0.18);
        ctx.strokeStyle = "rgba(20,40,120,0.8)";
        ctx.lineWidth = 3;
        ctx.strokeRect(-90, -26, 180, 52);
        ctx.fillStyle = "rgba(20,40,120,0.85)";
        ctx.font = "bold 28px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("EVIDENCE", 0, 0);
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

// ---------- desk surface (shader) + wainscoting + blotter ----------
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
          float hot = smoothstep(0.7, 0.0, r);
          // long-grain walnut
          float grain = noise(vec2(vUv.x*40.0, vUv.y*6.0));
          float knot  = smoothstep(0.35, 0.0, length(vUv-vec2(0.72,0.31))) * 0.5;
          float rings = 0.5 + 0.5*sin(r*80.0 + noise(vUv*4.0)*6.0);
          vec3 col = mix(uDeep, uWarm, hot);
          col += vec3(0.05, 0.03, 0.015) * grain;
          col += vec3(0.03, 0.02, 0.01) * rings * hot;
          col -= vec3(0.05, 0.03, 0.015) * knot;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }, []);
  return (
    <group>
      {/* Tabletop plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={mat}>
        <planeGeometry args={[120, 90]} />
      </mesh>
      {/* subtle waxed sheen streak (additive) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 2]}>
        <planeGeometry args={[36, 14]} />
        <meshBasicMaterial color="#ffb066" transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Front desk edge (bevel illusion) */}
      <mesh position={[0, -0.1, 20]}>
        <boxGeometry args={[120, 0.4, 0.6]} />
        <meshStandardMaterial color="#2a160a" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Dark leather blotter */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0.5]}>
        <planeGeometry args={[26, 16]} />
        <meshStandardMaterial color="#1a0d06" roughness={0.9} metalness={0} />
      </mesh>
      {/* Manila folder under the scatter (peeking edges) */}
      <mesh rotation={[-Math.PI / 2, 0, 0.05]} position={[0.4, 0.01, 0.6]} material={MANILA}>
        <planeGeometry args={[14, 10]} />
      </mesh>
      {/* Brass corner rings on blotter */}
      {[[-12.5, -7.5], [12.5, -7.5], [-12.5, 7.5], [12.5, 7.5]].map(([x, z], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.008, z + 0.5]} material={BRASS_HI}>
          <ringGeometry args={[0.35, 0.5, 20]} />
        </mesh>
      ))}
    </group>
  );
}

// ---------- back wall: damask wallpaper + wainscoting + bookshelf + framed portraits ----------
function BackWall() {
  const wallpaper = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    // deep oxblood base
    ctx.fillStyle = "#1a0d08";
    ctx.fillRect(0, 0, 256, 256);
    // damask motif — subtle gold diamond
    ctx.strokeStyle = "rgba(180,120,60,0.14)";
    ctx.lineWidth = 1.2;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const cx = x * 64 + 32, cy = y * 64 + 32;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 18);
        ctx.bezierCurveTo(cx + 18, cy - 18, cx + 18, cy + 18, cx, cy + 18);
        ctx.bezierCurveTo(cx - 18, cy + 18, cx - 18, cy - 18, cx, cy - 18);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(200,150,70,0.18)";
        ctx.fill();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 3);
    tex.anisotropy = 4;
    return tex;
  }, []);

  const portrait = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 128; c.height = 160;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 60, 5, 64, 80, 90);
    g.addColorStop(0, "#5a3818");
    g.addColorStop(1, "#0a0603");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 160);
    // silhouette bust
    ctx.fillStyle = "#0a0503";
    ctx.beginPath(); ctx.arc(64, 66, 22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(64, 120, 34, 28, 0, 0, Math.PI * 2); ctx.fill();
    return new THREE.CanvasTexture(c);
  }, []);

  const rng = seeded(7);
  const books = useMemo(() => {
    const arr: Array<{ x: number; h: number; w: number; c: string }> = [];
    let x = -14;
    const palette = ["#3a1a10", "#5a2a12", "#2a1508", "#4a2010", "#1a0d06", "#6a3418"];
    while (x < 14) {
      const w = 0.35 + rng() * 0.25;
      const h = 1.1 + rng() * 0.5;
      arr.push({ x, h, w, c: palette[Math.floor(rng() * palette.length)] });
      x += w + 0.02;
    }
    return arr;
  }, [rng]);

  return (
    <group position={[0, 0, -18]}>
      {/* wallpaper */}
      <mesh position={[0, 9, 0]}>
        <planeGeometry args={[120, 22]} />
        <meshStandardMaterial map={wallpaper} roughness={0.95} />
      </mesh>
      {/* wainscoting bottom */}
      <mesh position={[0, 1.4, 0.05]}>
        <planeGeometry args={[120, 2.8]} />
        <meshStandardMaterial color="#2a1608" roughness={0.85} />
      </mesh>
      {/* wainscoting panels */}
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={i} position={[-32 + i * 5, 1.4, 0.08]}>
          <planeGeometry args={[4.2, 2.0]} />
          <meshStandardMaterial color="#3a1e0c" roughness={0.75} />
        </mesh>
      ))}
      {/* chair rail */}
      <mesh position={[0, 2.85, 0.12]}>
        <boxGeometry args={[120, 0.22, 0.14]} />
        <meshStandardMaterial color="#7a4a20" roughness={0.45} metalness={0.35} />
      </mesh>
      {/* baseboard */}
      <mesh position={[0, 0.15, 0.12]}>
        <boxGeometry args={[120, 0.35, 0.18]} />
        <meshStandardMaterial color="#5a3418" roughness={0.5} metalness={0.25} />
      </mesh>

      {/* bookshelf, left */}
      <group position={[-22, 4.6, 0.4]}>
        <mesh position={[0, 0, -0.15]}>
          <boxGeometry args={[14.5, 3.2, 0.4]} />
          <meshStandardMaterial color="#1a0d06" roughness={0.9} />
        </mesh>
        {books.map((b, i) => (
          <mesh key={i} position={[b.x, 0, 0.1]}>
            <boxGeometry args={[b.w, b.h, 0.35]} />
            <meshStandardMaterial color={b.c} roughness={0.85} />
          </mesh>
        ))}
        {/* shelf plank */}
        <mesh position={[0, -0.75, 0.05]}>
          <boxGeometry args={[14.5, 0.15, 0.6]} />
          <meshStandardMaterial color="#3a1e0c" roughness={0.6} />
        </mesh>
      </group>

      {/* framed portrait, right */}
      <group position={[16, 6.2, 0.3]}>
        {/* frame */}
        <mesh>
          <boxGeometry args={[3.6, 4.6, 0.25]} />
          <meshStandardMaterial color="#8a5a1a" roughness={0.35} metalness={0.85} emissive="#3a1e08" emissiveIntensity={0.35} />
        </mesh>
        {/* inner mat */}
        <mesh position={[0, 0, 0.14]}>
          <planeGeometry args={[3.0, 4.0]} />
          <meshStandardMaterial map={portrait} roughness={0.8} />
        </mesh>
        {/* frame plaque */}
        <mesh position={[0, -2.5, 0.14]} material={BRASS_HI}>
          <boxGeometry args={[1.4, 0.2, 0.06]} />
        </mesh>
      </group>

      {/* small framed photo, far left */}
      <group position={[-12, 6.4, 0.3]} rotation={[0, 0, -0.03]}>
        <mesh>
          <boxGeometry args={[2.2, 2.8, 0.2]} />
          <meshStandardMaterial color="#6a4218" roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.12]}>
          <planeGeometry args={[1.7, 2.3]} />
          <meshStandardMaterial map={portrait} roughness={0.85} />
        </mesh>
      </group>

      {/* wall sconce glows (fake — cheap emissive discs) */}
      {[-6, 6].map((x, i) => (
        <group key={i} position={[x, 7.4, 0.35]}>
          <mesh material={BRASS_HI}>
            <cylinderGeometry args={[0.18, 0.22, 0.4, 12]} />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <sphereGeometry args={[0.35, 12, 12]} />
            <meshBasicMaterial color="#ffcc82" transparent opacity={0.85} />
          </mesh>
          {/* halo */}
          <mesh position={[0, 0.35, 0]}>
            <sphereGeometry args={[0.9, 12, 12]} />
            <meshBasicMaterial color="#ff9a3a" transparent opacity={0.14} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}


// ---------- instanced case files ----------
function CaseFiles() {
  const paper = useMemo(buildPaperAtlas, []);
  const files = useMemo(() => {
    const rand = seeded(19);
    const arr: { x: number; z: number; r: number; s: number; tile: number }[] = [];
    for (let i = 0; i < 18; i++) {
      let x = 0, z = 0;
      for (let t = 0; t < 20; t++) {
        x = (rand() - 0.5) * 26;
        z = (rand() - 0.5) * 16;
        if (Math.hypot(x, z * 1.4) > 4.5) break;
      }
      arr.push({ x, z, r: (rand() - 0.5) * 1.6, s: 0.85 + rand() * 0.55, tile: Math.floor(rand() * 4) });
    }
    return arr;
  }, []);

  return (
    <group>
      {files.map((f, i) => {
        const tx = f.tile % 2;
        const ty = Math.floor(f.tile / 2);
        return (
          <mesh
            key={i}
            position={[f.x, 0.02 + (i % 4) * 0.012, f.z]}
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

// ---------- red push-pins (instanced) ----------
const PIN_SEED = 41;
function generatePins() {
  const rand = seeded(PIN_SEED);
  const arr: [number, number, number][] = [];
  for (let i = 0; i < 8; i++) {
    arr.push([(rand() - 0.5) * 22, 0.08 + (i % 3) * 0.012, (rand() - 0.5) * 12]);
  }
  return arr;
}
function Pushpins() {
  const pins = useMemo(generatePins, []);
  return (
    <group>
      {pins.map((p, i) => (
        <group key={i} position={p}>
          <mesh material={DEEP_RED}>
            <sphereGeometry args={[0.11, 12, 10]} />
          </mesh>
          <mesh position={[0, -0.06, 0]} material={BLACK_METAL}>
            <cylinderGeometry args={[0.02, 0.02, 0.12, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------- red conspiracy string (one line-segments draw) ----------
function RedString() {
  const geom = useMemo(() => {
    const pins = generatePins();
    // route: pin[0] -> pin[3] -> pin[1] -> pin[5] -> pin[2] -> pin[7] -> pin[4] -> pin[6] -> pin[0]
    const order = [0, 3, 1, 5, 2, 7, 4, 6, 0];
    const g = new THREE.BufferGeometry();
    const pts: number[] = [];
    for (let i = 0; i < order.length - 1; i++) {
      const a = pins[order[i]], b = pins[order[i + 1]];
      // slight lift and sag mid-point for realism (2 segments per pair)
      const mid: [number, number, number] = [
        (a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 0.02, (a[2] + b[2]) / 2,
      ];
      pts.push(a[0], a[1] + 0.05, a[2], mid[0], mid[1], mid[2]);
      pts.push(mid[0], mid[1], mid[2], b[0], b[1] + 0.05, b[2]);
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <lineSegments geometry={geom}>
      <lineBasicMaterial color="#a01818" transparent opacity={0.85} />
    </lineSegments>
  );
}

// ---------- polaroids scattered ----------
function Polaroids() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 128; c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 60, 4, 64, 70, 70);
    g.addColorStop(0, "#3a2a1a"); g.addColorStop(1, "#0a0503");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = "#0a0503";
    ctx.beginPath(); ctx.arc(64, 58, 18, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(64, 100, 26, 20, 0, 0, Math.PI * 2); ctx.fill();
    return new THREE.CanvasTexture(c);
  }, []);
  const items = useMemo(() => {
    const r = seeded(91);
    return Array.from({ length: 3 }).map(() => ({
      p: [(r() - 0.5) * 18, 0.055 + r() * 0.02, (r() - 0.5) * 10] as [number, number, number],
      rot: (r() - 0.5) * 1.2,
    }));
  }, []);
  return (
    <group>
      {items.map((it, i) => (
        <group key={i} position={it.p} rotation={[-Math.PI / 2, 0, it.rot]}>
          {/* white border */}
          <mesh>
            <planeGeometry args={[1.6, 1.9]} />
            <meshStandardMaterial color="#efe6d4" roughness={0.9} />
          </mesh>
          {/* photo window */}
          <mesh position={[0, 0.12, 0.001]}>
            <planeGeometry args={[1.35, 1.35]} />
            <meshStandardMaterial map={tex} roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}


// ---------- paper clips (instanced) ----------
function PaperClips() {
  const rand = useMemo(() => seeded(53), []);
  const clips = useMemo(() => {
    const arr: { p: [number, number, number]; r: number }[] = [];
    for (let i = 0; i < 5; i++) {
      arr.push({
        p: [(rand() - 0.5) * 20, 0.04, (rand() - 0.5) * 10],
        r: rand() * Math.PI,
      });
    }
    return arr;
  }, [rand]);
  return (
    <group>
      {clips.map((c, i) => (
        <mesh key={i} position={c.p} rotation={[-Math.PI / 2, 0, c.r]}>
          <torusGeometry args={[0.28, 0.03, 6, 20, Math.PI * 1.6]} />
          <meshStandardMaterial color="#c8ccd2" roughness={0.35} metalness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

// ---------- brass magnifier ----------
function Magnifier() {
  return (
    <group position={[-6, 0.15, 3.2]} rotation={[-Math.PI / 2, 0, 0.4]}>
      <mesh material={BRASS_HI}>
        <torusGeometry args={[1.1, 0.08, 12, 40]} />
      </mesh>
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
      <mesh position={[1.9, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 1.8, 12]} />
        <meshStandardMaterial color="#6a4622" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* ferrule */}
      <mesh position={[1.0, 0, 0]} material={BRASS_LO}>
        <cylinderGeometry args={[0.11, 0.11, 0.14, 12]} />
      </mesh>
      {/* caustic hot spot on paper beneath lens */}
      <mesh position={[0, 0, -0.14]}>
        <circleGeometry args={[0.75, 24]} />
        <meshBasicMaterial color="#ffd88a" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ---------- brass compass ----------
function Compass() {
  return (
    <group position={[7.5, 0.06, 4.5]} rotation={[-Math.PI / 2, 0, 0.3]}>
      <mesh material={BRASS_HI}>
        <cylinderGeometry args={[0.85, 0.85, 0.12, 28]} />
      </mesh>
      <mesh position={[0, 0.07, 0]}>
        <circleGeometry args={[0.78, 28]} />
        <meshStandardMaterial color="#efe1bc" roughness={0.7} />
      </mesh>
      {/* needle */}
      <mesh position={[0, 0.09, 0]} rotation={[0, 0, 0.6]} material={DEEP_RED}>
        <boxGeometry args={[0.06, 0.02, 1.1]} />
      </mesh>
      {/* hinge */}
      <mesh position={[-0.85, 0.06, 0]} material={BRASS_LO}>
        <cylinderGeometry args={[0.1, 0.1, 0.22, 12]} />
      </mesh>
    </group>
  );
}

// ---------- stapler ----------
function Stapler() {
  return (
    <group position={[-8, 0.08, 4]} rotation={[0, 0.4, 0]}>
      <mesh position={[0, 0.08, 0]} material={BLACK_METAL}>
        <boxGeometry args={[1.6, 0.16, 0.5]} />
      </mesh>
      <mesh position={[0, 0.28, 0]} material={INK_BLUE}>
        <boxGeometry args={[1.5, 0.22, 0.42]} />
      </mesh>
      <mesh position={[0.7, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]} material={BRASS_LO}>
        <cylinderGeometry args={[0.11, 0.11, 0.44, 12]} />
      </mesh>

    </group>
  );
}

// ---------- typewriter (low-poly, silhouette-strong) ----------
function Typewriter() {
  const keys = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let r = 0; r < 3; r++) {
      const n = 10 - r;
      for (let k = 0; k < n; k++) {
        arr.push([-1.35 + k * 0.3 + r * 0.15, 0.62 + r * 0.05, 0.55 - r * 0.22]);
      }
    }
    return arr;
  }, []);
  return (
    <group position={[8.5, 0, -5]} rotation={[0, -0.35, 0]}>
      {/* base */}
      <mesh position={[0, 0.3, 0]} material={BLACK_METAL}>
        <boxGeometry args={[3.4, 0.6, 2.4]} />
      </mesh>
      {/* hood back */}
      <mesh position={[0, 0.85, -0.6]} material={BLACK_METAL}>
        <boxGeometry args={[3.2, 0.5, 1.0]} />
      </mesh>
      {/* roller */}
      <mesh position={[0, 1.15, -0.55]} rotation={[0, 0, Math.PI / 2]} material={IVORY}>
        <cylinderGeometry args={[0.18, 0.18, 3.0, 20]} />
      </mesh>
      {/* paper sheet in roller */}
      <mesh position={[0, 1.55, -0.55]} rotation={[-0.3, 0, 0]}>
        <planeGeometry args={[2.6, 1.3]} />
        <meshStandardMaterial color="#efe4c8" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* keys */}
      {keys.map((k, i) => (
        <mesh key={i} position={k} material={IVORY}>
          <cylinderGeometry args={[0.08, 0.08, 0.06, 10]} />
        </mesh>
      ))}
      {/* brand plaque */}
      <mesh position={[0, 0.55, 1.21]} material={BRASS_HI}>
        <boxGeometry args={[0.9, 0.12, 0.02]} />
      </mesh>
    </group>
  );
}

// ---------- rolodex ----------
function Rolodex() {
  const cards = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);
  return (
    <group position={[7.2, 0, -6]} rotation={[0, -0.6, 0]}>
      {/* base */}
      <mesh position={[0, 0.15, 0]} material={BLACK_METAL}>
        <boxGeometry args={[2.4, 0.3, 1.4]} />
      </mesh>
      {/* posts */}
      <mesh position={[-1.05, 0.55, 0]} material={BRASS_LO}>
        <cylinderGeometry args={[0.05, 0.05, 0.7, 8]} />
      </mesh>
      <mesh position={[1.05, 0.55, 0]} material={BRASS_LO}>
        <cylinderGeometry args={[0.05, 0.05, 0.7, 8]} />
      </mesh>
      {/* index cards fanned on axle */}
      {cards.map((i) => {
        const a = (i - 6) * 0.12;
        return (
          <mesh key={i} position={[0, 0.75, 0]} rotation={[a, 0, 0]}>
            <planeGeometry args={[1.9, 0.9]} />
            <meshStandardMaterial color="#efe4c8" roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
}

// ---------- raccoon paperweight (stylised silhouette) ----------
function Raccoon() {
  return (
    <group position={[3.6, 0, -4.4]} rotation={[0, 0.5, 0]}>
      {/* body */}
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.45, 16, 12]} />
        <meshStandardMaterial color="#5b5f66" roughness={0.55} metalness={0.4} />
      </mesh>
      {/* head */}
      <mesh position={[0, 0.85, 0.15]}>
        <sphereGeometry args={[0.32, 16, 12]} />
        <meshStandardMaterial color="#6a6e75" roughness={0.55} metalness={0.4} />
      </mesh>
      {/* mask stripe */}
      <mesh position={[0, 0.86, 0.42]}>
        <boxGeometry args={[0.42, 0.14, 0.02]} />
        <meshStandardMaterial color="#0f0f10" roughness={0.9} />
      </mesh>
      {/* ears */}
      <mesh position={[-0.2, 1.12, 0.05]}>
        <coneGeometry args={[0.08, 0.16, 8]} />
        <meshStandardMaterial color="#4a4e55" roughness={0.7} />
      </mesh>
      <mesh position={[0.2, 1.12, 0.05]}>
        <coneGeometry args={[0.08, 0.16, 8]} />
        <meshStandardMaterial color="#4a4e55" roughness={0.7} />
      </mesh>
      {/* brass plaque under */}
      <mesh position={[0, 0.02, 0]} material={BRASS_HI}>
        <cylinderGeometry args={[0.55, 0.55, 0.04, 20]} />
      </mesh>
    </group>
  );
}

// ---------- candle (only remaining flicker useFrame) ----------
function Candle() {
  const flameRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const flick = 0.9 + Math.sin(t * 11) * 0.06 + Math.sin(t * 23.3) * 0.04;
    if (flameRef.current) flameRef.current.scale.set(flick, 1 + Math.sin(t * 9) * 0.08, flick);
    if (lightRef.current) lightRef.current.intensity = 2.4 * flick;
  });
  return (
    <group position={[6.4, 0, -2.6]}>
      <mesh position={[0, 0.05, 0]} material={BRASS_HI}>
        <cylinderGeometry args={[0.55, 0.7, 0.1, 20]} />
      </mesh>
      <mesh position={[0, 0.35, 0]} material={BRASS_LO}>
        <cylinderGeometry args={[0.22, 0.28, 0.5, 16]} />
      </mesh>
      {/* wax */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.24, 0.28, 1.3, 18]} />
        <meshStandardMaterial color="#f2e6c8" roughness={0.7} emissive="#3a2410" emissiveIntensity={0.15} />
      </mesh>
      {/* wax drip */}
      <mesh position={[0.24, 0.75, 0]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <meshStandardMaterial color="#f2e6c8" roughness={0.7} />
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
    const g = ctx.createLinearGradient(0, 0, 0, 240);
    g.addColorStop(0, "#0a0f14");
    g.addColorStop(1, "#1a222c");
    ctx.fillStyle = g;
    ctx.fillRect(18, 18, 220, 240);
    ctx.fillStyle = "#0a0806";
    ctx.beginPath();
    ctx.arc(128, 130, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(88, 160, 80, 90);
    // grain
    for (let i = 0; i < 240; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
      ctx.fillRect(18 + Math.random() * 220, 18 + Math.random() * 240, 1, 1);
    }
    ctx.fillStyle = "#241812";
    ctx.font = "italic 20px serif";
    ctx.fillText("subject — 03:14", 30, 290);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }, []);
  return (
    <group>
      <mesh position={[5, 0.08, 3]} rotation={[-Math.PI / 2, 0, -0.3]}>
        <planeGeometry args={[2.2, 2.75]} />
        <meshStandardMaterial map={tex} roughness={0.9} />
      </mesh>
      {/* red pin holding it down */}
      <group position={[4.1, 0.12, 2.15]}>
        <mesh material={DEEP_RED}>
          <sphereGeometry args={[0.12, 12, 10]} />
        </mesh>
      </group>
    </group>
  );
}

// ---------- fountain pen ----------
function Pen() {
  return (
    <group position={[-2, 0.08, 5.2]} rotation={[-Math.PI / 2, 0, 1.15]}>
      <mesh>
        <cylinderGeometry args={[0.08, 0.08, 2.4, 12]} />
        <meshStandardMaterial color="#0e0a08" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.35, 0]} material={BRASS_HI}>
        <coneGeometry args={[0.08, 0.35, 12]} />
      </mesh>
      <mesh position={[0, -1.15, 0]} material={BRASS_HI}>
        <cylinderGeometry args={[0.09, 0.09, 0.15, 12]} />
      </mesh>
      {/* clip */}
      <mesh position={[0.09, 0.5, 0]} material={BRASS_LO}>
        <boxGeometry args={[0.03, 0.7, 0.04]} />
      </mesh>
    </group>
  );
}

// ---------- coffee cup + saucer + ring ----------
function Cup() {
  return (
    <group position={[-7.5, 0, -3.2]}>
      {/* saucer */}
      <mesh position={[0, 0.02, 0]} material={IVORY}>
        <cylinderGeometry args={[1.2, 1.2, 0.04, 24]} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.95, 0.85, 0.1, 24]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.6} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.7, 0.62, 1.0, 24, 1, true]} />
        <meshStandardMaterial color="#efe6d4" roughness={0.55} side={THREE.DoubleSide} />
      </mesh>
      {/* coffee surface */}
      <mesh position={[0, 1.02, 0]}>
        <cylinderGeometry args={[0.66, 0.66, 0.02, 24]} />
        <meshStandardMaterial color="#3a2010" roughness={0.4} emissive="#180a04" emissiveIntensity={0.4} />
      </mesh>
      {/* handle */}
      <mesh position={[0.78, 0.55, 0]} rotation={[0, 0, Math.PI / 2]} material={IVORY}>
        <torusGeometry args={[0.22, 0.06, 8, 16, Math.PI]} />
      </mesh>
      {/* faint ring stain on desk */}
      <mesh position={[1.6, 0.015, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.62, 24]} />
        <meshBasicMaterial color="#5a3820" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// ---------- hanging brass lamp shade (visual anchor top-of-frame) ----------
function Lamp() {
  return (
    <group position={[0, 6.5, 0]}>
      {/* cord */}
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 3.0, 6]} />
        <meshStandardMaterial color="#141010" />
      </mesh>
      {/* shade outer */}
      <mesh material={BRASS_HI}>
        <coneGeometry args={[1.6, 1.2, 24, 1, true]} />
      </mesh>
      {/* shade inner glow */}
      <mesh position={[0, -0.05, 0]}>
        <coneGeometry args={[1.55, 1.15, 24, 1, true]} />
        <meshBasicMaterial color="#ffd190" side={THREE.BackSide} transparent opacity={0.55} />
      </mesh>
      <pointLight position={[0, -0.4, 0]} color="#ffcc82" intensity={1.4} distance={22} decay={2} />
      {/* hot pool spotlight — one draw, dramatic falloff */}
      <spotLight
        position={[0, -0.2, 0]}
        target-position={[0, -6.5, 0]}
        angle={0.85}
        penumbra={0.7}
        intensity={2.4}
        color="#ffb46a"
        distance={18}
        decay={2}
        castShadow={false}
      />
      {/* volumetric-ish light cone (cheap billboard cone) */}
      <mesh position={[0, -3.2, 0]}>
        <coneGeometry args={[3.4, 6.0, 24, 1, true]} />
        <meshBasicMaterial color="#ffb46a" transparent opacity={0.05} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
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
    camera.position.x = Math.sin(t) * 1.4;
    camera.position.z = 15 + Math.cos(t * 0.7) * 0.5;
    camera.position.y = 9 + Math.sin(t * 0.5) * 0.35;
    camera.lookAt(0, 0.2, 0);
  });
  return null;
}

function PauseWhenHidden() {
  const { invalidate } = useThree();
  useEffect(() => {
    const on = () => { if (!document.hidden) invalidate(); };
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, [invalidate]);
  return null;
}

// ---------- scene root ----------
type Props = { className?: string };

// ---------- ashtray + smoldering cigarette (static) ----------
function Ashtray() {
  return (
    <group position={[6.8, 0, -2.4]}>
      {/* glass dish */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.95, 0.8, 0.1, 20]} />
        <meshPhysicalMaterial color="#1a0e08" roughness={0.15} metalness={0} transmission={0.6} thickness={0.3} ior={1.45} />
      </mesh>
      <mesh position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.02, 20]} />
        <meshStandardMaterial color="#3a2a1c" roughness={0.9} />
      </mesh>
      {/* ash pile */}
      <mesh position={[0.15, 0.13, 0.1]}>
        <sphereGeometry args={[0.14, 8, 6]} />
        <meshStandardMaterial color="#4a423c" roughness={1} />
      </mesh>
      {/* cigarette */}
      <mesh position={[0.3, 0.14, 0]} rotation={[0, 0.6, Math.PI / 2 - 0.1]}>
        <cylinderGeometry args={[0.05, 0.05, 0.9, 8]} />
        <meshStandardMaterial color="#f4ecd8" roughness={0.9} />
      </mesh>
      {/* filter */}
      <mesh position={[-0.05, 0.14, -0.28]} rotation={[0, 0.6, Math.PI / 2 - 0.1]}>
        <cylinderGeometry args={[0.055, 0.055, 0.22, 8]} />
        <meshStandardMaterial color="#c89a4a" roughness={0.95} />
      </mesh>
      {/* ember */}
      <mesh position={[0.7, 0.14, 0.22]}>
        <sphereGeometry args={[0.055, 8, 6]} />
        <meshBasicMaterial color="#ff6820" />
      </mesh>
      <pointLight position={[0.7, 0.22, 0.22]} color="#ff5a10" intensity={0.35} distance={1.4} decay={2} />
    </group>
  );
}

// ---------- spent brass casings ----------
function Casings() {
  const items = [
    { p: [4.2, 0.06, 3.4] as [number, number, number], r: 0.7 },
    { p: [4.9, 0.06, 3.05] as [number, number, number], r: -0.2 },
    { p: [-3.6, 0.06, 4.1] as [number, number, number], r: 1.2 },
  ];
  return (
    <group>
      {items.map((it, i) => (
        <group key={i} position={it.p} rotation={[Math.PI / 2, 0, it.r]}>
          <mesh material={BRASS_HI}>
            <cylinderGeometry args={[0.11, 0.11, 0.55, 12]} />
          </mesh>
          <mesh position={[0, -0.28, 0]} material={BRASS_LO}>
            <cylinderGeometry args={[0.12, 0.12, 0.04, 12]} />
          </mesh>
          <mesh position={[0, -0.31, 0]}>
            <circleGeometry args={[0.075, 12]} />
            <meshStandardMaterial color="#241612" roughness={0.6} metalness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------- ink splatter + extra stains on the desk (static decals) ----------
function DeskDecals() {
  const rng = seeded(9137);
  const splats = Array.from({ length: 14 }, (_, i) => ({
    p: [rng() * 12 - 6, 0.012, rng() * 8 - 2] as [number, number, number],
    s: 0.08 + rng() * 0.18,
    o: 0.25 + rng() * 0.4,
    k: i,
  }));
  return (
    <group>
      {/* ink pool near typewriter */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.4, 0.014, -1.2]}>
        <circleGeometry args={[0.55, 24]} />
        <meshBasicMaterial color="#0a0608" transparent opacity={0.75} />
      </mesh>
      {/* extra coffee ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.2, 0.014, -0.6]}>
        <ringGeometry args={[0.42, 0.5, 24]} />
        <meshBasicMaterial color="#5a3820" transparent opacity={0.28} />
      </mesh>
      {/* micro splatter */}
      {splats.map(s => (
        <mesh key={s.k} rotation={[-Math.PI / 2, 0, 0]} position={s.p}>
          <circleGeometry args={[s.s, 8]} />
          <meshBasicMaterial color="#0a0608" transparent opacity={s.o} />
        </mesh>
      ))}
      {/* chalk-white grease pencil arrow */}
      <mesh rotation={[-Math.PI / 2, 0, 0.6]} position={[-1.6, 0.014, 2.4]}>
        <planeGeometry args={[1.6, 0.06]} />
        <meshBasicMaterial color="#e8e2d0" transparent opacity={0.55} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0.6 + Math.PI / 4]} position={[-1.0, 0.014, 2.9]}>
        <planeGeometry args={[0.4, 0.06]} />
        <meshBasicMaterial color="#e8e2d0" transparent opacity={0.55} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0.6 - Math.PI / 4]} position={[-1.0, 0.014, 2.5]}>
        <planeGeometry args={[0.4, 0.06]} />
        <meshBasicMaterial color="#e8e2d0" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

// ---------- letter opener + wax seal ----------
function LetterOpener() {
  return (
    <group position={[5.6, 0.05, 2.2]} rotation={[0, 0.4, 0]}>
      {/* blade */}
      <mesh position={[0, 0.01, 0]} rotation={[Math.PI / 2, 0, 0]} material={BRASS_HI}>
        <coneGeometry args={[0.12, 1.6, 4]} />
      </mesh>
      {/* handle */}
      <mesh position={[0, 0.03, 0.95]}>
        <cylinderGeometry args={[0.12, 0.12, 0.7, 12]} />
        <meshStandardMaterial color="#2a1608" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* wax seal beside */}
      <mesh position={[-0.9, 0.02, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.28, 0.32, 0.06, 16]} />
        <meshStandardMaterial color="#8a1418" roughness={0.5} metalness={0.1} emissive="#3a0808" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

// ---------- folded newspaper ----------
function Newspaper() {
  return (
    <group position={[-4.6, 0.02, -2.6]} rotation={[-Math.PI / 2, 0, -0.35]}>
      {/* newsprint */}
      <mesh>
        <planeGeometry args={[3.4, 2.2]} />
        <meshStandardMaterial color="#d8cfb6" roughness={0.95} />
      </mesh>
      {/* masthead bar */}
      <mesh position={[0, 0.9, 0.001]}>
        <planeGeometry args={[3.0, 0.28]} />
        <meshBasicMaterial color="#141010" />
      </mesh>
      {/* headline block */}
      <mesh position={[-0.6, 0.4, 0.001]}>
        <planeGeometry args={[1.6, 0.32]} />
        <meshBasicMaterial color="#141010" />
      </mesh>
      {/* photo */}
      <mesh position={[0.9, 0.15, 0.001]}>
        <planeGeometry args={[1.2, 0.9]} />
        <meshStandardMaterial color="#3a2a20" roughness={0.9} />
      </mesh>
      {/* columns (thin bars) */}
      {[-1.1, -0.5, 0.1, 0.7].map((x, i) => (
        <mesh key={i} position={[x, -0.55, 0.001]}>
          <planeGeometry args={[0.5, 0.7]} />
          <meshBasicMaterial color="#6a5a48" transparent opacity={0.35} />
        </mesh>
      ))}
      {/* fold shadow */}
      <mesh position={[0, 0, 0.002]}>
        <planeGeometry args={[3.4, 0.04]} />
        <meshBasicMaterial color="#000" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// ---------- detective badge (five-point brass star) ----------
function Badge() {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const spikes = 5, outer = 0.55, inner = 0.22;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
    }
    s.closePath();
    return s;
  }, []);
  return (
    <group position={[6.4, 0.05, 3.4]} rotation={[-Math.PI / 2, 0, 0.4]}>
      <mesh>
        <extrudeGeometry args={[shape, { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }]} />
        <meshStandardMaterial color="#d4a848" roughness={0.28} metalness={0.95} emissive="#3a2408" emissiveIntensity={0.25} />
      </mesh>
      {/* center disc */}
      <mesh position={[0, 0, 0.07]}>
        <cylinderGeometry args={[0.16, 0.16, 0.02, 20]} />
        <meshStandardMaterial color="#8a6a2a" roughness={0.4} metalness={0.9} />
      </mesh>
    </group>
  );
}

// ---------- key ring with two keys ----------
function Keyring() {
  return (
    <group position={[2.2, 0.05, 3.8]} rotation={[-Math.PI / 2, 0, 0.9]}>
      {/* ring */}
      <mesh material={BRASS_LO}>
        <torusGeometry args={[0.32, 0.04, 8, 20]} />
      </mesh>
      {/* key 1 */}
      <group position={[0.55, 0, 0]}>
        <mesh material={BRASS_HI}>
          <cylinderGeometry args={[0.05, 0.05, 0.9, 8]} />
        </mesh>
        <mesh position={[0, 0.5, 0]} material={BRASS_HI}>
          <cylinderGeometry args={[0.2, 0.2, 0.04, 16]} />
        </mesh>
        <mesh position={[0, -0.42, 0]} material={BRASS_HI}>
          <boxGeometry args={[0.14, 0.14, 0.06]} />
        </mesh>
      </group>
      {/* key 2 */}
      <group position={[0.5, 0, 0]} rotation={[0, 0, 0.3]}>
        <mesh material={BRASS_LO}>
          <cylinderGeometry args={[0.045, 0.045, 0.75, 8]} />
        </mesh>
        <mesh position={[0, 0.42, 0]} material={BRASS_LO}>
          <torusGeometry args={[0.16, 0.03, 6, 14]} />
        </mesh>
      </group>
    </group>
  );
}

// ---------- postage envelope with stamp + wax stain ----------
function Envelope() {
  return (
    <group position={[-2.2, 0.014, -3.6]} rotation={[-Math.PI / 2, 0, 0.15]}>
      <mesh>
        <planeGeometry args={[2.4, 1.4]} />
        <meshStandardMaterial color="#efe6d4" roughness={0.92} />
      </mesh>
      {/* flap triangle (as tri) */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[2.4, 0.7]} />
        <meshStandardMaterial color="#e2d6b8" roughness={0.9} />
      </mesh>
      {/* stamp */}
      <mesh position={[0.85, 0.4, 0.002]}>
        <planeGeometry args={[0.55, 0.42]} />
        <meshStandardMaterial color="#7a1a1a" roughness={0.7} emissive="#2a0808" emissiveIntensity={0.2} />
      </mesh>
      {/* cancellation ring */}
      <mesh position={[0.85, 0.4, 0.003]}>
        <ringGeometry args={[0.18, 0.22, 24]} />
        <meshBasicMaterial color="#141010" transparent opacity={0.7} />
      </mesh>
      {/* address lines */}
      <mesh position={[-0.4, 0.05, 0.002]}>
        <planeGeometry args={[1.1, 0.05]} />
        <meshBasicMaterial color="#141010" transparent opacity={0.75} />
      </mesh>
      <mesh position={[-0.5, -0.1, 0.002]}>
        <planeGeometry args={[0.9, 0.05]} />
        <meshBasicMaterial color="#141010" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// ---------- desk front-lip (grounds the table under the camera) ----------
function DeskLip() {
  return (
    <group position={[0, -0.05, 6.4]}>
      <mesh>
        <boxGeometry args={[22, 0.35, 0.5]} />
        <meshStandardMaterial color="#2a160a" roughness={0.55} metalness={0.2} />
      </mesh>
      {/* brass drawer pull */}
      <mesh position={[0, -0.05, 0.28]} rotation={[Math.PI / 2, 0, 0]} material={BRASS_HI}>
        <torusGeometry args={[0.28, 0.05, 8, 18, Math.PI]} />
      </mesh>
      {/* keyhole */}
      <mesh position={[0, 0.02, 0.28]}>
        <circleGeometry args={[0.05, 12]} />
        <meshBasicMaterial color="#050303" />
      </mesh>
    </group>
  );
}

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

  // Cursor-follow "reader's light" — updates CSS variables directly (no React re-render).
  const lightRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = lightRef.current;
    if (!el || reduced) return;
    let raf = 0;
    let tx = 50, ty = 50;
    const onMove = (e: PointerEvent) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      tx = ((e.clientX - r.left) / r.width) * 100;
      ty = ((e.clientY - r.top) / r.height) * 100;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          const wrap = wrapRef.current;
          el.style.setProperty("--rx", tx + "%");
          el.style.setProperty("--ry", ty + "%");
          // parallax offsets — normalized -1..1, applied to overlay layers
          if (wrap) {
            const nx = (tx - 50) / 50;
            const ny = (ty - 50) / 50;
            wrap.style.setProperty("--pax", nx.toFixed(3));
            wrap.style.setProperty("--pay", ny.toFixed(3));
          }
          raf = 0;
        });
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  // Live CCTV timecode — real wall clock, tiny state, updates once/sec
  const [clock, setClock] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
  });
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      const d = new Date();
      setClock(`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`);
    }, 1000);
    return () => window.clearInterval(id);
  }, [reduced]);



  return (
    <div
      ref={wrapRef}
      className={`detective-desk pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      {/* rain-lit window bleed on back wall */}
      <div className="desk-window">
        <div className="desk-window-glow" />
        <svg className="desk-rain" viewBox="0 0 200 200" preserveAspectRatio="none">
          {Array.from({ length: 22 }, (_, i) => (
            <line
              key={i}
              x1={(i * 9.3) % 200}
              y1={-10}
              x2={((i * 9.3) % 200) - 6}
              y2={30 + (i % 5) * 8}
              stroke="rgba(180,210,240,0.35)"
              strokeWidth="0.6"
            >
              <animate
                attributeName="y1"
                values="-20;220"
                dur={`${1.6 + (i % 4) * 0.3}s`}
                begin={`${(i * 0.11) % 1.5}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="y2"
                values="10;250"
                dur={`${1.6 + (i % 4) * 0.3}s`}
                begin={`${(i * 0.11) % 1.5}s`}
                repeatCount="indefinite"
              />
            </line>
          ))}
        </svg>
      </div>

      <div className="desk-lamp-pool" />
      {visible && (
        <Suspense fallback={null}>
          <Canvas
            dpr={dpr}
            frameloop={visible && !reduced ? "always" : "demand"}
            camera={{ position: [0, 9, 15], fov: 54 }}
            gl={{
              antialias: false,
              powerPreference: "low-power",
              alpha: true,
              stencil: false,
              depth: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.05,
            }}
            style={{ background: "transparent" }}
          >
            <PauseWhenHidden />
            <CameraRig />
            <fog attach="fog" args={["#0c0603", 22, 55]} />
            <ambientLight intensity={0.22} color="#6a3a1a" />
            <hemisphereLight args={["#8a5424", "#050202", 0.3]} />
            <directionalLight position={[0, 12, 6]} intensity={0.55} color="#ffb060" />
            {/* cool rim from behind for silhouette */}
            <directionalLight position={[-6, 4, -14]} intensity={0.35} color="#4a6a90" />
            <BackWall />
            <Tabletop />

            <CaseFiles />
            <DeskDecals />
            <Pushpins />
            <RedString />
            <PaperClips />
            <Polaroids />
            <Photo />
            <Magnifier />
            <Compass />
            <Stapler />
            <Typewriter />
            <Rolodex />
            <Raccoon />
            <Pen />
            <Cup />
            <Ashtray />
            <Casings />
            <LetterOpener />
            <Newspaper />
            <Envelope />
            <Badge />
            <Keyring />
            <DeskLip />
            <Candle />
            <Lamp />
            <Dust />
          </Canvas>
        </Suspense>
      )}
      <div className="desk-fan-shadow" />
      <div ref={lightRef} className="desk-reader-light" />
      <div className="desk-letterbox top" />
      <div className="desk-letterbox bottom" />
      <div className="desk-grade" />
      <div className="desk-vignette" />
      {/* HUD case-file ticker — typewriter */}
      <div className="desk-hud">
        <span className="desk-hud-dot" />
        <span className="desk-hud-label">CASE FILE</span>
        <span className="desk-hud-num">#MV-4471</span>
        <span className="desk-hud-status">/ ACTIVE</span>
      </div>
      <div className="desk-hud-stamp">CONFIDENTIAL</div>

      {/* Audio intercept — waveform equalizer (compositor-only CSS) */}
      <div className="desk-intercept" aria-hidden="true">
        <span className="desk-intercept-rec" />
        <span className="desk-intercept-label">AUDIO INTERCEPT · CH-07</span>
        <span className="desk-eq">
          <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
        </span>
        <span className="desk-intercept-time">00:04:12</span>
      </div>

      {/* Fingerprint scanner panel — SVG with scan line */}
      <div className="desk-print" aria-hidden="true">
        <svg viewBox="0 0 60 72" className="desk-print-svg">
          <g fill="none" stroke="rgba(255,190,120,0.85)" strokeWidth="1.1" strokeLinecap="round">
            <path d="M30 6c-11 0-20 9-20 22v8" />
            <path d="M30 12c-8 0-14 7-14 16v10c0 4-1 8-3 12" />
            <path d="M30 18c-5 0-9 5-9 11v13c0 5-2 10-5 14" />
            <path d="M30 24c-3 0-5 3-5 7v14c0 6-2 12-6 17" />
            <path d="M30 30c-1 0-2 1-2 3v14c0 7-3 14-8 20" />
            <path d="M30 30c1 0 2 1 2 3v10c0 8 3 15 9 21" />
            <path d="M30 24c3 0 5 3 5 7v10c0 9 4 17 11 24" />
            <path d="M30 18c5 0 9 5 9 11v9c0 10 6 20 15 27" />
            <path d="M30 12c8 0 14 7 14 16v7c0 12 8 23 20 30" />
          </g>
          <line className="desk-print-scan" x1="6" y1="0" x2="54" y2="0" stroke="rgba(120,255,190,0.9)" strokeWidth="1.4" />
        </svg>
        <span className="desk-print-label">PRINT · MATCH 87%</span>
      </div>

      {/* Peel-back sticky note — handwritten warning */}
      <div className="desk-sticky" aria-hidden="true">
        <span className="desk-sticky-line">DO NOT</span>
        <span className="desk-sticky-line">TRUST</span>
        <span className="desk-sticky-line">HIM.</span>
      </div>

      {/* Morse LED — blinks "SOS" then pauses */}
      <div className="desk-morse" aria-hidden="true">
        <span className="desk-morse-led" />
        <span className="desk-morse-tag">TX · SOS</span>
      </div>

      {/* CCTV viewfinder — corner brackets, crosshair, live REC + timecode */}
      <div className="desk-cctv" aria-hidden="true">
        <span className="desk-cctv-b tl" /><span className="desk-cctv-b tr" />
        <span className="desk-cctv-b bl" /><span className="desk-cctv-b br" />
        <span className="desk-cctv-cross" />
        <span className="desk-cctv-scan" />
        <span className="desk-cctv-meta">
          <span className="desk-cctv-rec" /> REC · CAM-03 · {clock}
        </span>
      </div>

      {/* Polygraph strip — animated pulse line along the bottom */}
      <div className="desk-poly" aria-hidden="true">
        <span className="desk-poly-label">STRESS INDEX</span>
        <svg className="desk-poly-svg" viewBox="0 0 600 40" preserveAspectRatio="none">
          <path
            className="desk-poly-path"
            d="M0 20 L60 20 L70 8 L80 32 L90 20 L160 20 L172 4 L184 36 L196 20 L280 20 L292 12 L304 28 L316 20 L400 20 L412 2 L424 38 L436 20 L520 20 L532 14 L544 26 L556 20 L600 20"
            fill="none" stroke="rgba(120,255,190,0.9)" strokeWidth="1.4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* UV Blacklight sweep — auto-cycles; reveals a hidden watermark */}
      <div className="desk-uv" aria-hidden="true">
        <span className="desk-uv-bar" />
        <span className="desk-uv-mark">TRUTH · IS · A · WITNESS</span>
        <span className="desk-uv-tag">UV · 365nm</span>
      </div>

      {/* Dispatch scanner — marquee police chatter across the top */}
      <div className="desk-dispatch" aria-hidden="true">
        <span className="desk-dispatch-band">DISPATCH · 154.115 MHz</span>
        <div className="desk-dispatch-wrap">
          <div className="desk-dispatch-track">
            <span>10-4 · UNIT 34-BRAVO EN ROUTE · SUSPECT LAST SEEN I.I. CHUNDRIGAR · OVER &nbsp;·&nbsp; </span>
            <span>ALL POINTS · BE ADVISED · WIRE-FRAUD IN PROGRESS · GRID 07 · REQUEST BACKUP &nbsp;·&nbsp; </span>
            <span>10-20 CONFIRMED · SIGNAL FIVE · PHONE-SCAM ORIGIN TRACED TO CELL 21A &nbsp;·&nbsp; </span>
            <span>COPY THAT · MAINTAIN VISUAL · DO NOT ENGAGE · REPEAT · DO NOT ENGAGE &nbsp;·&nbsp; </span>
            {/* duplicate for seamless loop */}
            <span>10-4 · UNIT 34-BRAVO EN ROUTE · SUSPECT LAST SEEN I.I. CHUNDRIGAR · OVER &nbsp;·&nbsp; </span>
            <span>ALL POINTS · BE ADVISED · WIRE-FRAUD IN PROGRESS · GRID 07 · REQUEST BACKUP &nbsp;·&nbsp; </span>
            <span>10-20 CONFIRMED · SIGNAL FIVE · PHONE-SCAM ORIGIN TRACED TO CELL 21A &nbsp;·&nbsp; </span>
            <span>COPY THAT · MAINTAIN VISUAL · DO NOT ENGAGE · REPEAT · DO NOT ENGAGE &nbsp;·&nbsp; </span>
          </div>
        </div>
      </div>

      {/* Sonar sweep — rotating arm with concentric rings + contact blip */}
      <div className="desk-sonar" aria-hidden="true">
        <span className="desk-sonar-ring r1" />
        <span className="desk-sonar-ring r2" />
        <span className="desk-sonar-ring r3" />
        <span className="desk-sonar-arm" />
        <span className="desk-sonar-blip" />
        <span className="desk-sonar-tag">SWEEP · 3.2 km</span>
      </div>

      {/* Coordinates trace HUD — retargets every ~9s with a glitch */}
      <div className="desk-coords" aria-hidden="true">
        <span className="desk-coords-key">TRACE</span>
        <span className="desk-coords-val">
          <span>24.8607° N, 67.0011° E · KARACHI</span>
          <span>33.6844° N, 73.0479° E · ISLAMABAD</span>
          <span>31.5497° N, 74.3436° E · LAHORE</span>
          <span>25.3960° N, 68.3578° E · HYDERABAD</span>
        </span>
        <span className="desk-coords-lock">LOCK</span>
      </div>

      {/* Encrypted data cascade — Matrix-style rain along right edge */}
      <div className="desk-cascade" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`desk-cascade-col c${i}`}>
            <span>MV-4471</span><span>0xA3F7</span><span>24.86°N</span>
            <span>67.00°E</span><span>ACK</span><span>0xBE21</span>
            <span>MV-2189</span><span>03:14:07</span><span>0xDEAD</span>
            <span>73.04°E</span><span>SIGINT</span><span>0xC0FE</span>
            <span>MV-0031</span><span>MATCH</span><span>0x9B3C</span>
            <span>31.54°N</span><span>0xFACE</span><span>MV-1102</span>
          </div>
        ))}
      </div>

      {/* Person of Interest — dossier card cycles through 4 suspects */}
      <div className="desk-poi" aria-hidden="true">
        <div className="desk-poi-head">
          <span className="desk-poi-tag">PERSON OF INTEREST</span>
          <span className="desk-poi-id">ID · 000-<span className="desk-poi-num">417</span></span>
        </div>
        <div className="desk-poi-body">
          <svg className="desk-poi-mug" viewBox="0 0 40 48">
            <rect width="40" height="48" fill="rgba(20,10,4,0.85)" />
            <circle cx="20" cy="18" r="8" fill="rgba(200,170,130,0.55)" />
            <path d="M4 48 C 6 34, 34 34, 36 48 Z" fill="rgba(200,170,130,0.55)" />
            <rect x="0" y="22" width="40" height="4" fill="rgba(0,0,0,0.9)" />
            <rect x="0" y="34" width="40" height="2" fill="rgba(255,220,180,0.35)" />
          </svg>
          <div className="desk-poi-lines">
            <span className="desk-poi-name">ALIAS · "THE VOICE"</span>
            <span className="desk-poi-meta">CELL 21A · LAHORE</span>
            <div className="desk-poi-threat">
              <span className="desk-poi-threat-label">THREAT</span>
              <span className="desk-poi-threat-bar"><i /></span>
              <span className="desk-poi-threat-val">HIGH</span>
            </div>
          </div>
        </div>
      </div>

      {/* Distant lightning — cool-blue full-scene flash, rare */}
      <div className="desk-thunder" aria-hidden="true" />

      {/* Cold-open title card — one-shot cinematic on mount */}
      <div className="desk-coldopen" aria-hidden="true">
        <div className="desk-coldopen-box">
          <span className="desk-coldopen-eye">◉ EYES ONLY</span>
          <span className="desk-coldopen-title">SECTION 7</span>
          <span className="desk-coldopen-sub">CASE FILE · MV-4471</span>
          <span className="desk-coldopen-rule" />
          <span className="desk-coldopen-foot">MILVERSE COUNTER-SCAM DIVISION</span>
        </div>
      </div>

      {/* Ink annotation — red circle + arrow + label drawn on with pen scratch */}
      <svg className="desk-ink" viewBox="0 0 400 240" aria-hidden="true">
        <circle
          className="desk-ink-circle"
          cx="120" cy="120" r="52"
          fill="none" stroke="#d0261a" strokeWidth="2.4"
          strokeLinecap="round"
          pathLength="1"
        />
        <path
          className="desk-ink-arrow"
          d="M 200 80 Q 235 110, 210 148 L 195 132 M 210 148 L 226 138"
          fill="none" stroke="#d0261a" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round"
          pathLength="1"
        />
        <text
          className="desk-ink-label"
          x="248" y="76"
          fill="#d0261a"
          fontFamily='"Caveat", cursive'
          fontSize="26" fontWeight="700"
          transform="rotate(-4 248 76)"
        >SUSPECT ↗</text>
      </svg>

      {/* Cigarette-burn reel-change cues (top-right, one-shot) */}
      <span className="desk-reelcue a" aria-hidden="true" />
      <span className="desk-reelcue b" aria-hidden="true" />

      {/* Ashtray smoke plume — drifting SVG ribbon with turbulence */}
      <svg className="desk-smoke" viewBox="0 0 60 200" aria-hidden="true">
        <defs>
          <filter id="desk-smoke-turb" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.06" numOctaves="2" seed="7">
              <animate attributeName="baseFrequency" dur="14s" values="0.02 0.06;0.03 0.08;0.02 0.06" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="8" />
          </filter>
          <linearGradient id="desk-smoke-grad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="rgba(220,210,200,0.55)" />
            <stop offset="0.55" stopColor="rgba(220,210,200,0.18)" />
            <stop offset="1" stopColor="rgba(220,210,200,0)" />
          </linearGradient>
        </defs>
        <path
          d="M30 200 C 34 160, 26 140, 30 110 C 34 80, 22 60, 30 20"
          stroke="url(#desk-smoke-grad)" strokeWidth="14"
          fill="none" strokeLinecap="round"
          filter="url(#desk-smoke-turb)"
        />
      </svg>

      {/* Live decryption HUD — top-left, deterministic loop */}
      <div className="desk-decrypt" aria-hidden="true">
        <div className="desk-decrypt-head">
          <span className="desk-decrypt-dot" />
          <span>DECRYPTING · AES-256</span>
          <span className="desk-decrypt-tag">SIGINT</span>
        </div>
        <div className="desk-decrypt-bar"><i /></div>
        <div className="desk-decrypt-hex" data-r1="a3f9 c210 88bd 44e0" data-r2="7b2c 9f01 3a5e d8c4" />
        <div className="desk-decrypt-status">
          <span>KEY EXCHANGE OK</span><span>·</span><span>HANDSHAKE</span><span>·</span><span className="desk-decrypt-pct" />
        </div>
      </div>

      {/* Incoming call — rotary card, rings on 34s cycle */}
      <div className="desk-call" aria-hidden="true">
        <div className="desk-call-ring" />
        <div className="desk-call-body">
          <div className="desk-call-head">
            <span className="desk-call-dot" />
            <span className="desk-call-label">INCOMING</span>
            <span className="desk-call-time">00:00</span>
          </div>
          <div className="desk-call-num">+92 3•• ••• ••••</div>
          <div className="desk-call-meta">UNKNOWN CALLER · KARACHI CELL</div>
          <div className="desk-call-btns">
            <span className="desk-call-btn accept">ACCEPT</span>
            <span className="desk-call-btn reject">DECLINE</span>
          </div>
        </div>
      </div>

      {/* Filmstrip timeline — bottom edge, marquee of case moments */}
      <div className="desk-strip" aria-hidden="true">
        <div className="desk-strip-track">
          {["06:14 · CALL INTERCEPT · +92 3•• ••7412","06:31 · SMS · JAZZCASH ALERT","06:47 · WHATSAPP · IMPERSONATION","07:02 · WIRE HOLD · 128,400 PKR","07:19 · IP TRACE · KHI/DHA-05","07:36 · VOICE MATCH · 91%","07:52 · MULE FLAGGED · A/C ••3391","08:07 · WARRANT · PENDING","08:24 · UNIT DISPATCH · TAC-02","08:41 · SUBJECT IN CUSTODY","06:14 · CALL INTERCEPT · +92 3•• ••7412","06:31 · SMS · JAZZCASH ALERT","06:47 · WHATSAPP · IMPERSONATION","07:02 · WIRE HOLD · 128,400 PKR","07:19 · IP TRACE · KHI/DHA-05","07:36 · VOICE MATCH · 91%","07:52 · MULE FLAGGED · A/C ••3391","08:07 · WARRANT · PENDING","08:24 · UNIT DISPATCH · TAC-02","08:41 · SUBJECT IN CUSTODY"].map((s,i)=>(
            <span key={i} className="desk-strip-cell"><i className="desk-strip-perf" /><i className="desk-strip-perf b" /><em>{s}</em></span>
          ))}
        </div>
      </div>

      {/* Directed spotlight sweep — warm halo dollies across 5 focal points */}
      <div className="desk-spot" aria-hidden="true" />

      {/* Live police sketch — SVG face drawn in real-time, then dissolves */}
      <div className="desk-sketch" aria-hidden="true">
        <div className="desk-sketch-head">
          <span className="desk-sketch-dot" />
          <span>SKETCH · IN PROGRESS</span>
          <span className="desk-sketch-tag">FORENSIC</span>
        </div>
        <svg className="desk-sketch-svg" viewBox="0 0 160 180">
          <defs>
            <linearGradient id="desk-sketch-paper" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f2e6cf" />
              <stop offset="1" stopColor="#e6d6b6" />
            </linearGradient>
            <pattern id="desk-sketch-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M10 0 L0 0 0 10" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="160" height="180" fill="url(#desk-sketch-paper)" />
          <rect width="160" height="180" fill="url(#desk-sketch-grid)" />
          <path className="s s1" d="M 80 24 C 108 24, 122 46, 122 78 C 122 108, 112 140, 80 152 C 48 140, 38 108, 38 78 C 38 46, 52 24, 80 24 Z" fill="none" stroke="#2a1f14" strokeWidth="1.4" strokeLinecap="round" pathLength="1" />
          <path className="s s2" d="M 52 118 Q 80 138 108 118" fill="none" stroke="#2a1f14" strokeWidth="1.1" pathLength="1" />
          <path className="s s3" d="M 46 52 Q 60 30 80 30 Q 100 30 116 52 Q 108 44 96 42 Q 82 40 68 44 Q 56 48 46 52 Z" fill="#2a1f14" opacity="0.82" stroke="#2a1f14" strokeWidth="0.6" pathLength="1" />
          <path className="s s4" d="M 52 72 Q 62 68 72 72" fill="none" stroke="#2a1f14" strokeWidth="1.6" strokeLinecap="round" pathLength="1" />
          <path className="s s5" d="M 88 72 Q 98 68 108 72" fill="none" stroke="#2a1f14" strokeWidth="1.6" strokeLinecap="round" pathLength="1" />
          <path className="s s6" d="M 54 84 Q 62 80 72 84 Q 62 90 54 84 Z" fill="none" stroke="#2a1f14" strokeWidth="1.1" pathLength="1" />
          <circle className="s s7" cx="63" cy="84" r="1.6" fill="#2a1f14" pathLength="1" />
          <path className="s s8" d="M 88 84 Q 96 80 106 84 Q 96 90 88 84 Z" fill="none" stroke="#2a1f14" strokeWidth="1.1" pathLength="1" />
          <circle className="s s9" cx="97" cy="84" r="1.6" fill="#2a1f14" pathLength="1" />
          <path className="s s10" d="M 80 90 L 76 108 Q 80 112 84 108" fill="none" stroke="#2a1f14" strokeWidth="1.2" strokeLinecap="round" pathLength="1" />
          <path className="s s11" d="M 68 124 Q 80 130 92 124" fill="none" stroke="#2a1f14" strokeWidth="1.3" strokeLinecap="round" pathLength="1" />
          <path className="s s12" d="M 66 118 Q 72 114 80 116 Q 88 114 94 118" fill="none" stroke="#2a1f14" strokeWidth="1.4" pathLength="1" />
          <path className="s s13" d="M 46 96 Q 42 108 48 118" fill="none" stroke="rgba(42,31,20,0.4)" strokeWidth="0.9" pathLength="1" />
          <path className="s s14" d="M 114 96 Q 118 108 112 118" fill="none" stroke="rgba(42,31,20,0.4)" strokeWidth="0.9" pathLength="1" />
        </svg>
        <div className="desk-sketch-foot">
          <span>SUBJECT · UNKNOWN</span>
          <span className="desk-sketch-conf" />
        </div>
      </div>

      {/* Evidence notifications — right-side toast stack */}
      <div className="desk-toasts" aria-hidden="true">
        <div className="desk-toast t1">
          <span className="desk-toast-dot" />
          <div><b>MATCH · MULE A/C</b><em>••••3391 · JS BANK</em></div>
        </div>
        <div className="desk-toast t2">
          <span className="desk-toast-dot" />
          <div><b>IP TRACE · KHI/DHA-05</b><em>39.62.14.220 · CBM</em></div>
        </div>
        <div className="desk-toast t3">
          <span className="desk-toast-dot warn" />
          <div><b>VOICE MATCH · 91.3%</b><em>vs REFERENCE-04</em></div>
        </div>
        <div className="desk-toast t4">
          <span className="desk-toast-dot ok" />
          <div><b>WIRE HOLD · CLEARED</b><em>128,400 PKR · SBP</em></div>
        </div>
      </div>

      {/* Conspiracy string web — SVG lines connecting anchor pushpins */}
      <svg
        className="desk-web"
        viewBox="0 0 1000 700"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <filter id="webBlur" x="-2%" y="-2%" width="104%" height="104%">
            <feGaussianBlur stdDeviation="0.4" />
          </filter>
        </defs>
        <g className="desk-web-lines" filter="url(#webBlur)">
          <line x1="180" y1="140" x2="520" y2="300" />
          <line x1="520" y1="300" x2="820" y2="180" />
          <line x1="520" y1="300" x2="360" y2="560" />
          <line x1="820" y1="180" x2="680" y2="540" />
          <line x1="360" y1="560" x2="680" y2="540" />
          <line x1="180" y1="140" x2="680" y2="540" />
          <line x1="820" y1="180" x2="360" y2="560" />
        </g>
        <g className="desk-web-nodes">
          <circle cx="180" cy="140" r="4" />
          <circle cx="520" cy="300" r="5" />
          <circle cx="820" cy="180" r="4" />
          <circle cx="360" cy="560" r="4" />
          <circle cx="680" cy="540" r="4" />
        </g>
      </svg>

      {/* Handwritten margin notes — detective's own scribbles */}
      <div className="desk-notes" aria-hidden="true">
        <span className="desk-note n1">same voice as<br/>MV-4468 ✓</span>
        <span className="desk-note n2">check alibi ✗</span>
        <span className="desk-note n3">3rd caller —<br/>accent shift?</span>
        <span className="desk-note n4">trace → KHI<br/>DHA-05</span>
        <span className="desk-note n5">$$ moves<br/>Fri 21:40</span>
      </div>

      {/* Corner case-status ribbon — cycling severity */}
      <div className="desk-ribbon" aria-hidden="true">
        <div className="desk-ribbon-band">
          <span className="rb rb1">COLD</span>
          <span className="rb rb2">ACTIVE</span>
          <span className="rb rb3">HOT</span>
          <span className="rb rb4">RESOLVED</span>
        </div>
      </div>

      {/* Top-center clue counter HUD */}
      <div className="desk-clues" aria-hidden="true">
        <span className="desk-clues-tag">CASE</span>
        <span className="desk-clues-id">MV-4471</span>
        <span className="desk-clues-sep">·</span>
        <span className="desk-clues-label">CLUES</span>
        <span className="desk-clues-count" />
        <span className="desk-clues-total">/07</span>
      </div>
    </div>



  );
}
