// MILVERSE — constant-time passcode check shared by the passcode-gated
// server functions (pressroom, review console, devintel, assessment phase).
// SHA-256 both sides via Web Crypto (Workers-safe), then compare digests —
// comparison time no longer depends on where the strings first differ.

async function sha256(s: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(s);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}

/** Throws unless `passcode` matches MILVERSE_REVIEW_PASSCODE. */
export async function assertReviewPasscode(passcode: string): Promise<void> {
  const expected = process.env.MILVERSE_REVIEW_PASSCODE;
  if (!expected) throw new Error("Review passcode is not configured on the server.");
  const [a, b] = await Promise.all([sha256(passcode), sha256(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  if (diff !== 0) throw new Error("Invalid passcode.");
}
