import { useEffect, useMemo, useRef, useState } from "react";
import { loadFirstPhone, saveFirstPhone } from "@/lib/firstPhone/profile";
import { LESSONS } from "@/lib/firstPhone/lessons";
import { describeTactic } from "@/lib/firstPhone/tacticMap";
import { Download, Printer } from "lucide-react";

interface Props {
  onClose?: () => void;
}

/** Random per-print issue mark. NOT persisted anywhere. Regenerates every mount. */
function generateIssueMark(): string {
  const A = "ABCDEFGHJKMNPQRSTVWXYZ";
  const N = "23456789";
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  return `${pick(A)}${pick(A)}-${pick(N)}${pick(N)}${pick(N)}${pick(N)}`;
}

type Mode = "screen" | "paper";

interface Palette {
  bgFrom: string;
  bgTo: string;
  guilloche: string;
  borderOuter: string;
  borderInner: string;
  header: string;
  subheader: string;
  title: string;
  titleSub: string;
  labelMuted: string;
  holder: string;
  endorsement: string;
  disclaimer: string;
  stamp: string;
  rule: string;
}

const PALETTES: Record<Mode, Palette> = {
  screen: {
    bgFrom: "#0b1220",
    bgTo: "#131c2e",
    guilloche: "rgba(34,211,238,0.06)",
    borderOuter: "rgba(34,211,238,0.5)",
    borderInner: "rgba(34,211,238,0.9)",
    header: "#22d3ee",
    subheader: "#94a3b8",
    title: "#ffffff",
    titleSub: "#22d3ee",
    labelMuted: "#94a3b8",
    holder: "#ffffff",
    endorsement: "#e2e8f0",
    disclaimer: "#64748b",
    stamp: "#22d3ee",
    rule: "rgba(148,163,184,0.8)",
  },
  paper: {
    bgFrom: "#f8f7f2",
    bgTo: "#f8f7f2",
    guilloche: "rgba(30,58,138,0.08)",
    borderOuter: "rgba(30,58,138,0.35)",
    borderInner: "rgba(30,58,138,0.75)",
    header: "#1e3a8a",
    subheader: "#4b5b73",
    title: "#1b2430",
    titleSub: "#1e3a8a",
    labelMuted: "#4b5b73",
    holder: "#1b2430",
    endorsement: "#1b2430",
    disclaimer: "#5a6472",
    stamp: "#1e3a8a",
    rule: "#1b2430",
  },
};

// Base coordinate space (all render() constants). Backing store scales by K.
const BASE_W = 1200;
const BASE_H = 760;
const K = 2; // 2x resolution — 2400x1520 backing store.

