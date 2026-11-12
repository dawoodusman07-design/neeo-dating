# Store compliance checklist

Each item lists the file or screen that satisfies it. ✅ implemented in code · 🟡 implemented, needs your action (account, hosting, legal) · ⏳ not done yet.

## Apple App Store

| Requirement | Status | Where |
|---|---|---|
| 1.2 UGC: filter objectionable material | ✅ | Image moderation on upload (`supabase/functions/moderate-image`, photos stay `pending` until approved — enforced by RLS); text filter (`src/services/textModeration.ts`, `supabase/functions/moderate-text`) |
| 1.2 In-app reporting with timely response | ✅ | Report flow `src/app/report/[id].tsx` from profile (`…` menu), chat (shield + per-message "Does this bother you?"), likes (via profile); human review queue `web/admin/index.html` + `moderation_queue` view; copy promises review within 24 h |
| 1.2 User blocking | ✅ | `src/features/safety/SafetyMenu.tsx`; symmetric block enforced by RLS (`is_blocked_between`) — tested |
| 1.2 Published contact info | 🟡 | In-app: Help & policies → Contact support (`src/app/settings/help.tsx`, `EXPO_PUBLIC_SUPPORT_EMAIL`); add the support URL in App Store Connect |
| 5.1.1(v) In-app account deletion | ✅ | `src/app/settings/delete-account.tsx`: explain → reauthenticate (OTP) → type DELETE → done; server `supabase/functions/delete-account` (storage + RevenueCat + auth user, cascades) ; tested in `e2e:web` and RLS tests |
| 4.8 Sign in with Apple | ✅ n/a | Phone OTP only, no third-party login. If Google/Facebook login is added later, add Sign in with Apple. |
| IAP for subscriptions, no external links | ✅ | RevenueCat (`src/services/purchases.ts`); no external payment links anywhere |
| Restore purchases | ✅ | Paywall "Restore purchase" (`src/app/plus.tsx`) + restored / nothing-to-restore states |
| Clear auto-renew terms | ✅ | Renewal disclosure under the CTA + Terms/Privacy links (`plus.renewal` string) |
| Age rating 18+, age gate | ✅ / 🟡 | DOB gate `src/app/onboarding/dob.tsx` + DB constraint `dob <= now - 18y`; set 18+ in App Store Connect |
| Privacy manifest | ✅ | `app.config.ts → ios.privacyManifests` (collected data types, required-reason APIs, no tracking) |
| App Privacy "nutrition label" | 🟡 | Answers in `STORE_LISTING.md` → enter in App Store Connect |
| Purpose strings that explain WHY | ✅ | `app.config.ts` infoPlist + plugin configs: camera, photos, microphone, location (When In Use), contacts; notifications are explained in-app first (`onboarding/notifications.tsx`) |
| Location When-In-Use only, rounded distance | ✅ | `expo-location` foreground only, background disabled, `Accuracy.Low`; server returns only `rounded_distance_km()` (tested: no lat/lng readable by others) |
| Reviewer demo account + OTP bypass for ONE number | 🟡 | Test number/code set only in the hosted Supabase dashboard, rotated after each review, never committed (README → “App Review test account”); notes in `STORE_LISTING.md` |

## Google Play

| Requirement | Status | Where |
|---|---|---|
| Declare app as Dating | 🟡 | Play Console → App content → Dating app |
| Child Safety Standards: published standards against CSAE | 🟡 | `web/child-safety.html` (host at neeo.app/child-safety) — `[LEGAL REVIEW]`, add named contact |
| CSAE: in-app feedback mechanism | ✅ | Report reason "May be under 18" (prioritised first in `moderation_queue`) |
| CSAE: designated child-safety contact | 🟡 | `childsafety@neeo.app` placeholder in `web/child-safety.html` — name a person |
| UGC: accept ToS before creating content | ✅ | Community agreement step must be accepted before profile is created (`onboarding/agreement.tsx`) |
| UGC: report content AND users; block | ✅ | Report a user (profile/chat) and a specific message (chat bubble); block everywhere |
| Account deletion in-app | ✅ | As above |
| Account deletion via public web page | 🟡 | `web/delete-account.html` (OTP → delete-account function; email fallback). Host at neeo.app/delete-account and enter the URL in Play Console |
| Data safety form | 🟡 | Answers in `STORE_LISTING.md` |
| Latest target API level | ✅ | Expo SDK 58 default target SDK |
| Runtime permissions in context | ✅ | Camera on selfie tap, mic on record tap, location on "Use my location", contacts on "Block contacts", notifications after explainer. Unused permissions blocked in `app.config.ts`. |
| Content rating questionnaire | 🟡 | Answers in `STORE_LISTING.md` (UGC, users interact, shares location approximately) |

## Both stores

| Requirement | Status | Where |
|---|---|---|
| Privacy Policy, Terms, Community Guidelines, Safety Guide hosted + linked in-app | 🟡 | `web/*.html` with `[LEGAL REVIEW]`; linked from Welcome, Agreement, Paywall, Help & policies, Safety centre (`src/lib/links.ts`) |
| Automated image check on upload | ✅ / mocked vendor | `moderate-image` (vendor TBD) |
| Text filter on messages | ✅ | Client nudge + server flag/auto-blur |
| Human review queue with warn / suspend / ban / appeal | ✅ | `web/admin/index.html`, `moderation_actions` trigger updates account status, `appeals` + `appeals_queue`; in-app appeal `settings/appeal.tsx`; tested in RLS suite |
| Encryption in transit | ✅ | Supabase HTTPS only; session tokens in Keychain/Keystore (`expo-secure-store`) |
| Private storage buckets, short-lived signed URLs | ✅ | Buckets `photos`, `voice`, `exports` are private; signed URLs 10 min (`SIGNED_URL_TTL`); blurred variants for non-matches so clear photos never reach them |
| RLS tests proving A cannot read B's private photos/chats | ✅ | `supabase/tests/rls.test.sql` — 42 checks pass (`npm run test:rls`) |
