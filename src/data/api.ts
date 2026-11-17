import type {
  BlockedAccount,
  CheckIn,
  Invite,
  MyFriendsTake,
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
  PreferencePreset,
  SavedProfile,
  DatePlan,
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
    /** Rejects with ApiError('plus_required') when turning on a Plus filter without Plus. */
    setPreferences(p: Preferences): Promise<void>;
    presets(): Promise<PreferencePreset[]>;
    /** Plus only (server-enforced). */
    savePreset(name: string, prefs: Preferences): Promise<PreferencePreset>;
    /** Always allowed, also after Plus ends. */
    deletePreset(id: string): Promise<void>;
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
    /** "I need help": alert the trusted contact now (the escalation job sends the SMS). */
    requestHelp(id: string): Promise<void>;
    /** The check-in that is scheduled and not yet answered, if any. */
    activeCheckIn(): Promise<CheckIn | null>;
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
  saved: {
    profiles(): Promise<SavedProfile[]>;
    saveProfile(profileId: string): Promise<void>;
    removeProfile(profileId: string): Promise<void>;
    plans(): Promise<DatePlan[]>;
    savePlan(plan: Omit<DatePlan, 'savedAt'>): Promise<void>;
    removePlan(id: string): Promise<void>;
  };
  notes: {
    /** Private note about a profile; only its author can read it. */
    get(profileId: string): Promise<string>;
    set(profileId: string, body: string): Promise<void>;
  };
  inbox: {
    list(): Promise<InboxItem[]>;
    markAllRead(): Promise<void>;
  };
  /** Invitations to people outside Neeo (chaperone, Friend's Take). Owner-only. */
  invites: {
    list(kind: Invite['kind']): Promise<Invite[]>;
    create(kind: Invite['kind'], input: { name: string; phone?: string }): Promise<Invite>;
    revoke(id: string): Promise<void>;
  };
  friendsTakes: {
    /** All takes written about me, approved or not (only I can see unapproved ones). */
    mine(): Promise<MyFriendsTake[]>;
    setApproved(id: string, approved: boolean): Promise<void>;
    remove(id: string): Promise<void>;
  };
}