export function LicenseCard({ onClose }: Props) {
  const state = loadFirstPhone();
  const [name, setName] = useState(state.kidCityName || "");
  const [mode, setMode] = useState<Mode>("screen");
  // Per-print mark — regenerates on every mount. Random is intentional; not stored.
  const issueMark = useMemo(() => generateIssueMark(), []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const issued = state.licenseIssuedAt ? new Date(state.licenseIssuedAt) : new Date();
  const issuedISO = issued.toISOString().slice(0, 10);
  const ariaLabel = `First Phone License for ${name || "unnamed citizen"}, issued ${issuedISO}, ten endorsements.`;

  useEffect(() => {
    render(mode);
  }, [name, issueMark, mode]);

  function render(m: Mode) {
    const c = canvasRef.current;
    if (!c) return;
    const W = BASE_W * K;
    const H = BASE_H * K;
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    // Everything below reads base coords; ctx.scale multiplies by K.
    ctx.scale(K, K);
    const p = PALETTES[m];
    // Background
    const bg = ctx.createLinearGradient(0, 0, BASE_W, BASE_H);
    bg.addColorStop(0, p.bgFrom);
    bg.addColorStop(1, p.bgTo);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    // Guilloché
    ctx.strokeStyle = p.guilloche;
    ctx.lineWidth = 1;
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      ctx.arc(BASE_W / 2, BASE_H / 2, 40 + i * 12, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Border
    ctx.strokeStyle = p.borderOuter;
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, BASE_W - 48, BASE_H - 48);
    ctx.strokeStyle = p.borderInner;
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, BASE_W - 80, BASE_H - 80);
    // Header
    ctx.fillStyle = p.header;
    ctx.font = "600 20px ui-monospace, Menlo, monospace";
    ctx.fillText("MILVERSE · CITY OF SIGNALS", 72, 96);
    ctx.fillStyle = p.subheader;
    ctx.font = "14px ui-monospace, Menlo, monospace";
    ctx.fillText("FIRST PHONE LICENSE — DEPARTMENT OF DIGITAL TRUST", 72, 122);
    // Title
    ctx.fillStyle = p.title;
    ctx.font = "900 82px Impact, 'Bebas Neue', sans-serif";
    ctx.fillText("LICENSED CITIZEN", 72, 220);
    ctx.fillStyle = p.titleSub;
    ctx.font = "600 22px ui-monospace, Menlo, monospace";
    ctx.fillText("CLEARED FOR FIRST REAL PHONE", 72, 254);
    // Name
    ctx.fillStyle = p.labelMuted;
    ctx.font = "500 14px ui-monospace, Menlo, monospace";
    ctx.fillText("HOLDER", 72, 306);
    ctx.fillStyle = p.holder;
    ctx.font = "700 42px 'Bebas Neue', Impact, sans-serif";
    ctx.fillText((name || "———").toUpperCase(), 72, 348);
    // Endorsements
    ctx.fillStyle = p.labelMuted;
    ctx.font = "500 14px ui-monospace, Menlo, monospace";
    ctx.fillText("ENDORSEMENTS · SKILLS EARNED", 72, 400);
    ctx.fillStyle = p.endorsement;
    ctx.font = "500 13px ui-sans-serif, system-ui, sans-serif";
    LESSONS.forEach((l, i) => {
      const col = i < 5 ? 0 : 1;
      const row = i % 5;
      const primary = l.cases[0]?.tactic;
      const d = primary ? describeTactic(primary) : null;
      const suffix = d?.manualCode ? `  ·  Field Manual ${d.manualCode}` : "";
      ctx.fillText(`L${l.n} · ${l.title}${suffix}`, 72 + col * 540, 432 + row * 28);
    });
    // Footer row — issue mark left, countersign block right.
    ctx.fillStyle = p.labelMuted;
    ctx.font = "500 13px ui-monospace, Menlo, monospace";
    ctx.fillText(`ISSUE MARK ${issueMark}`, 72, 688);
    ctx.fillText(`ISSUED ${issuedISO}`, 72, 710);
    // Countersign — 300px rule + caption, right side of footer.
    const csX = BASE_W - 72 - 300;
    const csY = 688;
    ctx.strokeStyle = p.rule;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(csX, csY);
    ctx.lineTo(csX + 300, csY);
    ctx.stroke();
    ctx.fillStyle = p.labelMuted;
    ctx.font = "500 11px ui-monospace, Menlo, monospace";
    ctx.fillText("COUNTERSIGNED · A TRUSTED ADULT", csX, csY + 18);
    // Small print — disclaimer.
    ctx.fillStyle = p.disclaimer;
    ctx.font = "italic 11px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText("Certifies completion of a learning pathway. Not a guarantee of online", 72, 732);
    ctx.fillText("safety — the training continues in real life.", 72, 748);
    // Stamp
    ctx.save();
    ctx.translate(BASE_W - 200, BASE_H - 210);
    ctx.rotate(-0.22);
    ctx.strokeStyle = p.stamp;
    ctx.lineWidth = 3;
    ctx.strokeRect(-90, -50, 180, 100);
    ctx.fillStyle = p.stamp;
    ctx.font = "700 22px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText("CITY SEAL", 0, -8);
    ctx.font = "500 12px ui-monospace, Menlo, monospace";
    ctx.fillText("DEPT. OF TRUST", 0, 14);
    ctx.fillText("MILVERSE", 0, 32);
    ctx.restore();
    ctx.textAlign = "start";
    // Reset transform so a subsequent render() with a fresh scale is correct.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function save() {
    const s = loadFirstPhone();
    if (name && s.kidCityName !== name) {
      s.kidCityName = name;
      saveFirstPhone(s);
    }
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `first-phone-license-${(name || "citizen").toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }

  function print() {
    // Print always uses PAPER. Swap render, print, restore.
    const prev = mode;
    render("paper");
    // Give the browser one frame to pick up the repaint before the print dialog.
    requestAnimationFrame(() => {
      window.print();
      if (prev !== "paper") {
        // Restore the on-screen preview after the dialog closes.
        setTimeout(() => render(prev), 50);
      }
    });
  }

  const tabBase =
    "px-3 py-1.5 font-mono text-[11px] tracking-[0.25em] rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60";
  const tabOn = "border-primary/60 bg-primary/15 text-primary";
  const tabOff = "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40";

  return (
    <div className="rounded-2xl border-2 border-primary/50 bg-card p-5 print:border-0 print:bg-white">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <div>
          <div className="font-mono text-[11px] tracking-widest text-primary">
            FIRST PHONE LICENSE
          </div>
          <h2 className="text-2xl font-semibold mt-1">You made it. Ten lessons. Cleared.</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
            Close
          </button>
        )}
      </div>

      <div className="mt-4 print:hidden">
        <label className="block text-xs text-muted-foreground mb-1" htmlFor="license-name">
          The name on your card
        </label>
        <input
          id="license-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. FALCON"
          maxLength={24}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          Any name you like — yours or one you made up. It stays on this device and on the paper.
        </p>
      </div>

      {/* SCREEN / PAPER toggle */}
      <div className="mt-4 flex gap-2 print:hidden" role="tablist" aria-label="Card style">
        <button
          role="tab"
          aria-selected={mode === "screen"}
          onClick={() => setMode("screen")}
          className={`${tabBase} ${mode === "screen" ? tabOn : tabOff}`}
        >
          SCREEN
        </button>
        <button
          role="tab"
          aria-selected={mode === "paper"}
          onClick={() => setMode("paper")}
          className={`${tabBase} ${mode === "paper" ? tabOn : tabOff}`}
        >
          PAPER
        </button>
      </div>

      <div className="mt-3 overflow-x-auto license-print-host">
        <canvas
          ref={canvasRef}
          aria-label={ariaLabel}
          role="img"
          className="w-full max-w-full rounded-lg border border-border"
          style={{ aspectRatio: `${BASE_W} / ${BASE_H}` }}
        />
      </div>

      <p className="mt-3 text-[11px] italic text-muted-foreground print:hidden">
        Certifies completion of a learning pathway. Not a guarantee of online safety — the training
        continues in real life.
      </p>

      <p className="mt-2 text-sm text-foreground/80 print:hidden">
        There's a line on it for a grown-up you trust. Ask them to sign it for real.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        <button
          onClick={save}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 transition-all"
        >
          <Download className="h-4 w-4" /> Save PNG
        </button>
        <button
          onClick={print}
          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 transition-colors"
        >
          <Printer className="h-4 w-4" /> Print (A5)
        </button>
      </div>

      <style>{`
        @media print {
          @page { size: A5 landscape; margin: 10mm; }
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          canvas, canvas * { visibility: visible; }
          .license-print-host { position: relative; }
        }
      `}</style>
    </div>
  );
}
