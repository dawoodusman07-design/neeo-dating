// Web E2E of the critical paths, run against `expo export --platform web` (mock data).
// Mirrors maestro/*.yaml so the paths are verified in CI without a simulator.
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
  const dialogs = [];
  page.on('dialog', async (d) => {
    dialogs.push(d.message());
    // "Are you sure?" nudge → "Edit message" (dismiss); anything else → accept.
    if (d.message().includes('Are you sure?')) await d.dismiss();
    else await d.accept();
  });
  const tid = (id) => page.locator(`[data-testid="${id}"]`).first();
  const see = (text) => page.getByText(text, { exact: false }).filter({ visible: true }).first().waitFor({ state: 'visible', timeout: 8000 });
  const button = (name) => page.getByRole('button', { name }).filter({ visible: true }).first().click();
  const tab = (name) => page.getByRole('tab', { name: new RegExp('^' + name) }).click();
  /** Press Back/Close until the tab bar is visible again. */
  const backToTabs = async () => {
    for (let i = 0; i < 8; i++) {
      if (await page.getByRole('tablist').isVisible().catch(() => false)) return;
      const b = page.getByRole('button', { name: /^(Back|Close)$/ }).first();
      if (await b.isVisible().catch(() => false)) await b.click();
      else await page.goBack();
      await page.waitForTimeout(400);
    }
  };
  const dev = async (testId) => {
    await backToTabs();
    await tab('You');
    await tid('dev-menu').click();
    await tid(testId).click();
    await page.waitForTimeout(300);
    await backToTabs();
  };
  const buyPlus = async () => {
    await tab('You');
    await button(/^Neeo Plus/);
    await tid('plus-compare').click();
    await tid('plus-review').click();
    await see('Auto-renews until cancelled');
    await tid('plus-continue').click();
  };
  const step = (s) => console.log('✓', s);

  try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await see('Make room for something real.');
    step('welcome (package 01 copy)');

    // ---- sign-up: code error (05) + age gate (06/07) ----
    await tid('create-account').click();
    await tid('phone-input').fill('+15555550100');
    await tid('send-code').click();
    await tid('otp-input').fill('000000');
    await see('That code did not work');
    await see('attempts left');
    step('wrong code → "That code did not work" with attempts left');
    await tid('otp-input').fill('123456');
    await see('Dating for adults');
    await tid('dob-input').fill('20120101');
    await tid('dob-continue').click();
    await see('You cannot join yet');
    step('under-18 → not eligible');

    // ---- demo (onboarded) account ----
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await tid('create-account').click();
    await tid('phone-input').fill('+15555550199');
    await tid('send-code').click();
    await tid('otp-input').fill('123456');
    await see('Maya, 28');
    step('signed in → Discover');

    // ---- restore with nothing to restore (38 → 40) ----
    await tab('You');
    await button(/^Settings/);
    await button(/^Membership/);
    await see('You’re on Free');
    await button(/^Restore purchase/);
    await tid('restore-confirm').click();
    await see('No active purchase found');
    step('restore → "No active purchase found"');
    await backToTabs();

    // ---- purchase failed (37) ----
    await dev('dev-outcome-failed');
    await buyPlus();
    await see('Purchase could not be completed');
    step('purchase failed → "Purchase could not be completed"');
    await backToTabs();

    // ---- purchase pending (36) → check status → success (34) → membership (41) ----
    await dev('dev-outcome-pending');
    await buyPlus();
    await see('Waiting for confirmation');
    await button(/^Check purchase status/);
    await see('Still waiting for your store');
    await page.waitForTimeout(500);
    await button(/^Check purchase status/);
    await see('Welcome to Neeo Plus');
    step('purchase pending → check status → confirmed');
    await button(/^Explore Plus/);
    await see('You are on Neeo Plus');
    step('membership: "You are on Neeo Plus"');

    // ---- membership states as RevenueCat reports them (43, 44, 45) ----
    for (const [id, text] of [
      ['dev-membership-renewal_off', 'Renewal is off'],
      ['dev-membership-billing_issue', 'Your store needs attention'],
      ['dev-membership-expired', 'You are back on Free'],
    ]) {
      await dev(id);
      await tab('You');
      await button(/^Settings/);
      await button(/^Membership/);
      await see(text);
      await backToTabs();
    }
    step('membership: renewal off / billing issue / expired');

    // ---- restore success (39) ----
    await tab('You');
    await button(/^Settings/);
    await button(/^Membership/);
    await button(/^Restore purchase/);
    await tid('restore-confirm').click();
    await see('Your Plus access is restored');
    step('restore → "Your Plus access is restored"');
    await backToTabs();

    // ---- like → match → chat → nudge ----
    await tab('Discover');
    await tid('like').click();
    await tid('like-comment').fill('That Sunday sounds perfect.');
    await tid('send-like').click();
    await see('It’s a match');
    await tid('match-send').click();
    await page.getByPlaceholder('Message Maya…').waitFor({ timeout: 8000 });
    await tid('composer').fill('Hi Maya! Farmers market this weekend?');
    await tid('send').click();
    await see('Hi Maya! Farmers market this weekend?');
    await see('there’s no reply countdown');
    step('like with comment → match → chat');
    dialogs.length = 0;
    await tid('composer').fill('you are stupid');
    await tid('send').click();
    await page.waitForTimeout(500);
    assert.ok(dialogs.some((m) => m.includes('Are you sure?')), 'harmful-message nudge shown');
    step('harmful-message nudge');

    // ---- report (25 → 26 → 27) + block ----
    await tid('chat-safety').click();
    await page.getByRole('button', { name: 'Report' }).first().click();
    await see('Tell us what happened');
    await tid('report-review').click();
    await see('Choose a reason');
    step('report: reason is required (error text)');
    await page.getByRole('radio', { name: 'Harassment or hateful messages' }).click();
    await tid('report-review').click();
    await see('Ready to submit?');
    await tid('report-submit').click();
    await see('Thank you for telling us');
    step('report: review → received');
    await backToTabs();
    await tab('Chats');
    await page.waitForTimeout(800);
    assert.equal(await tid('chat-row-Maya').count(), 0, 'blocked match removed from chats');
    step('blocked user gone from chats');

    // ---- end a connection (29) → listed under Ended connections ----
    await tid('chat-row-Ayesha').click();
    await tid('chat-safety').click();
    await button('End connection');
    await tid('unmatch-confirm').click();
    await see('Connection ended');
    await button(/^Back to chats/);
    await see('Ended connections');
    step('end connection → "Ended connections" (still reportable)');

    // ---- support request (46 → 47) ----
    await tab('You');
    await button(/^Settings/);
    await button(/^Help inbox/);
    await tid('support-new').click();
    await tid('support-review').click();
    await see('Choose one');
    await page.getByRole('radio', { name: 'Billing' }).click();
    await tid('support-body').fill('Help');
    await tid('support-review').click();
    await see('at least 10 characters');
    await tid('support-body').fill('I was charged twice this month.');
    await tid('support-review').click();
    await tid('support-send').click();
    await see('We have your request');
    await see('NE-');
    step('support: validation → request received with reference');
    await backToTabs();

    // ---- delete: reauth (wrong code) → confirm → removed (52 → 53 → 54) ----
    await tab('You');
    await button(/^Settings/);
    await button(/^Delete account/);
    await see('Before you leave');
    await tid('delete-continue').click();
    await tid('reauth-otp').fill('111111');
    await tid('reauth-verify').click();
    await see('2 attempts left');
    step('reauthentication failure shows attempts left');
    await tid('reauth-otp').fill('123456');
    await tid('reauth-verify').click();
    await see('Delete your Neeo account?');
    await tid('delete-confirm').fill('nope');
    await tid('delete-final').click();
    await see('Type DELETE to confirm');
    await tid('delete-confirm').fill('DELETE');
    await tid('delete-final').click();
    await see('Your profile is removed');
    await button(/^Back to welcome/);
    await see('Make room for something real.');
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
