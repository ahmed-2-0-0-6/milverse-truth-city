import { OrthographicCamera, OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useGameEngine } from "@/lib/game/GameStateProvider";

// A basic isometric 5x5 grid rendered in WebGL as a proof-of-concept for Phase 1
const GRID = 5;
const TILE_SIZE = 10;

function CityGrid() {
  const { state } = useGameEngine();
  // Get overall corruption to influence atmosphere
  const totalCorruption = state.corrupters.reduce((acc, c) => acc + c.controlLevel, 0);

  const tiles = useMemo(() => {
    const arr = [];
    for (let x = 0; x < GRID; x++) {
      for (let y = 0; y < GRID; y++) {
        const isCenter = x === 2 && y === 2;
        const isIndustrial = x < 2 && y > 2; // Arbitrary "Botmaster" zone
        const isEntertainment = x > 2 && y < 2; // Arbitrary "Illusionist" zone
        const h = isCenter ? 0.5 : 2 + Math.random() * 6;
        
        let corruptionColor = "";
        let isCorrupted = false;
        if (isIndustrial && state.corrupters[0]?.controlLevel > 0) {
          corruptionColor = "#8b0000"; // dark red
          isCorrupted = true;
        } else if (isEntertainment && state.corrupters[1]?.controlLevel > 0) {
          corruptionColor = "#4b0082"; // indigo
          isCorrupted = true;
        }

        arr.push({
          x: (x - Math.floor(GRID / 2)) * TILE_SIZE,
          z: (y - Math.floor(GRID / 2)) * TILE_SIZE,
          h,
          isCenter,
          isCorrupted,
          corruptionColor
        });
      }
    }
    return arr;
  }, [state.corrupters]);

  return (
    <group>
      {tiles.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          {/* Base Tile */}
          <mesh position={[0, -0.5, 0]} receiveShadow>
            <boxGeometry args={[TILE_SIZE - 0.5, 1, TILE_SIZE - 0.5]} />
            <meshStandardMaterial color={t.isCorrupted ? t.corruptionColor : (t.isCenter ? "#2a2620" : "#1a1a24")} roughness={0.8} />
          </mesh>
          {/* Building */}
          {!t.isCenter && (
            <mesh position={[0, t.h / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[TILE_SIZE - 2, t.h, TILE_SIZE - 2]} />
              <meshStandardMaterial color={t.isCorrupted ? "#1a0505" : "#0a0a10"} roughness={0.4} metalness={0.6} />
            </mesh>
          )}
          {/* Neon Glow details */}
          {!t.isCenter && (
            <mesh position={[0, t.h, 0]}>
              <boxGeometry args={[TILE_SIZE - 2.5, 0.2, TILE_SIZE - 2.5]} />
              <meshBasicMaterial color={t.isCorrupted ? "#ff0044" : (Math.random() > 0.5 ? "#22d3ee" : "#f5b942")} transparent opacity={t.isCorrupted ? 0.9 : 0.6} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

export function CityWorldWebGL({ onSwitchView }: { onSwitchView: (v: "map" | "list") => void }) {
  const { state } = useGameEngine();
  const totalCorruption = state.corrupters.reduce((acc, c) => acc + c.controlLevel, 0);
  // Change fog and background based on corruption presence
  const bgColor = totalCorruption > 100 ? "#0a0005" : "#050914";

  return (
    <div className="relative w-full h-[85vh] min-h-[560px] rounded-sm overflow-hidden border border-amber-400/40 bg-[#050914]">
      <Canvas shadows gl={{ antialias: true, alpha: false }}>
        <color attach="background" args={[bgColor]} />
        <fog attach="fog" args={[bgColor, 30, 150]} />
        
        {/* Isometric Camera setup */}
        <OrthographicCamera 
          makeDefault 
          position={[50, 50, 50]} 
          zoom={12} 
          near={-100} 
          far={200} 
        />
        <OrbitControls 
          enableRotate={false} 
          enableZoom={true} 
          enablePan={true}
          minZoom={5}
          maxZoom={30}
          target={[0, 0, 0]}
        />

        {/* Noir Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[20, 40, 20]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        >
          <orthographicCamera attach="shadow-camera" args={[-50, 50, 50, -50, 0.1, 100]} />
        </directionalLight>
        <hemisphereLight args={["#22d3ee", "#0a0f1a", 0.4]} />

        <CityGrid />
        
        {/* Ground Plane Bedrock */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
          <planeGeometry args={[500, 500]} />
          <meshStandardMaterial color="#02040a" />
        </mesh>
      </Canvas>
      
      {/* HUD Overlay */}
      <div className="absolute top-2 left-2 right-2 flex items-start justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1 rounded-sm border border-emerald-400/40 bg-black/70 backdrop-blur px-1 py-1 stencil text-[10px]">
          <button 
            onClick={() => onSwitchView("map")}
            className="px-2 py-1 rounded-sm text-emerald-200/70 hover:text-emerald-100"
          >
            SVG MAP
          </button>
          <button className="px-2 py-1 rounded-sm bg-emerald-500 text-black font-bold">
            WEBGL ALPHA
          </button>
          <button 
            onClick={() => onSwitchView("list")}
            className="px-2 py-1 rounded-sm text-emerald-200/70 hover:text-emerald-100"
          >
            LIST
          </button>
        </div>
      </div>
    </div>
  );
}
