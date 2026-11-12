import type {
  BlockedAccount,
  CheckIn,
  DateProposal,
  Introductions,
  Like,
  LikeTarget,
  Match,
  Message,
  MyProfile,
  Appeal,
  AccountReview,
  InboxItem,
  Preferences,
  Gender,
  SupportTicket,
  SupportTopic,
  PhotoAccessRequest,
  Profile,
  ReportReason,
  TrustedContact,
  VoiceClip,
} from './types';

/**
 * The single seam between UI and backend. `mock` runs fully in-memory (Expo Go,
 * tests, store screenshots); `supabase` is the production implementation.
 */
export interface NeeoApi {
  auth: {
    sendOtp(phone: string): Promise<{ resendInSec: number }>;
    verifyOtp(phone: string, code: string): Promise<{ userId: string; onboarded: boolean }>;
    reauthenticate(code: string): Promise<void>;
    signOut(): Promise<void>;
  };
  me: {
    get(): Promise<MyProfile>;
    update(patch: Partial<Pick<MyProfile, 'firstName' | 'pronouns' | 'intention' | 'prompts' | 'dateIdeas' | 'basics' | 'city' | 'chaperoneEnabled'>>): Promise<MyProfile>;
    completeOnboarding(input: {
      dob: string;
      firstName: string;
      pronouns?: string;
      intention: Profile['intention'];
      photoUris: string[];
      prompts: { question: string; answer: string; voice?: VoiceClip }[];
      dateIdeas: string[];
      city: string;
      gender?: Gender;
      genderText?: string;
      intentionNote?: string;
      preferences?: Preferences;
    }): Promise<MyProfile>;
    uploadPhoto(localUri: string): Promise<{ id: string; uri: string; status: 'pending' | 'approved' | 'rejected' }>;
    setVerified(): Promise<void>;
    reorderPhotos(ids: string[]): Promise<void>;
    removePhoto(id: string): Promise<void>;
    preferences(): Promise<Preferences>;
    setPreferences(p: Preferences): Promise<void>;
    review(): Promise<AccountReview>;
    pause(paused: boolean): Promise<void>;
    exportData(): Promise<{ status: 'preparing' | 'ready'; url?: string; expiresAt?: string }>;
    deleteAccount(): Promise<void>;
    setHashedContacts(hashes: string[]): Promise<void>;
  };
  discover: {
    introductions(): Promise<Introductions>;
    like(profileId: string, target?: LikeTarget, comment?: string): Promise<{ matchId?: string }>;
    pass(profileId: string): Promise<void>;
    undo(): Promise<Profile | null>;
    save(profileId: string): Promise<void>;
    profile(id: string): Promise<Profile>;
  };
  likes: {
    received(): Promise<Like[]>;
    sent(): Promise<Like[]>;
  };
  matches: {
    list(): Promise<Match[]>;
    get(id: string): Promise<Match>;
    close(id: string): Promise<void>;
    /** Ends the connection for both people. The match stays listed as ended so it can still be reported. */
    unmatch(id: string): Promise<void>;
  };
  messages: {
    list(matchId: string): Promise<Message[]>;
    send(matchId: string, input: { kind: Message['kind']; body: string; voice?: VoiceClip; dateProposal?: DateProposal }): Promise<Message>;
    respondToDate(messageId: string, status: DateProposal['status']): Promise<void>;
    markRead(matchId: string): Promise<void>;
    subscribe(matchId: string, onMessage: (m: Message) => void): () => void;
    notifyScreenshot(matchId: string): Promise<void>;
  };
  safety: {
    block(profileId: string): Promise<void>;
    unblock(profileId: string): Promise<void>;
    blocked(): Promise<BlockedAccount[]>;
    report(profileId: string, reason: ReportReason, details?: string, messageId?: string): Promise<{ reportId: string }>;
    createCheckIn(input: { matchId: string; place: string; startsAt: string; checkInAt: string; contact: TrustedContact }): Promise<CheckIn>;
    confirmCheckIn(id: string): Promise<void>;
    appeal(text: string): Promise<Appeal>;
    appeals(): Promise<Appeal[]>;
  };
  privacy: {
    requests(): Promise<PhotoAccessRequest[]>;
    respond(id: string, decision: 'shared' | 'declined'): Promise<void>;
    revoke(id: string): Promise<void>;
    requestAccess(profileId: string): Promise<void>;
    /** Share my clear photos with one person (e.g. from a chat). */
    grant(profileId: string): Promise<void>;
  };
  support: {
    create(input: { topic: SupportTopic; body: string; attachmentUri?: string }): Promise<SupportTicket>;
    list(): Promise<SupportTicket[]>;
    get(id: string): Promise<SupportTicket>;
    reply(id: string, body: string): Promise<SupportTicket>;
  };
  inbox: {
    list(): Promise<InboxItem[]>;
    markAllRead(): Promise<void>;
  };
}
