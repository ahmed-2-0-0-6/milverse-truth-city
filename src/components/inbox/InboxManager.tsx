// MILVERSE — Citizen Inbox scheduler mount. Renders NOTHING visible except
// the Morning Edition delivery card. Safe to mount on multiple hub pages —
// dedup via the per-day arrived[] log in localStorage.

import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  todaysArrivals,
  callAlreadyFiredToday,
  morningEdition,
  PAPER_ARRIVE_SEC,
  type InboxItem,
} from "@/lib/inbox/scheduler";
import { loadInbox, markArrived } from "@/lib/inbox/profile";
import { useVisualMode } from "@/lib/visual-quality";
import { useJuniorMode } from "@/hooks/useJuniorMode";
import { shouldReduceMotion } from "@/lib/access";
import { getLatestEdition } from "@/lib/paper.functions";
import type { Edition } from "@/lib/paper/types";
import { PaperDropCard } from "./PaperDropCard";

export function InboxManager() {
  const { mode } = useVisualMode();
  const junior = useJuniorMode();
  const fetchEdition = useServerFn(getLatestEdition);
  const [paperCard, setPaperCard] = useState<InboxItem | null>(null);

  const dismissPaper = useCallback(() => setPaperCard(null), []);

  useEffect(() => {
    if (!junior.ready) return;
    if (junior.active) return; // never fire for juniors
    const items = todaysArrivals();
    const already = new Set(loadInbox().arrived);
    const reduce = shouldReduceMotion();
    const lite = mode !== "cinematic";

    const messages = items.filter((it) => it.type === "message");
    const call = items.find((it) => it.type === "call") ?? null;

    const handles: number[] = [];

    if (lite) {
      // LITE: pre-fill tray with messages, no toasts.
      for (const it of messages) if (!already.has(it.id)) markArrived(it.id);
      // LITE + reduced motion: voicemail lands directly (no ring takeover).
      if (call && !callAlreadyFiredToday() && !already.has(call.id)) {
        markArrived(call.id);
      }
    } else {
      for (const it of messages) {
        if (already.has(it.id)) continue;
        const h = window.setTimeout(() => {
          markArrived(it.id);
          window.dispatchEvent(new CustomEvent("milverse:inbox:arrive", { detail: it }));
        }, it.arriveAfterSec * 1000);
        handles.push(h);
      }

      // The Missed Call
      if (call && !callAlreadyFiredToday()) {
        if (reduce) {
          const h = window.setTimeout(() => {
            markArrived(call.id);
            window.dispatchEvent(
              new CustomEvent("milverse:inbox:arrive", { detail: call }),
            );
          }, call.arriveAfterSec * 1000);
          handles.push(h);
        } else {
          const h = window.setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent<InboxItem>("milverse:inbox:call", { detail: call }),
            );
          }, call.arriveAfterSec * 1000);
          handles.push(h);
        }
      }
    }

    // The Morning Edition — read-only edition fetch via /paper's server fn.
    let alive = true;
    fetchEdition()
      .then((row) => {
        if (!alive) return;
        const edition = row as unknown as Edition | null;
        const paper = morningEdition(new Date(), edition);
        if (!paper) return;
        const alreadyArrived = new Set(loadInbox().arrived).has(paper.id);
        if (lite) {
          // LITE: land it in the tray immediately, no floating card.
          if (!alreadyArrived) markArrived(paper.id);
          return;
        }
        const h = window.setTimeout(() => {
          if (!alreadyArrived) markArrived(paper.id);
          setPaperCard(paper);
        }, PAPER_ARRIVE_SEC * 1000);
        handles.push(h);
      })
      .catch(() => {
        /* No edition available: the feature silently does nothing today. */
      });

    return () => {
      alive = false;
      for (const h of handles) window.clearTimeout(h);
    };
  }, [mode, junior.ready, junior.active, fetchEdition]);

  if (!paperCard || !paperCard.editionId) return null;
  return (
    <PaperDropCard
      editionId={paperCard.editionId}
      editionNumber={paperCard.editionNumber ?? 0}
      editionDate={paperCard.editionDate ?? ""}
      headline={paperCard.headline ?? paperCard.senderName}
      onDismiss={dismissPaper}
    />
  );
}
