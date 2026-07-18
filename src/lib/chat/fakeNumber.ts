// MILVERSE — deterministic fake number formula for a case.
// Shared by the mirror chat header and the Citizen Inbox call/voicemail
// so the SAME case always renders the SAME number in every surface.

export function fakeNumberForCase(caseId: string): string {
  const len = caseId.length;
  const a = String(((len * 137) % 900) + 100);
  const b = String(((len * 41) % 9000) + 1000);
  return `+92 3xx ${a} ${b}`;
}
