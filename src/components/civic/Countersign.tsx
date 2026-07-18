// Civic primitive — the Countersign ceremony. Local, ceremonial signature
import "@/styles/paper-fonts.css";
// tied to the player's current rank title (not a name). Signed state is
// persisted to localStorage; the signature RECOMPUTES from current rank
// on every render — the document lives with the player.

import { useEffect, useMemo, useState } from "react";
import { loadProfile } from "@/lib/mirror/profile";
import { loadUnlocked } from "@/lib/manual/state";
import { computeXp, rankFromXp } from "@/lib/ranks";

const KEY = "milverse.charter.signed";

function currentRankTitle(): string {
  try {
    const profile = loadProfile();
    const manualUnlocks = loadUnlocked().size;
    const publishedCount = profile?.publishedCount ?? 0;
    const xp = computeXp(profile, manualUnlocks, publishedCount);
    return rankFromXp(xp).current.name;
  } catch {
    return "CITIZEN";
  }
}

function readSigned(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return iso;
  }
}

export function Countersign() {
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const [justSigned, setJustSigned] = useState(false);
  const [rankTitle, setRankTitle] = useState<string>("CITIZEN");

  useEffect(() => {
    setSignedAt(readSigned());
    setRankTitle(currentRankTitle());
    const on = () => setRankTitle(currentRankTitle());
    window.addEventListener("milverse:profile", on);
    window.addEventListener("milverse:manual", on);
    return () => {
      window.removeEventListener("milverse:profile", on);
      window.removeEventListener("milverse:manual", on);
    };
  }, []);

  const signature = useMemo(() => `${rankTitle} · CITIZEN`, [rankTitle]);

  function sign() {
    const iso = new Date().toISOString();
    try {
      localStorage.setItem(KEY, iso);
    } catch {
      /* localStorage unavailable */
    }
    setSignedAt(iso);
    setJustSigned(true);
  }

  return (
    <div className="mt-10 border-t border-primary/30 pt-6">
      <div className="stencil text-[10px] tracking-widest text-muted-foreground text-center">
        COUNTERSIGNED BY
      </div>

      {signedAt ? (
        <div className={`mt-4 text-center ${justSigned ? "ink-in" : ""}`}>
          <div
            className="text-3xl sm:text-4xl italic tracking-tight text-foreground"
            style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
          >
            {signature}
          </div>
          <div className="mt-3 font-mono text-[10px] tracking-widest text-muted-foreground">
            SIGNED {formatDate(signedAt).toUpperCase()} · THIS DEVICE
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-4">
          <div
            aria-hidden="true"
            className="h-px w-64 max-w-full bg-foreground/30"
          />
          <button
            type="button"
            onClick={sign}
            aria-label="Sign the charter"
            className="rounded-sm border border-primary/50 bg-background/40 px-6 py-2 stencil text-[10px] tracking-widest text-primary hover:bg-primary/10 transition-colors"
          >
            SIGN THE CHARTER
          </button>
        </div>
      )}
    </div>
  );
}
