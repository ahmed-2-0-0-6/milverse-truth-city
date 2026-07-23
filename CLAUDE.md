# CLAUDE.md — MILVERSE (Trust City)

MIL training simulator for the UNESCO Youth Hackathon 2026 (theme: "Play Your Part: Youth
Designing the Future of MIL"). Deliverables: proposal doc + 3-min video, submit by Aug 13.
Judged 18 Aug–13 Sep by 3 experts on: Theme consistency · Clarity (incl. team & ability to
deliver) · Innovation · Feasibility & Sustainability · Impact & Inclusion.
Live: milverse-truth-city.lovable.app — Lovable two-way GitHub sync is ON (Lovable edits
land as commits here; pushed commits sync into Lovable).

## STATUS: FEATURE FREEZE
No new features, routes, or systems. Allowed: bug fixes, copy/voice rewrites, a11y,
performance, content polish. A school pilot with minors is imminent — stability wins.

## THE LAWS (locked decisions — never violate, never "improve")
1. AI NEVER judges truth. Every verdict resolves from hand-authored dossier/config ground
   truth. AI only voices surface text (scammer roleplay, Handler coach) with deterministic
   fallbacks. Never add AI fact-checking, AI verdicts, or paste-a-link truth checkers.
2. NO user recording or user media: no getUserMedia, MediaRecorder, or uploads of user
   audio/video/images. Voice = pre-built TTS assets only.
3. All scenario content is FICTIONAL and anonymized. Tactics, never victims. No real
   people, brands, platforms, or groups (in-world equivalents only).
4. Junior (First Phone) content lines are ABSOLUTE: no grooming/predator scenarios, no
   romantic/body/photo-request content, no self-harm. Scams/impersonation/misinfo only.
   "TELL A TRUSTED ADULT" is always available and always a win in junior cases.
5. Two-way loss is the core innovation: gullibility (Missed Scam) AND paranoia (False
   Alarm) both lose. Never make "refuse everything" a winning strategy.
6. Never frame the product as deepfake-SPOTTING. Thesis: "Spotting is dying; verifying is
   forever." Boss cases where fact-checks CONFIRM the scam's cover story are intentional.
7. Privacy: no accounts. localStorage-first profiles. Cloud stores aggregates/pseudonymous
   codenames only — no names, no message bodies. Dashboards suppress groups n<5.
8. Roman Urdu (Latin script) code-switching only; never full Urdu script.
9. Accessibility is a feature: LITE mode, reduced motion, transcripts on all voice notes,
   keyboard play, ARIA on chat surfaces. Never regress these.

## MAP (where things live)
- Stack: TanStack Start v1 (React 19, Vite 7) on Cloudflare Workers; Tailwind v4 +
  shadcn/ui; GSAP + framer-motion + R3F (3D hero, CINEMATIC mode only); Supabase
  (Lovable Cloud) with RLS; Lovable AI Gateway (src/lib/ai-gateway.server.ts).
- Districts: src/lib/{mirror,feed,boss}/ → engine.ts (deterministic outcome logic —
  DO NOT alter behavior), scenarios.ts (content + ground truth), profile.ts (localStorage).
- Boss Protocol: lib/boss/* — HOLD_UNVERIFIED verdict, protocol moves, variants (some REAL
  → punishes blank refusal). Crown jewel. Engine changes forbidden.
- Phone UI: src/components/chat/* (ChatShell, StatusBar, ChatHeader, ContactsSheet,
  CallScreen, BankConfirmSheet, NotificationBanner). Mirror/Boss/First-Phone render in it.
- First Phone: lib/firstPhone/* (lessons.ts = 10-lesson junior curriculum, inline cases),
  components/firstPhone/*, routes first-phone.tsx + family.tsx (parent dashboard via
  group-code infra — shows skills only, never conversations).
- Assessment (pre/post instrument): lib/assessment/*, routes/assessment.tsx,
  assessment.functions.ts — matched forms A/B, calibration gap, Brier score. Feeds /review.
- The Paper: lib/paper/*, routes/paper.tsx, /pressroom (passcode editor, human-published
  editions). Daily Drop: routes/drop.tsx (stake/wager, streak, receipt).
- Field Manual: lib/manual/entries.ts (tactic codex incl. outrage-machine). Handler:
  lib/handler/* (deterministic templates + cached AI lines).
- Server fns: src/lib/*.functions.ts. Public API: routes/api/public/telemetry.ts
  (zod + whitelist + insert-only RLS). Migrations: supabase/migrations/.
- Judge tour: routes/visit.tsx (zero AI, zero cloud, sandboxed). Values: routes/charter.tsx.

## VOICE (canon register for ALL copy edits)
Noir city desk: short declaratives, concrete nouns, contractions, second person, dry
humor rarely, Pakistani texture sparingly (chai, load-shedding, Eidi). Parent/educator
pages: plain professional, human. Junior: warm, zero fear, never babyish.
BANNED: empower, unlock, seamless, dive in, journey, discover, explore, "whether you're",
"in today's digital age", "it's not just X it's Y", "Welcome to...", exclamation marks
outside scam dialogue, emoji outside chat artifacts.
Calibration: "Ten lessons. Then the phone's yours." / "He never gave you time to think.
That was the whole trick." Scammer lines: messy, human, guilt+warmth as tools, natural
Roman-Urdu mid-switch. Player reply chips sound like real typed replies, not quiz options.

## WORKFLOW
- User pulls (GitHub Desktop) BEFORE any session; commits+pushes AFTER. Never edit while
  unpulled Lovable changes exist. Small, single-purpose commits.
- Never modify: engine outcome logic, scenario ground truths, migration history, license/
  assessment scoring math — without explicit user request.
- Big scaffolding jobs go through Lovable prompts (written in the Cowork war-room session);
  this repo is for surgical fixes, copy/voice rewrites, a11y, audits.
- End substantial work with a short report: DONE / FILES / RISKS / NEXT.

## PRIORITIES (war plan — what actually wins)
1. School pilot (~Jul 25–Aug 2): named partner school, intake/exit assessments, retention.
2. Proposal doc (≤10MB) + 3-min video — the ONLY artifacts judges score. Site = evidence.
3. Code work is in service of: pilot stability, judge /visit polish, voice quality.
Positioning: "Enter as a target. Leave as a designer." / "Other tools childproof the
phone. MILVERSE phone-proofs the child." / a city in UNESCO's MILtiverse (homage, stated).
