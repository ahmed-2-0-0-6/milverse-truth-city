# CitizenOS phone surface — presentation-only overhaul

## Scope (exactly the 4 surfaces, nothing else)

1. **ChatShell** — reusable phone-frame wrapper hosting Mirror & Boss conversations
2. **Contacts sheet + Callback UI** — bottom-sheet contacts, full-screen call
3. **Bank confirm sheet** — bank-app transfer sheet for COMPLY path
4. **Notification banners** — status-bar drop for boss pressure phases 2+

Everything else in the prompt's "NOT BUILDING" list stays out.

## Files created

- `src/components/chat/ChatShell.tsx` — device frame + status bar + header + body slot + composer slot
- `src/components/chat/StatusBar.tsx` — signal/clock/battery/CitizenOS wordmark
- `src/components/chat/ChatHeader.tsx` — avatar, name, number line, unknown-number amber banner, contacts button
- `src/components/chat/MessageBubble.tsx` — sender/player bubbles, ticks, timestamps, date chip, forwarded label, voice-note bubble (wraps existing VoiceNote), system inset card
- `src/components/chat/TypingIndicator.tsx` — dots with human-rhythm delay helper (~40ms/char, clamp 600–2500, reduced-motion → instant)
- `src/components/chat/SmartReplyChips.tsx` — restyle existing choice options as chips above fake keyboard-suggestion bar; "+" opens action sheet
- `src/components/chat/ActionSheet.tsx` — generic bottom sheet (probes, contacts, transfer live inside)
- `src/components/chat/ContactsSheet.tsx` — 4–6 seeded saved contacts + per-case contacts; Mirror shows "No help here"
- `src/components/chat/CallScreen.tsx` — full-screen outbound + incoming call UI, timer, scripted result text
- `src/components/chat/BankConfirmSheet.tsx` — CitizenPay header, amount, beneficiary (details collapsed), hold-to-confirm
- `src/components/chat/NotificationBanner.tsx` — status-bar drop; single-slot queue
- `src/lib/chat/contacts.ts` — **presentation-only** static contact seed + per-boss-variant contact map (no engine changes)
- `src/lib/chat/timing.ts` — typing-delay helper, reduced-motion detection

## Files modified (routes only, no engine files)

- `src/routes/mirror.$caseId.tsx` — swap the current custom chat frame in `Simulation` for `<ChatShell>`; keep every state hook, every engine call, every session-storage key, every phase flow. VOB button moves into ContactsSheet ("No help here" branch for pure-Mirror; the existing VOB button stays functional). Verdict phase gets the BankConfirmSheet **only** when the case has a defined transfer amount (existing scenario field or scoped derivation from dossier — flagging as RISK if no field exists, then skipping bank sheet for that case).
- `src/routes/boss.$bossId.tsx` — swap the boss conversation view into `<ChatShell>`; wire callback contact tap → existing `playMove(<CALLBACK_MOVE_ID>)` from `boss/engine.ts` (READ-ONLY use of existing exports); wire notification banner to phase ≥ 2 incoming messages.

## Explicitly untouched (per guard)

`src/lib/mirror/engine.ts`, `src/lib/boss/engine.ts`, `src/lib/feed/engine.ts`, any `scenarios.ts`, profile stores, `boss/doctrine.ts`, Supabase. If a needed piece of data (transfer amount, callback move id per variant) isn't already exported, I stop and put it in the RISKS section rather than modifying those files.

## Reduced motion & LITE

- All animations gated by `prefers-reduced-motion` and the existing `visual-quality` context.
- LITE: no blurs on bubbles, no ring pulses (static ring), notifications = static toast.

## Report format

Ends with the requested `===MILVERSE REPORT===` block covering surfaces, files, routes, engine-file audit, callback move ids used, risks, next.

## Non-goals confirmed

No home screen, app grid, browser/Reels app, settings, battery mechanics, Feed migration, free-text input, mic/media capture, uploads, new deps.
