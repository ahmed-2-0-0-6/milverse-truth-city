// MILVERSE — THE DESK.
// Rendered inside the landing hero for RETURNING citizens only. Replaces
// the marketing tagline block; the world below (map, story, marquee) is
// untouched. Deterministic: same profile + same now → same desk. All
// items are real <Link>s so tab order runs the desk top-down.

import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { deskReport, type DeskItem, type DeskUrgency } from "@/lib/city/returning";
import { loadProfile } from "@/lib/mirror/profile";
import { rankFromXp, computeXp } from "@/lib/ranks";
import { currentShift, type Shift } from "@/lib/city/shift";

function urgencyGlyph(u: DeskUrgency): string {
  if (u === "dying") return "▲";
  if (u === "due") return "●";
  return "·";
}

function urgencyClasses(u: DeskUrgency): { row: string; glyph: string } {
  if (u === "dying") {
    return {
      row: "text-amber-300 hover:text-amber-200",
      // Pulse ONLY the glyph, and only when motion is safe. LITE/reduced-
      // motion users see the static caret — content, not decoration.
      glyph: "text-amber-300 motion-safe:desk-dying",
    };
  }
  if (u === "due") {
    return {
      row: "text-white hover:text-cyan-200",
      glyph: "text-primary",
    };
  }
  return {
    row: "text-white/60 hover:text-white/85",
    glyph: "text-white/45",
  };
}

function rankTitle(): string {
  try {
    const p = loadProfile();
    const xp = computeXp(p, 0, p.publishedCount ?? 0);
    return rankFromXp(xp).current.name;
  } catch {
    return "CITIZEN";
  }
}

function weekdayLabel(now: Date): string {
  try {
    return now
      .toLocaleDateString("en-GB", { weekday: "long" })
      .toUpperCase();
  } catch {
    return "TODAY";
  }
}

export function CitizenDesk({ now = new Date() }: { now?: Date }) {
  const items: DeskItem[] = useMemo(() => deskReport(now), [now]);
  const name = useMemo(() => rankTitle(), []);
  const day = useMemo(() => weekdayLabel(now), [now]);

  return (
    <section
      aria-label="Your desk"
      className="w-full max-w-xl mt-2"
    >
      <div className="stencil text-[10px] text-cyan-300/80 mb-3 text-center">
        // THE DESK · {day}
      </div>
      <div className="text-center mb-4">
        <div
          className="text-2xl sm:text-3xl font-black text-white leading-none tracking-tight"
          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
        >
          BACK ON SHIFT, {name}.
        </div>
      </div>

      <div className="hud-frame p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
        <ul className="divide-y divide-white/10">
          {items.map((it) => {
            const cls = urgencyClasses(it.urgency);
            return (
              <li key={it.id}>
                <Link
                  to={it.to}
                  className={`flex items-center gap-3 py-3 px-1 group ${cls.row} transition-colors`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-4 text-center stencil text-sm ${cls.glyph}`}
                  >
                    {urgencyGlyph(it.urgency)}
                  </span>
                  <span className="flex-1 text-sm sm:text-[15px] leading-snug">
                    {it.line}
                  </span>
                  <span
                    aria-hidden="true"
                    className="stencil text-xs opacity-70 group-hover:translate-x-0.5 transition-transform"
                  >
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-3 text-center">
        <a
          href="#enter"
          className="inline-block stencil text-[10px] text-white/50 hover:text-cyan-200 transition"
        >
          FIRST VISIT? THE FULL TOUR STANDS →
        </a>
      </div>
    </section>
  );
}

export default CitizenDesk;
