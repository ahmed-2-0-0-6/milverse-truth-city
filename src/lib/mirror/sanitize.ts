// MILVERSE — hardening: sanitize AI-generated replies before display.
// Rules:
//  - Strip markdown fences, code blocks, "system:"-style prefixes.
//  - Reject anything that mentions being an AI, a language model,
//    instructions, a prompt, a simulation, an assistant, or any known
//    model/vendor name — case-insensitive.
//  - Truncate at 240 chars on a sentence boundary.
//  - If sanitization would produce empty/rejected text, callers should
//    fall back to deterministic text.

// Case-insensitive word/phrase matches. We look for suspicious mentions
// regardless of context — even a benign-sounding "I'm an AI, but…" or
// "let's roleplay this differently" from the model gets discarded.
const FORBIDDEN_PATTERNS: RegExp[] = [
  /\bas an ai\b/i,
  /\bi am an? ai\b/i,
  /\bi'?m an? ai\b/i,
  /\ba\.i\.\b/i,
  /(?<![a-z0-9])ai(?![a-z0-9])/i, // bare "AI" token
  /\blanguage model\b/i,
  /\blarge language model\b/i,
  /\bllm\b/i,
  /\bchatbot\b/i,
  /\bassistant\b/i,
  /\binstructions?\b/i,
  /\bsystem prompt\b/i,
  /\bprompt\b/i,
  /\brole ?play(ing)?\b/i,
  /\bsimulation\b/i,
  /\bsimulated\b/i,
  /\bopenai\b/i,
  /\bgemini\b/i,
  /\banthropic\b/i,
  /\bclaude\b/i,
  /\bgpt(-|\s)?[0-9]?\b/i,
  /\bi was trained\b/i,
  /\bi cannot (?:comply|do that|help with that)\b/i,
  /\bi can'?t provide\b/i,
  /\bdeveloper mode\b/i,
  /\bjailbreak\b/i,
  /\bdan\b(?=.*mode)/i,
];

const PREFIX = /^\s*(system|assistant|contact|user|ai)\s*[:>-]\s*/i;

function isForbidden(s: string): boolean {
  return FORBIDDEN_PATTERNS.some((re) => re.test(s));
}

export function sanitizeReply(raw: string): string | null {
  if (!raw) return null;
  let s = String(raw);

  // Strip triple-backtick code fences
  s = s.replace(/```[\s\S]*?```/g, "");
  // Strip inline backticks
  s = s.replace(/`([^`]+)`/g, "$1");
  // Strip common markdown emphasis
  s = s.replace(/(\*\*|__|~~)(.*?)\1/g, "$2");
  s = s.replace(/(^|\s)[*_](\S(?:.*?\S)?)[*_](?=\s|$)/g, "$1$2");
  // Strip markdown headings and blockquotes
  s = s.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  s = s.replace(/^\s{0,3}>\s?/gm, "");
  // Strip markdown links [text](url) → text
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  // Strip HTML tags
  s = s.replace(/<\/?[a-z][^>]*>/gi, "");
  // Strip stage directions in brackets/asterisks
  s = s.replace(/[[(]?\*[^*]{2,80}\*[\])]?/g, "");
  // Collapse whitespace
  s = s.replace(/\s+/g, " ").trim();
  // Strip leading role prefix
  s = s.replace(PREFIX, "").trim();
  // Strip surrounding quotes
  s = s.replace(/^["'`""'']+|["'`""'']+$/g, "").trim();

  if (!s) return null;
  if (isForbidden(s)) return null;

  // Hard cap at 240 chars — prefer sentence boundary if there is one late enough.
  if (s.length > 240) {
    const window = s.slice(0, 240);
    const lastBoundary = Math.max(
      window.lastIndexOf("."),
      window.lastIndexOf("!"),
      window.lastIndexOf("?"),
      window.lastIndexOf("…"),
    );
    s = lastBoundary > 80 ? window.slice(0, lastBoundary + 1) : window.trimEnd() + "…";
  }

  return s;
}
