This is a large presentation + content pass on top of MILVERSE. I'll ship it in one build without touching engine, scoring, dossier, Supabase, share codes, or the Mirror/Feed/Studio logic. Everything below is additive.

## What ships

### 1. Media formats in The Feed
- Add a `format` field to Feed scenarios: `whatsapp | instagram | news | image | video`.
- Render distinct frames in `feed.$caseId.tsx`: WhatsApp bubble (existing), Instagram post card (avatar + image + caption + faux likes/comments), news article clip (masthead + headline + date), viral image with caption card, video card (poster + play glyph + caption).
- Existing 4 cases keep working; add 6 new cases (4 Pakistan-rooted, 2 global patterns: job-offer scam, disaster charity scam).
- Visible `FORMAT` chip on every case card.

### 2. The Field Manual (`/manual`)
- New route: noir codex of tactics (IMPERSONATION, URGENCY & FEAR, OUT-OF-CONTEXT MEDIA, ENGAGEMENT BAIT, IMPOSTER OUTLETS, PHISHING, ROMANCE/TRUST FARMING, AI-GENERATED CONTENT, MIS/DIS/MAL-INFORMATION, THE FORGERY ENGINE).
- Each entry: how it works, 2 anonymized worldwide examples, red flags, counter-move.
- Locked entries render as redacted files.
- Unlock state stored in `localStorage` (new key, does not touch profile schema).
- Every case scenario gets a `tacticId`; debrief in Feed + Mirror shows "TACTIC IDENTIFIED: X" stamp + link to manual entry.
- Sub-page "Take It Outside": real tools (Google Lens, lateral reading, AFP, Snopes, Soch Fact Check) with outbound links.

### 3. Verification Toolbelt (Feed cases)
- Feed scenarios already have `actions`. Tag each with a `tool` type: `reverse_image | check_source | cross_check | check_date`.
- Render toolbelt UI grouping actions by tool; wrong-tool-for-format hint shown after use.
- Purely presentational: results still come from `action.result` (dossier ground truth).

### 4. AI literacy
- Manual entry "THE FORGERY ENGINE" (part of #2).
- 2 new Feed cases flagged `aiGenerated: true` where only source-check wins.
- Small transparency blurb on `/manual` and on landing.

### 5. Ranks & profile card
- Add XP + rank ladder (CITIZEN → SPOTTER → ANALYST → INVESTIGATOR → EDITOR → CITY DESIGNER) derived from existing `profile` (cases played, correct, manual unlocks, Studio publishes). Pure read-only helpers in a new `src/lib/ranks.ts`.
- Rank-up stamp animation reused from verdict style, triggered when crossing thresholds (checked client-side on debrief).
- New route `/profile`: rank, 2x2 calibration, manual %, districts cleared, badges. "Save as image" via `html-to-image`-free approach: render as downloadable SVG (no new dep).

### 6. In-room storytelling
- Reusable `<DistrictIntro>` component: 2-panel noir key-art + typewriter narration, skippable, session-remembered. Wired into Mirror index, Feed index, Studio, Archive intros.
- Micro tactic-reveal stamp component reused on debrief.

### 7. Judge-proofing
- Landing: add pinned "MEDIA / INFORMATION / LITERACY" scroll beat in `ScrollStory`.
- New `/educators` route: MIL competency mapping, inoculation theory, lateral reading — half-page.
- Landing tagline: "Enter as a target. Leave as a designer."

### 8. Map
- Add Field Manual + Educators + Profile as landmarks in `CityWorld` / `CityList` (data only — no map restructure).

## Files (new)
- `src/lib/manual/entries.ts`, `src/lib/manual/state.ts`
- `src/lib/ranks.ts`
- `src/routes/manual.tsx`, `src/routes/manual.$entryId.tsx`, `src/routes/manual.take-it-outside.tsx`
- `src/routes/educators.tsx`
- `src/routes/profile.tsx`
- `src/components/feed/FormatFrame.tsx`
- `src/components/feed/Toolbelt.tsx`
- `src/components/TacticStamp.tsx`
- `src/components/DistrictIntro.tsx`

## Files (edited, presentation only)
- `src/lib/feed/scenarios.ts` — add `format`, `tacticId`, `aiGenerated`, `actions[].tool`; add 6+2 cases.
- `src/routes/feed.$caseId.tsx` — mount FormatFrame + Toolbelt + tactic stamp on debrief.
- `src/routes/feed.index.tsx` — format chip.
- `src/routes/mirror.$caseId.tsx` — tactic stamp on debrief.
- `src/components/ScrollStory.tsx` — MEDIA/INFORMATION/LITERACY beat + tagline.
- `src/components/CityWorld.tsx`, `src/components/CityList.tsx` — 3 new landmarks.
- `src/components/TopBar.tsx` — Manual link.

## Guardrails
- No engine, scoring, dossier, share-code, Supabase, or route-restructure changes.
- No feature judges truth for the player: Toolbelt returns dossier text, Manual is reference material, ranks are derived from existing history.
- LITE mode + reduced motion respected (typewriters/stamps short-circuit).
- No new heavy deps.

Self-audit reported at the end.
