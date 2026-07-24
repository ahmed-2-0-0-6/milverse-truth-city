// MILVERSE — Your City · Title Promotion Toast (Phase 3 upgrade).
// Detects seat-step increases between renders and fires a milverse:title:promoted
// event. Also renders a stencil toast on-screen for 3.6s.

import { useEffect, useState } from "react";
import { readStore, writeStore } from "@/lib/storage";
import { loadCity } from "@/lib/city/citySave";
import { titleFor } from "@/lib/city/title";

const KEY = "milverse.city.title.step.v1";

function readLastStep(): number {
  const raw = readStore<{ v: 1; step: number }>(KEY, (v): v is { v: 1; step: number } =>
    !!v && typeof v === "object" && (v as { v?: number }).v === 1 && typeof (v as { step?: unknown }).step === "number",
  );
  if (raw && raw !== "corrupt") return raw.step;
  return -1;
}

export function TitlePromotionToast() {
  const [visible, setVisible] = useState<{ rank: string; seat: string } | null>(null);

  useEffect(() => {
    const check = () => {
      const save = loadCity();
      const t = titleFor(save);
      const last = readLastStep();
      if (last === -1) {
        writeStore(KEY, { v: 1, step: t.step });
        return;
      }
      if (t.step > last) {
        writeStore(KEY, { v: 1, step: t.step });
        setVisible({ rank: t.rank, seat: t.seat });
        window.dispatchEvent(
          new CustomEvent("milverse:title:promoted", { detail: { rank: t.rank, seat: t.seat } }),
        );
        window.setTimeout(() => setVisible(null), 3600);
      }
    };
    check();
    window.addEventListener("milverse:city", check);
    window.addEventListener("milverse:city:built", check);
    window.addEventListener("milverse:bricks", check);
    return () => {
      window.removeEventListener("milverse:city", check);
      window.removeEventListener("milverse:city:built", check);
      window.removeEventListener("milverse:bricks", check);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed z-[70] left-1/2 top-24 -translate-x-1/2 pointer-events-none"
    >
      <div className="rounded-sm border-2 border-yellow-300/70 bg-black/70 backdrop-blur px-5 py-3 shadow-[0_0_40px_rgba(253,224,71,0.35)] animate-[promoIn_.4s_ease-out]">
        <div className="stencil text-[10px] tracking-widest text-yellow-200/80 text-center">
          CITY HALL · SEAT PROMOTION
        </div>
        <div className="mt-1 text-center font-mono text-[13px] text-yellow-100">
          Sworn in as <span className="text-yellow-300">{visible.rank}</span>
        </div>
        <div className="text-center text-[11px] text-yellow-100/60 font-mono">{visible.seat}</div>
      </div>
      <style>{`
        @keyframes promoIn {
          from { transform: translate(-50%, -12px); opacity: 0; }
          to   { transform: translate(-50%, 0);      opacity: 1; }
        }
      `}</style>
    </div>
  );
}
