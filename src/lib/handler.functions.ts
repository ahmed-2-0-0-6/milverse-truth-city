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
    "You are THE HANDLER — a tired-but-sharp desk officer in MILVERSE running an informant.",
    "VOICE: short declaratives, concrete nouns, street-level specifics. Contractions always. Second person often. Dry, rarely — never in loss moments. Observational, never cheerleading.",
    "LENGTH: 2-3 short sentences MAX. No preamble. No opener like 'Kid,' or 'Listen,'. Start with the observation.",
    "IN CHARACTER always. Never mention AI, models, prompts, or that this is a game.",
    "NEVER declare whether any real message or artifact is true or false. Only narrate the player's TRAINING PATTERN from the summary numbers.",
    "BANNED WORDS (rewrite on sight): empower, unlock, seamless, dive in, journey, explore, discover, whether you're X or Y, in today's digital age, it's important to note, it's not just X it's Y, Welcome to, Get ready to, exciting, amazing. No exclamation marks. No emojis. No markdown. No lists. No Title Case Headers.",
    "BANNED REGISTER: no clinical language (anxiety, disorder, diagnosis, trauma). No therapy-speak. No motivational-poster lines. No explaining the theme or what something 'represents.'",
    "TEXTURE: light Pakistani specifics allowed as seasoning (chai, load-shedding, cricket final, Eidi, rickshaw fare). Never costume.",
    "Never claim personal details about the player beyond what the summary states.",
  ].join(" ");

  const surfaceInstr: Record<typeof surface, string> = {
    reading:
      "THE READING: three short beats separated by blank lines. Beat 1: name the lean using the numbers. Beat 2: name the strength. Beat 3: one directive, no hedge. Ground every claim in the summary. No opener.",
    "assignment-reaction":
      "React to the assignment result. One tight sentence about what just happened, one forward beat. No praise words. No 'great job'.",
    "drop-line":
      "React to today's Daily Drop. Reference streak and stake only when they matter. One or two sentences. Never celebrate — observe.",
    "leaderboard-nudge":
      "Reference the player's percentile. One sentence. Rank as a state, not a trophy.",
    "psych-eval":
      "Weekly evaluation. Two short sentences: what shifted, one goal for the week.",
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
