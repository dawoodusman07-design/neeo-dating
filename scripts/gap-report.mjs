#!/usr/bin/env node
/**
 * Gap report: reference design package vs. the app.
 *
 *   node scripts/gap-report.mjs            → writes GAP_REPORT.md
 *
 * Inputs
 *  - reference-prototype/Journey_Inventory.json (58 screens: id, name, title, body, cta)
 *  - the 7 core photo-led SVGs (reference-prototype/screens/<name>.svg)
 *  - Appendix B: screen names from the later online prototype (no SVGs; "from name only")
 *  - our routes (src/app/**) and our English strings (src/i18n/en.ts, transpiled on the fly)
 *
 * Status
 *  - missing : the mapped route file does not exist (or no route is mapped)
 *  - partial : route exists but MAP marks a known gap (`partial: '...'`)
 *  - built   : route exists and no gap is recorded
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const ts = require('typescript');

// ---------- load our strings ----------
async function loadEn() {
  const src = readFileSync(join(ROOT, 'src/i18n/en.ts'), 'utf8');
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
  const tmp = join(ROOT, 'node_modules/.cache/gap-report-en.mjs');
  const { mkdirSync } = await import('node:fs');
  mkdirSync(dirname(tmp), { recursive: true });
  writeFileSync(tmp, js);
  return (await import(pathToFileURL(tmp).href + `?t=${Date.now()}`)).default;
}
const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

// ---------- route existence ----------
function routeFile(route) {
  if (!route) return null;
  const clean = route.split('?')[0].split('#')[0].replace(/^\//, '');
  const candidates = [`src/app/${clean}.tsx`, `src/app/${clean}/index.tsx`, `src/app/(tabs)/${clean}.tsx`];
  return candidates.find((c) => existsSync(join(ROOT, c))) ?? null;
}

// ---------- the mapping (package screen → our route + i18n keys) ----------
// keys: i18n key paths whose English text is compared with the package's title/body/cta.
// body may be an array of keys (joined). partial: known gap, shown in the report.
const MAP = {
  '01': { route: '/welcome', keys: { title: 'welcome.headline', body: 'welcome.sub', cta: 'welcome.create' } },
  '02': { route: '/sign-in/phone?mode=signin', keys: { title: 'auth.signInTitle', body: 'auth.signInBody', cta: 'common.continue' } },
  '03': { route: '/sign-in/phone', keys: { title: 'auth.phoneTitle', body: 'auth.phoneBody', cta: 'auth.sendCode' } },
  '04': { route: '/sign-in/otp', keys: { title: 'auth.otpTitle', body: 'auth.otpBody', cta: 'auth.verify' } },
  '05': { route: '/sign-in/otp', keys: { title: 'auth.codeErrorTitle', body: 'auth.codeErrorBody', cta: 'common.retry' }, note: 'Inline error state on the OTP screen' },
  '06': { route: '/onboarding/dob', keys: { title: 'onboarding.dobTitle', body: 'onboarding.dobBody', cta: 'common.continue' } },
  '07': { route: '/onboarding/not-eligible', keys: { title: 'onboarding.notEligibleTitle', body: 'onboarding.notEligibleBody', cta: 'onboarding.notEligibleAction' } },
  '08': { route: '/onboarding/name', keys: { title: 'onboarding.nameTitle', body: 'onboarding.genderLabel', cta: 'common.continue' } },
  '09': { route: '/onboarding/intention', keys: { title: 'onboarding.intentionTitle', body: 'onboarding.intentionBody', cta: 'common.continue' } },
  '10': { route: '/onboarding/preferences', keys: { title: 'onboarding.prefsTitle', body: 'onboarding.prefsBody', cta: 'common.continue' } },
  '11': { route: '/onboarding/location', keys: { title: 'onboarding.locationTitle', body: 'onboarding.locationBody', cta: 'onboarding.locationAllow' } },
  '12': { route: '/onboarding/location', keys: { title: 'onboarding.locationUnavailableTitle', body: 'onboarding.locationUnavailableBody', cta: 'onboarding.useCity' }, note: 'State of the location step' },
  '13': { route: '/onboarding/photos', keys: { title: 'onboarding.photosTitle', body: 'onboarding.photosBody', cta: 'onboarding.photosAdd' } },
  '14': { route: '/onboarding/photos', keys: { title: 'states.upload-failed.title', body: 'states.upload-failed.body', cta: 'states.upload-failed.action' }, note: 'Per-photo failed state with retry + state/upload-failed' },
  '15': { route: '/onboarding/prompts', keys: { title: 'onboarding.promptsTitle', body: 'onboarding.promptsBody', cta: 'onboarding.promptsSave' } },
  '16': { route: '/onboarding/review', keys: { title: 'onboarding.reviewTitle', body: 'onboarding.reviewBody', cta: 'onboarding.reviewFinish' } },
  '17': { route: '/onboarding/agreement', keys: { title: 'onboarding.agreementTitle', body: 'onboarding.agreementBody', cta: 'onboarding.agreementAccept' } },
  '18': { route: '/onboarding/notifications', keys: { title: 'onboarding.notifTitle', body: 'onboarding.notifBody', cta: 'onboarding.notifAllow' } },
  '19': { route: '/discover', keys: { title: 'discover.noMatchesTitle', body: 'discover.noMatchesBody', cta: 'discover.noMatchesAction' }, note: 'Empty state of Discover' },
  '20': { route: '/discover', keys: { title: 'discover.caughtUpTitle', body: 'discover.caughtUpBody', cta: 'discover.caughtUpAction' }, note: 'Daily-limit state of Discover' },
  '21': { route: '/state/offline', keys: { title: 'states.offline.title', body: 'states.offline.body', cta: 'states.offline.action' } },
  '22': { route: '/photo-request/[id]', keys: { title: 'photoRequest.title', body: 'photoRequest.body', cta: 'photoRequest.cta' } },
  '23': { route: '/settings/photo-privacy', keys: { title: 'privacy.accessTitle', body: 'privacy.accessBody', cta: 'privacy.manageAccess' } },
  '24': { route: '/settings/safety', keys: { title: 'settings.safetyTitle', body: 'settings.safetyIntro', cta: 'settings.reviewConnection' } },
  '25': { route: '/report/[id]', keys: { title: 'report.why', body: 'report.details', cta: 'report.review' } },
  '26': { route: '/report/[id]', keys: { title: 'report.reviewTitle', body: 'report.reviewBody', cta: 'report.submit' }, note: 'Step 2 of the report flow' },
  '27': { route: '/report/[id]', keys: { title: 'report.sentTitle', body: 'report.sentBody', cta: 'report.backToSafety' }, note: 'Step 3 of the report flow' },
  '28': { route: '/block/[id]', keys: { title: 'block.title', body: 'block.body', cta: 'block.cta' } },
  '29': { route: '/unmatch/[id]', keys: { title: 'unmatch.title', body: 'unmatch.body', cta: 'unmatch.cta' } },
  '30': { route: '/plus', keys: { title: 'plus.title', body: 'plus.sub', cta: 'plus.compare' } },
  '31': { route: '/plus/compare', keys: { title: 'plus.compareTitle', body: 'plus.compareBody', cta: 'plus.reviewPlan' } },
  '32': { route: '/plus/review', keys: { title: 'plus.reviewTitle', body: 'plus.renewalShort', cta: 'plus.continueToStore' } },
  '33': { route: '/plus/checkout', keys: { title: 'plus.checkoutTitle', body: 'plus.checkoutBody', cta: 'plus.checkoutCta' }, note: 'Native store sheet is shown by StoreKit / Play Billing; this is the hand-off state' },
  '34': { route: '/state/purchase-success', keys: { title: 'states.purchase-success.title', body: 'states.purchase-success.body', cta: 'states.purchase-success.action' } },
  '35': { route: '/state/purchase-cancelled', keys: { title: 'states.purchase-cancelled.title', body: 'states.purchase-cancelled.body', cta: 'states.purchase-cancelled.action' } },
  '36': { route: '/state/purchase-pending', keys: { title: 'states.purchase-pending.title', body: 'states.purchase-pending.body', cta: 'states.purchase-pending.action' } },
  '37': { route: '/state/purchase-failed', keys: { title: 'states.purchase-failed.title', body: 'states.purchase-failed.body', cta: 'states.purchase-failed.action' } },
  '38': { route: '/membership/restore', keys: { title: 'membership.restoreTitle', body: 'membership.restoreBody', cta: 'plus.restore' } },
  '39': { route: '/state/restored', keys: { title: 'states.restored.title', body: 'states.restored.body', cta: 'states.restored.action' } },
  '40': { route: '/state/restore-none', keys: { title: 'states.restore-none.title', body: 'states.restore-none.body', cta: 'states.restore-none.action' } },
  '41': { route: '/membership', keys: { title: 'membership.activeTitle', body: 'membership.activeBody', cta: 'membership.manage' } },
  '42': { route: '/membership/cancel', keys: { title: 'membership.cancelTitle', body: 'membership.cancelBody', cta: 'membership.openStore' } },
  '43': { route: '/membership', keys: { title: 'membership.renewalOffTitle', body: 'membership.renewalOffBody', cta: 'membership.backToAccount' }, note: 'Membership screen when RevenueCat reports willRenew=false' },
  '44': { route: '/membership', keys: { title: 'membership.billingTitle', body: 'membership.billingBody', cta: 'membership.manageBilling' }, note: 'Membership screen when billingIssueDetectedAt is set' },
  '45': { route: '/membership', keys: { title: 'membership.expiredTitle', body: 'membership.expiredBody', cta: 'membership.continueFree' }, note: 'Membership screen when the entitlement has expired' },
  '46': { route: '/support', keys: { title: 'support.title', body: 'support.body', cta: 'support.review' } },
  '47': { route: '/state/support-received', keys: { title: 'states.support-received.title', body: 'states.support-received.body', cta: 'states.support-received.action' } },
  '48': { route: '/settings/account', keys: { title: 'settings.accountTitle', body: 'settings.accountBody', cta: null } },
  '49': { route: '/settings/pause', keys: { title: 'settings.pauseTitle', body: 'settings.pauseBody', cta: 'settings.pauseCta' } },
  '50': { route: '/state/paused', keys: { title: 'states.paused.title', body: 'states.paused.body', cta: 'states.paused.action' } },
  '51': { route: '/settings/export', keys: { title: 'settings.exportTitle', body: 'settings.exportBody', cta: 'settings.exportAction' } },
  '52': { route: '/settings/delete-account', keys: { title: 'settings.deleteTitle', body: 'settings.deleteStep1', cta: 'settings.deleteReview' } },
  '53': { route: '/settings/delete-account', keys: { title: 'settings.deleteConfirmTitle', body: 'settings.deleteConfirmBody', cta: 'settings.deleteFinal' }, note: 'Confirm step of the delete flow' },
  '54': { route: '/settings/delete-account', keys: { title: 'settings.deletedTitle', body: 'settings.deletedBody', cta: 'settings.backToWelcome' }, note: 'Done step of the delete flow' },
  '55': { route: '/settings/logout', keys: { title: 'logout.title', body: 'logout.body', cta: 'logout.cta' } },
  '56': { route: '/state/session-expired', keys: { title: 'states.session-expired.title', body: 'states.session-expired.body', cta: 'states.session-expired.action' } },
  '57': { route: '/account-review', keys: { title: 'states.account-review.title', body: 'states.account-review.body', cta: 'states.account-review.action' } },
  '58': { route: '/settings/appeal', keys: { title: 'settings.appealTitle', body: 'settings.appealBody', cta: 'settings.appealSend' } },
};

const CORE = [
  { svg: 'discover', name: 'Discover', route: '/discover' },
  { svg: 'likes', name: 'Likes', route: '/likes', partial: 'Liked-you list is blurred for Free users (v2 spec); the package says viewing and responding to likes stays free — see conflicts' },
  { svg: 'chats', name: 'Chats', route: '/chats' },
  { svg: 'conversation', name: 'Conversation', route: '/chat/[id]' },
  { svg: 'jamie', name: 'Profile detail (Jamie)', route: '/profile/[id]' },
  { svg: 'privacy', name: 'Privacy & visibility', route: '/settings/photo-privacy' },
  { svg: 'you', name: 'You / Your space', route: '/you' },
];

// Appendix B: names from the later online prototype (no SVG, no copy) → built "from name only".
const APPENDIX_B = [
  ['OTP locked', '/sign-in/locked'],
  ['Photo moderation', '/settings/photos'],
  ['Notification preferences', '/settings/notifications'],
  ['Blocked accounts', '/settings/blocked'],
  ['Unblock confirmation', '/unblock/[id]'],
  ['Export ready', '/state/export-ready'],
  ['Export expired', '/state/export-expired'],
  ['Reauthenticate', '/reauth'],
  ['Verification failed', '/verify'],
  ['Support conversation', '/support/[id]'],
  ['Appeal received', '/state/appeal-sent'],
  ['Appeal outcome', '/appeals'],
  ['Matched', '/match/[id]'],
  ['First message', '/chat/[id]'],
  ['Message sent', '/chat/[id]'],
  ['Photo request sent', '/state/photo-request-sent'],
  ['Access revoked', '/settings/photo-privacy'],
  ['Blocked', '/state/blocked'],
  ['Connection ended', '/chat/[id]'],
  ['Preferences', '/settings/preferences'],
  ['Edit profile', '/settings/edit-profile'],
  ['Photo order', '/settings/photos'],
  ['Compose message', '/chat/[id]'],
  ['Like with a comment', '/discover'],
  ['Sent likes', '/likes'],
  ['Photo request inbox', '/settings/photo-privacy'],
  ['Share photos', '/share-photos/[matchId]'],
  ['Photos shared', '/state/photos-shared'],
  ['Request declined', '/notifications'],
  ['No conversations', '/chats'],
  ['Message delivery failed', '/chat/[id]'],
  ['Identity verification', '/verify'],
  ['Identity check pending', '/verify'],
  ['Identity check complete', '/verify'],
  ['Identity retry', '/verify'],
  ['Report outcome', '/notifications'],
  ['Notification inbox', '/notifications'],
  ['Language', '/settings/region'],
  ['Help and policies', '/settings/help'],
  ['Community rules', '/info/community'],
  ['Privacy summary', '/info/privacy-summary'],
  ['Subscription terms', '/info/subscription-terms'],
  ['Refund help', '/info/refunds'],
  ['Resume draft', '/chat/[id]'],
  ['Region & formats', '/settings/region'],
  ['Readability', '/settings/readability'],
  ['Plan a first date', '/chat/[id]'],
  ['Date idea saved', '/saved'],
  ['Quiet hours', '/settings/quiet-hours'],
  ['Shared interests', '/profile/[id]'],
  ['Saved profiles', '/saved'],
  ['Private profile notes', '/profile/[id]'],
  ['Saved date plans', '/saved'],
  ['About Neeo', '/info/about'],
  ['How matching works', '/info/matching'],
  ['Photo privacy guide', '/info/photo-privacy'],
  ['Free & Plus FAQ', '/info/plus-faq'],
  ['Safer dating guide', '/info/safety'],
];

// Known partial implementations (kept here so the report stays honest when re-run).
const PARTIAL = {
  'Private profile notes': 'Notes are stored on this device only (not synced)',
  'Saved date plans': 'Stored on this device only (not synced)',
  'Saved profiles': 'Stored on this device only (not synced)',
};

// Every place the package and the v2 spec disagree. Decision follows the rules in the brief:
// v2 wins for safety / compliance / accessibility; the package wins for copy tone; anything else is flagged for Dawood.
const CONFLICTS = [
  ['Plus model', 'Plus = advanced preference filters + saved presets; viewing and responding to likes stays free (README, 30, 31, likes.svg)', 'Plus = see who liked you (Free list blurred), more daily introductions, advanced preferences, undo', 'Product decision, not safety/compliance: kept v2 behaviour, adopted package framing copy ("core matching, chat, privacy and safety stay free"), added "Saved preference presets" as a Plus feature. **Needs your decision.**'],
  ['Minimum photos', '"Add at least one clear photo" (13)', 'Minimum 3 photos', 'Kept v2 (3): more photos support verification/moderation. Package copy adapted to "at least 3". **Confirm.**'],
  ['Per-photo privacy', '"Choose which photos stay private. Share private photos match by match" (13, privacy.svg)', 'One "Blur my photos" switch + share/revoke per person', 'Kept v2 (single switch, per-person grants). Per-photo privacy not built. **Confirm.**'],
  ['Intention options', 'Long-term relationship · Exploring my intentions · Tell us in your own words (09)', 'Long-term · Life partner · Figuring it out', 'Kept v2 options (needed for Muslim/Gulf markets: "life partner"); renamed "Figuring it out" → "Exploring my intentions" (package tone) and added the optional "In your own words" field.'],
  ['Gender', '"Gender: Choose how you identify" on Your identity (08)', 'Not in v2 spec', 'Added (needed for "Who you meet"). Optional free-text option included; shown only to you unless you choose to show it.'],
  ['Who you meet', 'Preferences step in onboarding with age range (10)', 'Preferences only in settings', 'Added onboarding step; same data as Settings → Preferences.'],
  ['Notifications step', '"Choose notifications" — pick types, quiet hours editable (18)', 'Explainer then system prompt', 'Both: type toggles + quiet-hours note, then the system prompt (v2 accessibility/permissions rule: explain first).'],
  ['Report + block', '"You can block this person separately" (26, 27)', '"Also block" toggle (default on) in report', 'Safety → v2 wins: kept the toggle, default on; package copy used for the hint.'],
  ['Report outcome', '"We will update you when there is an outcome" (27)', 'Not specified', 'Added outcome items in the notification inbox.'],
  ['Unmatch wording', '"End this connection?" / ended connections can still be reported (29, chats.svg)', 'Unmatch', 'Package copy adopted; "Ended connections" section added to Chats so past connections can be reported (safety).'],
  ['Export verification', '"Verify your account before requesting" (51)', 'Not specified', 'Adopted: export requires a fresh code (reauthentication).'],
  ['Privacy save button', '"Save privacy settings" button (privacy.svg)', 'Toggles apply immediately', 'Kept immediate apply (fewer lost changes; announced to screen readers). No save button.'],
  ['Incognito', 'Incognito: "Only people you like can see you. Available to everyone for free." (privacy.svg)', '"Who can find me: Everyone / Only people I’ve liked"', 'Same feature; adopted the Incognito name and copy as a switch.'],
  ['Prices', 'US$9.99 / month shown on 32, 41', 'Prices only from the store', 'v2 wins (compliance): no hard-coded prices anywhere; mock store shows "Test price".'],
  ['Sample data', 'Alex, Maya, Jamie, Chris, +1 416 555 0123, renewal 28 November', 'Fictional data only in mock', 'Kept inside src/data/seed.ts / mock.ts only. Placeholders in forms use a generic number.'],
  ['Status bar / colours / 3D icons', 'Fake 9:41 status bar, gradient buttons, 3D emoji icons', 'Native status bar, design tokens, lucide outline icons', 'v2 wins (design system rules in the brief).'],
  ['Account settings hub', 'Separate "Account settings" screen (48)', 'Grouped settings on the You tab', 'Both: You tab keeps the groups; new Settings → Account hub for account, data and help (you.svg "Settings").'],
];

// ---------- build ----------
const norm = (s) => (s ?? '').toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').replace(/[^\p{L}\p{N}' ]/gu, '').trim();
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' / ');

const en = await loadEn();
const inventory = JSON.parse(readFileSync(join(ROOT, 'reference-prototype/Journey_Inventory.json'), 'utf8'));
const rows = [];
const copyDiffs = [];
const counts = { built: 0, partial: 0, missing: 0 };
const bump = (s) => (counts[s] += 1);

for (const item of inventory) {
  const m = MAP[item.id] ?? {};
  const file = routeFile(m.route);
  const missingKeys = [];
  const diffs = [];
  for (const field of ['title', 'body', 'cta']) {
    const key = m.keys?.[field];
    if (key === undefined || key === null) continue;
    const ours = get(en, key);
    if (typeof ours !== 'string') {
      missingKeys.push(key);
      continue;
    }
    const theirs = item[field];
    const same = norm(ours) === norm(theirs) || (field === 'body' && norm(theirs).includes(norm(ours)));
    if (!same) diffs.push({ field, theirs, ours, key });
  }
  let status = !file ? 'missing' : missingKeys.length ? 'partial' : m.partial ? 'partial' : 'built';
  bump(status);
  const note = [m.note, m.partial, missingKeys.length ? `missing strings: ${missingKeys.join(', ')}` : ''].filter(Boolean).join('; ');
  rows.push({ id: item.id, name: item.name, route: file ? m.route : m.route ? `${m.route} (not built)` : '—', status, copy: diffs.length ? `${diffs.length} field(s) differ` : 'matches', note, source: 'inventory' });
  for (const d of diffs) copyDiffs.push({ id: item.id, name: item.name, ...d });
}

for (const c of CORE) {
  const file = routeFile(c.route);
  const status = !file ? 'missing' : c.partial ? 'partial' : 'built';
  bump(status);
  rows.push({ id: `core:${c.svg}`, name: c.name, route: file ? c.route : `${c.route} (not built)`, status, copy: 'see core-screen notes', note: c.partial ?? '', source: 'core' });
}

for (const [name, route] of APPENDIX_B) {
  const file = routeFile(route);
  const status = !file ? 'missing' : PARTIAL[name] ? 'partial' : 'built';
  bump(status);
  rows.push({ id: 'B', name, route: file ? route : `${route} (not built)`, status, copy: 'from name only', note: PARTIAL[name] ?? '', source: 'appendixB' });
}

// "Vera" (the old brand) must never ship.
const VERA = /\bvera\b/i;
const veraPackage = [];
if (VERA.test(JSON.stringify(inventory))) veraPackage.push('Journey_Inventory.json');
const extractedPath = join(ROOT, 'reference-prototype/_extracted.json');
if (existsSync(extractedPath)) for (const [k, v] of Object.entries(JSON.parse(readFileSync(extractedPath, 'utf8')))) if (VERA.test(JSON.stringify(v))) veraPackage.push(`${k}.svg`);
const veraApp = [];
const { readdirSync, statSync } = await import('node:fs');
(function walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|json)$/.test(n) && VERA.test(readFileSync(p, 'utf8'))) veraApp.push(p.slice(ROOT.length + 1));
  }
})(join(ROOT, 'src'));

const total = rows.length;
const by = (src) => rows.filter((r) => r.source === src);
const tally = (list) => ['built', 'partial', 'missing'].map((s) => `${list.filter((r) => r.status === s).length} ${s}`).join(' · ');

const md = [];
md.push('# Gap report — Neeo design package vs. app', '');
md.push(`_Generated by \`node scripts/gap-report.mjs\` on ${new Date().toISOString().slice(0, 10)}. Do not edit by hand — change the app or the mapping in the script and re-run._`, '');
md.push('## Summary', '');
md.push(`| Source | Screens | Status |`, `|---|---|---|`);
md.push(`| Journey_Inventory.json (01–58) | ${by('inventory').length} | ${tally(by('inventory'))} |`);
md.push(`| Core photo-led SVGs | ${by('core').length} | ${tally(by('core'))} |`);
md.push(`| Appendix B (from name only) | ${by('appendixB').length} | ${tally(by('appendixB'))} |`);
md.push(`| **All** | **${total}** | **${counts.built} built · ${counts.partial} partial · ${counts.missing} missing** |`, '');
md.push(`Copy: ${copyDiffs.length} title/body/CTA fields differ from the package (listed below; many are deliberate — form placeholders, sample data, or v2 rules).`, '');
md.push(`“Vera” check (whole word, case-insensitive): package inventory + extracted SVG text → ${veraPackage.length ? veraPackage.join(', ') : 'none'}; app source (src/) → ${veraApp.length ? veraApp.join(', ') : 'none'}.`, '');

md.push('## Conflicts between the package and the v2 spec', '');
md.push('| Topic | Package | v2 spec | Decision |', '|---|---|---|---|');
for (const c of CONFLICTS) md.push(`| ${c.map(esc).join(' | ')} |`);
md.push('');

md.push('## Screens', '');
md.push('| ID | Screen | Our route | Status | Copy | Notes |', '|---|---|---|---|---|---|');
for (const r of rows) md.push(`| ${r.id} | ${esc(r.name)} | \`${esc(r.route)}\` | ${r.status} | ${esc(r.copy)} | ${esc(r.note)} |`);
md.push('');

md.push('## Copy differences (package vs. ours)', '');
md.push('| ID | Screen | Field | Package | Ours (i18n key) |', '|---|---|---|---|---|');
for (const d of copyDiffs) md.push(`| ${d.id} | ${esc(d.name)} | ${d.field} | ${esc(d.theirs)} | ${esc(d.ours)} (\`${d.key}\`) |`);
md.push('');

writeFileSync(join(ROOT, 'GAP_REPORT.md'), md.join('\n'));
console.log(`GAP_REPORT.md: ${total} screens — ${counts.built} built, ${counts.partial} partial, ${counts.missing} missing; ${copyDiffs.length} copy differences`);
if (veraApp.length) {
  console.error(`"Vera" found in app source: ${veraApp.join(', ')}`);
  process.exit(1);
}
if (process.argv.includes('--strict') && counts.missing > 0) process.exit(1);
