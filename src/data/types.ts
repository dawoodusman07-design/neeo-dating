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

export type MyProfile = Profile & {
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

export const nameSchema = z.string().trim().min(1, 'Enter your first name').max(30, 'Keep it under 30 characters');

export const promptAnswerSchema = z.string().trim().min(2, 'Write a short answer').max(200, 'Keep it under 200 characters');

export const commentSchema = z.string().trim().max(200, 'Keep it under 200 characters');
