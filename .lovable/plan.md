# MILVERSE — UI v3 Overhaul

Goal: modern, responsive, accessible. Same product, same voice, same detective-office vibe. Cleaner grid, calmer hierarchy, better mobile, WCAG AA everywhere.

I'll ship in phases and pause after each so you can eyeball before I move on.

---

## Phase 0 — Foundation (design tokens + shell)
Files: `src/styles.css`, `src/components/TopBar.tsx`, `src/routes/__root.tsx`

- Retune the token layer: one canonical dark surface scale (`--surface-1..4`), stroke scale, elevation scale. Kill one-off `bg-card/60` + `border-white/10` scatter.
- Type scale: cap display sizes on mobile (currently blows past 40vw on some hero variants). Add `--step--1 … --step-6` using `clamp()`.
- Focus system: single `focus-visible` ring token (`ring-3 ring-primary/70 ring-offset-2 ring-offset-background`) applied globally via `@layer base`.
- Motion tokens: `--ease-out-back`, `--dur-fast/base/slow`; honor `prefers-reduced-motion` at the token layer, not per-component.
- Grain / scanlines: gate behind a `.lite-mode` opt-out that already exists.

## Phase 1 — TopBar (the thing every page shares)
- Rebuild as a proper `<header role="banner">` with a real `<nav aria-label="Primary">`.
- Mobile: replace the current cramped chip row with a Sheet-based menu (shadcn Sheet, Radix a11y-correct out of the box). Rank chip + XP bar stay visible at all widths.
- Desktop: 3-zone grid — brand · nav · status. Grouped nav ("Play / Learn / Records") with a proper active state.
- Skip-to-content link (`sr-only focus:not-sr-only`), keyboard nav sweep.

## Phase 2 — Landing (`/`)
- Keep LiveBait as the hook. Tighten mobile layout: phone frame sizes off `dvh`, not `vh`; buttons ≥44px; readable at 320px.
- Below-fold: recompose CitizenDesk / Explore City / hooks into a clean 12-col grid at md+, single-column stack on mobile with proper section rhythm (`space-y-*` scale).
- Alt text on every generated hero image. `loading="eager"` only on the LCP one.

## Phase 3 — Play surfaces
`mirror.$caseId.tsx`, `mirror.index.tsx`, `shift.tsx`, `boss.$bossId.tsx`, debrief

- The Hand chips: 44px min tap target, high-contrast, keyboard focus order matches visual order, chip role = button.
- Case chat bubbles: rework contrast (current muted-on-muted fails AA in a few states), landmark the transcript as `<ol role="log" aria-live="polite">`.
- Verdict bar sits above safe-area on iOS; sticky, thumb-zone height.
- Debrief: split into sections with proper headings (h1 → h2 → h3), no skipped levels.

## Phase 4 — Hubs
`city.tsx`, `wall.tsx`, `board.tsx`, `city-hall.tsx`, `manual.index.tsx`, `feed.tsx`

- Uniform card grid: responsive `grid-cols-[repeat(auto-fill,minmax(280px,1fr))]`, consistent gap scale.
- Standardize CaseCard density; kill inconsistent border radii / shadow scales.
- All icon-only buttons get `aria-label`. Filter chips become a real `role="tablist"`.

## Phase 5 — Global a11y + responsive sweep
- Contrast pass: replace remaining `text-muted-foreground/50`, `text-gray-*`, low-contrast pairs with tokens.
- Every `<img>` gets alt or `alt=""` (decorative).
- Every icon-only `<button>` / `<Link>` gets `aria-label`.
- Every `role`-less clickable `<div>` becomes a `<button>`.
- Single `<main>` per page (via `__root.tsx`), route content becomes `<section>` / `<article>`.
- Heading order audit across all 40+ routes.
- Replace `h-screen` with `h-dvh` where mobile browser chrome causes clipping.
- Responsive header rows: `grid-cols-[minmax(0,1fr)_auto]` + `min-w-0` + `shrink-0` pattern applied where header rows currently `flex-wrap`.

## Phase 6 — Micro-polish
- Consistent hover/press states, unified skeleton components, unified empty/error states pulled through `PageStates`.
- Toast style pass, dialog style pass.

---

## Technical notes
- Tailwind v4: all token work in `src/styles.css` under `@theme` and `@theme inline`; utilities via `@utility`; variants via `@custom-variant`. No `tailwind.config.js`.
- No new deps. Radix/shadcn primitives already installed cover Sheet, Dialog, Tabs, Tooltip.
- No route renames, no data-model changes, no server-fn changes. Presentation only unless a fix requires more.
- The boss-red palette stays quarantined to `/boss/*` per your earlier rule.

---

## Delivery
I'll do Phase 0 + Phase 1 in the next message, build-check, then stop for a look. Phases 2-6 follow one at a time. Say "go" if this shape is right, or tell me to reorder / drop / add.
