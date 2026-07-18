import { useEffect, useRef, useState } from "react";
import { LESSONS } from "@/lib/firstPhone/lessons";
import { loadFirstPhone, markLessonComplete, type FirstPhoneState } from "@/lib/firstPhone/profile";
import { logPilotEntry } from "@/lib/pilot";
import { LicenseCard } from "./LicenseCard";
import { HomeScreen } from "./HomeScreen";
import { JuniorLesson } from "./JuniorLesson";
import { LessonCleared } from "./LessonCleared";
import { LockScreen } from "./LockScreen";
import { FirstBoot } from "./FirstBoot";
import { ChatShell } from "@/components/chat/ChatShell";
import { ChevronLeft } from "lucide-react";

function freshState(): FirstPhoneState {
  return {
    active: false,
    kidCityName: "",
    familyCode: null,
    lessonsCompleted: [],
    licenseIssuedAt: null,
    licenseNumber: null,
    wallpaper: 0,
    handoverSeen: false,
    tourSeen: false,
  };
}

/**
 * Root of the First Phone experience once the kid is activated + past handover.
 * Renders the phone's home screen (LessonPath as apps) and swaps to a chat
 * lesson or the license "app" as the kid navigates.
 */
export function LessonPath() {
  const [state, setState] = useState<FirstPhoneState>(freshState);
  const [openLesson, setOpenLesson] = useState<number | null>(null);
  const [showLicense, setShowLicense] = useState(false);
  const [graduated, setGraduated] = useState(false);
  const [cleared, setCleared] = useState<number | null>(null);
  const homeHostRef = useRef<HTMLDivElement>(null);
  const [tourHost, setTourHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setState(loadFirstPhone());
    const on = () => setState(loadFirstPhone());
    window.addEventListener("milverse:firstphone", on);
    return () => window.removeEventListener("milverse:firstphone", on);
  }, []);

  function refresh() {
    setState(loadFirstPhone());
  }

  function completeLesson(n: number, caseId: string) {
    const wasIssued = state.licenseIssuedAt !== null;
    const next = markLessonComplete(n);
    logPilotEntry({
      wing: "daily",
      caseId: `junior:L${n}:${caseId}`,
      result: "correct",
      points: 10,
      ts: Date.now(),
    });
    refresh();
    setOpenLesson(null);
    if (n === 10 && !wasIssued && next.licenseIssuedAt) {
      // Show graduation on the device (lock screen with LICENSED CITIZEN),
      // then open the LicenseCard.
      setGraduated(true);
    } else {
      // Small cleared beat before the home screen. Graduation replaces it on L10.
      setCleared(n);
    }
  }

  // License "app"
  if (showLicense) {
    return (
      <div className="mt-4">
        <button
          onClick={() => setShowLicense(false)}
          className="mb-3 inline-flex items-center gap-1 font-mono text-[11px] tracking-widest text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" /> HOME
        </button>
        <LicenseCard onClose={() => setShowLicense(false)} />
      </div>
    );
  }

  // Graduation moment: lock screen with licensed watermark → open license.
  if (graduated) {
    return (
      <div className="mt-4">
        <ChatShell
          variant="junior"
          header={
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 bg-neutral-900/70">
              <div className="font-mono text-[10px] tracking-[0.25em] text-primary">GRADUATION</div>
              <button
                onClick={() => {
                  setGraduated(false);
                  setShowLicense(true);
                }}
                className="rounded-md px-3 py-1 font-mono text-[10px] tracking-[0.25em] text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                OPEN LICENSE →
              </button>
            </div>
          }
        >
          <LockScreen
            wallpaper={state.wallpaper}
            cityName={state.kidCityName}
            licensed
            hint="You passed the last case. The city cleared you."
          />
        </ChatShell>
      </div>
    );
  }

  // Active lesson
  if (openLesson) {
    const lesson = LESSONS.find((l) => l.n === openLesson);
    if (lesson) {
      return (
        <div className="mt-4">
          <JuniorLesson
            lesson={lesson}
            state={state}
            onBackHome={() => setOpenLesson(null)}
            onComplete={(caseId) => completeLesson(lesson.n, caseId)}
          />
        </div>
      );
    }
  }

  // Home screen (phone)
  return (
    <div className="mt-4">
      {cleared !== null && (
        <LessonCleared
          lessonN={cleared}
          totalDone={state.lessonsCompleted.length}
          totalLessons={LESSONS.length}
          onDone={() => setCleared(null)}
        />
      )}
      <ChatShell
        variant="junior"
        header={
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 bg-neutral-900/70">
            <div className="font-mono text-[10px] tracking-[0.25em] text-white/60">HOME</div>
            {state.licenseIssuedAt && (
              <button
                onClick={() => setShowLicense(true)}
                className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[10px] tracking-[0.25em] text-primary hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                LICENSE
              </button>
            )}
          </div>
        }
      >
        <div ref={(el) => { setTourHost(el); (homeHostRef as { current: HTMLDivElement | null }).current = el; }} className="relative flex-1 min-h-0 flex flex-col">
          <HomeScreen
            state={state}
            onOpenLesson={(n) => setOpenLesson(n)}
            onOpenLicense={() => setShowLicense(true)}
          />
          {state.active &&
            state.handoverSeen &&
            !state.tourSeen &&
            state.lessonsCompleted.length === 0 && (
              <FirstBoot
                container={tourHost}
                onOpenLesson={(n) => {
                  refresh();
                  setOpenLesson(n);
                }}
                onClose={() => refresh()}
              />
            )}
        </div>
      </ChatShell>
    </div>
  );
}
