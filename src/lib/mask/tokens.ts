// MILVERSE — THE MASK · result tokens.
//
// A compact string appended to the receiver's share text so the designer's
// ledger can stamp "FOOLED THEM / THEY CAUGHT IT / TRUTH TOOK THEM" without
// any accounts or server round-trip. Wordle-grid honest: spoofable in
// theory (anyone who reads this file can craft one), but the token is
// scoped to a specific shareCode the designer already possesses, so the
// only "attack" is a friend lying about their own result — and the whole
// point is that the two of them are talking on WhatsApp anyway.
//
// Format: "{payloadBase36}-{checksum2}" where payload encodes
//   [shareCode(6)] · [verdict(1)] · [seconds(base36, 2-3 char)]
// verdict char: C=caught (correct), F=fooled (wrong on imposter),
//               T=played by the truth (wrong on real), X=expired/timeout.

const VERDICT_CHARS = ["C", "F", "T", "X"] as const;
export type TokenVerdict = (typeof VERDICT_CHARS)[number];

function checksum2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36).slice(-2).padStart(2, "0").toUpperCase();
}

export function encodeToken(shareCode: string, verdict: TokenVerdict, seconds: number): string {
  const code = shareCode.toUpperCase().slice(0, 6);
  const secs = Math.max(0, Math.min(9999, Math.round(seconds))).toString(36).toUpperCase();
  const payload = `${code}${verdict}${secs}`;
  return `${payload}-${checksum2(payload)}`;
}

export interface DecodedToken {
  shareCode: string;
  verdict: TokenVerdict;
  seconds: number;
}

export function decodeToken(raw: string): DecodedToken | null {
  const t = raw.trim().toUpperCase();
  const m = /^([A-Z0-9]{7,12})-([A-Z0-9]{2})$/.exec(t);
  if (!m) return null;
  const [, payload, sum] = m;
  if (checksum2(payload) !== sum) return null;
  if (payload.length < 8) return null;
  const shareCode = payload.slice(0, 6);
  const v = payload[6] as TokenVerdict;
  if (!(VERDICT_CHARS as readonly string[]).includes(v)) return null;
  const secsRaw = payload.slice(7);
  const seconds = parseInt(secsRaw, 36);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return { shareCode, verdict: v, seconds };
}
