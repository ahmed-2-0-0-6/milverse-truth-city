# THE STYLE LEDGER — MILVERSE VOICE

One page of law for copy across the app. Not shipped UI. Update this file
whenever a Copy Desk pass moves a rule.

## The three registers

### 1. NOIR (city desk)
For every in-world player surface: `/`, `mirror/*`, `feed/*`, `boss/*`,
`drop`, `paper`, `manual/*`, `archive`, `studio`, `city-hall`, `charter`,
`market`, `arena`, `profile`, `assessment` (player parts), `quick-tour`,
`visit`, `wall`, `board`.

- Short declarative sentences. End with a period, not a shout.
- Concrete nouns. Contractions. Second person.
- No apology, no hedging, no fluff. The city speaks like a police-beat
  editor at 2am.
- Uppercase stencil idioms allowed for status: `// PULLING THE FILE…`,
  `// LOADING BASELINE…`, `BOARD DARK`.

### 2. PLAIN PROFESSIONAL (staff and parent)
For `/educators`, `/family`, `/kit`, `/pilot`, `/review`, and any
parent-facing section anywhere.

- Human, direct, no noir affect, no stencil drama in body text.
- No "please" as decoration; keep it only where it's a real request.
- Titles are short declaratives. Descriptions carry the facts.

### 3. JUNIOR WARM
For `first-phone/*` and every component under `components/firstPhone/`.

- Warm, never babyish, never fear-based.
- Praise the check, not the child. Coach the reflex, not the outcome.
- Junior lesson option text is content — do not tweak in copy passes.

## The exemption

**Scam dialogue is exempt.** Scammers in `scenarios.ts`, `lessons.ts`,
personas, fillers, deflections, and scripted tour lines keep their
exclamation marks and bait words. Rewriting scam voice destroys the
teaching moment.

The frozen files (never edited in a copy pass):
- `src/lib/mirror/scenarios.ts`
- `src/lib/feed/scenarios.ts`
- `src/lib/boss/scenarios.ts`, `src/lib/boss/doctrine.ts`
- `src/lib/firstPhone/lessons.ts`
- `src/lib/handler/copy.ts` (handler is character voice)
- engine files (`mirror/engine.ts`, `feed/engine.ts`, `boss/engine.ts`)

If drift lives in frozen content, file it for a future content pass.

## The banned list (non-exempt copy)

- `empower`, `unlock` as a marketing verb (game-mechanic "unlocked" is
  fine as a state label), `seamless`, `dive in`, `journey`, `discover`,
  `explore`
- `whether you're`, `in today's digital age`, `it's not just X, it's Y`,
  `Welcome to…`, `Get ready to…`
- `awesome`, `amazing`, `exciting`, `great job`, `congrats`
- `Oops`, `Sorry!`, `Please try again` outside parent-plain surfaces
- No exclamation marks in non-scam copy. No emoji outside chat artifacts.

## Established idioms

**Loading (noir):** `// PULLING THE FILE…`, `// LOADING PROFILE…`,
`// LOADING BASELINE…`, `Setting type…` (paper). Uppercase stencil,
one ellipsis, no more.

**Loading (plain):** `Loading` (no ellipsis-spam, no "please").

**Errors (noir):** state the fact, then the next step.
- `This didn't load.` / `The fault's on our end. A refresh usually clears it.`
- `The page didn't make it.` / `Refresh, or walk back to the city.`
- `No such address in this city.` (404)
- `The board's dark. Try again in a moment.`

**Errors (plain):** short, human, no drama. Titles are declaratives:
`Sign-in failed.` / `Refresh failed.` / `Nothing to export.`

**Toasts:** title is one short declarative with a period. Description
carries the facts. No exclamation.
- `Published as private.` — `Share code ABC123 · AI safety check passed`
- `Publish failed.` — `<server message>`
- `Code copied.`
- `Queue refreshed.`

## Five before → after (from this pass)

1. `page-states.tsx` ErrorState default
   - before: `Something went wrong` / `Please try again. If the problem persists, refresh the page.` / `Try again`
   - after: `This didn't load.` / `The fault's on our end. A refresh usually clears it.` / `Refresh`

2. `__root.tsx` 404
   - before: `Page not found` / `The page you're looking for doesn't exist or has been moved.` / `Go home`
   - after: `404` / `No such address in this city.` / `BACK TO THE MAP →`

3. `studio.tsx` publish success
   - before: `Submitted to the Community Library` / `Published as a private case`
   - after: `Submitted to the library.` / `Published as private.`

4. `board.tsx` unreachable
   - before: `Couldn't reach the board. Try again in a moment.`
   - after: `The board's dark. Try again in a moment.`

5. `mirror.index.tsx` lookup failure
   - before: `No case with that code — check the code and try again.`
   - after: `No case with that code. Check the code and try again.`

## Assistive copy (aria-labels, sr-only)

Descriptive-first, register-second. Clarity beats voice inside an
accessible name. Only rewrite labels that are wordy or apologetic;
never make a label cryptic for style.
