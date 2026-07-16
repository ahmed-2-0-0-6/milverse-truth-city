# Scope check before I ship

This ask is 4 big passes braided together. If I try to land all of it in one turn, half of it will be shallow — especially the sitewide ARIA sweep, the per-image alt rewrite, and the cast diversity audit across ~54 scenarios. I want to sequence it so each pass is real, not cosmetic.

## Proposed sequence (each pass is one turn, reviewable)

**Pass 1 — Access infrastructure (A5 + A1 + A4 color-independence)**
The load-bearing plumbing. Once this ships, every later pass inherits it.
- New `AccessProvider` + `mem://` persisted store: text size, high-legibility mode, reduce motion (composes with existing visual-quality), transcripts-always-open, sound.
- New `AccessPanel` sheet + TopBar entry (icon-only button, aria-labeled).
- Global focus-visible ring token in `styles.css`; audit `outline: none` offenders.
- Focus-trap + ESC + return-focus wired into the shared bottom-sheet primitives (ContactsSheet, BankConfirmSheet, action sheet, verdict overlay).
- Color-independence pass on verdict states: add glyph + label everywhere (chip, stamp, receipt, profile matrix). List of surfaces touched in the report.
- Keyboard order + stake-slider arrow-key + aria-valuenow.

**Pass 2 — Deaf/HoH + screen reader (A2 + A3)**
- ChatShell thread → `role="log"` + `aria-live="polite"`; bubble labels; typing indicator `aria-hidden`.
- VoiceNote gets global TRANSCRIPT toggle (respects transcripts-always-open).
- CallScreen live-caption line synced to TTS text.
- Verdict overlay `aria-live="assertive"`, one-shot.
- Full-codebase icon-only button sweep — I'll grep every `<Button size="icon"` / bare icon anchor and add `aria-label`. Report will list the count.
- Sound-only signal audit (stamp thud, rank-up, verdict stings) — list findings + add visual twin where missing.
- Semantic landmarks + single H1 audit per route.

**Pass 3 — Alt-text for case media (A2 continued)**
This is content work, not infra. Every Mirror/Feed/Boss/Paper case image gets a hand-written neutral-faithful alt. I'll do it in this order: Feed cases (25) → Mirror (15) → Boss (14 variants) → Paper. Decorative art (district headers, atmosphere) → `alt=""` + `aria-hidden`. Report lists per-case count.

**Pass 4 — Charter, T-11, two Feed cases, cast sweep, educators (B + C + D)**
- New `/charter` route, plaque design, footer link + educators link.
- Field Manual T-11 entry in `manual/entries.ts` + unlock wiring.
- Two new Feed dossiers ("THE QUOTE", "THE INVASION ALBUM") — fictional council figure + fictional newcomer community, no verbatim slurs, tactic mechanics only.
- Cast diversity sweep across scenarios (surface details only — names, avatar descriptors, framing lines; zero tell/dossier changes). Delivered as a diff table in the report.
- `/educators` "ACCESS & INCLUSION" section + motto line.
- Landing footer motto line.

## What each pass will NOT touch
Engines (mirror/boss/feed), scoring, scenario logic/tells/dossier facts, schemas, Supabase, engine profiles. Cast sweep is surface strings only.

## Contrast + zoom sweep
Both are audit-then-fix. I'll fold them into Pass 1 as a listed audit (offenders enumerated) and fix in Pass 1 if <10 offenders, otherwise defer to a Pass 1b so the pass stays reviewable.

## Confirm before I start
Reply "go" to start Pass 1, or tell me to collapse passes (e.g. "do 1+2 together") or reorder (e.g. "charter first — it's the demo hook"). If you want everything in one turn I'll do it, but you'll get breadth over depth and I'd rather warn now than apologize later.
