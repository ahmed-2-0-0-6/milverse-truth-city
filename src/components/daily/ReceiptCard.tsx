// MILVERSE — Daily Drop share card ("THE RECEIPT").
// Canvas-rendered PNG + copyable text line. Zero spoilers: never names the
// case title, verdict, or truth. Only shows probe fingerprint + result color +
// stake delta + streak + local sharpness estimate.

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/telemetry";
import { Copy, Download, Share2, Check } from "lucide-react";

export interface ReceiptData {
  dropNumber: number; // e.g. days since epoch UTC+5 mod something, or just streak-index
  dateKey: string;
  probesUsed: number; // 0..2
  correct: boolean;
  outcome: "correct" | "missed_scam" | "false_alarm";
  stake: number;
  delta: number; // +N or -N
  streak: number;
  /** "sharper than X% of the city". Optional — omitted if not derivable. */
  sharpness?: number;
  siteUrl: string;
  /** Only present when the day's aggregate cleared the n>=5 suppression floor.
   *  Never set for rebuilt spool receipts (historical splits aren't stored). */
  citySplit?: { pct: number; total: number };
}

const COLOR: Record<ReceiptData["outcome"], string> = {
  correct: "#22d3ee",
  missed_scam: "#ef4444",
  false_alarm: "#f5b942",
};

/** Emoji row: N probe icons + a result square. */
export function receiptEmojiRow(d: ReceiptData): string {
  const probes = "🔎".repeat(Math.max(0, Math.min(2, d.probesUsed)));
  const dots = "▫️".repeat(2 - Math.max(0, Math.min(2, d.probesUsed)));
  const box = d.correct ? "🟩" : d.outcome === "missed_scam" ? "🟥" : "🟨";
  return `${probes}${dots}${box}`;
}

export function receiptText(d: ReceiptData): string {
  const emoji = receiptEmojiRow(d);
  const result = d.correct
    ? `staked ${d.stake} → won ${d.delta}`
    : `staked ${d.stake} → lost ${Math.abs(d.delta)}`;
  let head = `MILVERSE #${d.dropNumber} ${emoji} · ${result} · ${d.streak} days on watch`;
  if (typeof d.sharpness === "number") {
    head += ` · sharper than ${d.sharpness}% of the city`;
  }
  const lines = [head];
  if (d.citySplit) {
    lines.push(
      `CITY SPLIT · ${d.citySplit.pct}% CALLED IT RIGHT · ${d.citySplit.total} REPORTED`,
    );
  }
  lines.push(d.siteUrl);
  return lines.join("\n");
}

