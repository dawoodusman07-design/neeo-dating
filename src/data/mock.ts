import type { NeeoApi } from './api';
import { seedProfiles } from './seed';
import {
  ApiError,
  type BlockedAccount,
  type CheckIn,
  type Like,
  type Match,
  type Message,
  type MyProfile,
  type PhotoAccessRequest,
  type Profile,
  type Appeal,
  type InboxItem,
  type Preferences,
  type SupportTicket,
  type PreferencePreset,
  type DatePlan,
} from './types';
import { uid } from '@/lib/id';
import { checkSync } from '@/services/textModeration';
import { completeness } from './completeness';
import { isPlusActive, purchases } from '@/services/purchases';

export const MOCK_OTP = '123456';
/** Mock-only: signing in with this number skips onboarding (store screenshots, demos). */
export const DEMO_ONBOARDED_PHONE = '+15555550199';
export const DAILY_LIMIT = 8;
const MAX_ATTEMPTS = 5;

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

/** In-memory backend. Deterministic enough for tests and store screenshots. */
export function createMockApi(): NeeoApi & { _state: ReturnType<typeof initialState> } {
  const state = initialState();
  const listeners = new Map<string, Set<(m: Message) => void>>();
  const emit = (m: Message) => listeners.get(m.matchId)?.forEach((fn) => fn(m));

  const visible = () => seedProfiles.filter((p) => !state.blocked.some((b) => b.id === p.id));
  const findProfile = (id: string) => {
    const p = seedProfiles.find((x) => x.id === id);
    if (!p) throw new ApiError('unknown', 'Profile not found');
    return p;
  };

  const api: NeeoApi = {
    auth: {
      async sendOtp() {
        await delay();
        if (state.otpLockedUntil > Date.now()) throw new ApiError('otp_locked', undefined, Math.ceil((state.otpLockedUntil - Date.now()) / 1000));
        // Rate limit: at most 3 codes per 10 minutes.
        const now = Date.now();
        state.otpSends = state.otpSends.filter((t) => now - t < 10 * 60_000);
        if (state.otpSends.length >= 3) throw new ApiError('rate_limited', undefined, Math.ceil((state.otpSends[0]! + 10 * 60_000 - now) / 1000));
        state.otpSends.push(now);
        return { resendInSec: 30 };
      },
      async verifyOtp(phone, code) {
        await delay();
        if (state.otpLockedUntil > Date.now()) throw new ApiError('otp_locked', undefined, Math.ceil((state.otpLockedUntil - Date.now()) / 1000));
        if (code !== MOCK_OTP) {
          state.otpAttempts += 1;
          if (state.otpAttempts >= MAX_ATTEMPTS) {
            state.otpLockedUntil = Date.now() + 15 * 60_000;
            state.otpAttempts = 0;
            throw new ApiError('otp_locked', undefined, 15 * 60);
          }
          throw new ApiError('invalid_code', `${MAX_ATTEMPTS - state.otpAttempts} attempts left`);
        }
        state.otpAttempts = 0;
        state.me.phone = phone;
        if (phone === DEMO_ONBOARDED_PHONE) state.onboarded = true;
        return { userId: state.me.id, onboarded: state.onboarded };
      },
      async reauthenticate(code) {
        await delay();
        if (code !== MOCK_OTP) throw new ApiError('invalid_code');
      },
      async signOut() {
        await delay(100);
      },
    },
    me: {
      async get() {
        await delay(100);
        return { ...state.me, completeness: completeness(state.me) };
      },
      async update(patch) {
        await delay();
        Object.assign(state.me, patch);
        return { ...state.me, completeness: completeness(state.me) };
      },
      async completeOnboarding(input) {
        await delay(400);
        Object.assign(state.me, {
          firstName: input.firstName,
          pronouns: input.pronouns,
          intention: input.intention,
          dob: input.dob,
          city: input.city,
          dateIdeas: input.dateIdeas,
          photos: input.photoUris.map((uri) => ({ id: uid('ph'), uri, status: 'pending' as const })),
          prompts: input.prompts.map((p) => ({ id: uid('pr'), ...p })),
          gender: input.gender,
          genderText: input.genderText,
          intentionNote: input.intentionNote,
        });
        if (input.preferences) state.preferences = input.preferences;
        state.onboarded = true;
        return { ...state.me, completeness: completeness(state.me) };
      },
      async uploadPhoto(localUri) {
        await delay(600);
        if (localUri.includes('fail') || state.failUploads) throw new ApiError('upload_failed');
        const photo = { id: uid('ph'), uri: localUri, status: 'pending' as const };
        if (state.onboarded) state.me.photos.push(photo);
        return photo;
      },
      async reorderPhotos(ids) {
        const byId = new Map(state.me.photos.map((p) => [p.id, p]));
        state.me.photos = ids.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p);
      },
      async removePhoto(id) {
        state.me.photos = state.me.photos.filter((p) => p.id !== id);
      },
      async preferences() {
        await delay(80);
        return { ...state.preferences };
      },
      async setPreferences(p) {
        await delay(120);
        const old = state.preferences;
        const turningOn = (p.verifiedOnly && !old.verifiedOnly) || (p.voiceOnly && !old.voiceOnly) || (!!p.travelCity && p.travelCity !== old.travelCity);
        if (turningOn && !(await hasPlus())) throw new ApiError('plus_required');
        state.preferences = { ...p };
      },
      async presets() {
        return [...state.presets];
      },
      async savePreset(name, prefs) {
        if (!(await hasPlus())) throw new ApiError('plus_required');
        const preset: PreferencePreset = { id: uid('pre'), name, prefs };
        state.presets.push(preset);
        return preset;
      },
      async deletePreset(id) {
        state.presets = state.presets.filter((p) => p.id !== id);
      },
      async review() {
        return { ...state.review };
      },
      async setVerified() {
        state.me.verified = true;
      },
      async pause(paused) {
        state.me.paused = paused;
      },
      async exportData() {
        await delay(500);
        return { status: 'ready', url: 'https://neeo.app/export/mock.zip', expiresAt: new Date(Date.now() + 7 * 86400_000).toISOString() };
      },
      async deleteAccount() {
        await delay(500);
        Object.assign(state, initialState());
      },
      async setHashedContacts(hashes) {
        state.contactHashes = hashes;
      },
    },
    discover: {
      async introductions() {
        await delay();
        const items = visible().filter((p) => !state.acted.has(p.id));
        return {
          items: items.slice(0, Math.max(0, DAILY_LIMIT - state.seenToday)),
          total: DAILY_LIMIT,
          seen: state.seenToday,
          nextAt: nextBatchTime(),
        };
      },
      async like(profileId, target, comment) {
        await delay();
        const profile = findProfile(profileId);
        state.acted.add(profileId);
        state.history.push(profileId);
        state.seenToday += 1;
        state.sent.unshift({ id: uid('lk'), profile, target, comment, createdAt: new Date().toISOString() });
        const theyLikedMe = state.received.find((l) => l.profile.id === profileId) || profileId === 'p_maya';
        if (theyLikedMe) {
          const match: Match = { id: uid('m'), profile, matchedAt: new Date().toISOString(), unread: 0 };
          state.matches.unshift(match);
          state.received = state.received.filter((l) => l.profile.id !== profileId);
          state.messages[match.id] = [msg(match.id, 'system', 'system', 'matched')];
          if (comment) state.messages[match.id]!.push(msg(match.id, state.me.id, 'text', comment));
          return { matchId: match.id };
        }
        return {};
      },
      async pass(profileId) {
        await delay(100);
        state.acted.add(profileId);
        state.history.push(profileId);
        state.seenToday += 1;
      },
      async undo() {
        const last = state.history.pop();
        if (!last) return null;
        state.acted.delete(last);
        state.seenToday = Math.max(0, state.seenToday - 1);
        state.sent = state.sent.filter((l) => l.profile.id !== last);
        return findProfile(last);
      },
      async save(profileId) {
        state.saved.add(profileId);
      },
      async profile(id) {
        await delay(100);
        return findProfile(id);
      },
    },
    likes: {
      async received() {
        await delay();
        return state.received.filter((l) => !state.blocked.some((b) => b.id === l.profile.id));
      },
      async sent() {
        await delay();
        return state.sent;
      },
    },
    matches: {
      async list() {
        await delay();
        return state.matches.map((m) => ({ ...m, lastMessage: state.messages[m.id]?.at(-1) }));
      },
      async get(id) {
        const m = state.matches.find((x) => x.id === id);
        if (!m) throw new ApiError('unknown', 'Match not found');
        return m;
      },
      async close(id) {
        const m = state.matches.find((x) => x.id === id);
        if (m) m.closed = true;
      },
      async unmatch(id) {
        const m = state.matches.find((x) => x.id === id);
        if (m) m.endedAt = new Date().toISOString();
        state.messages[id] = [];
      },
    },
    messages: {
      async list(matchId) {
        await delay(150);
        return [...(state.messages[matchId] ?? [])];
      },
      async send(matchId, input) {
        await delay(150);
        if (state.failSends) throw new ApiError('send_failed');
        if (state.matches.find((x) => x.id === matchId)?.endedAt) throw new ApiError('send_failed', 'This connection has ended');
        const m: Message = { ...msg(matchId, state.me.id, input.kind, input.body), voice: input.voice, dateProposal: input.dateProposal };
        (state.messages[matchId] ??= []).push(m);
        // Simulated reply so the realtime path can be exercised in mock mode.
        if (input.kind === 'text' && state.autoReply) {
          setTimeout(() => {
            const body = 'That sounds lovely. Let me check my week and get back to you.';
            const reply: Message = { ...msg(matchId, state.matches.find((x) => x.id === matchId)?.profile.id ?? 'them', 'text', body) };
            reply.flagged = checkSync(body).severity !== 'none';
            state.messages[matchId]?.push(reply);
            emit(reply);
          }, 2500);
        }
        return m;
      },
      async respondToDate(messageId, status) {
        for (const list of Object.values(state.messages)) {
          const m = list.find((x) => x.id === messageId);
          if (m?.dateProposal) m.dateProposal = { ...m.dateProposal, status };
        }
      },
      async markRead(matchId) {
        const m = state.matches.find((x) => x.id === matchId);
        if (m) m.unread = 0;
        state.messages[matchId]?.forEach((x) => {
          if (x.senderId !== state.me.id && !x.readAt) x.readAt = new Date().toISOString();
        });
      },
      subscribe(matchId, onMessage) {
        const set = listeners.get(matchId) ?? new Set();
        set.add(onMessage);
        listeners.set(matchId, set);
        return () => set.delete(onMessage);
      },
      async notifyScreenshot(matchId) {
        (state.messages[matchId] ??= []).push(msg(matchId, 'system', 'system', 'screenshot_taken'));
      },
    },
    safety: {
      async block(profileId) {
        await delay();
        const p = findProfile(profileId);
        if (!state.blocked.some((b) => b.id === profileId)) state.blocked.push({ id: p.id, firstName: p.firstName, blockedAt: new Date().toISOString() });
        const m = state.matches.find((x) => x.profile.id === profileId);
        if (m) {
          state.matches = state.matches.filter((x) => x.id !== m.id);
          delete state.messages[m.id];
        }
        state.acted.add(profileId);
      },
      async unblock(profileId) {
        state.blocked = state.blocked.filter((b) => b.id !== profileId);
      },
      async blocked() {
        await delay(100);
        return state.blocked;
      },
      async report(profileId, reason, details, messageId) {
        await delay();
        const reportId = uid('rp');
        state.reports.push({ id: reportId, profileId, reason, details, messageId, status: 'open' });
        state.inbox.unshift({ id: uid('in'), kind: 'report_outcome', title: 'Report received', body: 'We’ll update you here when there is an outcome.', createdAt: new Date().toISOString(), read: false });
        return { reportId };
      },
      async createCheckIn(input) {
        await delay();
        const c: CheckIn = { id: uid('ci'), status: 'scheduled', ...input };
        state.checkIns.push(c);
        return c;
      },
      async confirmCheckIn(id) {
        const c = state.checkIns.find((x) => x.id === id);
        if (c) c.status = 'checked_in';
      },
      async appeal(body) {
        await delay();
        const a: Appeal = { id: uid('ap'), body, createdAt: new Date().toISOString(), status: 'open' };
        state.appeals.unshift(a);
        return a;
      },
      async appeals() {
        await delay(80);
        return [...state.appeals];
      },
    },
    privacy: {
      async requests() {
        await delay();
        return state.photoRequests;
      },
      async respond(id, decision) {
        const r = state.photoRequests.find((x) => x.id === id);
        if (r) {
          r.status = decision;
          if (decision === 'shared') r.direction = 'granted';
        }
      },
      async revoke(id) {
        const r = state.photoRequests.find((x) => x.id === id);
        if (r) r.status = 'revoked';
      },
      async requestAccess(profileId) {
        await delay();
        state.outgoingRequests.add(profileId);
      },
      async grant(profileId) {
        await delay();
        const profile = findProfile(profileId);
        state.photoRequests.unshift({ id: uid('pa'), profile, direction: 'granted', status: 'shared', createdAt: new Date().toISOString() });
      },
    },
    support: {
      async create({ topic, body }) {
        await delay(300);
        const t: SupportTicket = {
          id: uid('st'),
          reference: `NE-${String(Math.floor(100000 + Math.random() * 900000))}`,
          topic,
          status: 'open',
          createdAt: new Date().toISOString(),
          messages: [{ id: uid('sm'), from: 'me', body, createdAt: new Date().toISOString() }],
        };
        state.tickets.unshift(t);
        return t;
      },
      async list() {
        await delay(80);
        return state.tickets.map((t) => ({ ...t, messages: [...t.messages] }));
      },
      async get(id) {
        const t = state.tickets.find((x) => x.id === id);
        if (!t) throw new ApiError('unknown', 'Request not found');
        return { ...t, messages: [...t.messages] };
      },
      async reply(id, body) {
        const t = state.tickets.find((x) => x.id === id);
        if (!t) throw new ApiError('unknown', 'Request not found');
        t.messages.push({ id: uid('sm'), from: 'me', body, createdAt: new Date().toISOString() });
        t.status = 'open';
        return { ...t, messages: [...t.messages] };
      },
    },
    saved: {
      async profiles() {
        await delay(80);
        return [...state.savedProfiles.entries()]
          .filter(([id]) => !state.blocked.some((b) => b.id === id))
          .map(([id, savedAt]) => ({ profile: findProfile(id), savedAt }))
          .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
      },
      async saveProfile(profileId) {
        findProfile(profileId);
        state.savedProfiles.set(profileId, new Date().toISOString());
      },
      async removeProfile(profileId) {
        state.savedProfiles.delete(profileId);
      },
      async plans() {
        await delay(80);
        return [...state.plans];
      },
      async savePlan(plan) {
        state.plans = [{ ...plan, savedAt: new Date().toISOString() }, ...state.plans.filter((p) => p.id !== plan.id)];
      },
      async removePlan(id) {
        state.plans = state.plans.filter((p) => p.id !== id);
      },
    },
    notes: {
      async get(profileId) {
        return state.notes.get(profileId) ?? '';
      },
      async set(profileId, body) {
        if (body.length > 1000) throw new ApiError('unknown', 'Keep notes under 1000 characters');
        if (body.trim()) state.notes.set(profileId, body.trim());
        else state.notes.delete(profileId);
      },
    },
    inbox: {
      async list() {
        await delay(80);
        return [...state.inbox];
      },
      async markAllRead() {
        state.inbox.forEach((i) => (i.read = true));
      },
    },
  };

  return Object.assign(api, { _state: state });
}

