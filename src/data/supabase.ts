/**
 * Production backend: Supabase (Postgres + RLS, phone OTP, private Storage, Realtime).
 * Every query runs as the signed-in user; isolation is enforced by RLS
 * (see supabase/migrations and supabase/tests/rls.test.sql), not by this file.
 */
import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { NeeoApi } from './api';
import { ApiError, type Match, type Message, type Photo, type Profile, type MyProfile, type Preferences, type SupportTicket, type PreferencePreset, type SavedProfile, type DatePlan } from './types';
import { completeness } from './mock';

const SIGNED_URL_TTL = 60 * 10; // 10 minutes

// Session tokens live in the Keychain / Keystore, never in AsyncStorage.
const secureStorage = {
  getItem: (k: string) => SecureStore.getItemAsync(k),
  setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
  removeItem: (k: string) => SecureStore.deleteItemAsync(k),
};

export function createSupabaseClient(): SupabaseClient {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase URL / anon key missing. See .env.example');
  return createClient(url, key, {
    auth: { storage: secureStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  });
}

type ProfileRow = {
  id: string; first_name: string; dob: string; pronouns: string | null; intention: Profile['intention'];
  city: string | null; verified: boolean; status: string; chaperone_enabled: boolean; basics: string[];
  date_ideas: string[]; blur_photos: boolean;
  photos?: { id: string; storage_path: string; blurred_path: string | null; position: number; status: Photo['status'] }[];
  prompts?: { id: string; question: string; answer: string; voice_path: string | null; voice_duration_sec: number | null; position: number }[];
  friends_takes?: { id: string; author_name: string; body: string }[];
};

const PROFILE_SELECT = '*, photos(id, storage_path, blurred_path, position, status), prompts(*), friends_takes(id, author_name, body)';

function ageOf(dob: string) {
  const d = new Date(dob);
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
  return a;
}

function mapError(e: unknown): never {
  const err = e as { message?: string; status?: number; code?: string };
  const msg = err?.message ?? '';
  if (/plus_required/i.test(msg)) throw new ApiError('plus_required', msg);
  if (/rate limit|too many/i.test(msg)) throw new ApiError('otp_locked', msg, 15 * 60);
  if (/expired/i.test(msg)) throw new ApiError('expired_code', msg);
  if (/invalid|token/i.test(msg) && err.status === 403) throw new ApiError('invalid_code', msg);
  if (/JWT|session/i.test(msg)) throw new ApiError('session_expired', msg);
  if (/network|fetch/i.test(msg)) throw new ApiError('offline', msg);
  throw new ApiError('unknown', msg);
}

export function createSupabaseApi(sb: SupabaseClient = createSupabaseClient()): NeeoApi {
  const uid = async () => {
    const { data } = await sb.auth.getUser();
    if (!data.user) throw new ApiError('session_expired');
    return data.user.id;
  };

  async function signed(bucket: 'photos' | 'voice', path: string | null | undefined) {
    if (!path) return '';
    const { data } = await sb.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL);
    return data?.signedUrl ?? '';
  }

  async function toProfile(row: ProfileRow, opts: { distance?: boolean } = {}): Promise<Profile> {
    const me = await uid();
    const clear = row.id === me ? true : ((await sb.rpc('can_see_clear_photos', { target: row.id })).data as boolean);
    const photos = await Promise.all(
      [...(row.photos ?? [])]
        .filter((p) => p.status === 'approved' || row.id === me)
        .sort((a, b) => a.position - b.position)
        .map(async (p) => ({
          id: p.id,
          status: p.status,
          blurred: !clear,
          uri: await signed('photos', clear ? p.storage_path : p.blurred_path),
        })),
    );
    const prompts = await Promise.all(
      [...(row.prompts ?? [])]
        .sort((a, b) => a.position - b.position)
        .map(async (p) => ({
          id: p.id,
          question: p.question,
          answer: p.answer,
          voice: p.voice_path ? { uri: await signed('voice', p.voice_path), durationSec: p.voice_duration_sec ?? 0, waveform: [] } : undefined,
        })),
    );
    const distanceKm = opts.distance ? ((await sb.rpc('rounded_distance_km', { target: row.id })).data as number | null) ?? undefined : undefined;
    return {
      id: row.id,
      firstName: row.first_name,
      age: ageOf(row.dob),
      pronouns: row.pronouns ?? undefined,
      city: row.city ?? '',
      distanceKm,
      intention: row.intention,
      verified: row.verified,
      photos,
      prompts,
      basics: row.basics,
      dateIdeas: row.date_ideas,
      friendsTakes: (row.friends_takes ?? []).map((f) => ({ id: f.id, author: f.author_name, text: f.body })),
      chaperoneEnabled: row.chaperone_enabled,
    };
  }

  async function profileById(id: string) {
    const { data, error } = await sb.from('profiles').select(PROFILE_SELECT).eq('id', id).single();
    if (error || !data) throw new ApiError('unknown', 'Profile not available');
    return toProfile(data as ProfileRow, { distance: true });
  }

  function toMessage(r: Record<string, unknown>): Message {
    return {
      id: r.id as string,
      matchId: r.match_id as string,
      senderId: r.kind === 'system' ? 'system' : (r.sender_id as string),
      kind: r.kind as Message['kind'],
      body: r.body as string,
      createdAt: r.created_at as string,
      readAt: (r.read_at as string) ?? undefined,
      flagged: r.flagged as boolean,
      dateProposal: (r.date_proposal as Message['dateProposal']) ?? undefined,
    };
  }

  async function uploadFile(bucket: 'photos' | 'voice', path: string, localUri: string, contentType: string) {
    const body = await (await fetch(localUri)).arrayBuffer();
    const { error } = await sb.storage.from(bucket).upload(path, body, { contentType, upsert: false });
    if (error) throw new ApiError('upload_failed', error.message);
  }

  const api: NeeoApi = {
    auth: {
      async sendOtp(phone) {
        const { error } = await sb.auth.signInWithOtp({ phone });
        if (error) mapError(error);
        return { resendInSec: 30 };
      },
      async verifyOtp(phone, token) {
        const { data, error } = await sb.auth.verifyOtp({ phone, token, type: 'sms' });
        if (error || !data.user) mapError(error);
        const { data: prof } = await sb.from('profiles').select('id').eq('id', data.user!.id).maybeSingle();
        return { userId: data.user!.id, onboarded: !!prof };
      },
      async reauthenticate(token) {
        const { data } = await sb.auth.getUser();
        const { error } = await sb.auth.verifyOtp({ phone: data.user?.phone ?? '', token, type: 'sms' });
        if (error) mapError(error);
      },
      async signOut() {
        await sb.auth.signOut();
      },
    },
    me: {
      async get() {
        const id = await uid();
        const { data, error } = await sb.from('profiles').select(PROFILE_SELECT).eq('id', id).single();
        if (error) mapError(error);
        const row = data as ProfileRow;
        const p = await toProfile(row);
        const { data: user } = await sb.auth.getUser();
        const me: MyProfile = { ...p, phone: user.user?.phone ?? '', dob: row.dob, paused: row.status === 'paused', completeness: 0 };
        return { ...me, completeness: completeness(me) };
      },
      async update(patch) {
        const id = await uid();
        const row: Record<string, unknown> = {};
        if (patch.firstName !== undefined) row.first_name = patch.firstName;
        if (patch.pronouns !== undefined) row.pronouns = patch.pronouns;
        if (patch.intention !== undefined) row.intention = patch.intention;
        if (patch.dateIdeas !== undefined) row.date_ideas = patch.dateIdeas;
        if (patch.basics !== undefined) row.basics = patch.basics;
        if (patch.city !== undefined) row.city = patch.city;
        if (patch.chaperoneEnabled !== undefined) row.chaperone_enabled = patch.chaperoneEnabled;
        if (Object.keys(row).length) {
          const { error } = await sb.from('profiles').update(row).eq('id', id);
          if (error) mapError(error);
        }
        return api.me.get();
      },
      async completeOnboarding(input) {
        const id = await uid();
        const { error } = await sb.from('profiles').insert({
          id, first_name: input.firstName, dob: input.dob, pronouns: input.pronouns || null,
          intention: input.intention, city: input.city, date_ideas: input.dateIdeas,
          gender: input.gender ?? null, gender_text: input.genderText ?? null, intention_note: input.intentionNote ?? null,
        });
        if (error) mapError(error);
        if (input.preferences) await api.me.setPreferences(input.preferences);
        await sb.from('profile_private').upsert({ user_id: id });
        for (const [i, uri] of input.photoUris.entries()) {
          const path = `${id}/${Date.now()}_${i}.jpg`;
          await uploadFile('photos', path, uri, 'image/jpeg');
          await sb.from('photos').insert({ user_id: id, storage_path: path, position: i });
        }
        for (const [i, p] of input.prompts.entries()) {
          let voice_path: string | null = null;
          if (p.voice?.uri) {
            voice_path = `${id}/prompts/${Date.now()}_${i}.m4a`;
            await uploadFile('voice', voice_path, p.voice.uri, 'audio/mp4');
          }
          await sb.from('prompts').insert({ user_id: id, question: p.question, answer: p.answer, voice_path, voice_duration_sec: p.voice?.durationSec ?? null, position: i });
        }
        return api.me.get();
      },
      async uploadPhoto(localUri) {
        const id = await uid();
        const path = `${id}/${Date.now()}.jpg`;
        await uploadFile('photos', path, localUri, 'image/jpeg');
        const { count } = await sb.from('photos').select('id', { count: 'exact', head: true }).eq('user_id', id);
        const { data, error } = await sb.from('photos').insert({ user_id: id, storage_path: path, position: count ?? 0 }).select('id, status').single();
        if (error) mapError(error);
        // moderate-image Edge Function is triggered by a Storage webhook and flips status.
        return { id: (data as { id: string }).id, uri: localUri, status: 'pending' as const };
      },
      async setVerified() {
        // Verified is server-managed (column not writable by users). The
        // verify-liveness Edge Function sets it after the vendor confirms.
      },
      async reorderPhotos(ids) {
        await Promise.all(ids.map((pid, position) => sb.from('photos').update({ position }).eq('id', pid)));
      },
      async removePhoto(pid) {
        const { data } = await sb.from('photos').select('storage_path').eq('id', pid).single();
        await sb.from('photos').delete().eq('id', pid);
        if (data?.storage_path) await sb.storage.from('photos').remove([data.storage_path]);
      },
      async preferences(): Promise<Preferences> {
        const { data } = await sb.from('preferences').select('*').maybeSingle();
        return data
          ? {
              genders: data.genders, ageMin: data.age_min, ageMax: data.age_max, maxKm: data.max_km, intentions: data.intentions,
              verifiedOnly: data.verified_only, voiceOnly: data.voice_only, travelCity: data.travel_city,
            }
          : { genders: [], ageMin: 18, ageMax: 99, maxKm: 50, intentions: ['long_term', 'life_partner', 'figuring_out'], verifiedOnly: false, voiceOnly: false, travelCity: null };
      },
      async setPreferences(p) {
        const id = await uid();
        const { error } = await sb.from('preferences').upsert({
          user_id: id, genders: p.genders, age_min: p.ageMin, age_max: p.ageMax, max_km: p.maxKm, intentions: p.intentions,
          verified_only: p.verifiedOnly, voice_only: p.voiceOnly, travel_city: p.travelCity, updated_at: new Date().toISOString(),
        });
        if (error) mapError(error);
      },
      async presets(): Promise<PreferencePreset[]> {
        const { data } = await sb.from('preferences').select('presets').maybeSingle();
        return (data?.presets as PreferencePreset[] | undefined) ?? [];
      },
      async savePreset(name, prefs) {
        const preset: PreferencePreset = { id: `pre_${Date.now()}`, name, prefs };
        const current = await api.me.presets();
        const { error } = await sb.from('preferences').update({ presets: [...current, preset] }).eq('user_id', await uid());
        if (error) mapError(error);
        return preset;
      },
      async deletePreset(presetId) {
        const current = await api.me.presets();
        await sb.from('preferences').update({ presets: current.filter((p) => p.id !== presetId) }).eq('user_id', await uid());
      },
      async review() {
        const { data } = await sb.rpc('my_account_review');
        const row = (data as { status: string; reason: string | null }[] | null)?.[0];
        const status = row?.status === 'suspended' || row?.status === 'banned' ? 'suspended' : row?.status === 'under_review' ? 'under_review' : 'active';
        return { status, reason: row?.reason ?? undefined };
      },
      async pause(paused) {
        const { error } = await sb.functions.invoke('account', { body: { action: paused ? 'pause' : 'unpause' } });
        if (error) mapError(error);
      },
      async exportData() {
        const { data, error } = await sb.functions.invoke('export-data', { body: {} });
        if (error) mapError(error);
        return data as { status: 'preparing' | 'ready'; url?: string; expiresAt?: string };
      },
      async deleteAccount() {
        // Removes storage objects, revokes RevenueCat alias, then calls delete_my_account().
        const { error } = await sb.functions.invoke('delete-account', { body: {} });
        if (error) mapError(error);
        await sb.auth.signOut();
      },
      async setHashedContacts(hashes) {
        const id = await uid();
        const { error } = await sb.from('profile_private').upsert({ user_id: id, contact_hashes: hashes });
        if (error) mapError(error);
      },
    },
    discover: {
      async introductions() {
        const { data, error } = await sb.rpc('daily_introductions', { lim: 8 });
        if (error) mapError(error);
        const rows = (data ?? []) as { id: string }[];
        const items = await Promise.all(rows.map((r) => profileById(r.id)));
        const next = new Date();
        next.setDate(next.getDate() + 1);
        next.setHours(9, 0, 0, 0);
        return { items, total: 8, seen: 8 - items.length, nextAt: next.toISOString() };
      },
      async like(profileId, target, comment) {
        const me = await uid();
        const { error } = await sb.from('likes').insert({ from_id: me, to_id: profileId, target_kind: target?.kind, target_id: target?.id, comment: comment || null });
        if (error) mapError(error);
        const { data } = await sb.from('matches').select('id').or(`and(user_a.eq.${[me, profileId].sort()[0]},user_b.eq.${[me, profileId].sort()[1]})`).maybeSingle();
        return { matchId: data?.id };
      },
      async pass(profileId) {
        const me = await uid();
        await sb.from('passes').insert({ from_id: me, to_id: profileId });
      },
      async undo() {
        const me = await uid();
        const { data } = await sb.from('passes').select('to_id').eq('from_id', me).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (!data) return null;
        await sb.from('passes').delete().eq('from_id', me).eq('to_id', data.to_id);
        return profileById(data.to_id);
      },
      async save() {
        // Saved profiles: stored client-side for now (see PROGRESS.md).
      },
      profile: profileById,
    },
    likes: {
      async received() {
        const me = await uid();
        const { data, error } = await sb.from('likes').select('*').eq('to_id', me).order('created_at', { ascending: false });
        if (error) mapError(error);
        return Promise.all((data ?? []).map(async (l) => ({
          id: l.id, comment: l.comment ?? undefined, createdAt: l.created_at,
          target: l.target_kind ? { kind: l.target_kind, id: l.target_id } : undefined,
          profile: await profileById(l.from_id),
        })));
      },
      async sent() {
        const me = await uid();
        const { data, error } = await sb.from('likes').select('*').eq('from_id', me).order('created_at', { ascending: false });
        if (error) mapError(error);
        return Promise.all((data ?? []).map(async (l) => ({ id: l.id, comment: l.comment ?? undefined, createdAt: l.created_at, profile: await profileById(l.to_id) })));
      },
    },
    matches: {
      async list() {
        const me = await uid();
        const { data, error } = await sb.from('matches').select('*').order('created_at', { ascending: false });
        if (error) mapError(error);
        return Promise.all((data ?? []).map(async (m): Promise<Match> => {
          const other = m.user_a === me ? m.user_b : m.user_a;
          const { data: last } = await sb.from('messages').select('*').eq('match_id', m.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
          const { count } = await sb.from('messages').select('id', { count: 'exact', head: true }).eq('match_id', m.id).neq('sender_id', me).is('read_at', null);
          return { id: m.id, profile: await profileById(other), matchedAt: m.created_at, lastMessage: last ? toMessage(last) : undefined, unread: count ?? 0, closed: (m.closed_by as string[]).includes(me), endedAt: m.unmatched_at ?? undefined };
        }));
      },
      async get(id) {
        const list = await api.matches.list();
        const m = list.find((x) => x.id === id);
        if (!m) throw new ApiError('unknown', 'Match not found');
        return m;
      },
      async close(id) {
        const me = await uid();
        const { data } = await sb.from('matches').select('closed_by').eq('id', id).single();
        await sb.from('matches').update({ closed_by: [...((data?.closed_by as string[]) ?? []), me] }).eq('id', id);
      },
      async unmatch(id) {
        await sb.from('matches').update({ unmatched_at: new Date().toISOString() }).eq('id', id);
      },
    },
    messages: {
      async list(matchId) {
        const { data, error } = await sb.from('messages').select('*').eq('match_id', matchId).order('created_at');
        if (error) mapError(error);
        return (data ?? []).map(toMessage);
      },
      async send(matchId, input) {
        const me = await uid();
        let voice_path: string | null = null;
        if (input.voice?.uri) {
          voice_path = `${me}/chat/${matchId}/${Date.now()}.m4a`;
          await uploadFile('voice', voice_path, input.voice.uri, 'audio/mp4');
        }
        const { data, error } = await sb.from('messages').insert({
          match_id: matchId, sender_id: me, kind: input.kind, body: input.body,
          voice_path, voice_duration_sec: input.voice?.durationSec ?? null, date_proposal: input.dateProposal ?? null,
        }).select('*').single();
        if (error) mapError(error);
        return toMessage(data);
      },
      async respondToDate(messageId, status) {
        const { data } = await sb.from('messages').select('date_proposal').eq('id', messageId).single();
        await sb.from('messages').update({ date_proposal: { ...(data?.date_proposal ?? {}), status } }).eq('id', messageId);
      },
      async markRead(matchId) {
        const me = await uid();
        await sb.from('messages').update({ read_at: new Date().toISOString() }).eq('match_id', matchId).neq('sender_id', me).is('read_at', null);
      },
      subscribe(matchId, onMessage) {
        const channel = sb
          .channel(`messages:${matchId}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, (payload) =>
            onMessage(toMessage(payload.new as Record<string, unknown>)),
          )
          .subscribe();
        return () => {
          sb.removeChannel(channel);
        };
      },
      async notifyScreenshot(matchId) {
        await sb.functions.invoke('screenshot-notice', { body: { matchId } });
      },
    },
    safety: {
      async block(profileId) {
        const me = await uid();
        const { error } = await sb.from('blocks').insert({ blocker_id: me, blocked_id: profileId });
        if (error && error.code !== '23505') mapError(error);
      },
      async unblock(profileId) {
        const me = await uid();
        await sb.from('blocks').delete().eq('blocker_id', me).eq('blocked_id', profileId);
      },
      async blocked() {
        const { data } = await sb.from('blocks').select('blocked_id, created_at');
        // Blocked profiles are no longer readable via RLS, so names come from a definer function.
        const { data: names } = await sb.functions.invoke('blocked-names', { body: { ids: (data ?? []).map((b) => b.blocked_id) } });
        return (data ?? []).map((b) => ({ id: b.blocked_id, firstName: (names as Record<string, string> | null)?.[b.blocked_id] ?? '—', blockedAt: b.created_at }));
      },
      async report(profileId, reason, details, messageId) {
        const me = await uid();
        const { data, error } = await sb.from('reports').insert({ reporter_id: me, reported_id: profileId, reason, details, message_id: messageId ?? null }).select('id').single();
        if (error) mapError(error);
        return { reportId: data.id };
      },
      async createCheckIn(input) {
        const me = await uid();
        const { data, error } = await sb.from('check_ins').insert({
          user_id: me, match_id: input.matchId, place: input.place, starts_at: input.startsAt, check_in_at: input.checkInAt,
          contact_name: input.contact.name, contact_phone: input.contact.phone,
        }).select('*').single();
        if (error) mapError(error);
        return { id: data.id, matchId: input.matchId, place: input.place, startsAt: input.startsAt, checkInAt: input.checkInAt, contact: input.contact, status: 'scheduled' };
      },
      async confirmCheckIn(id) {
        await sb.from('check_ins').update({ status: 'checked_in' }).eq('id', id);
      },
      async appeal(text) {
        const me = await uid();
        const { data, error } = await sb.from('appeals').insert({ user_id: me, body: text }).select('*').single();
        if (error) mapError(error);
        return { id: data.id, body: data.body, createdAt: data.created_at, status: data.status };
      },
      async appeals() {
        const { data } = await sb.from('appeals').select('*').order('created_at', { ascending: false });
        return (data ?? []).map((a) => ({ id: a.id, body: a.body, createdAt: a.created_at, status: a.status, outcomeNote: a.outcome_note ?? undefined }));
      },
    },
    privacy: {
      async requests() {
        const me = await uid();
        const { data } = await sb.from('photo_access').select('*').eq('owner_id', me).order('created_at', { ascending: false });
        return Promise.all((data ?? []).map(async (r) => ({
          id: r.id, status: r.status, createdAt: r.created_at, direction: r.status === 'pending' ? ('incoming' as const) : ('granted' as const),
          profile: await profileById(r.viewer_id),
        })));
      },
      async respond(id, decision) {
        await sb.from('photo_access').update({ status: decision }).eq('id', id);
      },
      async revoke(id) {
        await sb.from('photo_access').update({ status: 'revoked' }).eq('id', id);
      },
      async requestAccess(profileId) {
        const me = await uid();
        await sb.from('photo_access').insert({ owner_id: profileId, viewer_id: me });
      },
      async grant(profileId) {
        const me = await uid();
        const { error } = await sb.from('photo_access').upsert({ owner_id: me, viewer_id: profileId, status: 'shared' }, { onConflict: 'owner_id,viewer_id' });
        if (error) mapError(error);
      },
    },
    support: {
      async create({ topic, body, attachmentUri }) {
        const me = await uid();
        let attachment_path: string | null = null;
        if (attachmentUri) {
          attachment_path = `${me}/support/${Date.now()}.jpg`;
          await uploadFile('photos', attachment_path, attachmentUri, 'image/jpeg');
        }
        const { data, error } = await sb.from('support_tickets').insert({ user_id: me, topic, attachment_path }).select('id').single();
        if (error) mapError(error);
        await sb.from('support_messages').insert({ ticket_id: data.id, sender: 'user', body });
        return api.support.get(data.id);
      },
      async list() {
        const { data } = await sb.from('support_tickets').select('id').order('created_at', { ascending: false });
        return Promise.all((data ?? []).map((t) => api.support.get(t.id)));
      },
      async get(id): Promise<SupportTicket> {
        const { data: t, error } = await sb.from('support_tickets').select('*').eq('id', id).single();
        if (error) mapError(error);
        const { data: msgs } = await sb.from('support_messages').select('*').eq('ticket_id', id).order('created_at');
        return {
          id: t.id, reference: t.reference, topic: t.topic, status: t.status, createdAt: t.created_at,
          messages: (msgs ?? []).map((m) => ({ id: m.id, from: m.sender === 'user' ? ('me' as const) : ('support' as const), body: m.body, createdAt: m.created_at })),
        };
      },
      async reply(id, body) {
        const { error } = await sb.from('support_messages').insert({ ticket_id: id, sender: 'user', body });
        if (error) mapError(error);
        return api.support.get(id);
      },
    },
    saved: {
      async profiles(): Promise<SavedProfile[]> {
        const { data } = await sb.from('saved_profiles').select('profile_id, created_at').order('created_at', { ascending: false });
        const rows = await Promise.all(
          (data ?? []).map(async (r) => {
            try {
              return { profile: await profileById(r.profile_id), savedAt: r.created_at as string };
            } catch {
              return null; // blocked, paused or deleted since saving
            }
          }),
        );
        return rows.filter((r): r is SavedProfile => !!r);
      },
      async saveProfile(profileId) {
        const { error } = await sb.from('saved_profiles').upsert({ user_id: await uid(), profile_id: profileId });
        if (error) mapError(error);
      },
      async removeProfile(profileId) {
        await sb.from('saved_profiles').delete().eq('profile_id', profileId);
      },
      async plans(): Promise<DatePlan[]> {
        const { data } = await sb.from('date_plans').select('*').order('created_at', { ascending: false });
        return (data ?? []).map((d) => ({ id: d.id, matchId: d.match_id, name: d.partner_name, idea: d.idea, when: d.when_text ?? undefined, place: d.place ?? undefined, savedAt: d.created_at }));
      },
      async savePlan(plan) {
        const { error } = await sb.from('date_plans').upsert({
          id: /^[0-9a-f-]{36}$/.test(plan.id) ? plan.id : undefined,
          user_id: await uid(), match_id: plan.matchId, partner_name: plan.name, idea: plan.idea, when_text: plan.when ?? null, place: plan.place ?? null,
        });
        if (error) mapError(error);
      },
      async removePlan(id) {
        await sb.from('date_plans').delete().eq('id', id);
      },
    },
    notes: {
      async get(profileId) {
        const { data } = await sb.from('profile_notes').select('body').eq('profile_id', profileId).maybeSingle();
        return (data?.body as string | undefined) ?? '';
      },
      async set(profileId, body) {
        const me = await uid();
        if (!body.trim()) {
          await sb.from('profile_notes').delete().eq('profile_id', profileId);
          return;
        }
        const { error } = await sb.from('profile_notes').upsert({ user_id: me, profile_id: profileId, body: body.trim(), updated_at: new Date().toISOString() });
        if (error) mapError(error);
      },
    },
    inbox: {
      async list() {
        const { data } = await sb.from('inbox_items').select('*').order('created_at', { ascending: false }).limit(100);
        return (data ?? []).map((i) => ({ id: i.id, kind: i.kind, title: i.title, body: i.body, createdAt: i.created_at, read: i.read, href: i.href ?? undefined }));
      },
      async markAllRead() {
        await sb.from('inbox_items').update({ read: true }).eq('read', false);
      },
    },
  };
  return api;
}
