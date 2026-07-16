// MILVERSE — Verification Toolbelt (dossier-driven).
//
// The four real-world verification instruments, always visible. Each result
// string is sourced EXCLUSIVELY from the case's dossier (scenario.toolbelt or
// scenario.actions[].result). The Toolbelt never manufactures a verdict — it
// only surfaces evidence. The player judges.
//
// Tool-choice grading trains real MIL skill:
//   • FIT tool + dossier evidence exists  → STRONG probe
//   • FIT tool but dossier has no answer  → NEUTRAL (case genuinely lacks that trail)
//   • WRONG-format tool                   → WASTED turn, teaching line shown
//
// First use of any tool shows a one-line tooltip linking to its Field Manual
// "Take It Outside" how-to.

import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Image as ImageIcon, Globe2, Layers, CalendarClock, ExternalLink } from "lucide-react";
import type { FeedAction, FeedFormat, FeedToolKind, FeedScenario } from "@/lib/feed/scenarios";
import { track } from "@/lib/telemetry";

interface ToolMeta {
  kind: FeedToolKind;
  label: string;
  Icon: typeof ImageIcon;
  hint: string;
  /** Formats where this tool can meaningfully be applied. */
  bestFor: FeedFormat[];
  /** Teaching line when the player picks the wrong tool for this format. */
  wastedLine: (fmt: FeedFormat) => string;
  /** Visual instrument animation class (see styles.css). */
  animClass: string;
}

const TOOLS: ToolMeta[] = [
  {
    kind: "reverse_image",
    label: "REVERSE IMAGE SEARCH",
    Icon: ImageIcon,
    hint: "Best when the claim rides on a photo, screenshot, or video frame.",
    bestFor: ["image", "instagram", "video"],
    wastedLine: (fmt) =>
      fmt === "whatsapp"
        ? "No image here, detective. This is a text forward — reverse-image gives you nothing. Choose your instrument for the evidence in front of you."
        : "This artifact has no image to search. Wasted turn — but you'll remember it next time.",
    animClass: "tool-lens",
  },
  {
    kind: "check_source",
    label: "CHECK THE SOURCE",
    Icon: Globe2,
    hint: "Best when the claim wears a newsroom, brand, government body, or account handle.",
    bestFor: ["news", "instagram", "whatsapp"],
    wastedLine: () =>
      "No claimed outlet or account to check on this artifact. Wasted turn — reserve source-checks for a masthead or a handle.",
    animClass: "tool-dossier",
  },
  {
    kind: "cross_check",
    label: "CROSS-CHECK OUTLETS",
    Icon: Layers,
    hint: "Best when you need a second independent witness of any factual claim.",
    bestFor: ["news", "whatsapp", "video", "image"],
    wastedLine: () =>
      "Cross-checking needs a concrete claim to cross-check against. Nothing to trace here — wasted turn.",
    animClass: "tool-stack",
  },
  {
    kind: "check_date",
    label: "CHECK DATE / METADATA",
    Icon: CalendarClock,
    hint: "Best when the claim depends on 'yesterday', 'today', 'now', or 'breaking'.",
    bestFor: ["whatsapp", "image", "news"],
    wastedLine: () =>
      "No time-sensitive claim in this artifact. A date check reveals nothing new — wasted turn.",
    animClass: "tool-clock",
  },
];

export type ToolQuality = "strong" | "neutral" | "wasted";

interface Props {
  scenario: FeedScenario;
  /** IDs of scenario.actions that have already been consumed. Preserved to keep
   *  existing Feed engine + scoring untouched. */
  used: string[];
  onUse: (actionId: string) => void;
  /** Fired for tool-choice cues (does NOT change existing action scoring). */
  onGrade?: (kind: FeedToolKind, quality: ToolQuality) => void;
}

const FIRST_USE_KEY = "milverse.toolbelt.firstuse.v1";
function loadFirstUse(): Set<FeedToolKind> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(FIRST_USE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}
function markFirstUse(kind: FeedToolKind) {
  if (typeof window === "undefined") return;
  const s = loadFirstUse();
  s.add(kind);
  try { localStorage.setItem(FIRST_USE_KEY, JSON.stringify([...s])); } catch { /* noop */ }
}

interface Slot {
  evidence: string | null;
  action: FeedAction | null; // authored action if any (for scoring parity)
}

/** Resolve the dossier evidence for a tool on this scenario. */
function resolveSlot(scenario: FeedScenario, kind: FeedToolKind): Slot {
  const authored = scenario.actions.find((a) => (a.tool ?? "check_source") === kind);
  const dossier = scenario.toolbelt?.[kind] ?? null;
  const evidence = dossier ?? authored?.result ?? null;
  return { evidence, action: authored ?? null };
}

