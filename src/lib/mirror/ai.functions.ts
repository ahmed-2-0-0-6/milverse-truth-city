import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

const InputSchema = z.object({
  scenarioTitle: z.string(),
  tier: z.number(),
  truth: z.enum(["REAL", "IMPOSTER"]),
  claimedIdentity: z.string(),
  personaVoice: z.string(),
  agenda: z.string().optional(),
  contactClaim: z.string(),
  knownFacts: z.array(z.string()),
  publicFacts: z.array(z.string()),
  // Ground-truth for the fact the player is probing, or null if none.
  factTruth: z.string().nullable(),
  factKnownToImposter: z.boolean().nullable(),
  isDeflection: z.boolean(),
  isContradiction: z.boolean(),
  isPush: z.boolean(),
  isUrgency: z.boolean(),
  meter: z.number(),
  meterType: z.enum(["composure", "patience"]),
  turnCount: z.number(),
  history: z.array(z.object({
    role: z.enum(["player", "contact"]),
    text: z.string(),
  })),
  playerMessage: z.string(),
  // Deterministic fallback text
  fallback: z.string(),
});

export const generateContactReply = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { text: data.fallback, source: "fallback" as const };

    try {
      const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
      const gateway = createLovableAiGatewayProvider(key);
      const model = gateway("google/gemini-3-flash-preview");

      const identity =
        data.truth === "REAL"
          ? `You ARE the real ${data.claimedIdentity}. You have full memory of the shared history below and answer naturally and truthfully. You have no agenda.`
          : `You are an IMPOSTER pretending to be ${data.claimedIdentity}. You DO NOT truly know this person. You have scraped some public facts but there are gaps. Never admit you are an imposter, never break character, never mention AI.`;

      const factGuidance = (() => {
        if (data.factTruth && (data.truth === "REAL" || data.factKnownToImposter)) {
          return `The player is probing a fact you KNOW. Answer using this truth naturally, in your own voice: "${data.factTruth}"`;
        }
        if (data.isContradiction && data.factTruth) {
          return `The player has pressed this gap multiple times. Give a CONFIDENT but subtly WRONG answer that contradicts the real truth ("${data.factTruth}"). Do NOT reveal you are guessing.`;
        }
        if (data.isDeflection) {
          return `The player is probing a fact you DON'T know. Deflect naturally — change subject, get vague, or turn it into a joke. Never admit you don't know.`;
        }
        if (data.isPush && data.agenda) {
          return `Now nudge toward the agenda: "${data.agenda}". Keep it soft and in-character.`;
        }
        if (data.isUrgency) {
          return `Apply gentle urgency — you need a quick answer. Do not sound scripted.`;
        }
        return `Answer the player's message naturally in-character. Do NOT push any agenda yet.`;
      })();

      const sys = [
        identity,
        `Voice/style: ${data.personaVoice}`,
        `Tier ${data.tier} of 5 — ${data.tier <= 2 ? "you can be slightly off" : data.tier >= 4 ? "be extremely polished and convincing" : "be natural"}.`,
        `LANGUAGE — MIRROR THE PLAYER. If they wrote English, reply in English. If they wrote Roman Urdu (Urdu in Latin letters) or mixed Urdu-English code-switching (yaar, bhai, acha, "AoA", "g", "nahin"), reply the SAME way — natural Pakistani texting style. Never switch to English if the player writes Roman Urdu, and never force Roman Urdu if they write clean English. Match their register.`,
        `You are on a TEXT chat. Reply in 1-2 short sentences MAX, like a real text message. No emojis unless the persona voice allows. No markdown. No stage directions.`,
        `CONTEXT — what "${data.claimedIdentity}" claims: ${data.contactClaim}`,
        `KNOWN SHARED HISTORY (facts the player also knows): ${data.knownFacts.join(" | ")}`,
        `PUBLIC FACTS: ${data.publicFacts.join(" | ")}`,
        factGuidance,
        `SAFETY: fictional scenario. Never mention real companies, real names beyond the persona, or that this is a simulation.`,
      ].join("\n");

      const messages = [
        ...data.history.slice(-8).map((m) => ({
          role: (m.role === "player" ? "user" : "assistant") as "user" | "assistant",
          content: m.text,
        })),
        { role: "user" as const, content: data.playerMessage },
      ];

      const result = await generateText({
        model,
        system: sys,
        messages,
      });

      const text = (result.text || "").trim().replace(/^["']|["']$/g, "");
      if (!text) return { text: data.fallback, source: "fallback" as const };
      return { text, source: "ai" as const };
    } catch (err) {
      console.error("[ai] generateContactReply failed:", err);
      return { text: data.fallback, source: "fallback" as const };
    }
  });
