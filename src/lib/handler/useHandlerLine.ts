// MILVERSE — useHandlerLine: cached, timeout-guarded Handler voice.
// Always returns fallback FIRST (instant), then upgrades to AI on the same
// day if the server responds within 2.5s. Cached per surface per profile per day.

import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateHandlerLine } from "@/lib/handler.functions";
import { readCache, writeCache, fingerprint, type HandlerSurface } from "./cache";

export interface HandlerSummary {
  lean: string;
  leanBlurb: string;
  strength: string;
  directive: string;
  weakestTactic: string | null;
  weakestWrong: number;
  weakestSeen: number;
  wager: string;
  dailyStreak: number;
  lastPlayCorrect?: boolean | null;
  lastPlayStake?: number;
  leaderboardPercentile?: number | null;
  weeklyTrend?: "steady" | "toward-calibrated" | "away-from-calibrated" | null;
}

export interface HandlerLineInput {
  surface: HandlerSurface;
  fallback: string;
  summary: HandlerSummary;
  /** Extra hash bits (e.g. playerId) to key the cache per profile. */
  cacheKey?: string;
  /** Set false to skip AI entirely (still returns fallback). */
  enabled?: boolean;
}

export interface HandlerLineState {
  text: string;
  source: "fallback" | "ai";
  loading: boolean;
}

const AI_TIMEOUT_MS = 2500;

export function useHandlerLine(input: HandlerLineInput): HandlerLineState {
  const call = useServerFn(generateHandlerLine);
  const [state, setState] = useState<HandlerLineState>({
    text: input.fallback,
    source: "fallback",
    loading: false,
  });
  const lastKey = useRef<string>("");

  useEffect(() => {
    if (input.enabled === false) {
      setState({ text: input.fallback, source: "fallback", loading: false });
      return;
    }
    const hash = fingerprint({ s: input.surface, k: input.cacheKey ?? "", sum: input.summary });
    if (hash === lastKey.current) return;
    lastKey.current = hash;

    // 1) cache hit → done, no AI call.
    const cached = readCache(input.surface, hash);
    if (cached) {
      setState({ text: cached.text, source: cached.source, loading: false });
      return;
    }

    // 2) show fallback INSTANTLY, upgrade if AI beats the timeout.
    setState({ text: input.fallback, source: "fallback", loading: true });
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      // Fallback wins; cache it so we don't retry today.
      writeCache(input.surface, hash, input.fallback, "fallback");
      setState((s) => ({ ...s, loading: false }));
    }, AI_TIMEOUT_MS);

    (async () => {
      try {
        const res = await call({ data: { surface: input.surface, fallback: input.fallback, summary: input.summary } });
        if (done) return;
        done = true;
        clearTimeout(timer);
        writeCache(input.surface, hash, res.text, res.source);
        setState({ text: res.text, source: res.source, loading: false });
      } catch {
        if (done) return;
        done = true;
        clearTimeout(timer);
        writeCache(input.surface, hash, input.fallback, "fallback");
        setState({ text: input.fallback, source: "fallback", loading: false });
      }
    })();

    return () => { clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.surface, input.fallback, input.cacheKey, JSON.stringify(input.summary), input.enabled]);

  return state;
}
