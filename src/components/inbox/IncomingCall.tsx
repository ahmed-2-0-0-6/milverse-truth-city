// MILVERSE — Citizen Inbox / The Missed Call.
// Full-screen incoming call overlay. Silent, visual-only ring.
// Answering hangs up after ~1s. Timeout/decline both land a voicemail.

import { useEffect, useRef, useState } from "react";
import { PhoneOff, Phone } from "lucide-react";
import { toast } from "sonner";
import type { InboxItem } from "@/lib/inbox/scheduler";
import { markArrived, markCallFired } from "@/lib/inbox/profile";
import { ringPulse, stopRing } from "@/lib/mirror/audio";
import { VoicemailSheet } from "./VoicemailSheet";

const RING_MS = 8000;
const CONNECT_MS = 1000;

type Phase = "ringing" | "connecting" | "ended";

export function IncomingCall() {
  const [call, setCall] = useState<InboxItem | null>(null);
  const [phase, setPhase] = useState<Phase>("ringing");
  const [voicemailFor, setVoicemailFor] = useState<InboxItem | null>(null);
  const declineRef = useRef<HTMLButtonElement | null>(null);
  const ringTimer = useRef<number | null>(null);
  const connectTimer = useRef<number | null>(null);

  useEffect(() => {
    const onCall = (e: Event) => {
      const detail = (e as CustomEvent<InboxItem>).detail;
      if (!detail || detail.type !== "call") return;
      setCall((cur) => cur ?? detail);
      setPhase("ringing");
    };
    window.addEventListener("milverse:inbox:call", onCall);
    return () => window.removeEventListener("milverse:inbox:call", onCall);
  }, []);

  // Autofocus decline for keyboard users; auto-timeout the ring.
  useEffect(() => {
    if (!call || phase !== "ringing") return;
    const raf = requestAnimationFrame(() => declineRef.current?.focus());
    ringTimer.current = window.setTimeout(() => landVoicemail("timeout"), RING_MS);
    return () => {
      cancelAnimationFrame(raf);
      if (ringTimer.current) window.clearTimeout(ringTimer.current);
      ringTimer.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call, phase]);

  // Escape declines during ringing.
  useEffect(() => {
    if (!call) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase === "ringing") landVoicemail("decline");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call, phase]);

  function landVoicemail(_reason: "decline" | "timeout" | "answer") {
    if (!call) return;
    if (ringTimer.current) {
      window.clearTimeout(ringTimer.current);
      ringTimer.current = null;
    }
    markCallFired(call.caseId);
    markArrived(call.id);
    toast("Missed call. They left a voice note.");
    setVoicemailFor(call);
    setCall(null);
    setPhase("ringing");
  }

  function answer() {
    if (!call || phase !== "ringing") return;
    if (ringTimer.current) {
      window.clearTimeout(ringTimer.current);
      ringTimer.current = null;
    }
    setPhase("connecting");
    connectTimer.current = window.setTimeout(() => {
      setPhase("ended");
      // Brief hang-up beat, then drop the voicemail.
      connectTimer.current = window.setTimeout(() => landVoicemail("answer"), 1600);
    }, CONNECT_MS);
  }

  useEffect(() => {
    return () => {
      if (ringTimer.current) window.clearTimeout(ringTimer.current);
      if (connectTimer.current) window.clearTimeout(connectTimer.current);
    };
  }, []);

  return (
    <>
      {call && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="incoming-call-name"
          aria-describedby="incoming-call-number"
          className="fixed inset-0 z-[320] flex flex-col items-center justify-between bg-black/95 text-white px-6 py-10"
        >
          {/* SR-only polite announcement */}
          <span className="sr-only" aria-live="polite">
            Incoming call from {call.senderName}, number not in contacts.
          </span>

          <div className="w-full text-center">
            <div className="stencil text-[10px] text-white/50 tracking-widest">
              INCOMING CALL
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="relative flex h-32 w-32 items-center justify-center">
              {phase === "ringing" && (
                <>
                  <span className="call-pulse absolute inset-0 rounded-full border border-white/40" />
                  <span
                    className="call-pulse absolute inset-0 rounded-full border border-white/30"
                    style={{ animationDelay: "0.8s" }}
                  />
                </>
              )}
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white/10 border border-white/20 backdrop-blur">
                <span className="text-3xl font-bold tracking-wide">
                  {initials(call.senderName)}
                </span>
              </div>
            </div>

            <div className="text-center">
              <div id="incoming-call-name" className="text-2xl font-semibold">
                {call.senderName}
              </div>
              <div
                id="incoming-call-number"
                className="mt-1 font-mono text-sm text-white/70"
              >
                {call.number}
              </div>
              <div className="mt-3 max-w-xs text-[11px] leading-relaxed text-amber-300/90">
                Not in your contacts. The name is what they claim.
              </div>
            </div>

            {phase === "connecting" && (
              <div className="mt-2 stencil text-xs text-white/70">Connected · 0:01</div>
            )}
            {phase === "ended" && (
              <div className="mt-2 max-w-xs text-center text-sm leading-relaxed text-white/80">
                <div className="stencil text-xs text-white/60 mb-2">CALL ENDED.</div>
                They hung up the moment you picked up. A live line can be tested. A
                voice note can&apos;t.
              </div>
            )}
          </div>

          <div className="flex w-full max-w-xs items-center justify-between px-4">
            <button
              ref={declineRef}
              onClick={() => landVoicemail("decline")}
              disabled={phase !== "ringing"}
              aria-label="Decline call"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-500 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-400/60"
            >
              <PhoneOff className="h-6 w-6" />
            </button>
            <button
              onClick={answer}
              disabled={phase !== "ringing"}
              aria-label="Answer call"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-500 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/60"
            >
              <Phone className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {voicemailFor && (
        <VoicemailSheet
          item={voicemailFor}
          open={!!voicemailFor}
          onOpenChange={(o) => !o && setVoicemailFor(null)}
        />
      )}
    </>
  );
}

function initials(name: string): string {
  const parts = (name || "?").trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}
