# Mil-Verse v2 — Phased Polish Plan

Goal: a premium, editorial, trustworthy feel across every route. Visuals + UX states only. Game engines, scenarios, scoring, assessment items, daily/boss/firstPhone logic, and DB schemas stay untouched.

## Guardrails (unchanged from prior fix-packs)
- Do not touch: `boss/engine.ts`, `feed/engine.ts`, `mirror/engine.ts`, scenario dialogue, scoring, assessment items, daily stake math, schemas.
- Do not touch auto-generated files (`routeTree.gen.ts` except when routes change, supabase `client.ts`, `types.ts`, etc.).
- No new secrets, no new backend features, no new npm packages unless strictly required (aim: zero).
- All work in frontend/presentation layer.

## Phase 1 — Design system foundation
Files: `src/styles.css`, `tailwind` tokens via `@theme`, a new `src/components/ui/` primitives review.

- Refine typographic scale: introduce editorial pair (display serif + neutral sans) via `<link>` in `__root.tsx` head, wire family names in `@theme` under `--font-display` / `--font-sans`. Keep existing high-legibility mode override intact.
- Tighten spacing scale, radius tokens (`--radius-sm/md/lg/xl`), elevation tokens (`--shadow-1..4`), and semantic surfaces (`--surface`, `--surface-muted`, `--surface-raised`, `--border-subtle`, `--border-strong`).
- Contrast pass on `--muted-foreground`, timestamps, byline text — ensure ≥4.5:1 in both default and high-legibility modes.
- Add motion tokens (`--ease-out-soft`, `--dur-fast/med/slow`) and `prefers-reduced-motion` short-circuits.
- Focus-visible ring token (`ring-3 ring-ring/60`) applied to all interactive primitives.

## Phase 2 — Navigation & IA
Files: `src/routes/__root.tsx`, new `src/components/site/{SiteHeader,SiteFooter,NavLink}.tsx`.

- Single sticky top nav with clear grouping: Play (/), Learn (/first-phone, /charter), For Educators (/educators), For Family (/family), Visit (/visit).
- Mobile: drawer with the same grouping; keyboard traversable; ESC to close; focus trap.
- Breadcrumb-less; use route titles + a subtle section eyebrow instead.
- Footer: three columns (Product, For Adults, About) + safety disclaimer line already established in Fix-Pack C.
- Skip-to-content link, single `<main>` in root layout only.

## Phase 3 — Landing + marketing routes
Files: `src/routes/index.tsx`, `src/routes/educators.tsx`, `src/routes/family.tsx`, `src/routes/charter.tsx`, `src/routes/visit.tsx`.

- Landing: sharpen primary purpose in a single sentence hero; two CTAs (Play / Take the Visit); replace clutter with a 3-beat "how it works" strip and a "who it's for" card set.
- Educators/Family/Charter: editorial layout — hero, pull quote, section cards, disclaimer band; consistent max-width and vertical rhythm.
- Visit: unchanged mechanics; only shell/typography lift.

## Phase 4 — App shell routes (non-gameplay)
Files: `src/routes/review.tsx`, `src/routes/assessment.tsx`, `src/routes/family.tsx` dashboards, `src/routes/pilot*`.

- Consistent page header pattern (eyebrow + title + description + inline action slot).
- Card grid rewrites using shared `Card`, `Stat`, `EmptyState`, `ErrorState`, `LoadingSkeleton` primitives.
- Add skeletons for every server-fn read; add explicit empty states with a useful next action; error states with retry via `router.invalidate()`; toast (sonner) on save/regenerate/export.
- Preserve all existing k-anonymity suppression and disclaimers.

## Phase 5 — Gameplay chrome polish (chrome only, zero logic)
Files: `src/components/chat/{ChatHeader,ChatShell,StatusBar,NotificationBanner,CallScreen,BankConfirmSheet,ContactsSheet}.tsx`, `src/components/firstPhone/{LicenseCard,LessonPath,JuniorGate,TrustedAdultChip}.tsx`.

- Spacing/typography alignment to new tokens; refined shadows; better disabled/validation/loading visuals on sheets.
- No changes to state, engine calls, scoring, or scenario text.

## Phase 6 — UX states sweep
- Every server-fn call site gets: loading skeleton, empty state, error state with recovery, success toast.
- Every form gets: inline validation, disabled submit while pending, aria-invalid, aria-describedby error text.
- Responsive audit at 360 / 768 / 1024 / 1440 using the responsive-layout patterns (grid+min-w-0+shrink-0 for header rows).

## Phase 7 — Quality pass
- Fix TS strictness issues surfaced along the way.
- Delete any dead placeholder handlers, wire buttons that were no-ops.
- Console-clean load on each route; a11y sweep (axe-style: button-name, contrast, single main, focus visible).
- Update route `head()` metadata where the copy changed.

## Out of scope
- Game engines, scenarios, scoring, assessment items, daily stake math, DB schemas.
- New product features, search/filter, favorites, profile system.
- Third-party packages, new secrets, deployment config.

## Delivery order
I'll ship phase-by-phase, one message per phase, with a compact per-phase changelog. After each phase you can stop me, redirect, or continue.

**Starting with Phase 1 (design system foundation) on approval.**