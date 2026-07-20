// LAYER-1 — WebGL noir detective desk (three.js via r3f).
// Same stack as the hero (NoirCityScene). Lazy-loaded, pauses off-screen
// and when the tab is hidden. Presentation only.
//
// Composition philosophy — this is a scene, not props on a table. Camera is
// a low-angle three-quarter that fills the frame. The walnut top runs to
// the edges of the vignette. Every prop has printed content (case files
// with typed body copy, redactions and CLASSIFIED stamps, clock with roman
// numerals + real hour/minute/second, business cards, sticky notes with
// hand scrawl, a typewriter with a sheet of paper cocked in the roller, a
// brass ashtray with a smouldering cigar, an ink bottle, evidence bag with
// a phone inside). The center pool stays clean for the headline.

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

function canvasTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

// ---------- desk surface ----------
function Tabletop() {
  const grainTex = useMemo(
    () =>
      canvasTex(1024, 1024, (ctx) => {
        // deep walnut base with a warm hotspot under the lamp
        const g = ctx.createRadialGradient(512, 512, 60, 512, 512, 560);
        g.addColorStop(0, "#5a3820");
        g.addColorStop(0.35, "#3a2416");
        g.addColorStop(0.75, "#1e1208");
        g.addColorStop(1, "#080502");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 1024, 1024);
        // concentric grain rings
        ctx.strokeStyle = "rgba(255,205,150,0.06)";
        for (let r = 40; r < 560; r += 5 + Math.random() * 7) {
          ctx.lineWidth = 0.6 + Math.random() * 0.8;
          ctx.beginPath();
          ctx.ellipse(512, 512, r, r * (0.93 + Math.random() * 0.08), 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        // long streaks of grain
        for (let i = 0; i < 240; i++) {
          const a = Math.random() * Math.PI * 2;
          const r0 = 60 + Math.random() * 480;
          const r1 = r0 + 40 + Math.random() * 90;
          ctx.strokeStyle = `rgba(255,205,140,${0.02 + Math.random() * 0.05})`;
          ctx.lineWidth = 0.5 + Math.random() * 0.9;
          ctx.beginPath();
          ctx.moveTo(512 + Math.cos(a) * r0, 512 + Math.sin(a) * r0);
          ctx.lineTo(512 + Math.cos(a) * r1, 512 + Math.sin(a) * r1);
          ctx.stroke();
        }
        // coffee ring stain, top-left of desk
        ctx.strokeStyle = "rgba(30,15,5,0.35)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(320, 380, 46, 0, Math.PI * 2);
        ctx.stroke();
        // ink blot
        ctx.fillStyle = "rgba(4,4,8,0.55)";
        ctx.beginPath();
        ctx.ellipse(720, 620, 22, 14, 0.4, 0, Math.PI * 2);
        ctx.fill();
        // fine noise
        const img = ctx.getImageData(0, 0, 1024, 1024);
        for (let i = 0; i < img.data.length; i += 4) {
          const n = (Math.random() - 0.5) * 12;
          img.data[i] += n;
          img.data[i + 1] += n * 0.9;
          img.data[i + 2] += n * 0.6;
        }
        ctx.putImageData(img, 0, 0);
      }),
    [],
  );

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <circleGeometry args={[34, 128]} />
      <meshStandardMaterial map={grainTex} roughness={0.82} metalness={0.06} />
    </mesh>
  );
}

// ---------- case files with printed content ----------
type FileSpec = {
  x: number;
  z: number;
  rot: number;
  w: number;
  h: number;
  paper: string;
  title: string;
  num: string;
  stampText?: string;
  stampColor?: string;
};

const TITLES = [
  { t: "IMPERSONATION / BANK", n: "MV-7743-A" },
  { t: "SIM-SWAP INTAKE", n: "MV-2210-K" },
  { t: "PHISHING · SMS", n: "MV-0918-C" },
  { t: "COURIER FRAUD", n: "MV-6631-D" },
  { t: "ROMANCE SCHEME", n: "MV-4457-E" },
  { t: "TAX AUTHORITY SPOOF", n: "MV-8802-F" },
  { t: "LOTTERY / SWEEPSTAKES", n: "MV-1150-G" },
  { t: "RECRUITMENT SCAM", n: "MV-3319-H" },
  { t: "UTILITY DISCONNECT", n: "MV-7005-J" },
  { t: "FAKE INVOICE / VENDOR", n: "MV-9124-L" },
];

