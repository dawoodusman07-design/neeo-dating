# Neeo — progress

_Last updated: 2026-11-12_

## Verification status (all run in this repo, all passing)

| Check | Result |
|---|---|
| `npx tsc --noEmit` (strict) | ✅ 0 errors |
| `npx expo lint` | ✅ 0 errors, 0 warnings |
| `npm run check:tokens` | ✅ 0 hard-coded colours, 0 emoji in `src/` |
| `npm test` (Jest + RNTL) | ✅ 88 tests: WCAG contrast, age gate, distance rounding, chat cap, nudges, validation, mock backend paths, membership states, Plus rules, synced lists, UI kit accessibility |
| `npm run test:rls` | ✅ 74 RLS / server-rule checks against real Postgres 16 (see `supabase/tests/rls.test.sql`) |
| `npm run e2e:web` | ✅ 22 steps in the real app (web build): sign-up errors, age gate, free likes, Plus-locked filters, purchase failed / pending → confirmed / restore, travel mode, membership states, like → match → chat, nudge, report, block, end connection, support, reauth failure, delete |
| `expo export --platform android` | ✅ Hermes bundle builds |
| Maestro flows (`maestro/`) | ⚠️ Written, **not run** — this environment has no iOS simulator / Android emulator |

## Decisions applied (2026-11-12)

1. **Plus model — package model.** Seeing who liked you and replying is **free** (the "Liked you" blur is gone). **Neeo Plus = advanced filters** (verified only, voice prompts only), **saved preference presets** and **travel mode**. Enforced server-side by `preferences_plus_guard` + `has_plus()` (free users can switch Plus features off but never on; after Plus ends, stored filters are ignored by `daily_introductions`). Paywall, FAQ, STORE_LISTING.md, tests and E2E updated.
2. **Minimum 3 photos** — kept.
3. **Photo privacy v1** — one "Private photos" switch + per-person sharing/revoking. See "v2" below.
4. **Headline** — "Make room for something real." in the app, STORE_LISTING.md, web/index.html and the store screenshots.
5. **Synced lists** — saved profiles, saved date plans and private notes are stored in Supabase (`saved_profiles`, `date_plans`, `profile_notes`) with owner-only RLS; preference presets live in `preferences.presets` (Plus-gated). Only unsent message drafts stay on the device.

## v2 backlog

- **Per-photo privacy** (package 13 / privacy.svg): choose which individual photos stay private and share them match by match. Needs a per-photo visibility column, per-photo blurred variants and storage-policy changes; v1 deliberately ships one switch + per-person grants.
- Mock backend: daily introductions don't apply preference filters (the real filter logic is in SQL and RLS-tested).

## Design package pass (2026-11-12)

The original design package is now in `reference-prototype/`; `npm run gap-report` regenerates `GAP_REPORT.md`.

- **Coverage:** 123 screens checked (58 inventory + 7 core + 58 Appendix B): **123 built, 0 partial, 0 missing** (after the decisions above).
- **Copy:** aligned with the package's tone; 36 fields still differ, each with a recorded reason (form-field samples, sample data, v2 rules, or conflicts).
- **Conflicts:** 18 listed in `GAP_REPORT.md`, all decided.
- **Membership lifecycle (30–45):** every state comes from RevenueCat customer info (`membershipFromEntitlement`, unit-tested). Pending purchases re-sync with "Check purchase status".
- **Now working states:** OTP rate limit and lockout, photo moderation and reorder, notification preferences, blocked accounts and unblock, export ready/download/expiry, reauthentication failure, support conversation, appeal outcome.
- **Verification:** Jest 83 tests; RLS suite 54 checks (an earlier commit message said 57 — 54 is the real count); web E2E 19 steps including purchase failed, pending → confirmed, restore none/success, and renewal-off / billing-issue / expired.

## Phases

