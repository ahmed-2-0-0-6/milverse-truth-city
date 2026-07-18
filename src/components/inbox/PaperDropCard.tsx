// MILVERSE — The Morning Edition delivery card.
// A folded-newspaper card that thuds into the hub once a day.
// Read-only consumer of the edition already fetched by /paper.

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { PAPER_NAME } from "@/lib/paper/masthead";
import { markPaperRead } from "@/lib/inbox/profile";
import { shouldReduceMotion } from "@/lib/access";

interface Props {
  editionId: string;
  editionNumber: number;
  editionDate: string; // YYYY-MM-DD
  headline: string;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 12_000;

function formatDate(iso: string): string {
  try {
    const d = new Date(iso + "T00:00:00");
    return d
      .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
      .toUpperCase();
  } catch {
    return iso.toUpperCase();
  }
}

export function PaperDropCard({
  editionId,
  editionNumber,
  editionDate,
  headline,
  onDismiss,
}: Props) {
  const nav = useNavigate();
  const [live, setLive] = useState<string>("");
  const reduce = shouldReduceMotion();

  useEffect(() => {
    setLive("The morning edition arrived.");
    if (reduce) return; // no auto-dismiss under reduced motion
    const t = window.setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [reduce, onDismiss]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  const open = () => {
    markPaperRead(editionId);
    onDismiss();
    nav({ to: "/paper" });
  };

  const dateLine = formatDate(editionDate);

  return (
    <>
      <span aria-live="polite" className="sr-only">
        {live}
      </span>
      <div
        className={`fixed z-40 left-1/2 -translate-x-1/2 bottom-4 sm:left-auto sm:right-6 sm:translate-x-0 sm:bottom-6 w-[min(360px,92vw)] ${reduce ? "" : "paper-thud"}`}
        style={{ transform: reduce ? undefined : undefined }}
      >
        <div className="relative">
          <button
            type="button"
            onClick={open}
            aria-label={`Morning edition. ${headline}. Open the paper.`}
            className="block w-full text-left rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            style={{
              background: "#f4efe4",
              color: "#1a1712",
              boxShadow:
                "0 22px 40px -12px rgba(0,0,0,0.55), 0 2px 0 rgba(0,0,0,0.08) inset",
              transform: reduce ? "rotate(0deg)" : "rotate(-2deg)",
              padding: "16px 18px 14px",
              border: "1px solid rgba(26,23,18,0.25)",
            }}
          >
            <div
              className="text-center leading-none"
              style={{
                fontFamily: "'UnifrakturCook', 'Playfair Display', serif",
                fontWeight: 700,
                fontSize: "22px",
                letterSpacing: "0.01em",
              }}
            >
              {PAPER_NAME}
            </div>
            <div
              className="mt-1 text-center"
              style={{
                fontFamily:
                  "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "9px",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "#5a5147",
              }}
            >
              № {editionNumber} · {dateLine}
            </div>
            <h3
              className="mt-3"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 900,
                fontSize: "20px",
                lineHeight: 1.15,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {headline}
            </h3>
            <div
              className="mt-3"
              style={{ borderTop: "1px solid rgba(26,23,18,0.55)" }}
            />
            <p
              className="mt-2"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "13px",
                fontStyle: "italic",
                color: "#3a332b",
              }}
            >
              Chai's on. Paper's here.
            </p>
            <div
              className="mt-3 text-right"
              style={{
                fontFamily:
                  "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "10px",
                letterSpacing: "0.2em",
                color: "#1a1712",
              }}
            >
              UNFOLD →
            </div>
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss morning edition to the inbox"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            style={{
              background: "#1a1712",
              color: "#f4efe4",
              boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