export function Toolbelt({ scenario, used, onUse, onGrade }: Props) {
  const format = scenario.format ?? "whatsapp";
  const [firstUse, setFirstUse] = useState<Set<FeedToolKind>>(() => new Set());
  useEffect(() => { setFirstUse(loadFirstUse()); }, []);
  const [active, setActive] = useState<FeedToolKind | null>(null);
  const [reveals, setReveals] = useState<Record<FeedToolKind, string | null>>({
    reverse_image: null, check_source: null, cross_check: null, check_date: null,
  });
  const [wastedFlash, setWastedFlash] = useState<FeedToolKind | null>(null);
  const [counts, setCounts] = useState({ strong: 0, wasted: 0 });

  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => setActive(null), 900);
    return () => window.clearTimeout(t);
  }, [active]);

  const slots = useMemo(() => {
    const m: Record<FeedToolKind, Slot> = {} as Record<FeedToolKind, Slot>;
    for (const t of TOOLS) m[t.kind] = resolveSlot(scenario, t.kind);
    return m;
  }, [scenario]);

  function tooltipFor(kind: FeedToolKind): string {
    const t = TOOLS.find((x) => x.kind === kind)!;
    return t.hint;
  }

  function useTool(tool: ToolMeta) {
    const slot = slots[tool.kind];
    const isFit = tool.bestFor.includes(format);
    const alreadyRevealed = reveals[tool.kind] !== null;
    if (alreadyRevealed) return;

    // Instrument animation
    setActive(tool.kind);

    // Mark first-use tooltip
    if (!firstUse.has(tool.kind)) {
      markFirstUse(tool.kind);
      setFirstUse(new Set(firstUse).add(tool.kind));
    }

    let text: string;
    let quality: ToolQuality;
    if (!isFit) {
      text = tool.wastedLine(format);
      quality = "wasted";
      setWastedFlash(tool.kind);
      window.setTimeout(() => setWastedFlash((k) => (k === tool.kind ? null : k)), 2500);
    } else if (slot.evidence) {
      // Dossier ground truth.
      text = slot.evidence;
      quality = "strong";
      // Preserve existing engine scoring path: consume the authored action if present.
      if (slot.action && !used.includes(slot.action.id)) onUse(slot.action.id);
    } else {
      text = "Nothing surfaces from this angle. The trail is elsewhere — pick another instrument.";
      quality = "neutral";
    }

    setReveals((r) => ({ ...r, [tool.kind]: text }));
    setCounts((c) => ({
      strong: c.strong + (quality === "strong" ? 1 : 0),
      wasted: c.wasted + (quality === "wasted" ? 1 : 0),
    }));
    onGrade?.(tool.kind, quality);
    track("tool_pick", {
      case_id: scenario.id,
      payload: { tool: tool.kind, quality, correct: quality === "strong" },
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
          VERIFICATION TOOLBELT · {format.toUpperCase()} ARTIFACT
        </div>
        <div className="flex items-center gap-1.5">
          {counts.strong > 0 && (
            <span className="rounded-sm border border-primary/40 bg-primary/10 px-1.5 py-0.5 stencil text-[9px] tracking-widest text-primary">
              STRONG · {counts.strong}
            </span>
          )}
          {counts.wasted > 0 && (
            <span className="rounded-sm border border-caution/40 bg-caution/10 px-1.5 py-0.5 stencil text-[9px] tracking-widest text-caution">
              WASTED · {counts.wasted}
            </span>
          )}
        </div>
      </div>

      {TOOLS.map((tool) => {
        const isFit = tool.bestFor.includes(format);
        const revealed = reveals[tool.kind];
        const wasted = wastedFlash === tool.kind;
        const spinning = active === tool.kind;
        const showedFirst = !firstUse.has(tool.kind);
        return (
          <section
            key={tool.kind}
            className={`rounded-md border p-3 transition ${
              isFit ? "border-primary/40 bg-primary/[0.04]" : "border-border bg-card"
            } ${wasted ? "animate-[fade-in_.2s_ease-out] border-caution/60" : ""}`}
          >
            <header className="flex items-center gap-2 mb-1.5">
              <div className={`relative h-6 w-6 grid place-items-center rounded-sm border ${isFit ? "border-primary/50 text-primary" : "border-border text-muted-foreground"}`}>
                <tool.Icon className={`h-3.5 w-3.5 ${spinning ? tool.animClass : ""}`} />
              </div>
              <div className="stencil text-[10px] tracking-widest">{tool.label}</div>
              {isFit && <span className="stencil text-[9px] text-primary">· FIT</span>}
              {!isFit && <span className="stencil text-[9px] text-muted-foreground">· POOR FIT</span>}
            </header>
            <p className="text-[11px] text-muted-foreground mb-2">{tool.hint}</p>

            {showedFirst && (
              <Link
                to="/manual/take-it-outside"
                hash={tool.kind}
                className="mb-2 inline-flex items-center gap-1 rounded-sm border border-dashed border-primary/40 px-2 py-0.5 stencil text-[9px] tracking-widest text-primary hover:bg-primary/10"
              >
                <ExternalLink className="h-2.5 w-2.5" /> HOW TO DO THIS IN REAL LIFE
              </Link>
            )}

            {revealed ? (
              <div className={`rounded-md border-l-2 pl-3 py-2 text-xs ${
                wasted ? "border-caution bg-caution/5 text-caution-foreground/90"
                : isFit ? "border-primary bg-primary/5"
                : "border-muted bg-muted/20 text-muted-foreground"
              }`}>
                <div className="stencil text-[9px] tracking-widest mb-1 opacity-80">
                  {wasted ? "WASTED TURN · TEACHING LINE" : "EVIDENCE · FROM DOSSIER"}
                </div>
                <div className="italic">"{revealed}"</div>
              </div>
            ) : (
              <button
                onClick={() => useTool(tool)}
                className={`w-full rounded-md border p-2 stencil text-[10px] tracking-widest transition ${
                  isFit
                    ? "border-primary/50 bg-background/60 text-primary hover:bg-primary/10"
                    : "border-border bg-background/40 text-muted-foreground hover:border-caution/60 hover:text-caution"
                }`}
              >
                {tooltipFor(tool.kind).toUpperCase().split(".")[0]} — USE INSTRUMENT →
              </button>
            )}
          </section>
        );
      })}

      <p className="text-[10px] text-muted-foreground italic text-center pt-2">
        Instruments surface evidence. <b>You</b> deliver the verdict.
      </p>
    </div>
  );
}