### 1. Foundation — ✅ done
- Expo SDK 58, React Native 0.88, TypeScript strict, Expo Router (`src/app`), typed routes.
- `src/theme/tokens.ts` is the single colour source. ESLint rule + `scripts/check-tokens.mjs` enforce it.
- Inter (400–800) via `@expo-google-fonts/inter`; all `Text` uses `allowFontScaling` (max 2×).
- `src/ui/`: Button, IconButton (44pt hit area guaranteed), Chip, Toggle (native Switch), ListRow/ListGroup, Card, ProfilePhoto (blur + pending), Avatar, TextField (label + error text + icon), ProgressBar (+ segmented), Sheet, Toast (announced), EmptyState/ErrorState, Segmented, TabBar, Screen, VerifiedBadge.
- Lucide outline icons, 1.75 stroke, one icon per meaning (`src/ui/icons.ts`); directional icons mirror in RTL.
- `/dev/components` renders every component in every state in light AND dark. Dev menu at `/dev` (force RTL, mock purchase outcomes, all state screens).
- Dark mode follows the system with an in-app override (You → Appearance). Reduce Motion honoured (like/pass 220 ms ease-out, match 280 ms scale-in).

### 2. Auth & onboarding — ✅ done
Phone → OTP (resend timer, wrong-code, expired, lockout) → DOB (under-18 "not eligible", no data kept) → name & pronouns → intention → photos (min 3, max 6, reorder, upload / moderation-pending / failed-retry / rejected states) → 3 prompts (+ optional voice answer) → date ideas (≤3) → location (When-In-Use, coarse, typed-city fallback) → community agreement (must accept) → notifications (explainer, then system prompt) → selfie verification (skippable, benefits shown) → profile review.

### 3. Discover, likes & matching — ✅ done
Daily introductions ("1 of 8"), hero card with segmented photo progress, intention chip, undo + save on the card, bottom scrim (name, age, verified, city, rounded km, pronouns), first prompt peek, "See more about Maya", fixed Pass (56 px) + "Like Maya". Likes can target a photo or a prompt with a comment. "You're all caught up" state with next batch time. Match celebration. Likes tab (blurred + Plus upsell for Free, Sent tab).

### 4. Chat — ✅ done
Realtime (Supabase channel; simulated in mock), day separators, timestamps, read state, bubbles (theirs start / mine end), date-idea card (Accept / Suggest a time), Plan a date sheet, voice notes, send disabled until text, "Take your time — there's no reply countdown", "Are you sure?" nudge before sending, auto-blur + "Does this bother you?" on receiving, soft cap of 10 open chats with a nudge to close quiet ones, opt-in AI conversation starters (labelled).

### 5. Privacy & safety — ✅ done
Blur photos (default on), screenshot protection (default on; Android FLAG_SECURE, iOS detect + app-switcher blur + system note, described honestly), who can find me, request inbox (Share / Decline), revoke access, block / report / unmatch from profile, chat and likes, block contacts (hashed on device), date check-in with trusted contact + 15-minute escalation, chaperone (wali) mode, safety centre, appeal, admin moderation queue (`web/admin`).

### 6. Monetisation & settings — ✅ done (store wiring pending accounts)
RevenueCat paywall (comparison table with text alternatives, plan radio group, renewal disclosure, Restore · Terms · Privacy; prices only from the store), purchase success / pending / failed / cancelled, restore / nothing-to-restore, billing issue. All settings: preferences, notifications, quiet hours, region & language, appearance + AI toggle, help & policies, pause, export my data, delete account (reauth → explain → confirm → done) + web deletion page.

### 7. Store readiness — 🟡 partly done
- ✅ `app.config.ts`: bundle IDs per profile, permission purpose strings that explain why, blocked unused Android permissions, iOS privacy manifest, splash via plugin.
- ✅ `eas.json` with development / preview / production profiles + submit config.
- ✅ Placeholder icon / adaptive icon / splash generated from brand tokens (`scripts/make-brand-assets.py`).
- ✅ Store screenshots generated from the real app: `store/screenshots/{iphone-6.7,iphone-6.5,android-phone}` (1290×2796, 1242×2688, 1080×2400).
- ✅ `STORE_LISTING.md`, `COMPLIANCE.md`.
- ⏳ EAS production builds, TestFlight, Play internal track — need your accounts (see "What you must do").

## What is mocked (behind interfaces, swap without UI changes)

