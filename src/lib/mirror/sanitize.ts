// MILVERSE — hardening: sanitize AI-generated replies before display.
// Rules:
//  - Strip markdown fences, code blocks, "system:"-style prefixes
//  - Reject anything that mentions being an AI, a language model, instructions, or a simulation
//  - Truncate at 240 chars on a sentence boundary
//  - If sanitization would produce empty/rejected text, callers should fall back to deterministic text

const FORBIDDEN = /\b(as an ai|i am an ai|language model|large language model|as a language|instructions|prompt|simulation|i cannot|i can'?t provide|i was trained|openai|gemini|anthropic|claude|gpt)\b/i;

const PREFIX = /^\s*(system|assistant|contact|user|ai)\s*[:>-]\s*/i;

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
  s = s.replace(/[\[\(]?\*[^*]{2,80}\*[\]\)]?/g, "");
  // Collapse whitespace
  s = s.replace(/\s+/g, " ").trim();
  // Strip leading role prefix
  s = s.replace(PREFIX, "").trim();
  // Strip surrounding quotes
  s = s.replace(/^["'`""'']+|["'`""'']+$/g, "").trim();

  if (!s) return null;
  if (FORBIDDEN.test(s)) return null;

  if (s.length > 240) {
    const window = s.slice(0, 240);
    const lastBoundary = Math.max(
      window.lastIndexOf("."), window.lastIndexOf("!"), window.lastIndexOf("?"),
    );
    s = lastBoundary > 80 ? window.slice(0, lastBoundary + 1) : window.trimEnd() + "…";
  }

  return s;
}
