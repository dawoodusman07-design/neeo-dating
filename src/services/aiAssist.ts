/**
 * Opt-in AI helpers, always labelled "AI suggestion" in the UI.
 * Mocked; production should call a server-side function (never ship model keys in the app).
 */
import type { Profile, MyProfile } from '@/data/types';

export interface AiAssist {
  profileFeedback(me: MyProfile): Promise<string[]>;
  conversationStarters(them: Profile): Promise<string[]>;
}

export class MockAiAssist implements AiAssist {
  async profileFeedback(me: MyProfile) {
    const tips: string[] = [];
    if (me.photos.length < 4) tips.push('Add one more photo that shows you doing something you love.');
    if (!me.prompts.some((p) => p.voice)) tips.push('A voice prompt helps people hear your warmth. Try a 20-second answer.');
    if (me.prompts.some((p) => p.answer.length < 30)) tips.push('One of your prompt answers is short. A specific detail gives people something to reply to.');
    if (tips.length === 0) tips.push('Your profile looks complete. Nice work.');
    return tips;
  }
  async conversationStarters(them: Profile) {
    const p = them.prompts[0];
    const idea = them.dateIdeas[0];
    return [
      p ? `You wrote “${p.answer.slice(0, 40)}…” — what's the story there?` : `What's been the best part of your week, ${them.firstName}?`,
      idea ? `${idea} sounds great. Where would you go for it?` : 'What does a good weekend look like for you?',
    ];
  }
}

export const aiAssist: AiAssist = new MockAiAssist();
