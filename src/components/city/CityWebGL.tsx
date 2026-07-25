// MILVERSE — Your City · WebGL board.
// A 1:1 port of the SVG isometric city into real 3D: same 9×9 grid, same
// districts, same road cross + ring road, same plaza fountain, same bay,
// same rank-sealed ground. Presentation only — every level, lock and
// palette is read from the existing city libs, nothing is decided here.
//
// Camera is shared with the SVG board via `camRef` (x/y in SVG units,
// z = zoom) so the existing D-pad, flyover and district jumps keep working.

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { memo, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { BuildingDef, BuildingId } from "@/lib/city/buildings";
import { GRID, CENTER, ringOf } from "@/lib/city/zones";

/* Matches the SVG board's tile metrics so camera maths stays shared. */
const TW = 96;
const TH = 48;

export interface WebGLPlot {
  id: BuildingId;
  gx: number;
  gy: number;
  level: number;
  locked: boolean;
  district: BuildingDef["district"];
  name: string;
}

export interface CityWebGLProps {
  camRef: MutableRefObject<{ x: number; y: number; z: number }>;
  plots: WebGLPlot[];
  lockedCells: Array<[number, number]>;
  hour: number;
  reducedMotion: boolean;
  lowFx: boolean;
  immersed: boolean;
  onSelect: (id: BuildingId) => void;
  onDragStateChange?: (dragging: boolean) => void;
}

const PALETTE: Record<
  BuildingDef["district"],
  { body: string; roof: string; window: string; accent: string }
> = {
  core:    { body: "#2b241d", roof: "#3d332a", window: "#fcd34d", accent: "#f97316" },
  learn:   { body: "#1f3446", roof: "#2e4a5c", window: "#67e8f9", accent: "#22d3ee" },
  press:   { body: "#341814", roof: "#4a2622", window: "#fda4af", accent: "#f43f5e" },
  signals: { body: "#271e40", roof: "#3a2e58", window: "#c4b5fd", accent: "#a78bfa" },
  records: { body: "#362813", roof: "#4d3a1f", window: "#fde68a", accent: "#eab308" },
  elite:   { body: "#183633", roof: "#264d4a", window: "#a7f3d0", accent: "#34d399" },
};

type TileKind = "grass" | "road" | "plaza";
function classifyTile(gx: number, gy: number): TileKind {
  if (gx === CENTER && gy === CENTER) return "plaza";
  if (gx === CENTER || gy === CENTER) return "road";
  if (ringOf(gx, gy) === 3) return "road";
  return "grass";
}

function hashCell(gx: number, gy: number, seed = 0) {
  let n = ((gx + 17) * 73856093) ^ ((gy + 31) * 19349663) ^ ((seed + 7) * 83492791);
  n = (n >>> 0) % 100000;
  return n / 100000;
}

/** World coords: 1 grid cell = 1 unit, centred on the plaza. */
const wx = (gx: number) => gx - CENTER;
const wz = (gy: number) => gy - CENTER;

/* ── ground ─────────────────────────────────────────────── */
const Ground = memo(function Ground({ lockedKeys }: { lockedKeys: Set<string> }) {
  const tiles = useMemo(() => {
    const out: {
      key: string;
      x: number;
      z: number;
      kind: TileKind;
      color: string;
      locked: boolean;
      h: number;
    }[] = [];
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        const kind = classifyTile(gx, gy);
        const jitter = (hashCell(gx, gy, 4) - 0.5) * 0.05;
        const base =
          kind === "road" ? "#151519" : kind === "plaza" ? "#2a2620" : "#0f0c14";
        const c = new THREE.Color(base);
        c.offsetHSL(0, 0, jitter);
        out.push({
          key: `${gx}-${gy}`,
          x: wx(gx),
          z: wz(gy),
          kind,
          color: `#${c.getHexString()}`,
          locked: lockedKeys.has(`${gx}-${gy}`),
          h: kind === "road" ? 0.06 : kind === "plaza" ? 0.14 : 0.1,
        });
      }
    }
    return out;
  }, [lockedKeys]);

  return (
    <group>
      {/* the slab the city sits on — soil sides, like the SVG earth skirt */}
      <mesh position={[0, -0.35, 0]} receiveShadow={false}>
        <boxGeometry args={[GRID + 0.6, 0.6, GRID + 0.6]} />
        <meshStandardMaterial color="#180f22" roughness={1} metalness={0} />
      </mesh>

      {tiles.map((t) => (
        <group key={t.key} position={[t.x, 0, t.z]}>
          <mesh position={[0, t.h / 2, 0]}>
            <boxGeometry args={[0.98, t.h, 0.98]} />
            <meshStandardMaterial
              color={t.locked ? "#0a0410" : t.color}
              roughness={t.kind === "road" ? 0.55 : 0.95}
              metalness={t.kind === "road" ? 0.35 : 0.05}
            />
          </mesh>
          {/* road centreline */}
          {t.kind === "road" && (
            <mesh position={[0, t.h + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={gyRoad(t.x, t.z) ? [0.06, 0.86] : [0.86, 0.06]} />
              <meshBasicMaterial color="#c9a227" transparent opacity={0.45} />
            </mesh>
          )}
          {/* sealed ground reads red, exactly like the hatch plate */}
          {t.locked && (
            <mesh position={[0, t.h + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.98, 0.98]} />
              <meshBasicMaterial color="#f43f5e" transparent opacity={0.1} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
});

/** Road runs along the grid's Y axis when the tile sits on the X avenue. */
function gyRoad(x: number, z: number) {
  return Math.round(x) === 0 && Math.round(z) !== 0 ? false : Math.round(z) === 0;
}

/* ── windows shader — the lit grid on every façade ───────── */
function windowMaterial(color: string, seed: number, lit: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uSeed: { value: seed },
      uLit: { value: lit },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform vec3 uColor; uniform float uSeed; uniform float uLit;
      float rnd(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
      void main(){
        vec2 cells = vec2(4.0, 6.0);
        vec2 g = fract(vUv*cells);
        vec2 cid = floor(vUv*cells);
        float pane = step(0.25,g.x)*step(g.x,0.75)*step(0.3,g.y)*step(g.y,0.8);
        float on = step(1.0-uLit, rnd(cid+uSeed));
        gl_FragColor = vec4(uColor*1.5, pane*on*0.85);
      }
    `,
  });
}

/* ── a building ─────────────────────────────────────────── */
function Plot({ plot, onSelect }: { plot: WebGLPlot; onSelect: (id: BuildingId) => void }) {
  const pal = PALETTE[plot.district];
  const level = plot.level;
  const h = level === 0 ? 0.22 : 0.45 + level * 0.42;
  const w = level === 0 ? 0.5 : 0.6;
  const x = wx(plot.gx);
  const z = wz(plot.gy);
  const seed = hashCell(plot.gx, plot.gy, 11) * 100;

  const mats = useMemo(
    () => windowMaterial(pal.window, seed, Math.min(0.85, 0.35 + level * 0.12)),
    [pal.window, seed, level],
  );

  const beacon = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (beacon.current) {
      const m = beacon.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.35 + Math.abs(Math.sin(clock.elapsedTime * 1.6)) * 0.6;
    }
  });

  if (plot.locked) {
    // A chained plot: the foundation is poured, nothing stands on it.
    return (
      <mesh position={[x, 0.12, z]}>
        <boxGeometry args={[0.66, 0.06, 0.66]} />
        <meshStandardMaterial color="#1a0d18" roughness={1} />
      </mesh>
    );
  }

  return (
    <group
      position={[x, 0, z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(plot.id);
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      {level === 0 ? (
        <>
          {/* empty lot: hoarding + survey stakes */}
          <mesh position={[0, 0.11, 0]}>
            <boxGeometry args={[w, 0.06, w]} />
            <meshStandardMaterial color="#241a1a" roughness={1} />
          </mesh>
          <mesh position={[0, 0.26, 0]}>
            <boxGeometry args={[w * 0.9, 0.24, 0.03]} />
            <meshStandardMaterial color="#3a2c14" emissive={pal.accent} emissiveIntensity={0.12} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, h / 2 + 0.1, 0]}>
            <boxGeometry args={[w, h, w]} />
            <meshStandardMaterial color={pal.body} roughness={0.85} metalness={0.1} />
          </mesh>
          {/* window sheets on all four faces */}
          {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((r, i) => (
            <mesh
              key={i}
              position={[
                Math.sin(r) * (w / 2 + 0.002),
                h / 2 + 0.1,
                Math.cos(r) * (w / 2 + 0.002),
              ]}
              rotation={[0, r, 0]}
              material={mats}
            >
              <planeGeometry args={[w * 0.86, h * 0.86]} />
            </mesh>
          ))}
          {/* roof plate */}
          <mesh position={[0, h + 0.12, 0]}>
            <boxGeometry args={[w * 1.04, 0.04, w * 1.04]} />
            <meshStandardMaterial color={pal.roof} roughness={0.7} />
          </mesh>
          {/* Lv3+ roof furniture: mast and beacon, same as the SVG city */}
          {level >= 3 && (
            <>
              <mesh position={[0, h + 0.32, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.4, 6]} />
                <meshStandardMaterial color="#0d0d14" />
              </mesh>
              <mesh ref={beacon} position={[0, h + 0.54, 0]}>
                <sphereGeometry args={[0.045, 8, 8]} />
                <meshBasicMaterial color={pal.accent} transparent opacity={0.8} />
              </mesh>
            </>
          )}
        </>
      )}
    </group>
  );
}

/* ── plaza fountain ─────────────────────────────────────── */
function Fountain({ reducedMotion }: { reducedMotion: boolean }) {
  const water = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (reducedMotion || !water.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * 1.4) * 0.06;
    water.current.scale.set(s, 1, s);
  });
  return (
    <group position={[0, 0.14, 0]}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.34, 0.36, 0.06, 24]} />
        <meshStandardMaterial color="#2a2620" roughness={0.8} />
      </mesh>
      <mesh ref={water} position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.02, 24]} />
        <meshStandardMaterial color="#0d2a33" emissive="#22d3ee" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.24, 10]} />
        <meshStandardMaterial color="#3a3644" />
      </mesh>
    </group>
  );
}

/* ── the bay ────────────────────────────────────────────── */
function Bay({ reducedMotion, lowFx }: { reducedMotion: boolean; lowFx: boolean }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const ferry = useRef<THREE.Group>(null);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 } }),
    [],
  );
  useFrame(({ clock }) => {
    if (reducedMotion) return;
    uniforms.uTime.value = clock.elapsedTime;
    if (ferry.current) {
      const t = (clock.elapsedTime * 0.06) % 1;
      ferry.current.position.x = -18 + t * 36;
    }
  });

  return (
    <group position={[0, -0.06, -GRID / 2 - 8]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[70, 26, 1, 1]} />
        <shaderMaterial
          ref={mat}
          uniforms={uniforms}
          transparent
          vertexShader={`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
          fragmentShader={`
            varying vec2 vUv; uniform float uTime;
            void main(){
              float band = sin(vUv.y*90.0 + uTime*1.2)*0.5+0.5;
              float crest = smoothstep(0.86, 1.0, band) * 0.35;
              float moon = smoothstep(0.06, 0.0, abs(vUv.x-0.5)) * 0.35;
              vec3 deep = vec3(0.02,0.05,0.10);
              vec3 col = deep + vec3(0.10,0.28,0.38)*crest + vec3(0.9,0.86,0.7)*moon*crest;
              gl_FragColor = vec4(col, 0.95);
            }
          `}
        />
      </mesh>
      {/* harbour piers */}
      {!lowFx &&
        [-3, -1, 1, 3].map((i) => (
          <mesh key={i} position={[i * 1.6, 0.06, 11.4]}>
            <boxGeometry args={[0.3, 0.1, 2.4]} />
            <meshStandardMaterial color="#1c1620" roughness={1} />
          </mesh>
        ))}
      {/* the ferry, still crossing */}
      <group ref={ferry} position={[0, 0.1, 3]}>
        <mesh>
          <boxGeometry args={[0.9, 0.16, 0.3]} />
          <meshStandardMaterial color="#221c2a" emissive="#fde68a" emissiveIntensity={0.15} />
        </mesh>
      </group>
    </group>
  );
}

/* ── camera rig ─────────────────────────────────────────── */
function Rig({
  camRef,
  immersed,
}: {
  camRef: MutableRefObject<{ x: number; y: number; z: number }>;
  immersed: boolean;
}) {
  const { camera, size } = useThree();
  useFrame(() => {
    const c = camRef.current;
    const cam = camera as THREE.OrthographicCamera;
    // SVG pan units → world units on the iso plane.
    const px = -c.x / TW;
    const pz = -c.y / TH / 1.2;
    const d = 14;
    cam.position.set(d + px + pz, d * 0.85, d + px - pz);
    cam.lookAt(px + pz, 0, px - pz);
    const zoom = (Math.min(size.width, size.height * 1.9) / (GRID + 3)) * (c.z / 1.7) * (immersed ? 1.25 : 1);
    if (Math.abs(cam.zoom - zoom) > 0.01) {
      cam.zoom = zoom;
      cam.updateProjectionMatrix();
    }
  });
  return null;
}

/* ── light model: the same day/night curve, as real light ── */
function DayLight({ hour }: { hour: number }) {
  const t = ((hour - 6) / 12.5 + 1) % 1;
  const day = hour >= 6 && hour < 18.5;
  const sun = new THREE.Vector3(Math.cos(Math.PI * t) * 14, 6 + Math.sin(Math.PI * t) * 12, 8);
  return (
    <>
      <ambientLight intensity={day ? 0.55 : 0.28} color={day ? "#cfd8ff" : "#4b3f7a"} />
      <hemisphereLight args={[day ? "#8ab4ff" : "#22d3ee", "#0a0512", day ? 0.45 : 0.3]} />
      <directionalLight
        position={[sun.x, sun.y, sun.z]}
        intensity={day ? 1.05 : 0.35}
        color={day ? "#ffe6bd" : "#7c8bff"}
      />
      <fog attach="fog" args={[day ? "#0b0a16" : "#05040a", 18, 52]} />
    </>
  );
}

/* ── the board ──────────────────────────────────────────── */
export default function CityWebGL({
  camRef,
  plots,
  lockedCells,
  hour,
  reducedMotion,
  lowFx,
  immersed,
  onSelect,
  onDragStateChange,
}: CityWebGLProps) {
  const lockedKeys = useMemo(
    () => new Set(lockedCells.map(([a, b]) => `${a}-${b}`)),
    [lockedCells],
  );
  const drag = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);

  const clamp = (c: { x: number; y: number; z: number }) => {
    const z = Math.min(3, Math.max(0.6, c.z));
    const span = 1600 / z;
    return { z, x: Math.min(span, Math.max(-span, c.x)), y: Math.min(span, Math.max(-span, c.y)) };
  };

  return (
    <div
      className="relative w-full touch-none select-none"
      style={{ height: immersed ? "100vh" : 520 }}
      onPointerDown={(e) => {
        const c = camRef.current;
        drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: c.x, oy: c.y, moved: false };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        const c = camRef.current;
        const scale = 2 / c.z;
        const dx = (e.clientX - d.sx) * scale;
        const dy = (e.clientY - d.sy) * scale;
        if (!d.moved && Math.hypot(dx, dy) > 4) {
          d.moved = true;
          onDragStateChange?.(true);
        }
        if (d.moved) camRef.current = clamp({ ...c, x: d.ox - dx, y: d.oy - dy });
      }}
      onPointerUp={() => {
        drag.current = null;
        onDragStateChange?.(false);
      }}
      onPointerCancel={() => {
        drag.current = null;
        onDragStateChange?.(false);
      }}
      onWheel={(e) => {
        const c = camRef.current;
        camRef.current = clamp({ ...c, z: c.z * (e.deltaY < 0 ? 1.1 : 1 / 1.1) });
      }}
    >
      <Canvas
        orthographic
        dpr={lowFx ? [1, 1.25] : [1, 2]}
        camera={{ position: [14, 12, 14], zoom: 40, near: -200, far: 400 }}
        gl={{ antialias: !lowFx, powerPreference: lowFx ? "low-power" : "high-performance" }}
        style={{ background: "transparent" }}
      >
        <Rig camRef={camRef} immersed={immersed} />
        <DayLight hour={hour} />
        <Bay reducedMotion={reducedMotion} lowFx={lowFx} />
        <Ground lockedKeys={lockedKeys} />
        <Fountain reducedMotion={reducedMotion} />
        {plots.map((p) => (
          <Plot key={p.id} plot={p} onSelect={onSelect} />
        ))}
      </Canvas>
    </div>
  );
}
