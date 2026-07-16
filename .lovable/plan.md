# FIRST PHONE — Implementation Plan

A big multi-surface feature. Before I write ~15+ files I want to lock scope so I don't over-build.

## Scope (5 parts)

### Part 1 — Junior Register (mode toggle)
- Add `firstPhone: { active, kidCityName, familyCode, lessonsCompleted[], licenseIssuedAt }` to existing profile store (additive, no schema change).
- Toggle in `/profile` + first-run setup on `/first-phone`.
- Junior mode = filter case pools by `junior: true` tag; softened copy strings gated behind a `useJuniorMode()` hook read at render (no engine changes).
- Tag existing safe cases across Mirror / Feed / Daily as junior. Report the list in the final report.
- Stake slider relabel + loss-screen coaching copy via junior-mode text swap only.

### Part 2 — Tell-a-Trusted-Adult protocol move
- Config-level: reuse boss engine's `protocolMove` pattern. Add `trustedAdult?: { line: string }` to junior case configs; when junior mode active, Mirror/Feed case screens render a persistent "TELL A TRUSTED ADULT" chip beside reply chips.
- Tapping it: renders a short scene (adult's line from config), resolves as `correct` result-class, credits calibration, debrief celebrates the reflex.
- Zero engine rewrite — chip lives in the case-screen UI layer, calls existing verdict resolver with `result: "correct"` and a flavor override.

### Part 3 — 10-Lesson Path (/first-phone)
- Transit-line vertical map reusing existing map/blueprint visual language (DistrictBlueprint styling).
- 10 lesson nodes; each has: 3-sentence teaching card + 1–2 curated case IDs.
- 4 NEW junior cases to build (game-currency giveaway, classmate OTP impersonation, chain-forward curse, school-closed rumor) — added to Feed/Mirror scenario files with `junior: true`, fictional platforms.
- Progress unlocks sequentially; state in profile store.
- L10 completion triggers celebration beat + issues license.

### Part 4 — Family Code (/family)
- **Reuse pilot infrastructure** — same `pilot_entries` table, add `wing: "junior"` entries with a `group_code` prefixed `FAM-` (or a `family` flag column? — I'll do the prefix approach to avoid a migration).
- Parent dashboard queries `fetchPilotGroup` filtered to junior wing.
- Dashboard shows ONLY: lessons completed count, badges, tactics mastered, calibration arrow, license status. No message content is ever logged for junior wing (enforced in the logger — junior entries include only `caseId`, `result`, `lesson number`).
- Plain-language parent copy + the promise line.

### Part 5 — First Phone License + Parent Pitch
- License card: reuse canvas receipt/profile-card render pattern → PNG download + `@media print` A5 stylesheet.
- `/first-phone` shows parent pitch when program inactive, kid path when active.
- Cross-links from `/educators` and Charter Article II.

## Files (new)
- `src/lib/firstPhone/profile.ts` — junior state on profile
- `src/lib/firstPhone/lessons.ts` — 10-lesson config
- `src/lib/firstPhone/juniorCases.ts` — 4 new cases
- `src/lib/firstPhone/copy.ts` — junior register text map
- `src/hooks/useJuniorMode.ts`
- `src/components/firstPhone/LessonPath.tsx`
- `src/components/firstPhone/TrustedAdultChip.tsx` + scene modal
- `src/components/firstPhone/LicenseCard.tsx` (canvas + print)
- `src/components/firstPhone/ParentPitch.tsx`
- `src/routes/first-phone.tsx`
- `src/routes/family.tsx`

## Files (edited, minimal)
- profile store — add junior fields
- `/profile` — toggle
- Mirror + Feed case screens — mount TrustedAdultChip when junior + junior stake-slider label swap
- Feed/Mirror scenario files — add `junior: true` tags to safe existing cases + append new junior cases
- `/educators` + charter — link

## Guardrails baked in
- Content lines: only scam/impersonation/misinfo/manipulation; fictional platforms in junior content (BloxBux not Roblox, GroupChat not WhatsApp).
- Zero conversation content in family dashboard — junior logger writes only lesson/result/badge fields.
- AI voice: unchanged, keeps existing hard fallbacks.
- CINEMATIC/LITE + Access Panel: LessonPath + LicenseCard respect existing motion/quality tokens.

## Not doing (flagging so you can push back)
- No engine rewrites, no new scoring, no schema migration.
- Not touching boss wing at all (adult register).
- Not building parent-side auth — Family Code is the same trust model as pilot codes (unlisted string).
- Print stylesheet is basic A5; not doing a designed PDF export.

## Question before I build

This is ~12 new files + edits across 6 existing surfaces. Two ways to ship:

**A) Full build in one pass** — all 5 parts, ~1 long turn, everything wired.

**B) Vertical slice first** — Part 1 (junior mode toggle + copy) + Part 2 (Trusted-Adult move) + tag existing cases, ship it, then Parts 3–5 next turn. Safer for review.

Which do you want? (If no answer, I'll do **A**.)