| Area | Where | Real implementation needed |
|---|---|---|
| Face liveness vendor | `src/services/verification.ts`, `supabase/functions/verify-liveness` | Choose FaceTec / AWS Face Liveness / Persona / Veriff. Without a vendor the server never auto-verifies (returns manual review). |
| Image moderation | `supabase/functions/moderate-image` | Choose Rekognition / Vision SafeSearch / Hive; set `MODERATION_API_URL/KEY`. Currently approves everything when unset. |
| Text moderation | `src/services/textModeration.ts` (client nudge) + `supabase/functions/moderate-text` (server flag) | Keyword lists today; swap in an LLM/moderation API. |
| AI profile tips & conversation starters | `src/services/aiAssist.ts` | Rule-based mock; production should call a server function (never ship model keys). Opt-in, labelled "AI suggestion". |
| SMS for check-in escalation | `supabase/functions/checkin-escalation` | Choose an SMS provider; set `SMS_WEBHOOK_URL`. |
| Store / prices | `src/services/purchases.ts` | Mock "Test store" when no RevenueCat key; real prices come from RevenueCat offerings. |
| Backend in dev | `src/data/mock.ts` | `src/data/supabase.ts` is the production implementation. |

## Known gaps / honest notes

- **The reference prototype was not in the repo** (`./reference-prototype/` was missing), so screens and copy were built from the spec in the brief, not from the 124-screen prototype. Once you add it, I can diff screen-by-screen and fill any gaps.
- **Token change:** dark `actionPressed` was `#C94770` in the brief, which gives only 4.04:1 under `onAction` text. Changed to `#D4507A` (4.57:1) so pressed buttons pass AA. Everything else is as specified.
- **Photo reordering** uses accessible move-earlier / move-later buttons rather than a drag gesture. A drag gesture (reanimated + gesture-handler) is still to do; the buttons must stay for screen-reader users anyway.
- `src/data/supabase.ts` type-checks and follows the schema, and the schema/RLS are tested, but the client has **not been run against a live Supabase project** yet. Edge Functions are written but not deployed or tested.
- Preferences are saved and applied in `daily_introductions` (RLS-tested). Plus features are enforced server-side from the `entitlements` table, which the RevenueCat webhook keeps current.
- Friend's Take shows on profiles; the invite-a-friend flow is not built. Local events (P3) not started.
- Waveforms for newly recorded voice clips are placeholders (no amplitude analysis yet).
- Urdu and Arabic contain only a few strings (fallback to English) and are marked `[TRANSLATION REVIEW]`. RTL layout uses start/end throughout but has not been checked visually on a device.
- 200% font scale, VoiceOver and TalkBack have been designed for (roles, labels, states, live regions, hit areas) but **not tested on devices**.
- Store screenshots were captured from the web build of the same app; re-capture from device builds before submission so the native status bar and system fonts are exact.
- The app icon and splash are token-generated placeholders; a designer should replace them.

## What you must do manually

1. **Accounts:** Apple Developer Program, Google Play Console, Expo (EAS), Supabase project, RevenueCat project.
2. **Store products:** create the Plus subscriptions in App Store Connect and Play Console, attach them to a RevenueCat offering, set real prices per country.
3. **Secrets:** Supabase keys in `.env.local` / EAS secrets; Edge Function secrets (`WEBHOOK_SECRET`, `REVENUECAT_*`, `MODERATION_*`, `LIVENESS_*`, `SMS_WEBHOOK_URL`).
4. **Vendor contracts:** liveness, image moderation, SMS, (optionally) LLM moderation.
5. **Legal review:** every page in `web/` marked `[LEGAL REVIEW]`; named child-safety contact; support/privacy mailboxes.
6. **Host `web/`** at `neeo.app` (privacy, terms, community guidelines, safety, child safety, delete-account) and the admin page somewhere private.
7. **Translations:** native-speaker Urdu and Arabic.
8. **Device QA:** run `maestro test maestro/` on iOS and Android, VoiceOver/TalkBack passes, 200% text, RTL.
9. **App Review:** create the reviewer demo account (test number `+1 555 555 0100`, code `123456` in `supabase/config.toml`) and paste the notes from `STORE_LISTING.md`.
