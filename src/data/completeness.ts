import type { MyProfile } from './types';

/** Profile completeness 0..1 (shared by every backend). */
export function completeness(me: Pick<MyProfile, 'photos' | 'prompts' | 'verified' | 'dateIdeas' | 'basics'>) {
  const parts = [
    Math.min(me.photos.length, 6) / 6,
    Math.min(me.prompts.length, 3) / 3,
    me.prompts.some((p) => p.voice) ? 1 : 0,
    me.verified ? 1 : 0,
    me.dateIdeas.length > 0 ? 1 : 0,
    me.basics.length >= 3 ? 1 : 0,
  ];
  return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100) / 100;
}
