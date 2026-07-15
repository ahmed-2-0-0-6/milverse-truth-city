// MILVERSE — Renders a Feed forward in its native media format.
// Each format = a distinct in-world artifact. Content still comes from the scenario dossier.

import { Forward, Heart, MessageCircle, Bookmark, Play } from "lucide-react";
import type { FeedForward, FeedFormat } from "@/lib/feed/scenarios";

interface Props {
  format: FeedFormat;
  senderName: string;
  forward: FeedForward;
  aiGenerated?: boolean;
}

export function FormatFrame({ format, senderName, forward: f, aiGenerated }: Props) {
  const chip = <FormatChip format={format} aiGenerated={aiGenerated} />;

  if (format === "instagram") {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-pink-500 via-orange-400 to-yellow-300" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">{f.headline?.split(" — ")[0] ?? senderName}</div>
            <div className="text-[10px] text-muted-foreground truncate">Sponsored · {f.meta}</div>
          </div>
          {chip}
        </div>
        <div className="aspect-square bg-muted/40 flex items-center justify-center text-7xl">{f.imageEmoji ?? "🖼️"}</div>
        <div className="px-3 py-2 space-y-1.5">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Heart className="h-5 w-5" />
            <MessageCircle className="h-5 w-5" />
            <Bookmark className="h-5 w-5 ml-auto" />
          </div>
          <div className="text-xs"><b>12,438 likes</b></div>
          <div className="text-xs leading-relaxed">
            <b>{senderName.toLowerCase().replace(/\s+/g, "_")}</b> {f.headline}
          </div>
          {f.bodyLines.map((l, i) => (
            <div key={i} className="text-xs text-muted-foreground">{l}</div>
          ))}
          <div className="text-[10px] text-muted-foreground pt-1">
            View all 847 comments · 2h
          </div>
        </div>
      </div>
    );
  }

  if (format === "news") {
    return (
      <div className="rounded-lg border-2 border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b-2 border-red-600/60 bg-red-950/30 px-3 py-1.5">
          <div className="flex items-center gap-2">
            <div className="stencil text-[10px] tracking-widest text-red-400">◉ BREAKING</div>
            <div className="text-[10px] text-muted-foreground font-mono">{f.meta ?? "screenshot"}</div>
          </div>
          {chip}
        </div>
        <div className="p-4">
          <div className="stencil text-[9px] tracking-widest text-muted-foreground mb-1">NATIONAL DESK · TODAY 09:14</div>
          <div className="text-lg font-black leading-tight" style={{ fontFamily: '"Bebas Neue", serif' }}>
            {f.headline}
          </div>
          {f.imageEmoji && (
            <div className="mt-3 aspect-[16/9] bg-muted/40 flex items-center justify-center text-6xl border border-border">{f.imageEmoji}</div>
          )}
          <div className="mt-3 space-y-1.5 text-xs text-muted-foreground leading-relaxed">
            {f.bodyLines.map((l, i) => <p key={i}>{l}</p>)}
          </div>
          <div className="mt-3 text-[10px] font-mono text-muted-foreground border-t border-border pt-2">
            Source: (shown on screenshot) · Zoom → is the logo real?
          </div>
        </div>
      </div>
    );
  }

  if (format === "image") {
    return (
      <div className="rounded-lg border border-border bg-black overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 bg-caution/10 border-b border-caution/30">
          <div className="stencil text-[10px] tracking-widest text-caution">📷 VIRAL IMAGE + CAPTION</div>
          {chip}
        </div>
        <div className="aspect-video bg-muted/20 flex items-center justify-center text-8xl">{f.imageEmoji ?? "🖼️"}</div>
        <div className="p-3">
          {f.headline && <div className="text-sm font-semibold text-white">{f.headline}</div>}
          <div className="mt-1 space-y-1 text-xs text-white/70">
            {f.bodyLines.map((l, i) => <p key={i}>{l}</p>)}
          </div>
          <div className="mt-2 text-[10px] font-mono text-white/40">{f.meta ?? "forwarded image"}</div>
        </div>
      </div>
    );
  }

  if (format === "video") {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 bg-primary/5 border-b border-border">
          <div className="stencil text-[10px] tracking-widest text-primary">▶ SHORT VIDEO CLIP</div>
          {chip}
        </div>
        <div className="relative aspect-video bg-black flex items-center justify-center">
          <div className="text-7xl opacity-60">{f.imageEmoji ?? "🎬"}</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-white/90 p-4 shadow-2xl">
              <Play className="h-6 w-6 text-black fill-black" />
            </div>
          </div>
          <div className="absolute bottom-2 right-2 stencil text-[10px] text-white/70 bg-black/50 px-2 py-0.5 rounded">
            0:42
          </div>
        </div>
        <div className="p-3">
          {f.headline && <div className="text-sm font-semibold">{f.headline}</div>}
          <div className="mt-1 space-y-1 text-xs text-muted-foreground">
            {f.bodyLines.map((l, i) => <p key={i}>{l}</p>)}
          </div>
        </div>
      </div>
    );
  }

  // whatsapp (default) — keeps existing look
  return (
    <div className="rounded-lg border border-caution/40 bg-caution/5 overflow-hidden">
      <div className="px-3 py-1.5 font-mono text-[10px] tracking-widest text-caution border-b border-caution/30 flex items-center justify-between">
        <span className="flex items-center gap-1.5"><Forward className="h-3 w-3" /> {f.meta ?? "Forwarded"}</span>
        {chip}
      </div>
      {f.imageEmoji && (
        <div className="flex items-center justify-center bg-muted/40 py-8 text-6xl" aria-label={f.imageAlt}>{f.imageEmoji}</div>
      )}
      <div className="p-3">
        {f.headline && <div className="text-sm font-semibold">{f.headline}</div>}
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          {f.bodyLines.map((l, i) => <p key={i}>{l}</p>)}
        </div>
      </div>
    </div>
  );
}

function FormatChip({ format, aiGenerated }: { format: FeedFormat; aiGenerated?: boolean }) {
  const label: Record<FeedFormat, string> = {
    whatsapp: "WHATSAPP",
    instagram: "INSTAGRAM",
    news: "NEWS SCREENSHOT",
    image: "VIRAL IMAGE",
    video: "VIDEO CLIP",
  };
  return (
    <span className="stencil text-[9px] tracking-widest border border-border rounded-sm px-1.5 py-0.5 text-muted-foreground">
      {label[format]}{aiGenerated && <span className="ml-1 text-primary">· AI</span>}
    </span>
  );
}

export function FormatBadge({ format, aiGenerated }: { format: FeedFormat; aiGenerated?: boolean }) {
  return <FormatChip format={format} aiGenerated={aiGenerated} />;
}
