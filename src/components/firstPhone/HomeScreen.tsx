import { LESSONS } from "@/lib/firstPhone/lessons";
import { getWallpaper } from "./wallpapers";
import type { FirstPhoneState } from "@/lib/firstPhone/profile";
import { isLessonUnlocked } from "@/lib/firstPhone/profile";
import { Lock, Check, ShieldCheck, Target, Wifi, Signal, BatteryMedium } from "lucide-react";
import { phoneKeyTap } from "@/lib/mirror/audio";

// Domain-specific mini glyphs per lesson tactic — one per lesson.
const APP_ICONS: Record<number, string> = {
  1: "🔑",
  2: "🎁",
  3: "✉️",
  4: "📷",
  5: "🎭",
  6: "🔥",
  7: "🎙️",
  8: "🛑",
  9: "👨‍👩‍👧",
  10: "🎓",
};

const APP_TINT: Record<number, string> = {
  1: "from-sky-500 to-blue-600",
  2: "from-pink-500 to-rose-600",
  3: "from-amber-500 to-orange-600",
  4: "from-emerald-500 to-teal-600",
  5: "from-fuchsia-500 to-purple-600",
  6: "from-red-500 to-rose-700",
  7: "from-violet-500 to-indigo-600",
  8: "from-yellow-500 to-amber-600",
  9: "from-cyan-500 to-sky-600",
  10: "from-primary to-primary/70",
};

interface Props {
  state: FirstPhoneState;
  onOpenLesson: (n: number) => void;
  onOpenLicense: () => void;
  onOpenSpotIt: () => void;
}

/**
 * The First Phone HOME SCREEN — the LessonPath, rendered as apps.
 * Pure DOM/CSS; works everywhere.
 */
export function HomeScreen({ state, onOpenLesson, onOpenLicense, onOpenSpotIt }: Props) {
  const wp = getWallpaper(state.wallpaper);
  const licensed = !!state.licenseIssuedAt;
  const done = state.lessonsCompleted.length;
  const batteryPct = Math.max(10, Math.min(100, 10 + done * 9));
  const spotItReady = done > 0;

  return (
    <div
      data-tour="wallpaper"
      className="relative flex-1 min-h-0 flex flex-col text-white"
      style={{ background: wp.bg }}
    >
      <div className="absolute inset-0 bg-black/25 pointer-events-none" aria-hidden="true" />
      <div className="relative flex-1 overflow-y-auto px-4 py-5">
        <div className="mb-4 flex items-center justify-between text-white drop-shadow">
          <div data-tour="path">
            <div className="font-mono text-[10px] tracking-[0.25em] opacity-80">THE PATH</div>
            <div className="text-lg font-semibold">
              {done} / {LESSONS.length} lessons
            </div>
          </div>
          <div className="flex items-center gap-3">
            {state.kidCityName && (
              <div className="text-right" data-tour="name">
                <div className="font-mono text-[10px] tracking-[0.25em] opacity-80">CITIZEN</div>
                <div className="text-sm font-medium">{state.kidCityName}</div>
              </div>
            )}
            <div
              className="flex flex-col items-center"
              title="The phone charges as you learn."
              aria-label={`Battery ${batteryPct} percent. The phone charges as you learn.`}
            >
              <span className="relative block h-3 w-7 rounded-[3px] border border-white/80">
                <span
                  className="absolute -right-[3px] top-1/2 -translate-y-1/2 h-1.5 w-[2px] rounded-r bg-white/80"
                  aria-hidden="true"
                />
                <span
                  className="absolute inset-y-[1px] left-[1px] rounded-[2px] bg-white/80 transition-[width] duration-500"
                  style={{ width: `calc(${batteryPct}% - 2px)` }}
                  aria-hidden="true"
                />
              </span>
              <span className="mt-0.5 font-mono text-[9px] tracking-widest opacity-80">
                {batteryPct}%
              </span>
            </div>
          </div>
        </div>

        <ul data-tour="adult" className="grid grid-cols-4 gap-3" aria-label="First Phone lessons">
          {LESSONS.map((l) => {
            const complete = state.lessonsCompleted.includes(l.n);
            const unlocked = isLessonUnlocked(state, l.n);
            const isCurrent = unlocked && !complete;
            return (
              <li key={l.n} data-tour={l.n === 1 ? "lesson1" : undefined}>
                <button
                  onClick={() => { if (unlocked) { phoneKeyTap(); onOpenLesson(l.n); } }}
                  disabled={!unlocked}
                  aria-label={`Lesson ${l.n}: ${l.title}${complete ? " (completed)" : unlocked ? "" : " (locked)"}`}
                  className="group w-full flex flex-col items-center gap-1.5 text-white focus-visible:outline-none"
                >
                  <span
                    className={`relative flex h-14 w-14 items-center justify-center rounded-[18px] shadow-lg text-2xl transition-all focus-visible:ring-2 focus-visible:ring-white ${
                      unlocked
                        ? `bg-gradient-to-br ${APP_TINT[l.n]} group-hover:scale-105 group-active:scale-95`
                        : "bg-white/10 backdrop-blur"
                    } ${isCurrent ? "animate-pulse-soft ring-2 ring-white/80" : ""}`}
                  >
                    <span aria-hidden="true">{APP_ICONS[l.n]}</span>
                    {!unlocked && (
                      <Lock className="absolute h-4 w-4 text-white/70" aria-hidden="true" />
                    )}
                    {complete && (
                      <span
                        aria-hidden="true"
                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 border-2 border-white shadow"
                      >
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-center leading-tight opacity-95 line-clamp-2 drop-shadow-sm">
                    L{l.n}
                  </span>
                </button>
              </li>
            );
          })}

          <li className="col-span-4 mt-2 border-t border-white/10 pt-3">
            <button
              onClick={onOpenSpotIt}
              aria-label={
                spotItReady
                  ? "SPOT IT — practice tricks you've already learned"
                  : "SPOT IT — locked. Finish Lesson 1 to open."
              }
              className={`group inline-flex flex-col items-center gap-1.5 text-white focus-visible:outline-none ${
                spotItReady ? "" : "opacity-50"
              }`}
            >
              <span className="relative flex h-14 w-14 items-center justify-center rounded-[18px] shadow-lg bg-gradient-to-br from-teal-400 to-teal-600 group-hover:scale-105 group-active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-white">
                <Target className="h-7 w-7 text-white" strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="text-[10px] text-center leading-tight opacity-95 drop-shadow-sm tracking-wide">
                SPOT IT
              </span>
            </button>
          </li>


          {licensed && (
            <li className="col-span-4 mt-4">
              <button
                onClick={onOpenLicense}
                className="w-full flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur px-4 py-3 text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-all"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-gradient-to-br from-primary to-primary/60 shadow-lg">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </span>
                <span className="text-left">
                  <span className="block font-mono text-[10px] tracking-[0.25em] opacity-80">
                    LICENSE
                  </span>
                  <span className="block text-sm font-semibold">First Phone License</span>
                </span>
              </button>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