/** Plus comes from the store (mock store in dev), exactly like the server's has_plus(). */
async function hasPlus() {
  return isPlusActive((await purchases.getMembership()).status);
}

function msg(matchId: string, senderId: string, kind: Message['kind'], body: string, createdAt = new Date().toISOString()): Message {
  return { id: uid('msg'), matchId, senderId, kind, body, createdAt };
}

function nextBatchTime() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

export { completeness };

function initialState() {
  const [maya, ayesha, omar, lena] = seedProfiles as [Profile, Profile, Profile, Profile];
  const me: MyProfile = {
    id: 'me',
    firstName: 'Sam',
    age: 30,
    pronouns: 'He/him',
    city: 'Toronto',
    intention: 'long_term',
    verified: false,
    photos: [
      { id: 'ph_me1', uri: `https://images.unsplash.com/photo-1619011940610-eda7c2ab3477?auto=format&fit=crop&w=900&q=75`, status: 'approved' },
      { id: 'ph_me2', uri: `https://images.unsplash.com/photo-1771865415533-af3eed82ef8a?auto=format&fit=crop&w=900&q=75`, status: 'approved' },
      { id: 'ph_me3', uri: `https://images.unsplash.com/photo-1762708546140-7aea0b34ecac?auto=format&fit=crop&w=900&q=75`, status: 'pending' },
    ],
    prompts: [
      { id: 'pr_me1', question: 'A perfect Sunday looks like', answer: 'Long breakfast, a walk, and a call with my parents.' },
      { id: 'pr_me2', question: 'I’m looking for', answer: 'Someone who laughs easily and plans ahead.' },
      { id: 'pr_me3', question: 'My simple pleasures', answer: 'Fresh bread.' },
    ],
    basics: ['5′11″', 'Accountant'],
    dateIdeas: ['Coffee and a walk'],
    friendsTakes: [],
    phone: '+15555550100',
    dob: '1995-04-12',
    completeness: 0,
    paused: false,
  };
  const ayeshaMatch: Match = { id: 'm_ayesha', profile: ayesha, matchedAt: ago(60 * 5), unread: 1 };
  const messages: Record<string, Message[]> = {
    m_ayesha: [
      msg('m_ayesha', 'system', 'system', 'matched', ago(60 * 5)),
      msg('m_ayesha', 'me', 'text', 'Your Eid spreadsheet prompt made me laugh. Do you colour-code?', ago(60 * 4)),
      { ...msg('m_ayesha', ayesha.id, 'text', 'Obviously. Green for food, pink for who is bringing it. You?', ago(60 * 3)), readAt: ago(170) },
      { ...msg('m_ayesha', ayesha.id, 'date_proposal', 'Dessert spot', ago(30)), dateProposal: { idea: 'Dessert spot', when: 'Saturday afternoon', place: 'Queen St W', status: 'proposed' } },
    ],
  };
  return {
    me,
    onboarded: false,
    otpAttempts: 0,
    otpLockedUntil: 0,
    seenToday: 0,
    acted: new Set<string>(['p_ayesha']),
    history: [] as string[],
    saved: new Set<string>(),
    received: [
      { id: 'lk_r1', profile: lena, target: { kind: 'prompt' as const, id: 'pr_l1' }, comment: 'What are you reading right now?', createdAt: ago(90) },
      { id: 'lk_r2', profile: omar, target: { kind: 'photo' as const, id: 'ph_o1' }, createdAt: ago(300) },
    ] as Like[],
    sent: [] as Like[],
    matches: [ayeshaMatch] as Match[],
    messages,
    blocked: [] as BlockedAccount[],
    reports: [] as { id: string; profileId: string; reason: string; details?: string; messageId?: string; status: string }[],
    checkIns: [] as CheckIn[],
    photoRequests: [
      { id: 'pa_1', profile: omar, direction: 'incoming', status: 'pending', createdAt: ago(45) },
      { id: 'pa_2', profile: maya, direction: 'granted', status: 'shared', createdAt: ago(60 * 24) },
    ] as PhotoAccessRequest[],
    contactHashes: [] as string[],
    autoReply: true,
    otpSends: [] as number[],
    failUploads: false,
    failSends: false,
    outgoingRequests: new Set<string>(),
    preferences: { genders: ['woman'], ageMin: 24, ageMax: 34, maxKm: 25, intentions: ['long_term', 'life_partner'], verifiedOnly: false, voiceOnly: false, travelCity: null } as Preferences,
    presets: [] as PreferencePreset[],
    savedProfiles: new Map<string, string>(),
    plans: [] as DatePlan[],
    notes: new Map<string, string>(),
    review: { status: 'active' } as { status: 'active' | 'under_review' | 'suspended'; reason?: string },
    appeals: [] as Appeal[],
    tickets: [] as SupportTicket[],
    inbox: [
      { id: 'in_1', kind: 'photo_request_declined', title: 'Photo request', body: 'Chris chose to keep their photos private for now.', createdAt: ago(60 * 20), read: false },
      { id: 'in_2', kind: 'new_like', title: 'New like', body: 'Someone liked your answer about Sundays.', createdAt: ago(90), read: true },
    ] as InboxItem[],
  };
}
