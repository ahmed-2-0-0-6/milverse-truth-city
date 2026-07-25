import { useGameEngine } from "@/lib/game/GameStateProvider";
import { Case, Detective } from "@/lib/game/gameSave";
import { useState } from "react";
import { Shield, Brain, Cpu, Search, Briefcase } from "lucide-react";
import { CorrupterRaidList } from "./CorrupterRaid";

function DetectiveCard({ det, onAssign }: { det: Detective; onAssign: () => void }) {
  return (
    <div className="rounded-sm border border-emerald-400/30 bg-black/60 p-3 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-100 transition-opacity">
        <Shield className="w-12 h-12 text-emerald-400" />
      </div>
      
      <div className="flex justify-between items-start mb-2 relative z-10">
        <div>
          <h4 className="text-emerald-100 font-bold stencil tracking-wider">{det.name}</h4>
          <p className="text-[10px] text-emerald-300/60 font-mono">Lvl {det.level} | {det.status.toUpperCase()}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] font-mono text-emerald-200/80 relative z-10">
        <div className="flex items-center gap-1"><Brain className="w-3 h-3 text-emerald-400" /> ANA: {det.stats.analysis}</div>
        <div className="flex items-center gap-1"><Cpu className="w-3 h-3 text-emerald-400" /> TCH: {det.stats.tech}</div>
        <div className="flex items-center gap-1"><Search className="w-3 h-3 text-emerald-400" /> INV: {det.stats.investigation}</div>
      </div>

      <div className="mt-3 flex gap-1 flex-wrap relative z-10">
        {det.traits.map(t => (
          <span key={t} className="px-1.5 py-0.5 rounded-sm bg-emerald-900/40 text-emerald-300 text-[9px] font-mono border border-emerald-400/20">
            {t}
          </span>
        ))}
      </div>

      {det.status === "idle" && (
        <button 
          onClick={onAssign}
          className="mt-3 w-full rounded-sm bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] py-1 stencil hover:bg-emerald-500 hover:text-black transition-colors"
        >
          ASSIGN CASE
        </button>
      )}
      {det.status === "investigating" && (
        <div className="mt-3 w-full rounded-sm bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] py-1 stencil text-center animate-pulse">
          ON MISSION
        </div>
      )}
    </div>
  );
}

function CaseList({ det, onAssign, onCancel }: { det: Detective; onAssign: (c: Case) => void; onCancel: () => void }) {
  // Temporary mock cases
  const availableCases: Case[] = [
    { id: "c1", title: "The Deepfake Mayor", difficulty: 4, requiredStat: "tech", durationSeconds: 60, rewardBricks: 50, rewardEvidence: 10 },
    { id: "c2", title: "Bot Farm Raid", difficulty: 7, requiredStat: "investigation", durationSeconds: 120, rewardBricks: 100, rewardEvidence: 30 },
  ];

  return (
    <div className="mt-4 p-4 border border-dashed border-emerald-400/30 bg-black/40 rounded-sm">
      <div className="flex justify-between items-center mb-3">
        <h4 className="stencil text-emerald-300 text-sm">SELECT CASE FOR {det.name.toUpperCase()}</h4>
        <button onClick={onCancel} className="text-muted-foreground hover:text-white text-[10px]">CANCEL</button>
      </div>
      
      <div className="space-y-2">
        {availableCases.map(c => (
          <div key={c.id} className="flex items-center justify-between p-2 rounded-sm bg-emerald-950/20 border border-emerald-400/20">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-emerald-400/60" />
              <div>
                <div className="text-emerald-100 text-[11px] font-bold">{c.title}</div>
                <div className="text-emerald-400/60 text-[9px] font-mono">REQ: {c.requiredStat.toUpperCase()} {c.difficulty} | +{c.rewardEvidence} EVD</div>
              </div>
            </div>
            <button 
              onClick={() => onAssign(c)}
              className="px-3 py-1 rounded-sm bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-black text-[10px] stencil transition-colors"
            >
              DISPATCH
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetectiveAcademy() {
  const { state, dispatch } = useGameEngine();
  const [selectedDetId, setSelectedDetId] = useState<string | null>(null);

  const selectedDet = state.detectives.find(d => d.id === selectedDetId);

  const handleAssign = (c: Case) => {
    if (!selectedDetId) return;
    dispatch({ type: "ASSIGN_CASE", payload: { detId: selectedDetId, caseId: c.id } });
    setSelectedDetId(null);
  };

  return (
    <section className="px-4 py-6">
      <div className="mb-6">
        <h2 className="stencil text-xl text-emerald-400">THE ACADEMY</h2>
        <p className="font-mono text-[11px] text-emerald-200/50">Train operatives. Solve cases. Reclaim the city.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.detectives.map(det => (
          <DetectiveCard 
            key={det.id} 
            det={det} 
            onAssign={() => setSelectedDetId(det.id)} 
          />
        ))}
      </div>

      {selectedDet && (
        <CaseList 
          det={selectedDet} 
          onAssign={handleAssign} 
          onCancel={() => setSelectedDetId(null)} 
        />
      )}

      <CorrupterRaidList />
    </section>
  );
}
