#!/usr/bin/env node
// Design-system guard: proves there are zero hard-coded colours and zero emoji in app code.
// Colours may only live in src/theme/tokens.ts.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');
const ALLOW_COLOURS = new Set(['src/theme/tokens.ts']);
const COLOUR = /(['"`])#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\1|\b(?:rgba?|hsla?)\(/;
const EMOJI = /\p{Extended_Pictographic}/u;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(tsx?|jsx?)$/.test(name)) yield p;
  }
}

const problems = [];
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (!ALLOW_COLOURS.has(rel) && COLOUR.test(line)) problems.push(`${rel}:${i + 1}  hard-coded colour: ${line.trim()}`);
      if (EMOJI.test(line)) problems.push(`${rel}:${i + 1}  emoji: ${line.trim()}`);
    });
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} design-system violation(s).`);
  process.exit(1);
}
console.log('check-tokens: 0 hard-coded colours, 0 emoji in src/');
