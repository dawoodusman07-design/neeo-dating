export const STEPS = ['dob', 'name', 'intention', 'preferences', 'photos', 'prompts', 'date-ideas', 'location', 'agreement', 'notifications', 'verify', 'review'] as const;
export type Step = (typeof STEPS)[number];

export function nextStep(step: Step): `/onboarding/${Step}` {
  const i = STEPS.indexOf(step);
  return `/onboarding/${STEPS[Math.min(i + 1, STEPS.length - 1)]!}`;
}

export const PROMPT_QUESTIONS = [
  'My kind of Sunday',
  'A perfect Sunday looks like',
  'I’m looking for',
  'My simple pleasures',
  'The way to win me over',
  'Green flags I look for',
  'My family would describe me as',
  'I geek out on',
  'Let’s debate',
  'Two truths and a lie',
  'This year I really want to',
];

export const DATE_IDEAS = [
  'Coffee and a walk',
  'Dessert spot',
  'Art gallery',
  'Bookshop browse',
  'Board game café',
  'Cooking class',
  'Live music',
  'Sunset at the waterfront',
  'Farmers market',
  'Pottery class',
  'Museum visit',
  'Picnic in the park',
];
