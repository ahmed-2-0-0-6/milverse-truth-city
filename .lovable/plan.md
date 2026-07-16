# CitizenOS Follow-Up: Verify, Extend, Polish

Presentation-layer only. Zero changes to `mirror/engine.ts`, `boss/engine.ts`, `feed/engine.ts`, any `scenarios.ts`, profile stores, or Supabase.

## 1. Verify (first, before touching anything)
- Boot the app in headless Playwright at 390×844 (phone) and 1280×1800.
- Load `/mirror` → pick a case → screenshot Mirror ChatShell (idle, typing, verdict, bank sheet if amount).
- Load `/boss` → pick a boss → screenshot Boss ChatShell (idle, callback contact, notification banner phase ≥ 2).
- Read console + network for errors. Report any regression before extending.
- Fix only what's clearly broken from the last pass; list anything ambiguous under RISKS.

## 2. Extend ChatShell to remaining conversation surfaces
Wrap these in `<ChatShell>` with theme-appropriate header/status, keeping all existing engine/store hooks untouched:

- `src/routes/feed.index.tsx` — Feed thread view: use ChatShell as the surface for post/reply conversations. Header shows the district handle; status bar unchanged. Existing feed engine untouched.
- `src/components/handler/HandlerDropLine.tsx` and `HandlersReading.tsx` — Handler drop/reading conversations get ChatShell with a "Handler" header variant (unknown-number banner off, verified check on). WeeklyEval stays as-is (it's a report card, not a chat).
- Drop (`src/routes/drop.tsx`) if it renders a conversation, otherwise skip.

For each: swap the outer frame only, keep composer, choice chips, VoiceNote, and all state hooks in place.

## 3. Polish CitizenOS visuals
Small, targeted CSS/prop tweaks — no redesigns:
- Bubble contrast: verify player vs sender tokens against light + dark; fix any low-contrast pair by binding to semantic tokens in `src/styles.css`.
- Typing indicator rhythm: confirm 40ms/char clamp 600–2500ms; reduced-motion → instant. Fix if off.
- Status bar: tighten signal/clock/battery spacing; ensure CitizenOS wordmark is centered on the notch line.
- Header: unknown-number amber banner uses `--warning` (or add the token if missing) instead of raw amber.
- Message spacing: 2px between same-sender bubbles, 8px between senders, 16px around date chip.
- ChatShell max-height on desktop caps at 844px so it looks like a phone, not a stretched panel.

## Non-goals
Home screen, app grid, browser app, mic capture, uploads, engine tweaks, scenario edits, new deps.

## Report back
`===MILVERSE REPORT===`: 1) Verify results ✅/⚠️/❌ per route with screenshot paths; 2) Files touched in extend pass; 3) Files touched in polish pass; 4) Confirm zero engine/scenario/store edits; 5) RISKS; 6) NEXT.
