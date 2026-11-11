// Web E2E of the critical path, run against `expo export --platform web` (mock data).
// Mirrors maestro/*.yaml so the path is verified in CI without a simulator.
// Usage: node scripts/e2e-web.cjs <webDir>
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');

const dir = process.argv[2] ?? 'dist';
const PORT = 8123;
const BASE = `http://localhost:${PORT}`;

(async () => {
  const server = spawn(process.execPath, [`${__dirname}/serve-web.mjs`, dir, String(PORT)], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800));
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 430, height: 932 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const nudges = [];
  page.on('dialog', async (d) => {
    nudges.push(d.message());
    // "Are you sure?" nudge → choose "Edit message" (dismiss); other confirmations (block, close) → accept.
    if (d.message().includes('Are you sure?')) await d.dismiss();
    else await d.accept();
  });
  const tid = (id) => page.locator(`[data-testid="${id}"]`).first();
  const see = (text) => page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout: 8000 });
  const step = (s) => console.log('✓', s);
  try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await see('Something real starts with hello.');
    step('welcome');

    // Age gate (fresh account)
    await tid('create-account').click();
    await tid('phone-input').fill('+15555550100');
    await tid('send-code').click();
    await tid('otp-input').fill('000000');
    await see('That code didn’t match');
    step('wrong OTP shows an error');
    await tid('otp-input').fill('123456');
    await see('When’s your birthday?');
    await tid('dob-input').fill('20120101');
    await tid('dob-continue').click();
    await see('Neeo is for adults');
    step('under-18 blocked');

    // Demo (onboarded) account for the main path
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await tid('create-account').click();
    await tid('phone-input').fill('+15555550199');
    await tid('send-code').click();
    await tid('otp-input').fill('123456');
    await see('Maya, 28');
    step('signed in → Discover');

    await tid('like').click();
    await tid('like-comment').fill('That Sunday sounds perfect.');
    await tid('send-like').click();
    await see('It’s a match');
    step('like with comment → match');

    await tid('match-send').click();
    await tid('composer').fill('Hi Maya! Farmers market this weekend?');
    await tid('send').click();
    await see('Hi Maya! Farmers market this weekend?');
    await see('there’s no reply countdown');
    step('chat message sent');

    await tid('composer').fill('you are stupid');
    nudges.length = 0;
    await tid('send').click();
    await page.waitForTimeout(500);
    assert.ok(nudges.some((m) => m.includes('Are you sure?')), 'harmful-message nudge shown');
    step('harmful-message nudge');

    await tid('chat-safety').click();
    await page.getByRole('button', { name: 'Report' }).first().click();
    await page.getByRole('radio', { name: 'Harassment or hateful messages' }).click();
    await tid('report-submit').click();
    await see('Thanks for telling us');
    step('report sent (+ block)');
    await page.getByRole('button', { name: 'Done' }).click();
    await page.getByRole('tab', { name: /^Chats/ }).click();
    await page.waitForTimeout(800);
    assert.equal(await tid('chat-row-Maya').count(), 0, 'blocked match removed from chats');
    step('blocked user gone from chats');

    await page.getByRole('tab', { name: /^You/ }).click();
    await page.getByRole('button', { name: 'Delete account' }).click();
    await tid('delete-continue').click();
    await tid('delete-otp').fill('123456');
    await tid('delete-reauth').click();
    await tid('delete-confirm').fill('DELETE');
    await tid('delete-final').click();
    await see('Your account has been deleted');
    await page.getByRole('button', { name: 'Close' }).click();
    await see('Something real starts with hello.');
    step('account deleted → welcome');

    assert.deepEqual(errors, [], `page errors: ${errors.join('\n')}`);
    console.log('\nWEB E2E PASSED');
  } catch (e) {
    await page.screenshot({ path: 'e2e-failure.png' });
    console.error(e);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.kill();
  }
})();
