// MILVERSE — THE HANDLER's single AI voice.
// One server function, four surfaces. Deterministic fallback string
// ALWAYS shipped by the client if AI doesn't return quickly.
//
// THE LAW: this AI never judges whether content is true or false.
// It only narrates the deterministic reading of the PLAYER'S PATTERN.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SummarySchema = z.object({
  lean: z.string(), // e.g. "SOFT TARGET"
  leanBlurb: z.string(),
  strength: z.string(),
  directive: z.string(),
  weakestTactic: z.string().nullable(),
  weakestWrong: z.number().int().min(0).max(999),
  weakestSeen: z.number().int().min(0).max(999),
  wager: z.string(), // "OVERCONFIDENT" / "TIMID" / "MEASURED" / "—"
  dailyStreak: z.number().int().min(0).max(9999),
  lastPlayCorrect: z.boolean().nullable().optional(),
  lastPlayStake: z.number().int().min(0).max(9999).optional(),
  leaderboardPercentile: z.number().min(0).max(100).nullable().optional(),
  weeklyTrend: z
    .enum(["steady", "toward-calibrated", "away-from-calibrated"])
    .nullable()
    .optional(),
});

const LegacyProfileSummarySchema = z
  .object({
    casesPlayed: z.number().int().min(0).max(9999).optional(),
    correctVerdicts: z.number().int().min(0).max(9999).optional(),
    missedScams: z.number().int().min(0).max(9999).optional(),
    falseAlarms: z.number().int().min(0).max(9999).optional(),
    dailyStreak: z.number().int().min(0).max(9999).optional(),
    trust: z.number().optional(),
  })
  .optional();

const InputSchema = z
  .object({
    surface: z.enum([
      "reading",
      "assignment-reaction",
      "drop-line",
      "leaderboard-nudge",
      "psych-eval",
    ]),
    fallback: z.string().min(1).max(600),
    // Compact, non-PII profile summary — the ONLY thing about the player
    // sent to the model. No case content, no verdicts about specific artifacts.
    summary: SummarySchema.optional(),
    // Backward-compatible shim for older PaperEditorial clients.
    profileSummary: LegacyProfileSummarySchema,
  })
  .transform((input) => ({
    surface: input.surface,
    fallback: input.fallback,
    summary: input.summary ?? legacyToSummary(input.profileSummary),
  }));

function legacyToSummary(
  profileSummary: z.infer<typeof LegacyProfileSummarySchema>,
): z.infer<typeof SummarySchema> {
  const played = profileSummary?.casesPlayed ?? 0;
  const correct = profileSummary?.correctVerdicts ?? 0;
  const missed = profileSummary?.missedScams ?? 0;
  const falseAlarms = profileSummary?.falseAlarms ?? 0;
  const lean =
    played < 5
      ? "ROOKIE"
      : missed > falseAlarms
        ? "DRIFTING TRUSTING"
        : falseAlarms > missed
          ? "JUMPY"
          : "CALIBRATED";

  return {
    lean,
    leanBlurb:
      played < 5
        ? "File's thin. More reps before a hard read."
        : `${correct}/${Math.max(played, 1)} calls closed clean.`,
    strength:
      correct > 0
        ? `You've closed ${correct} calls clean.`
        : "Instinct's alive. Now we sharpen it.",
    directive:
      missed > falseAlarms
        ? "Slow down before you agree. Probe first."
        : falseAlarms > missed
          ? "Prove REAL as hard as you prove FAKE."
          : "Hold the line. Keep the read calibrated.",
    weakestTactic: null,
    weakestWrong: 0,
    weakestSeen: 0,
    wager: "—",
    dailyStreak: profileSummary?.dailyStreak ?? 0,
  };
}

/**
 * Voice bible + rails. Compiled per-surface so the model stays terse and
 * NEVER strays into truth-judgment territory.
 */
function systemPromptFor(surface: z.infer<typeof InputSchema>["surface"]) {
  const bible = [
    "You are THE HANDLER — a noir veteran officer running an informant in MILVERSE.",
    "Voice: terse. 2-3 short sentences MAX. Caring under the gruff. Never sentimental.",
    "You speak IN CHARACTER, never mention AI, models, prompts, or that this is a game.",
    "You NEVER declare whether any real message or artifact is true or false — that is the player's job. You only narrate their TRAINING PATTERN.",
    "Never use clinical language: no 'anxiety', 'disorder', 'diagnosis', 'trauma'. Use noir register only: target, fortress, calibrated, drift, watch.",
    "Never claim personal details about the player beyond what the summary states.",
    "No emojis, no markdown, no lists — plain sentences only.",
  ].join(" ");

  const surfaceInstr: Record<typeof surface, string> = {
    reading:
      "Deliver THE READING: three short paragraphs — name the lean, name a strength, issue one clear directive. Ground every claim in the summary numbers.",
    "assignment-reaction":
      "React to whether the player just completed an assignment correctly. One tight sentence, plus one forward-looking beat.",
    "drop-line":
      "React to today's Daily Drop result. Reference streak and stake when they matter. One or two sentences.",
    "leaderboard-nudge":
      "Reference the player's percentile on the anonymous city leaderboard. One sentence, in character.",
    "psych-eval":
      "Deliver the weekly PSYCH EVAL beat: lean trend + one goal for the coming week. Two short sentences.",
  };

  return `${bible}\n\nTASK: ${surfaceInstr[surface]}`;
}

export const generateHandlerLine = createServerFn({ method: "POST" })
  .validator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { text: data.fallback, source: "fallback" as const };

    try {
      const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
      const { generateText } = await import("ai");
      const gateway = createLovableAiGatewayProvider(key);
      const model = gateway("google/gemini-3-flash-preview");

      const userMsg = [
        `LEAN: ${data.summary.lean} — ${data.summary.leanBlurb}`,
        `STRONGEST SKILL: ${data.summary.strength}`,
        `DETERMINISTIC DIRECTIVE (do not contradict): ${data.summary.directive}`,
        data.summary.weakestTactic
          ? `WEAKEST TACTIC: ${data.summary.weakestTactic} (${data.summary.weakestWrong}/${data.summary.weakestSeen} wrong)`
          : "WEAKEST TACTIC: —",
        `WAGER READ: ${data.summary.wager}`,
        `DAILY STREAK: ${data.summary.dailyStreak}`,
        data.summary.lastPlayCorrect != null
          ? `LAST DROP: ${data.summary.lastPlayCorrect ? "correct" : "wrong"} at stake ${data.summary.lastPlayStake ?? 0}`
          : "",
        data.summary.leaderboardPercentile != null
          ? `LEADERBOARD PERCENTILE: ${data.summary.leaderboardPercentile}`
          : "",
        data.summary.weeklyTrend ? `WEEKLY TREND: ${data.summary.weeklyTrend}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const result = await generateText({
        model,
        system: systemPromptFor(data.surface),
        prompt: userMsg,
      });
      const raw = (result.text ?? "").trim();
      // Basic guards: if empty, too long, or contains banned phrases → fallback.
      const banned = /\b(anxiety|disorder|diagnos|trauma|as an ai|language model|i cannot)\b/i;
      if (!raw || raw.length > 700 || banned.test(raw)) {
        return { text: data.fallback, source: "fallback" as const };
      }
      return { text: raw, source: "ai" as const };
    } catch (err) {
      console.error("[handler] generateHandlerLine failed:", err);
      return { text: data.fallback, source: "fallback" as const };
    }
  });