function fileTexture(spec: FileSpec) {
  const W = 640;
  const H = Math.round((640 * spec.h) / spec.w);
  return canvasTex(W, H, (ctx) => {
    // manila stock
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, spec.paper);
    grad.addColorStop(1, shade(spec.paper, -14));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // paper fiber noise
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.04})`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }
    // tab
    ctx.fillStyle = shade(spec.paper, -22);
    ctx.fillRect(W * 0.55, 6, W * 0.35, 26);
    ctx.fillStyle = "#1a120a";
    ctx.font = "bold 18px 'Courier New', monospace";
    ctx.fillText(spec.num, W * 0.57, 26);

    // red header band
    ctx.fillStyle = "#7a1414";
    ctx.fillRect(24, 44, W - 48, 46);
    ctx.font = "bold 26px 'Courier New', monospace";
    ctx.fillStyle = "#f5e9ce";
    ctx.fillText("CASE FILE", 40, 76);
    ctx.font = "bold 20px 'Courier New', monospace";
    ctx.fillText(spec.num, W - 200, 76);

    // title
    ctx.fillStyle = "#1a120a";
    ctx.font = "bold 22px 'Georgia', serif";
    ctx.fillText(spec.title, 32, 128);

    // subject line
    ctx.font = "14px 'Courier New', monospace";
    ctx.fillText("SUBJECT: ██████ ██ ████████", 32, 156);
    ctx.fillText("OPENED : 03·17·2026    STATUS: ACTIVE", 32, 176);

    // divider
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(32, 192);
    ctx.lineTo(W - 32, 192);
    ctx.stroke();

    // typed body — real-looking lines with variable widths, some redactions
    ctx.fillStyle = "#241608";
    ctx.font = "14px 'Courier New', monospace";
    let y = 216;
    const bodyH = H - 260;
    const linesN = Math.floor(bodyH / 22);
    for (let i = 0; i < linesN; i++) {
      const words = 4 + Math.floor(Math.random() * 6);
      let x = 34;
      for (let w = 0; w < words; w++) {
        const wl = 26 + Math.random() * 74;
        if (Math.random() > 0.86) {
          ctx.fillStyle = "#000";
          ctx.fillRect(x, y - 12, wl, 16);
          ctx.fillStyle = "#241608";
        } else {
          ctx.fillRect(x, y, wl, 2);
        }
        x += wl + 10;
        if (x > W - 40) break;
      }
      y += 22;
    }

    // signature line
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath();
    ctx.moveTo(34, H - 44);
    ctx.lineTo(W * 0.45, H - 44);
    ctx.stroke();
    ctx.font = "10px 'Courier New', monospace";
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillText("HANDLER SIGNATURE", 34, H - 30);

    // rubber stamp
    if (spec.stampText) {
      ctx.save();
      ctx.translate(W * 0.72, H * 0.72);
      ctx.rotate(-0.28);
      ctx.strokeStyle = spec.stampColor ?? "#8b1a1a";
      ctx.lineWidth = 4;
      ctx.strokeRect(-96, -30, 192, 60);
      ctx.strokeRect(-100, -34, 200, 68);
      ctx.font = "bold 26px 'Impact', sans-serif";
      ctx.fillStyle = spec.stampColor ?? "#8b1a1a";
      const m = ctx.measureText(spec.stampText);
      ctx.fillText(spec.stampText, -m.width / 2, 10);
      ctx.restore();
    }
  });
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt;
  let g = ((n >> 8) & 0xff) + amt;
  let b = (n & 0xff) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function CaseFiles() {
  const rand = useMemo(() => seeded(21), []);
  const files = useMemo<FileSpec[]>(() => {
    const arr: FileSpec[] = [];
    // ring the desk edges with paperwork — leave the center pool clean
    const slots: Array<[number, number]> = [
      [-14, -8], [-11, -3], [-13, 3], [-12, 9],
      [-6, -12], [6, -12], [11, -9],
      [14, -2], [13, 4], [12, 10],
      [-4, 11], [4, 11],
    ];
    const papers = ["#e8dcbf", "#d6c9a5", "#c9a26a", "#efe4c7", "#dccaa0"];
    const stamps = [
      { t: "CLASSIFIED", c: "#8b1a1a" },
      { t: "URGENT", c: "#8b1a1a" },
      { t: "REDACTED", c: "#111" },
      { t: "SEALED", c: "#8b1a1a" },
      { t: "ARCHIVE", c: "#2a3a6a" },
    ];
    for (let i = 0; i < slots.length; i++) {
      const [x, z] = slots[i];
      const meta = TITLES[i % TITLES.length];
      const stamp = rand() > 0.4 ? stamps[Math.floor(rand() * stamps.length)] : undefined;
      arr.push({
        x: x + (rand() - 0.5) * 1.1,
        z: z + (rand() - 0.5) * 1.1,
        rot: (rand() - 0.5) * 1.0,
        w: 4.4 + rand() * 0.5,
        h: 5.8 + rand() * 0.6,
        paper: papers[Math.floor(rand() * papers.length)],
        title: meta.t,
        num: meta.n,
        stampText: stamp?.t,
        stampColor: stamp?.c,
      });
    }
    return arr;
  }, [rand]);

  return (
    <group>
      {files.map((f, i) => {
        const tex = fileTexture(f);
        return (
          <group key={i} position={[f.x, 0.04 + i * 0.008, f.z]} rotation={[0, f.rot, 0]}>
            {/* folder card */}
            <mesh receiveShadow castShadow>
              <boxGeometry args={[f.w, 0.05, f.h]} />
              <meshStandardMaterial color={f.paper} roughness={0.95} />
            </mesh>
            {/* printed face */}
            <mesh position={[0, 0.031, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[f.w - 0.05, f.h - 0.05]} />
              <meshStandardMaterial map={tex} roughness={0.95} />
            </mesh>
            {/* corner paperclip on some */}
            {i % 3 === 0 && (
              <mesh
                position={[-f.w / 2 + 0.4, 0.09, -f.h / 2 + 0.4]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <torusGeometry args={[0.16, 0.025, 8, 20, Math.PI * 1.5]} />
                <meshStandardMaterial color="#c9c9c9" metalness={0.9} roughness={0.25} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

// ---------- surveillance photo (paperclipped) ----------
function Photo() {
  const tex = useMemo(
    () =>
      canvasTex(320, 400, (ctx) => {
        // black & white surveillance frame
        const g = ctx.createLinearGradient(0, 0, 0, 400);
        g.addColorStop(0, "#1c1c1c");
        g.addColorStop(1, "#0a0a0a");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 320, 400);
        // silhouette
        ctx.fillStyle = "#2a2a2a";
        ctx.beginPath();
        ctx.arc(160, 150, 46, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(100, 190, 120, 160);
        // grain / noise
        for (let i = 0; i < 2200; i++) {
          ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
          ctx.fillRect(Math.random() * 320, Math.random() * 400, 1, 1);
        }
        // timecode
        ctx.font = "bold 12px 'Courier New', monospace";
        ctx.fillStyle = "#c0c0c0";
        ctx.fillText("CAM · 04   03·11·26   22:47:11", 14, 388);
        // reticle
        ctx.strokeStyle = "rgba(255,60,60,0.7)";
        ctx.lineWidth = 1;
        ctx.strokeRect(114, 100, 92, 108);
      }),
    [],
  );

  return (
    <group position={[-9.5, 0.11, 6.5]} rotation={[0, 0.28, 0]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[3.2, 0.05, 4]} />
        <meshStandardMaterial color="#efe6d0" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.031, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.7, 3.4]} />
        <meshStandardMaterial map={tex} roughness={0.9} />
      </mesh>
      <mesh position={[0.55, 0.09, -1.85]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.24, 0.03, 8, 20, Math.PI * 1.5]} />
        <meshStandardMaterial color="#c9c9c9" metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  );
}

// ---------- sticky note with handwriting ----------
function StickyNote() {
  const tex = useMemo(
    () =>
      canvasTex(256, 256, (ctx) => {
        ctx.fillStyle = "#f6d768";
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = "rgba(0,0,0,0.06)";
        ctx.fillRect(0, 0, 256, 18);
        // scrawl
        ctx.strokeStyle = "#1a1a2a";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        // "CALL BACK"
        ctx.beginPath();
        ctx.moveTo(28, 70);
        ctx.bezierCurveTo(60, 40, 90, 100, 130, 70);
        ctx.bezierCurveTo(160, 40, 200, 100, 226, 70);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(28, 130);
        ctx.bezierCurveTo(70, 100, 120, 160, 170, 128);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(28, 190);
        ctx.bezierCurveTo(60, 160, 100, 220, 150, 188);
        ctx.stroke();
      }),
    [],
  );
  return (
    <group position={[8.5, 0.06, 8]} rotation={[0, -0.4, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[2.2, 0.03, 2.2]} />
        <meshStandardMaterial color="#f6d768" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.1, 2.1]} />
        <meshStandardMaterial map={tex} roughness={0.9} />
      </mesh>
    </group>
  );
}

// ---------- business card ----------
function BusinessCard() {
  const tex = useMemo(
    () =>
      canvasTex(320, 180, (ctx) => {
        ctx.fillStyle = "#f0ead8";
        ctx.fillRect(0, 0, 320, 180);
        ctx.fillStyle = "#8b1a1a";
        ctx.fillRect(0, 0, 320, 8);
        ctx.fillStyle = "#111";
        ctx.font = "bold 24px 'Georgia', serif";
        ctx.fillText("MILVERSE", 20, 60);
        ctx.font = "12px 'Courier New', monospace";
        ctx.fillText("COUNTER-SCAM DESK", 20, 82);
        ctx.strokeStyle = "rgba(0,0,0,0.6)";
        ctx.beginPath();
        ctx.moveTo(20, 96);
        ctx.lineTo(300, 96);
        ctx.stroke();
        ctx.font = "12px 'Courier New', monospace";
        ctx.fillStyle = "#333";
        ctx.fillText("HANDLER · NIGHT SHIFT", 20, 118);
        ctx.fillText("EXT · 0117", 20, 138);
        ctx.fillText("verify · don't guess", 20, 160);
      }),
    [],
  );
  return (
    <group position={[2.5, 0.05, -9]} rotation={[0, 0.15, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[2.2, 0.02, 1.3]} />
        <meshStandardMaterial color="#f0ead8" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.15, 1.25]} />
        <meshStandardMaterial map={tex} roughness={0.9} />
      </mesh>
    </group>
  );
}

// ---------- evidence bag with phone ----------
function EvidenceBag() {
  return (
    <group position={[-7, 0.05, -8]} rotation={[0, -0.35, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[3.6, 0.08, 4.8]} />
        <meshPhysicalMaterial
          color="#d8d5c0"
          transparent
          opacity={0.55}
          roughness={0.35}
          transmission={0.4}
          thickness={0.05}
        />
      </mesh>
      {/* label */}
      <mesh position={[0, 0.055, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 0.7]} />
        <meshBasicMaterial color="#8b1a1a" />
      </mesh>
      {/* phone inside */}
      <mesh position={[0, 0.09, 0.4]} castShadow>
        <boxGeometry args={[1.4, 0.14, 2.6]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.17, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, 2.3]} />
        <meshStandardMaterial color="#0c1420" emissive="#22d3ee" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

// ---------- typewriter with a page in the roller ----------
function Typewriter() {
  const pageTex = useMemo(
    () =>
      canvasTex(400, 520, (ctx) => {
        ctx.fillStyle = "#f5eede";
        ctx.fillRect(0, 0, 400, 520);
        ctx.fillStyle = "#241608";
        ctx.font = "16px 'Courier New', monospace";
        const lines = [
          "MEMORANDUM · INTERNAL",
          "TO   : ALL HANDLERS",
          "FROM : DESK · NIGHT",
          "RE   : ONGOING OPERATIONS",
          "",
          "THE CITY IS BEING WORKED.",
          "PICK UP. PLAY THEM. BURN THEM.",
          "",
          "VERIFY THE NUMBER.",
          "VERIFY THE VOICE.",
          "VERIFY THE URGENCY.",
          "",
          "NEVER PAY. NEVER FORWARD.",
          "ALWAYS LOG THE CALL.",
          "",
          "— HANDLER",
        ];
        lines.forEach((l, i) => ctx.fillText(l, 26, 40 + i * 22));
      }),
    [],
  );
  return (
    <group position={[10.5, 0, -6]} rotation={[0, -0.5, 0]}>
      {/* base */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 0.8, 3.4]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.55} metalness={0.35} />
      </mesh>
      {/* roller */}
      <mesh position={[0, 1.05, -0.9]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 4.4, 24]} />
        <meshStandardMaterial color="#151515" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* page in the roller */}
      <mesh position={[0, 1.7, -0.6]} rotation={[-0.35, 0, 0]} castShadow>
        <planeGeometry args={[3.6, 4.6]} />
        <meshStandardMaterial map={pageTex} side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
      {/* keys — 3 rows of small blocks */}
      {Array.from({ length: 3 }).map((_, r) =>
        Array.from({ length: 10 }).map((_, k) => (
          <mesh
            key={`${r}-${k}`}
            position={[-1.9 + k * 0.42, 0.86, 0.55 - r * 0.4]}
            castShadow
          >
            <cylinderGeometry args={[0.12, 0.14, 0.14, 12]} />
            <meshStandardMaterial color="#e8e0c8" roughness={0.6} />
          </mesh>
        )),
      )}
      {/* brand plate */}
      <mesh position={[0, 0.82, 1.55]}>
        <planeGeometry args={[1.4, 0.28]} />
        <meshStandardMaterial color="#c48b3a" metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ---------- ashtray with cigar + ember + smoke ----------
function Ashtray() {
  const smokeRef = useRef<THREE.Points>(null);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 40;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = 0.6 + Math.random() * 3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame((_, dt) => {
    if (!smokeRef.current) return;
    const pos = smokeRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] += dt * 0.4;
      arr[i] += Math.sin(performance.now() * 0.0005 + i) * dt * 0.12;
      if (arr[i + 1] > 4.5) {
        arr[i + 1] = 0.6;
        arr[i] = (Math.random() - 0.5) * 0.3;
        arr[i + 2] = (Math.random() - 0.5) * 0.3;
      }
    }
    pos.needsUpdate = true;
  });
  return (
    <group position={[5.5, 0, 7]}>
      {/* dish */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.1, 1.0, 0.22, 32]} />
        <meshStandardMaterial color="#c48b3a" metalness={0.85} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.9, 0.85, 0.06, 32]} />
        <meshStandardMaterial color="#1a1108" roughness={0.7} />
      </mesh>
      {/* cigar */}
      <mesh position={[0.35, 0.24, 0]} rotation={[0, 0, Math.PI / 2 - 0.2]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 1.4, 16]} />
        <meshStandardMaterial color="#4a2a12" roughness={0.9} />
      </mesh>
      {/* ember */}
      <mesh position={[1.02, 0.28, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#ff5522" emissive="#ff7733" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[1.02, 0.35, 0]} color="#ff7733" intensity={0.5} distance={2} />
      <points ref={smokeRef} geometry={geom} position={[1.02, 0, 0]}>
        <pointsMaterial
          size={0.32}
          color="#c9b8a0"
          transparent
          opacity={0.18}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
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
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 1] = 1.2 + Math.random() * 2.4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((_, dt) => {
    if (!steamRef.current) return;
    const pos = steamRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] += dt * 0.32;
      arr[i] += Math.sin(performance.now() * 0.0004 + i) * dt * 0.09;
      if (arr[i + 1] > 4) {
        arr[i + 1] = 1.2;
        arr[i] = (Math.random() - 0.5) * 0.5;
        arr[i + 2] = (Math.random() - 0.5) * 0.5;
      }
    }
    pos.needsUpdate = true;
  });

  return (
    <group position={[-10, 0, -4]}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.85, 0.75, 1.2, 32]} />
        <meshStandardMaterial color="#141414" roughness={0.55} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <torusGeometry args={[0.82, 0.04, 8, 32]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.19, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.78, 32]} />
        <meshStandardMaterial color="#180d05" roughness={0.25} metalness={0.3} />
      </mesh>
      <mesh position={[0.9, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.32, 0.09, 12, 24, Math.PI]} />
        <meshStandardMaterial color="#141414" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[1.35, 1.35, 0.05, 40]} />
        <meshStandardMaterial color="#0f0f0f" roughness={0.7} />
      </mesh>
      <points ref={steamRef} geometry={geom}>
        <pointsMaterial
          size={0.35}
          color="#e8dcc4"
          transparent
          opacity={0.2}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

// ---------- brass magnifier ----------
function Magnifier() {
  return (
    <group position={[6.5, 0.06, 4.5]} rotation={[0, -0.5, 0]}>
      <mesh position={[1.9, 0.08, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.09, 0.1, 2.8, 16]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[1.05, 0.11, 14, 40]} />
        <meshStandardMaterial color="#c48b3a" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.0, 40]} />
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

// ---------- fountain pen + ink bottle ----------
function PenAndInk() {
  return (
    <group position={[-3, 0.06, 9]} rotation={[0, 0.6, 0]}>
      {/* pen */}
      <group>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, 3, 20]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.35} metalness={0.5} />
        </mesh>
        <mesh position={[1.55, 0, 0]}>
          <coneGeometry args={[0.1, 0.4, 12]} />
          <meshStandardMaterial color="#c9a24a" metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh position={[-1.2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.15, 16]} />
          <meshStandardMaterial color="#c9a24a" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
      {/* ink bottle */}
      <group position={[2.5, 0, 1.2]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.6, 0.9, 24]} />
          <meshPhysicalMaterial
            color="#050510"
            transparent
            opacity={0.85}
            roughness={0.1}
            transmission={0.4}
            thickness={0.15}
          />
        </mesh>
        <mesh position={[0, 0.95, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.2, 20]} />
          <meshStandardMaterial color="#c48b3a" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.52, 0.57, 0.7, 24]} />
          <meshStandardMaterial color="#040410" />
        </mesh>
      </group>
    </group>
  );
}

// ---------- roman-numeral desk clock ----------
function Clock() {
  const faceTex = useMemo(
    () =>
      canvasTex(512, 512, (ctx) => {
        ctx.fillStyle = "#efe6d0";
        ctx.fillRect(0, 0, 512, 512);
        // subtle patina
        const g = ctx.createRadialGradient(256, 256, 60, 256, 256, 260);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(1, "rgba(80,50,20,0.35)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 512, 512);
        // outer brass ring
        ctx.strokeStyle = "#8b6a2a";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(256, 256, 232, 0, Math.PI * 2);
        ctx.stroke();
        // ticks + numerals
        const num = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
        ctx.fillStyle = "#1a1a1a";
        ctx.font = "bold 34px 'Georgia', serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const rx = 256 + Math.cos(a) * 190;
          const ry = 256 + Math.sin(a) * 190;
          ctx.fillText(num[i], rx, ry);
          // minor ticks
          for (let m = 1; m < 5; m++) {
            const am = ((i + m / 5) / 12) * Math.PI * 2 - Math.PI / 2;
            const x1 = 256 + Math.cos(am) * 220;
            const y1 = 256 + Math.sin(am) * 220;
            const x2 = 256 + Math.cos(am) * 210;
            const y2 = 256 + Math.sin(am) * 210;
            ctx.strokeStyle = "#333";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
        // maker mark
        ctx.font = "italic 14px 'Georgia', serif";
        ctx.fillStyle = "#555";
        ctx.fillText("MILVERSE · EST 2026", 256, 336);
        // center pin
        ctx.fillStyle = "#c48b3a";
        ctx.beginPath();
        ctx.arc(256, 256, 8, 0, Math.PI * 2);
        ctx.fill();
      }),
    [],
  );
  const secRef = useRef<THREE.Group>(null);
  const minRef = useRef<THREE.Group>(null);
  const hrRef = useRef<THREE.Group>(null);
  useFrame(() => {
    const d = new Date();
    const s = d.getSeconds() + d.getMilliseconds() / 1000;
    const m = d.getMinutes() + s / 60;
    const h = (d.getHours() % 12) + m / 60;
    if (secRef.current) secRef.current.rotation.y = -(s / 60) * Math.PI * 2;
    if (minRef.current) minRef.current.rotation.y = -(m / 60) * Math.PI * 2;
    if (hrRef.current) hrRef.current.rotation.y = -(h / 12) * Math.PI * 2;
  });
  return (
    <group position={[4, 0.06, -8]}>
      {/* brass body */}
      <mesh castShadow>
        <cylinderGeometry args={[1.4, 1.4, 0.5, 48]} />
        <meshStandardMaterial color="#c48b3a" metalness={0.85} roughness={0.28} />
      </mesh>
      {/* inner ring */}
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[1.25, 1.25, 0.02, 48]} />
        <meshStandardMaterial color="#8b6a2a" metalness={0.8} roughness={0.35} />
      </mesh>
      {/* face */}
      <mesh position={[0, 0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 48]} />
        <meshStandardMaterial map={faceTex} roughness={0.6} />
      </mesh>
      {/* hands */}
      <group ref={hrRef} position={[0, 0.29, 0]}>
        <mesh position={[0, 0, -0.35]}>
          <boxGeometry args={[0.07, 0.01, 0.75]} />
          <meshStandardMaterial color="#0d0d0d" />
        </mesh>
      </group>
      <group ref={minRef} position={[0, 0.295, 0]}>
        <mesh position={[0, 0, -0.5]}>
          <boxGeometry args={[0.05, 0.01, 1.0]} />
          <meshStandardMaterial color="#0d0d0d" />
        </mesh>
      </group>
      <group ref={secRef} position={[0, 0.3, 0]}>
        <mesh position={[0, 0, -0.55]}>
          <boxGeometry args={[0.02, 0.008, 1.15]} />
          <meshStandardMaterial color="#8b1a1a" emissive="#8b1a1a" emissiveIntensity={0.4} />
        </mesh>
      </group>
      {/* top bell */}
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[0.14, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#c48b3a" metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ---------- raccoon paperweight ----------
function Raccoon() {
  return (
    <group position={[-4.5, 0.05, -6]} rotation={[0, 0.6, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.4, 20, 16]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.32, 0.3]}>
        <sphereGeometry args={[0.28, 20, 16]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[-0.16, 0.56, 0.3]}>
        <coneGeometry args={[0.08, 0.14, 12]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0.16, 0.56, 0.3]}>
        <coneGeometry args={[0.08, 0.14, 12]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.32, 0.58]}>
        <boxGeometry args={[0.44, 0.07, 0.02]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>
      {/* tiny highlights on eyes */}
      <mesh position={[-0.1, 0.36, 0.6]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
      <mesh position={[0.1, 0.36, 0.6]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
    </group>
  );
}

// ---------- brass compass ----------
function Compass() {
  const faceTex = useMemo(
    () =>
      canvasTex(256, 256, (ctx) => {
        ctx.fillStyle = "#f0e6cf";
        ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = "#8b6a2a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(128, 128, 108, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#1a1a1a";
        ctx.font = "bold 22px 'Georgia', serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const dirs = ["N", "E", "S", "W"];
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
          ctx.fillText(dirs[i], 128 + Math.cos(a) * 86, 128 + Math.sin(a) * 86);
        }
        // tick marks
        for (let i = 0; i < 60; i++) {
          const a = (i / 60) * Math.PI * 2;
          const long = i % 5 === 0;
          ctx.strokeStyle = "#333";
          ctx.lineWidth = long ? 2 : 1;
          ctx.beginPath();
          ctx.moveTo(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100);
          ctx.lineTo(128 + Math.cos(a) * (long ? 90 : 94), 128 + Math.sin(a) * (long ? 90 : 94));
          ctx.stroke();
        }
        // needle
        ctx.fillStyle = "#8b1a1a";
        ctx.beginPath();
        ctx.moveTo(128, 40);
        ctx.lineTo(120, 128);
        ctx.lineTo(136, 128);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#222";
        ctx.beginPath();
        ctx.moveTo(128, 216);
        ctx.lineTo(120, 128);
        ctx.lineTo(136, 128);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#c48b3a";
        ctx.beginPath();
        ctx.arc(128, 128, 8, 0, Math.PI * 2);
        ctx.fill();
      }),
    [],
  );
  return (
    <group position={[7.5, 0.05, -3.5]} rotation={[0, 0.3, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.9, 0.9, 0.22, 32]} />
        <meshStandardMaterial color="#c48b3a" metalness={0.9} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.78, 40]} />
        <meshStandardMaterial map={faceTex} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.78, 0.86, 40]} />
        <meshStandardMaterial color="#8b6a2a" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ---------- stapler ----------
function Stapler() {
  return (
    <group position={[6, 0.05, 9]} rotation={[0, -0.6, 0]}>
      {/* base */}
      <mesh castShadow>
        <boxGeometry args={[2.6, 0.24, 0.7]} />
        <meshStandardMaterial color="#111" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* pad */}
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[2.4, 0.06, 0.6]} />
        <meshStandardMaterial color="#2b2b2b" roughness={0.6} />
      </mesh>
      {/* head (angled) */}
      <group position={[-0.4, 0.22, 0]} rotation={[0, 0, 0.16]}>
        <mesh castShadow>
          <boxGeometry args={[2.2, 0.28, 0.55]} />
          <meshStandardMaterial color="#8b1a1a" roughness={0.35} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <boxGeometry args={[2.0, 0.05, 0.5]} />
          <meshStandardMaterial color="#c48b3a" metalness={0.9} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}

// ---------- paper clips scatter + push pins ----------
function DeskClutter() {
  const clips = useMemo(() => {
    const r = seeded(77);
    return Array.from({ length: 8 }).map(() => ({
      x: (r() - 0.5) * 26,
      z: (r() - 0.5) * 22,
      rot: r() * Math.PI,
    }));
  }, []);
  const pins = useMemo(() => {
    const r = seeded(133);
    const colors = ["#c81616", "#f5a623", "#22d3ee", "#9b59b6"];
    return Array.from({ length: 6 }).map((_, i) => ({
      x: (r() - 0.5) * 24,
      z: (r() - 0.5) * 20,
      color: colors[i % colors.length],
    }));
  }, []);
  const coins = useMemo(() => {
    const r = seeded(211);
    return Array.from({ length: 4 }).map(() => ({
      x: (r() - 0.5) * 22,
      z: (r() - 0.5) * 18,
    }));
  }, []);
  return (
    <group>
      {clips.map((c, i) => (
        <mesh
          key={`clip-${i}`}
          position={[c.x, 0.09, c.z]}
          rotation={[Math.PI / 2, 0, c.rot]}
        >
          <torusGeometry args={[0.22, 0.03, 8, 22, Math.PI * 1.6]} />
          <meshStandardMaterial color="#d8d8d8" metalness={0.95} roughness={0.18} />
        </mesh>
      ))}
      {pins.map((p, i) => (
        <group key={`pin-${i}`} position={[p.x, 0.06, p.z]}>
          <mesh castShadow>
            <sphereGeometry args={[0.14, 14, 14]} />
            <meshStandardMaterial color={p.color} roughness={0.25} metalness={0.15} />
          </mesh>
          <mesh position={[0, -0.08, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.16, 8]} />
            <meshStandardMaterial color="#c9c9c9" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}
      {coins.map((c, i) => (
        <mesh key={`coin-${i}`} position={[c.x, 0.045, c.z]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.04, 20]} />
          <meshStandardMaterial color="#c48b3a" metalness={0.92} roughness={0.28} />
        </mesh>
      ))}
      {/* letter opener */}
      <group position={[9, 0.05, 4]} rotation={[0, 0.4, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2.4, 0.03, 0.16]} />
          <meshStandardMaterial color="#dcdcdc" metalness={0.95} roughness={0.22} />
        </mesh>
        <mesh position={[-1.35, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 0.9, 14]} />
          <meshStandardMaterial color="#4a2a12" roughness={0.7} />
        </mesh>

      </group>
      {/* rolodex */}
      <group position={[-8.5, 0.05, 2]} rotation={[0, 0.5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2.2, 0.5, 1.4]} />
          <meshStandardMaterial color="#151515" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 2.0, 24]} />
          <meshStandardMaterial color="#f0e6cf" roughness={0.9} />
        </mesh>
        <mesh position={[1.2, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, 0.4, 12]} />
          <meshStandardMaterial color="#c48b3a" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

// ---------- room (floor + back wall + side wall with picture frames) ----------
function Room() {
  const wallTex = useMemo(
    () =>
      canvasTex(1024, 1024, (ctx) => {
        // warm damask wallpaper
        const g = ctx.createLinearGradient(0, 0, 0, 1024);
        g.addColorStop(0, "#1a0e08");
        g.addColorStop(1, "#0a0604");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 1024, 1024);
        // vertical wallpaper stripes
        for (let x = 0; x < 1024; x += 48) {
          ctx.fillStyle = `rgba(120,70,30,${0.05 + Math.random() * 0.05})`;
          ctx.fillRect(x, 0, 2, 1024);
        }
        // damask motifs
        for (let y = 60; y < 1024; y += 120) {
          for (let x = 60; x < 1024; x += 120) {
            ctx.strokeStyle = "rgba(180,130,70,0.08)";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.ellipse(x, y, 22, 12, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(x, y, 12, 22, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        // grime
        for (let i = 0; i < 400; i++) {
          ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`;
          ctx.fillRect(Math.random() * 1024, Math.random() * 1024, Math.random() * 3, Math.random() * 3);
        }
      }),
    [],
  );
  const floorTex = useMemo(
    () =>
      canvasTex(1024, 1024, (ctx) => {
        ctx.fillStyle = "#0e0805";
        ctx.fillRect(0, 0, 1024, 1024);
        // plank boards
        for (let y = 0; y < 1024; y += 96) {
          ctx.fillStyle = `rgb(${25 + Math.random() * 12}, ${16 + Math.random() * 8}, ${8 + Math.random() * 6})`;
          ctx.fillRect(0, y, 1024, 88);
          // seams
          ctx.strokeStyle = "rgba(0,0,0,0.7)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, y + 88);
          ctx.lineTo(1024, y + 88);
          ctx.stroke();
          // random seams within
          for (let x = Math.random() * 200; x < 1024; x += 180 + Math.random() * 200) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + 88);
            ctx.stroke();
          }
        }
        // grain
        for (let i = 0; i < 3000; i++) {
          ctx.fillStyle = `rgba(255,200,140,${Math.random() * 0.03})`;
          ctx.fillRect(Math.random() * 1024, Math.random() * 1024, Math.random() * 30 + 10, 1);
        }
      }),
    [],
  );
  return (
    <group>
      {/* floor */}
      <mesh position={[0, -3.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial map={floorTex} roughness={0.95} />
      </mesh>
      {/* back wall */}
      <mesh position={[0, 12, -34]} receiveShadow>
        <planeGeometry args={[120, 40]} />
        <meshStandardMaterial map={wallTex} roughness={0.95} />
      </mesh>
      {/* side wall left */}
      <mesh position={[-42, 12, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[120, 40]} />
        <meshStandardMaterial map={wallTex} roughness={0.95} />
      </mesh>
      {/* side wall right */}
      <mesh position={[42, 12, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[120, 40]} />
        <meshStandardMaterial map={wallTex} roughness={0.95} />
      </mesh>
      {/* framed photos on back wall */}
      {[-16, -6, 6, 16].map((x, i) => (
        <group key={i} position={[x, 10, -33.7]}>
          <mesh>
            <planeGeometry args={[4.4, 5.2]} />
            <meshStandardMaterial color="#c48b3a" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[3.8, 4.6]} />
            <meshStandardMaterial color={i % 2 ? "#1a1a1a" : "#241608"} roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* wall lamp glow patches */}
      <mesh position={[-20, 16, -33.5]}>
        <circleGeometry args={[4, 32]} />
        <meshBasicMaterial color="#ffb060" transparent opacity={0.08} />
      </mesh>
      <mesh position={[20, 16, -33.5]}>
        <circleGeometry args={[4, 32]} />
        <meshBasicMaterial color="#ffb060" transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

function DustMotes() {
  const ref = useRef<THREE.Points>(null);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 140;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = 1 + Math.random() * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 22;
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
      if (arr[i + 1] > 11) arr[i + 1] = 1;
    }
    pos.needsUpdate = true;
  });
  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial
        size={0.06}
        color="#ffcf88"
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
}

// ---------- camera + lamp behaviour ----------
function DeskRig() {
  const { camera, size } = useThree();
  const t0 = useRef(performance.now());
  useFrame(() => {
    const t = (performance.now() - t0.current) * 0.00004;
    // pull camera back on wider aspect ratios so the desk always fills
    const aspect = size.width / Math.max(1, size.height);
    const dist = aspect > 1.6 ? 24 : aspect > 1.1 ? 22 : 20;
    camera.position.x = Math.sin(t) * 1.3;
    camera.position.z = dist + Math.cos(t) * 0.5;
    camera.position.y = 20 + Math.sin(t * 0.7) * 0.4;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function LampBreath() {
  const ref = useRef<THREE.SpotLight>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.0006;
    ref.current.intensity = 12 + Math.sin(t) * 0.9;
  });
  return (
    <spotLight
      ref={ref}
      position={[0, 12, 0]}
      angle={1.1}
      penumbra={0.88}
      intensity={12}
      color="#ffb060"
      distance={40}
      decay={1.4}
      castShadow={false}
    />
  );
}

function SpinningDesk({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.006; // very slow drift
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
      ? [1, 1.1]
      : [1, 1.4];

  return (
    <div
      ref={wrapRef}
      className={`detective-desk pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <div className="desk-lamp-pool" />
      <Suspense fallback={null}>
        <Canvas
          dpr={dpr}
          frameloop={visible && !reduced ? "always" : "demand"}
          camera={{ position: [0, 20, 22], fov: 55 }}
          gl={{ antialias: false, powerPreference: "low-power", alpha: true, stencil: false, depth: true }}
          style={{ background: "transparent" }}
        >
          <PauseWhenHidden />
          <DeskRig />
          <fog attach="fog" args={["#0a0603", 30, 70]} />
          <ambientLight intensity={0.45} color="#6a4020" />
          <hemisphereLight args={["#8a5424", "#000000", 0.55]} />
          <pointLight position={[0, 8, 0]} intensity={3} color="#ffb060" distance={26} decay={1.5} />

          <LampBreath />
          {/* Room shell — floor, walls, framed portraits. Grounds the desk
              inside a detective's office instead of floating in space. */}
          <Room />
          <SpinningDesk>
            <Tabletop />
            <CaseFiles />
            <Photo />
            <CoffeeMug />
            <Magnifier />
            <PenAndInk />
            <Clock />
            <Compass />
            <Stapler />
            <DeskClutter />
            <Raccoon />
            <StickyNote />
            <BusinessCard />
            <EvidenceBag />
            <Typewriter />
            <Ashtray />
          </SpinningDesk>
          <DustMotes />

        </Canvas>
      </Suspense>
      <div className="desk-vignette" />
    </div>
  );
}

export default DetectiveDesk;
