import { Link } from "@tanstack/react-router";
import { ShieldCheck, Lock } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { useJuniorMode } from "@/hooks/useJuniorMode";

/**
 * Junior-register route gate.
 * Usage: at the top of an adult-district route component:
 *   const gate = useJuniorGate("The Mirror");
 *   if (gate) return gate;
 *
 * When First Phone mode is active, adult districts (Mirror / Feed / Boss)
 * are soft-locked behind this screen so junior users stay in-curriculum.
 */
export function useJuniorGate(districtName: string) {
  const state = useJuniorMode();
  if (!state.active) return null;
  return <JuniorLockScreen districtName={districtName} />;
}

function JuniorLockScreen({ districtName }: { districtName: string }) {
  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 py-16">
        <Link
          to="/"
          className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← CITY
        </Link>

        <div className="mt-8 rounded-2xl border-2 border-primary/40 bg-card p-8">
          <div className="flex items-center gap-2 text-primary">
            <Lock className="h-4 w-4" />
            <span className="font-mono text-[10px] tracking-widest">
              ADULT DISTRICT · LOCKED WHILE FIRST PHONE IS ACTIVE
            </span>
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl font-semibold">
            {districtName} is for older operators.
          </h1>
          <p className="mt-3 text-muted-foreground">
            You're enrolled in the First Phone Program. Adult cases can carry
            heavier stakes and situations — you'll unlock them when you graduate.
          </p>

          <div className="mt-6 rounded-md border border-primary/30 bg-primary/5 p-4 text-sm">
            Stay on the path. Ten lessons, one license — and then the whole
            city opens up.
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/first-phone"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <ShieldCheck className="h-4 w-4" /> Back to the path
            </Link>
            <Link
              to="/family"
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm"
            >
              Family code
            </Link>
          </div>

          <p className="mt-6 text-xs text-muted-foreground italic">
            Parent or guardian? Exit First Phone mode from the profile screen.
          </p>
        </div>
      </main>
    </div>
  );
}
