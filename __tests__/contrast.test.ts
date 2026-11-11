import { color, contrastRatio } from '@/theme';

type Pair = [fg: keyof (typeof color)['light'], bg: keyof (typeof color)['light'], min: number];

// Text pairs actually used in the UI. 4.5:1 for text, 3:1 for large text / UI parts.
const PAIRS: Pair[] = [
  ['text', 'bg', 4.5],
  ['text', 'surface', 4.5],
  ['text', 'tint', 4.5],
  ['text', 'chip', 4.5],
  ['textMuted', 'bg', 4.5],
  ['textMuted', 'surface', 4.5],
  ['textMuted', 'tint', 4.5],
  ['onAction', 'action', 4.5],
  ['onAction', 'actionPressed', 4.5],
  ['onAction', 'danger', 4.5],
  ['action', 'bg', 4.5], // text buttons / links
  ['action', 'surface', 4.5],
  ['brandDeep', 'bg', 4.5],
  ['brandDeep', 'chip', 4.5],
  ['brandDeep', 'tint', 4.5],
  ['danger', 'bg', 4.5],
  ['danger', 'surface', 4.5],
  ['success', 'surface', 4.5],
  ['bg', 'text', 4.5], // toast (inverted)
  ['border', 'bg', 1.1], // decorative only
];

describe.each(['light', 'dark'] as const)('%s theme contrast (WCAG AA)', (scheme) => {
  it.each(PAIRS)('%s on %s ≥ %d:1', (fg, bg, min) => {
    const ratio = contrastRatio(color[scheme][fg], color[scheme][bg]);
    expect(ratio).toBeGreaterThanOrEqual(min);
  });
});

it('white text on the photo scrim stays ≥ 4.5:1 even over a white photo', () => {
  // scrim alpha composited over pure white (worst case)
  for (const scheme of ['light', 'dark'] as const) {
    const m = /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/.exec(color[scheme].scrim)!;
    const [r, g, b, a] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
    const mix = (c: number) => Math.round(c * a + 255 * (1 - a));
    const hex = `#${[mix(r), mix(g), mix(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    expect(contrastRatio(color[scheme].onPhoto, hex)).toBeGreaterThanOrEqual(4.5);
  }
});
