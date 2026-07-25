import { useGameEngine } from "@/lib/game/GameStateProvider";
import { Corrupter } from "@/lib/game/gameSave";
import { Skull, AlertTriangle, ShieldCheck } from "lucide-react";
import { useState } from "react";

export function CorrupterRaid({ corrupter }: { corrupter: Corrupter }) {
  const { state, dispatch } = useGameEngine();
  const [raidStatus, setRaidStatus] = useState<"prep" | "battling" | "victory">("prep");

  const startRaid = () => {
    setRaidStatus("battling");
    
    // Simulate a timed boss fight
    setTimeout(() => {
      // Logic for boss fight success (simplistic for now)
      // Require at least one detective with a matching trait weakness
      const hasWeakness = state.detectives.some(d => 
        corrupter.weaknesses.some(w => d.traits.includes(w))
      );
      
      if (hasWeakness) {
        dispatch({ type: "LOWER_CORRUPTION", payload: { districtId: corrupter.districtId, amount: 100 } });
        setRaidStatus("victory");
      } else {
        // Failed raid
        setRaidStatus("prep");
        alert("Raid failed! You need a detective with the right traits: " + corrupter.weaknesses.join(", "));
      }
    }, 2000);
  };

  if (corrupter.controlLevel === 0 || corrupter.isDefeated) {
    return (
      <div className="rounded-sm border border-emerald-500/50 bg-emerald-950/20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          <div>
            <h4 className="text-emerald-100 font-bold stencil tracking-wider">{corrupter.name} DEFEATED</h4>
            <p className="text-[11px] text-emerald-400/60 font-mono">District {corrupter.districtId} is secure.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-rose-500/50 bg-black/60 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
        <Skull className="w-24 h-24 text-rose-500" />
      </div>
      
      <div className="p-4 relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
          <h4 className="text-rose-100 font-bold stencil tracking-wider">{corrupter.name}</h4>
        </div>
        
        <p className="text-[11px] text-rose-300/80 font-mono mb-4">
          Alias: {corrupter.alias} | Sector: {corrupter.districtId} | Control: {corrupter.controlLevel}%
        </p>

        <div className="mb-4">
          <div className="text-[9px] text-rose-400/60 stencil mb-1">KNOWN WEAKNESSES:</div>
          <div className="flex gap-2">
            {corrupter.weaknesses.map(w => (
              <span key={w} className="px-2 py-0.5 rounded-sm bg-rose-950 border border-rose-500/30 text-[10px] text-rose-300 font-mono">
                {w}
              </span>
            ))}
          </div>
        </div>

        {raidStatus === "prep" && (
          <button 
            onClick={startRaid}
            className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-black stencil font-bold rounded-sm transition-colors"
          >
            INITIATE RAID
          </button>
        )}

        {raidStatus === "battling" && (
          <div className="w-full py-2 bg-rose-900 text-rose-200 stencil font-bold rounded-sm text-center animate-pulse border border-rose-500">
            RAID IN PROGRESS...
          </div>
        )}
      </div>
    </div>
  );
}

export function CorrupterRaidList() {
  const { state } = useGameEngine();
  
  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 max-w-[60px] bg-rose-500/60" />
        <div className="stencil text-[12px] text-rose-400 tracking-widest">ACTIVE CORRUPTER THREATS</div>
        <div className="h-px flex-1 bg-rose-500/20" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.corrupters.map(c => (
          <CorrupterRaid key={c.id} corrupter={c} />
        ))}
      </div>
    </div>
  );
}
