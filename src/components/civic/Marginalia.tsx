// Civic primitive — the Handler's off-duty margin note.
// Desktop (xl+): rendered in the outer gutter, rotated -1deg, italic,
// muted amber, connected by a thin line. Below xl: an indented aside
// under the block. The note is always in the DOM.

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  note: string;
  side?: "left" | "right";
  className?: string;
}

export function Marginalia({ children, note, side = "right", className = "" }: Props) {
  return (
    <div className={`relative ${className}`}>
      {children}

      {/* Desktop gutter note */}
      <aside
        aria-label="Margin note"
        className={`hidden xl:block absolute top-1 max-w-[160px] text-[13px] leading-snug italic text-amber-300/80 ${
          side === "left"
            ? "right-[calc(100%+2rem)] text-right"
            : "left-[calc(100%+2rem)] text-left"
        }`}
        style={{ transform: "rotate(-1deg)", fontFamily: "'Playfair Display', serif" }}
      >
        <span
          aria-hidden="true"
          className={`absolute top-3 h-px w-6 bg-amber-300/40 ${
            side === "left" ? "-right-8" : "-left-8"
          }`}
        />
        {note}
      </aside>

      {/* Mobile / tablet aside */}
      <aside
        aria-label="Margin note"
        className="xl:hidden mt-3 ml-6 border-l border-amber-300/40 pl-3 text-[13px] leading-snug italic text-amber-300/80"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {note}
      </aside>
    </div>
  );
}
