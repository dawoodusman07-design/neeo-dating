// Shared helpers for Edge Functions (Deno).
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' };

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });
}

/** Client acting as the calling user (RLS applies). */
export function userClient(req: Request): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
}

/** Service-role client. Only use for actions the user is NOT allowed to do directly. */
export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
}

export async function requireUser(req: Request) {
  const { data, error } = await userClient(req).auth.getUser();
  if (error || !data.user) throw new Response('Unauthorized', { status: 401, headers: cors });
  return data.user;
}
