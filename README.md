# Neeo

Thoughtful dating, at your own pace. Expo (SDK 58) + React Native + TypeScript (strict) + Expo Router, with a Supabase backend, RevenueCat subscriptions and one codebase for iOS and Android.

## Quick start

```bash
npm install
npm start                 # Expo dev server; press i / a, or scan with a dev build
```

The app runs fully offline in **mock mode** by default (`EXPO_PUBLIC_DATA_MODE=mock`): an in-memory backend with seeded profiles, so every screen works in a development build without any keys.

| Mock account | Phone | Code |
|---|---|---|
| New user (goes through onboarding) | any valid number, e.g. `+15555550100` | `123456` |
| Already onboarded (demo, screenshots) | `+15555550199` | `123456` |

Five wrong codes lock sign-in for 15 minutes (lockout state). A date of birth under 18 shows the "not eligible" screen.

Native modules used (camera, audio, screen capture, purchases) need a **development build** (`eas build --profile development`) rather than Expo Go.

### Real backend

1. Create a Supabase project, then `supabase link` and `supabase db push` (applies `supabase/migrations`).
2. Deploy functions: `supabase functions deploy` (see `supabase/README.md` for secrets and webhooks).
3. Copy `.env.example` to `.env.local` and fill in `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, RevenueCat keys, and set `EXPO_PUBLIC_DATA_MODE=supabase`.

## Scripts

| Command | What it does |
|---|---|
| `npm run typecheck` | `tsc --noEmit` (strict, `noUncheckedIndexedAccess`) |
| `npm run lint` | ESLint (expo config + a rule that bans colour literals outside `src/theme/tokens.ts`) |
| `npm run check:tokens` | Proves zero hard-coded colours and zero emoji in `src/` |
| `npm test` | Jest + React Native Testing Library (contrast, logic, mock backend, UI a11y) |
| `npm run test:rls` | Row Level Security isolation tests against a throwaway Postgres |
| `npm run e2e:web` | Playwright E2E of the critical path against the web build of the app |
| `npm run e2e` | Maestro flows (`maestro/`) on a simulator or device |
| `npm run screenshots` | Store screenshots from the real app at 6.7", 6.5" and Android sizes |
| `npm run verify` | typecheck + lint + tokens + tests |

## Layout

```
src/app/          Expo Router routes (screens only)
src/ui/           Design-system components (every state, a11y built in)
src/theme/        Tokens (the only place colours live), ThemeProvider, contrast utils
src/features/     Screen building blocks (discover, chat, profile, safety, verify, voice)
src/data/         API interface, mock + Supabase implementations, TanStack Query hooks
src/services/     Purchases, moderation, liveness, AI assist, notifications, screen protection
src/i18n/         i18next (en; ur/ar RTL scaffolding)
supabase/         Migrations (RLS on every table), Edge Functions, RLS tests
web/              Public pages: delete-account form, legal placeholders, admin moderation queue
maestro/          E2E flows for devices
store/            Store screenshots
```

See `PROGRESS.md` for status, `COMPLIANCE.md` for the App Store / Google Play checklist, `STORE_LISTING.md` for listing copy.