function drawReceipt(canvas: HTMLCanvasElement, d: ReceiptData) {
  const W = 1080,
    H = 1080;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background: noir paper
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);
  // grain
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  for (let i = 0; i < 4000; i++) ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);

  // Card
  const pad = 60;
  const cardX = pad,
    cardY = pad,
    cardW = W - pad * 2,
    cardH = H - pad * 2;
  ctx.fillStyle = "#141414";
  ctx.strokeStyle = "#f5b942";
  ctx.lineWidth = 3;
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.strokeRect(cardX, cardY, cardW, cardH);

  // Header stencil
  ctx.fillStyle = "#f5b942";
  ctx.font = "bold 32px 'Courier New', monospace";
  ctx.fillText("MILVERSE · THE RECEIPT", cardX + 40, cardY + 70);
  ctx.font = "22px 'Courier New', monospace";
  ctx.fillStyle = "#8a8a8a";
  ctx.fillText(`DROP #${d.dropNumber}  ·  ${d.dateKey}`, cardX + 40, cardY + 108);

  // Big result color band
  const bandY = cardY + 150;
  ctx.fillStyle = COLOR[d.outcome];
  ctx.fillRect(cardX + 40, bandY, cardW - 80, 6);

  // Probe fingerprint
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px 'Courier New', monospace";
  ctx.fillText("PROBE FINGERPRINT", cardX + 40, bandY + 70);
  const boxes = ["●", "●", "■"];
  const boxColors = [
    d.probesUsed >= 1 ? "#22d3ee" : "#2a2a2a",
    d.probesUsed >= 2 ? "#22d3ee" : "#2a2a2a",
    COLOR[d.outcome],
  ];
  ctx.font = "bold 96px sans-serif";
  boxes.forEach((c, i) => {
    ctx.fillStyle = boxColors[i];
    ctx.fillText(c, cardX + 40 + i * 130, bandY + 200);
  });

  // Stake result
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 40px 'Courier New', monospace";
  ctx.fillText("STAKE", cardX + 40, bandY + 340);
  ctx.fillStyle = COLOR[d.outcome];
  ctx.font = "bold 120px 'Impact', sans-serif";
  const stakeStr = d.correct ? `+${d.delta}` : `${d.delta}`;
  ctx.fillText(stakeStr, cardX + 40, bandY + 460);
  ctx.fillStyle = "#8a8a8a";
  ctx.font = "24px 'Courier New', monospace";
  ctx.fillText(`from ${d.stake} wagered`, cardX + 40, bandY + 495);

  // Streak
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px 'Courier New', monospace";
  ctx.fillText("DAYS ON WATCH", cardX + 40, bandY + 570);
  ctx.fillStyle = "#f5b942";
  ctx.font = "bold 96px 'Impact', sans-serif";
  ctx.fillText(String(d.streak), cardX + 40, bandY + 670);

  // City-sharper (optional — spool omits for past days it can still reconstruct,
  // but the field can be undefined for rebuilt receipts that predate the metric)
  if (typeof d.sharpness === "number") {
    ctx.fillStyle = "#22d3ee";
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.fillText(`SHARPER THAN ${d.sharpness}% OF THE CITY`, cardX + 40, bandY + 740);
  }

  // City split stamp (only present when today's aggregate cleared n>=5)
  if (d.citySplit) {
    ctx.fillStyle = "#f5b942";
    ctx.font = "bold 24px 'Courier New', monospace";
    ctx.fillText(
      `CITY SPLIT · ${d.citySplit.pct}% CALLED IT RIGHT · ${d.citySplit.total} REPORTED`,
      cardX + 40,
      bandY + 782,
    );
  }

  // Footer
  ctx.fillStyle = "#8a8a8a";
  ctx.font = "20px 'Courier New', monospace";
  ctx.fillText("VERIFY. DON'T GUESS.", cardX + 40, cardY + cardH - 50);
  ctx.fillStyle = "#f5b942";
  ctx.fillText(d.siteUrl, cardX + 40, cardY + cardH - 20);

  // Spoiler-safe seal
  ctx.strokeStyle = "#3a3a3a";
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(cardX + cardW - 260, cardY + 40, 220, 60);
  ctx.setLineDash([]);
  ctx.fillStyle = "#8a8a8a";
  ctx.font = "bold 22px 'Courier New', monospace";
  ctx.fillText("SPOILER-FREE", cardX + cardW - 235, cardY + 78);
}

export function ReceiptCard({ data }: { data: ReceiptData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (canvasRef.current) drawReceipt(canvasRef.current, data);
  }, [data]);

  const text = receiptText(data);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      track("share_copy", { payload: { surface: "receipt" } });
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };

  const download = () => {
    const c = canvasRef.current;
    if (!c) return;
    c.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `milverse-receipt-${data.dateKey}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };

  const share = async () => {
    const c = canvasRef.current;
    if (!c) return;
    if (!navigator.share) {
      copy();
      return;
    }
    try {
      const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/png"));
      const files = blob
        ? [new File([blob], `milverse-${data.dateKey}.png`, { type: "image/png" })]
        : undefined;
      const canShareFiles =
        files &&
        (navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean }).canShare?.({
          files,
        });
      await navigator.share(canShareFiles ? { text, files } : { text });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-sm border border-primary/40 bg-black/60 overflow-hidden">
        <canvas ref={canvasRef} className="block w-full h-auto" role="img" aria-label={text} />
      </div>
      <pre className="whitespace-pre-wrap break-words rounded-sm border border-border bg-card p-3 text-xs text-muted-foreground font-mono">
        {text}
      </pre>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-sm border border-primary/50 bg-primary/10 px-3 py-2 stencil text-[10px] text-primary hover:bg-primary/20"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "COPIED" : "COPY LINE"}
        </button>
        <button
          onClick={download}
          className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 stencil text-[10px] text-muted-foreground hover:text-foreground"
        >
          <Download className="h-3.5 w-3.5" /> DOWNLOAD PNG
        </button>
        <button
          onClick={share}
          className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 stencil text-[10px] text-muted-foreground hover:text-foreground"
        >
          <Share2 className="h-3.5 w-3.5" /> SHARE
        </button>
      </div>
      <div className="text-[10px] text-muted-foreground/70 stencil">
        SPOILER-SAFE · CONTAINS NO CASE TITLE, VERDICT, OR ANSWER
      </div>
    </div>
  );
}
