import { useEffect, useRef, useState } from "react";
import { loadFirstPhone, saveFirstPhone } from "@/lib/firstPhone/profile";
import { LESSONS } from "@/lib/firstPhone/lessons";
import { Download, Printer } from "lucide-react";

interface Props { onClose?: () => void }

export function LicenseCard({ onClose }: Props) {
  const state = loadFirstPhone();
  const [name, setName] = useState(state.kidCityName || "");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { render(); }, [name]);

  function render() {
    const c = canvasRef.current;
    if (!c) return;
    const W = 1200, H = 760;
    c.width = W; c.height = H;
    const ctx = c.getContext("2d")!;
    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0b1220");
    bg.addColorStop(1, "#131c2e");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // Guilloché
    ctx.strokeStyle = "rgba(34,211,238,0.06)";
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 40 + i * 12, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Border
    ctx.strokeStyle = "rgba(34,211,238,0.5)"; ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, W - 48, H - 48);
    ctx.strokeStyle = "rgba(34,211,238,0.9)"; ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, W - 80, H - 80);
    // Header
    ctx.fillStyle = "#22d3ee"; ctx.font = "600 20px ui-monospace, Menlo, monospace";
    ctx.fillText("MILVERSE · CITY OF SIGNALS", 72, 96);
    ctx.fillStyle = "#94a3b8"; ctx.font = "14px ui-monospace, Menlo, monospace";
    ctx.fillText("FIRST PHONE LICENSE — DEPARTMENT OF DIGITAL TRUST", 72, 122);
    // Title
    ctx.fillStyle = "#ffffff"; ctx.font = "900 82px Impact, 'Bebas Neue', sans-serif";
    ctx.fillText("LICENSED CITIZEN", 72, 220);
    ctx.fillStyle = "#22d3ee"; ctx.font = "600 22px ui-monospace, Menlo, monospace";
    ctx.fillText("CLEARED FOR FIRST REAL PHONE", 72, 254);
    // Name
    ctx.fillStyle = "#94a3b8"; ctx.font = "500 14px ui-monospace, Menlo, monospace";
    ctx.fillText("HOLDER", 72, 306);
    ctx.fillStyle = "#ffffff"; ctx.font = "700 42px 'Bebas Neue', Impact, sans-serif";
    ctx.fillText((name || "———").toUpperCase(), 72, 348);
    // Endorsements
    ctx.fillStyle = "#94a3b8"; ctx.font = "500 14px ui-monospace, Menlo, monospace";
    ctx.fillText("ENDORSEMENTS · SKILLS EARNED", 72, 400);
    ctx.fillStyle = "#e2e8f0"; ctx.font = "500 15px ui-sans-serif, system-ui, sans-serif";
    LESSONS.forEach((l, i) => {
      const col = i < 5 ? 0 : 1;
      const row = i % 5;
      ctx.fillText(`L${l.n} · ${l.title}`, 72 + col * 540, 432 + row * 28);
    });
    // Footer
    const issued = state.licenseIssuedAt ? new Date(state.licenseIssuedAt) : new Date();
    ctx.fillStyle = "#94a3b8"; ctx.font = "500 13px ui-monospace, Menlo, monospace";
    ctx.fillText(`LICENSE NO. ${state.licenseNumber ?? "PENDING"}`, 72, 688);
    ctx.fillText(`ISSUED ${issued.toISOString().slice(0, 10)}`, 72, 710);
    // Stamp
    ctx.save();
    ctx.translate(W - 200, H - 180);
    ctx.rotate(-0.22);
    ctx.strokeStyle = "rgba(34,211,238,0.9)"; ctx.lineWidth = 3;
    ctx.strokeRect(-90, -50, 180, 100);
    ctx.fillStyle = "#22d3ee"; ctx.font = "700 22px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText("CITY SEAL", 0, -8);
    ctx.font = "500 12px ui-monospace, Menlo, monospace";
    ctx.fillText("DEPT. OF TRUST", 0, 14);
    ctx.fillText("MILVERSE", 0, 32);
    ctx.restore();
    ctx.textAlign = "start";
  }

  function save() {
    // persist the city name if changed
    const s = loadFirstPhone();
    if (name && s.kidCityName !== name) { s.kidCityName = name; saveFirstPhone(s); }
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `first-phone-license-${(name || "citizen").toLowerCase()}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }

  return (
    <div className="rounded-2xl border-2 border-primary/50 bg-card p-5 print:border-0 print:bg-white">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <div>
          <div className="font-mono text-[11px] tracking-widest text-primary">FIRST PHONE LICENSE</div>
          <h2 className="text-2xl font-semibold mt-1">Congratulations — you're cleared.</h2>
        </div>
        {onClose && <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Close</button>}
      </div>

      <div className="mt-4 print:hidden">
        <label className="block text-xs text-muted-foreground mb-1">Your city name (on the card)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rania"
          maxLength={24}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-4 overflow-x-auto">
        <canvas ref={canvasRef} className="w-full max-w-full rounded-lg border border-border" style={{ aspectRatio: "1200 / 760" }} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        <button onClick={save} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          <Download className="h-4 w-4" /> Save PNG
        </button>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm">
          <Printer className="h-4 w-4" /> Print (A5)
        </button>
      </div>

      <style>{`
        @media print {
          @page { size: A5 landscape; margin: 10mm; }
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          canvas, canvas * { visibility: visible; }
        }
      `}</style>
    </div>
  );
}
