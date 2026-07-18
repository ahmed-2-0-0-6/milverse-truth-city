// THE DAILY MIRAGE — The Social Page
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { EditionSocial } from "@/lib/paper/types";
import { markSectionDone, readEditionRecord } from "@/lib/paper/profile";
import { logPaperInteraction } from "@/lib/paper.functions";
import { getDeviceId } from "@/lib/pilot";
import { Heart, Eye } from "lucide-react";

export function PaperSocialPage({
  social,
  editionNumber,
  onDone,
}: {
  social: EditionSocial;
  editionNumber: number;
  onDone: () => void;
}) {
  const [call, setCall] = useState<"TRUE" | "FALSE" | "MISLEADING" | null>(
    readEditionRecord(editionNumber).sectionsDone.includes("social") ? social.truth : null,
  );
  const logInt = useServerFn(logPaperInteraction);

  function submit(v: "TRUE" | "FALSE" | "MISLEADING") {
    setCall(v);
    void logInt({
      data: {
        number: editionNumber,
        section: "social",
        correct: v === social.truth,
        deviceId: getDeviceId(),
      },
    }).catch(() => {});
    markSectionDone(editionNumber, "social");
    onDone();
  }

  return (
    <section className="paper-section grid md:grid-cols-[300px_minmax(0,1fr)] gap-6 items-start">
      <div className="mx-auto md:mx-0 w-[280px] rounded-[2.2rem] border-8 border-[oklch(0.18_0.02_60)] p-2 bg-[oklch(0.18_0.02_60)] shadow-xl">
        <div className="rounded-[1.6rem] overflow-hidden bg-white">
          <div className="paper-halftone flex items-center justify-center h-52 text-7xl">
            <span aria-hidden style={{ mixBlendMode: "multiply" }}>
              {social.imageEmoji}
            </span>
          </div>
          <div className="p-3 text-black">
            <div className="text-xs font-bold">{social.handle}</div>
            <p className="text-sm mt-1">{social.caption}</p>
            <div className="mt-2 flex gap-4 text-[11px] text-black/60">
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3 w-3" /> {social.likes.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3 w-3" /> {social.views.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div className="paper-section-kicker">
          PULLED {social.likes.toLocaleString()} LIKES OVERNIGHT
        </div>
        <p className="paper-section-lede">A viral post moved through the city. Call it.</p>
        {!call ? (
          <div className="mt-4 grid grid-cols-3 gap-2 max-w-md">
            {(["TRUE", "FALSE", "MISLEADING"] as const).map((v) => (
              <button key={v} onClick={() => submit(v)} className="paper-btn">
                {v}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <div
              className={`paper-stamp inline-block border-4 px-3 py-1 paper-mono text-xs tracking-[0.3em] ${call === social.truth ? "paper-stamp-pass" : "paper-stamp-fail"}`}
            >
              TRUTH: {social.truth}
            </div>
            <p className="paper-body no-dropcap text-sm mt-3">{social.reveal}</p>
          </div>
        )}
      </div>
    </section>
  );
}
