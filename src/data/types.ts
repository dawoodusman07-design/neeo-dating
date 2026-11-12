import { z } from 'zod';

export type Intention = 'long_term' | 'life_partner' | 'figuring_out';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export type Photo = { id: string; uri: string; status: ModerationStatus; blurred?: boolean };
export type VoiceClip = { uri: string; durationSec: number; waveform: number[] };
export type Prompt = { id: string; question: string; answer: string; voice?: VoiceClip };
export type FriendsTake = { id: string; author: string; text: string };

export type Profile = {
  id: string;
  firstName: string;
  age: number;
  pronouns?: string;
  city: string;
  /** Always rounded server-side; exact coordinates are never sent to other users. */
  distanceKm?: number;
  intention: Intention;
  verified: boolean;
  photos: Photo[];
  prompts: Prompt[];
  basics: string[];
  dateIdeas: string[];
  friendsTakes: FriendsTake[];
  chaperoneEnabled?: boolean;
};

export type Gender = 'woman' | 'man' | 'nonbinary' | 'self_described';

export type Preferences = {
  genders: Gender[];
  ageMin: number;
  ageMax: number;
  maxKm: number;
  intentions: Intention[];
  // ---- Neeo Plus (advanced filters + travel mode). Enforced server-side. ----
  verifiedOnly: boolean;
  voiceOnly: boolean;
  /** Travel mode: meet people in another city before you arrive. null = off. */
  travelCity: string | null;
};

/** Free users can turn these OFF but never ON (server enforces the same rule). */
export const PLUS_PREFERENCE_FIELDS = ['verifiedOnly', 'voiceOnly', 'travelCity'] as const;
export const usesPlusFilters = (p: Pick<Preferences, 'verifiedOnly' | 'voiceOnly' | 'travelCity'>) => p.verifiedOnly || p.voiceOnly || !!p.travelCity;

export type PreferencePreset = { id: string; name: string; prefs: Preferences };

/** Synced to Supabase (owner-only RLS). */
export type SavedProfile = { profile: Profile; savedAt: string };
export type DatePlan = { id: string; matchId: string | null; name: string; idea: string; when?: string; place?: string; savedAt: string };

export type MyProfile = Profile & {
  gender?: Gender;
  genderText?: string;
  intentionNote?: string;
  phone: string;
  dob: string;
  completeness: number; // 0..1
  paused: boolean;
};

export type LikeTarget = { kind: 'photo' | 'prompt'; id: string };
export type Like = {
  id: string;
  profile: Profile;
  target?: LikeTarget;
  comment?: string;
  createdAt: string;
};

export type Introductions = {
  items: Profile[];
  total: number; // daily limit (e.g. 8)
  seen: number;
  nextAt: string; // ISO time of next batch
};

export type Match = {
  id: string;
  profile: Profile;
  matchedAt: string;
  lastMessage?: Message;
  unread: number;
  closed?: boolean;
  /** Set when either person ended the connection (unmatch). The chat is gone but it can still be reported. */
  endedAt?: string;
};

export type DateProposal = {
  idea: string;
  when?: string;
  place?: string;
  status: 'proposed' | 'accepted' | 'counter' | 'declined';
};

export type Message = {
  id: string;
  matchId: string;
  senderId: string;
  kind: 'text' | 'voice' | 'date_proposal' | 'system' | 'photo';
  body: string;
  createdAt: string;
  readAt?: string;
  voice?: VoiceClip;
  dateProposal?: DateProposal;
  /** Auto-blurred because the receiving-side check flagged it */
  flagged?: boolean;
};

export type PhotoAccessRequest = {
  id: string;
  profile: Profile;
  direction: 'incoming' | 'granted';
  status: 'pending' | 'shared' | 'declined' | 'revoked';
  createdAt: string;
};

export type ReportReason =
  | 'fake_profile'
  | 'inappropriate_photos'
  | 'harassment'
  | 'underage'
  | 'scam'
  | 'offline_behaviour'
  | 'other';

export type BlockedAccount = { id: string; firstName: string; blockedAt: string };

export type TrustedContact = { name: string; phone: string };
export type CheckIn = {
  id: string;
  matchId: string;
  place: string;
  startsAt: string;
  checkInAt: string;
  contact: TrustedContact;
  status: 'scheduled' | 'checked_in' | 'escalated' | 'cancelled';
};

export type ModerationAction = 'warn' | 'suspend' | 'ban' | 'dismiss';

export type Appeal = {
  id: string;
  body: string;
  createdAt: string;
  status: 'open' | 'upheld' | 'overturned';
  outcomeNote?: string;
};

export type AccountReview = { status: 'active' | 'under_review' | 'suspended'; reason?: string };

export type SupportTopic = 'account' | 'safety' | 'billing' | 'other';
export type SupportMessage = { id: string; from: 'me' | 'support'; body: string; createdAt: string };
export type SupportTicket = {
  id: string;
  reference: string;
  topic: SupportTopic;
  status: 'open' | 'answered' | 'closed';
  createdAt: string;
  messages: SupportMessage[];
};

export type InboxItem = {
  id: string;
  kind: 'report_outcome' | 'photo_request_declined' | 'photo_request_shared' | 'appeal_outcome' | 'support_reply' | 'new_match' | 'new_like';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
};

export type ApiErrorCode =
  | 'invalid_code'
  | 'expired_code'
  | 'otp_locked'
  | 'session_expired'
  | 'offline'
  | 'upload_failed'
  | 'not_eligible'
  | 'chat_cap_reached'
  | 'daily_limit'
  | 'rate_limited'
  | 'send_failed'
  | 'plus_required'
  | 'unknown';

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message?: string,
    public retryAfterSec?: number,
  ) {
    super(message ?? code);
  }
}

// ---- validation (Zod) ----
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, 'Enter your number in international format, e.g. +1 416 555 0100');

export const otpSchema = z.string().regex(/^\d{6}$/, 'Enter the 6-digit code');

export const dobSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter your date of birth as YYYY-MM-DD');

export const supportBodySchema = z.string().trim().min(10, 'Tell us a little more (at least 10 characters)').max(2000, 'Keep it under 2000 characters');

export const citySchema = z.string().trim().min(2, 'Enter your city').max(60, 'Keep it under 60 characters');

export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour time, e.g. 22:00');

export const deleteConfirmSchema = z.string().refine((v) => v.trim().toUpperCase() === 'DELETE', 'Type DELETE to confirm');

export const nameSchema = z.string().trim().min(1, 'Enter your first name').max(30, 'Keep it under 30 characters');

export const promptAnswerSchema = z.string().trim().min(2, 'Write a short answer').max(200, 'Keep it under 200 characters');

export const commentSchema = z.string().trim().max(200, 'Keep it under 200 characters');
