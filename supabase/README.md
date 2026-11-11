# Supabase backend

- `migrations/` — schema. **RLS is enabled on every table** (17 tables + entitlements). Users cannot write `verified`, `status`, photo `status`, or create matches; those are server-managed.
- `tests/rls.test.sql` — 42 isolation checks. Run `supabase/tests/run-rls-tests.sh` (plain Postgres + `tests/supabase_shim.sql`, no Docker) or against `supabase start` with psql.
- `functions/` — Edge Functions (Deno):

| Function | Trigger | Secrets |
|---|---|---|
| `moderate-image` | Storage webhook on `photos` INSERT | `WEBHOOK_SECRET`, `MODERATION_API_URL`, `MODERATION_API_KEY` |
| `moderate-text` | Database webhook on `messages` INSERT | `WEBHOOK_SECRET` |
| `verify-liveness` | App (selfie check) | `LIVENESS_API_URL`, `LIVENESS_API_KEY` |
| `delete-account` | App + web deletion page | `REVENUECAT_SECRET_KEY` |
| `export-data` | App | — |
| `checkin-escalation` | Cron every minute | `SMS_WEBHOOK_URL` |
| `revenuecat-webhook` | RevenueCat webhook | `REVENUECAT_WEBHOOK_AUTH` |
| `blocked-names`, `screenshot-notice`, `account` | App | — |

Deploy: `supabase link --project-ref <ref> && supabase db push && supabase functions deploy`.
Make a moderator: `insert into admins (user_id) values ('<auth user id>');`
