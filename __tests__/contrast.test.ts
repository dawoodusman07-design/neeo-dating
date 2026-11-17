import { color, contrastRatio } from '@/theme';

type Token = keyof (typeof color)['light'];
const AA = 4.5;

// Every token that is ever rendered as TEXT (or as a text-sized icon) …
const TEXT_TOKENS: Token[] = ['text', 'textMuted', 'action', 'brandDeep', 'accent', 'success', 'danger'];
// … on every surface text can sit on.
const BACKGROUNDS: Token[] = ['bg', 'surface', 'tint', 'chip'];
// Text drawn on a filled colour (buttons, badges, unread counts).
const ON_FILLS: [Token, Token][] = [
  ['onAction', 'action'],
  ['onAction', 'actionPressed'],
  ['onAction', 'danger'], // danger buttons
  ['onAction', 'accent'], // unread / new badges
  ['bg', 'text'], // toast (inverted)
];

const pairs: [Token, Token][] = [...TEXT_TOKENS.flatMap((fg) => BACKGROUNDS.map((bg) => [fg, bg] as [Token, Token])), ...ON_FILLS];

describe.each(['light', 'dark'] as const)('%s theme: every text/background pair is WCAG AA (≥ 4.5:1)', (scheme) => {
  it.each(pairs)('%s on %s', (fg, bg) => {
    expect(contrastRatio(color[scheme][fg], color[scheme][bg])).toBeGreaterThanOrEqual(AA);
  });

  it('explicitly: action (terracotta) on chip and accent (sage) on bg', () => {
    expect(contrastRatio(color[scheme].action, color[scheme].chip)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(color[scheme].accent, color[scheme].bg)).toBeGreaterThanOrEqual(AA);
  });

  it('covers every text-bearing token in the palette (new tokens must be added to this test)', () => {
    const known = new Set<Token>([...TEXT_TOKENS, ...BACKGROUNDS, 'onAction', 'actionPressed', 'border', 'scrim', 'onPhoto', 'overlay', 'focus']);
    expect(Object.keys(color[scheme]).filter((k) => !known.has(k as Token))).toEqual([]);
  });

  it('white text on the photo scrim stays ≥ 4.5:1 even over a pure-white photo', () => {
    const m = /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/.exec(color[scheme].scrim)!;
    const [r, g, b, a] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
    const mix = (c: number) => Math.round(c * a + 255 * (1 - a));
    const hex = `#${[mix(r), mix(g), mix(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    expect(contrastRatio(color[scheme].onPhoto, hex)).toBeGreaterThanOrEqual(AA);
  });
});

it('the palette is "Terracotta and sand"', () => {
  expect(color.light).toMatchObject({ bg: '#FBF7F2', action: '#A8432A', accent: '#2F6B5E' });
  expect(color.dark).toMatchObject({ bg: '#1A1411', action: '#E8896C', accent: '#6FBFAE' });
});
