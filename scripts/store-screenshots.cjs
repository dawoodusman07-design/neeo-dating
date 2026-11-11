// Captures store screenshots from the real app (web build, mock data).
// Usage: node scripts/store-screenshots.cjs <webDir> [outDir]
// Sizes: iPhone 6.7" 1290×2796, iPhone 6.5" 1242×2688, Android phone 1080×2400.
// NOTE: re-capture from device builds (Maestro `takeScreenshot`) before submission
// so the native status bar and fonts are pixel-exact.
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const { mkdirSync } = require('node:fs');

const dir = process.argv[2] ?? 'dist';
const out = process.argv[3] ?? 'store/screenshots';
const PORT = 8124;
const DEVICES = [
  { name: 'iphone-6.7', width: 430, height: 932 },
  { name: 'iphone-6.5', width: 414, height: 896 },
  { name: 'android-phone', width: 360, height: 800 },
];

(async () => {
  const server = spawn(process.execPath, [`${__dirname}/serve-web.mjs`, dir, String(PORT)], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800));
  const browser = await chromium.launch();
  for (const d of DEVICES) {
    mkdirSync(`${out}/${d.name}`, { recursive: true });
    const page = await (await browser.newContext({ viewport: { width: d.width, height: d.height }, deviceScaleFactor: 3 })).newPage();
    page.on('dialog', (x) => x.accept());
    const tid = (id) => page.locator(`[data-testid="${id}"]`).first();
    let n = 0;
    const shot = async (name) => {
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${out}/${d.name}/${String(++n).padStart(2, '0')}-${name}.jpg`, type: 'jpeg', quality: 88 });
    };
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    await shot('welcome');
    await tid('create-account').click();
    await tid('phone-input').fill('+15555550199');
    await tid('send-code').click();
    await tid('otp-input').fill('123456');
    await page.getByText('Maya, 28').first().waitFor();
    await shot('discover');
    await tid('see-more').click();
    await shot('profile');
    await page.goBack();
    await page.getByRole('tab', { name: /^Chats/ }).click();
    await tid('chat-row-Ayesha').click();
    await shot('chat-date-idea');
    await tid('chat-safety').click();
    await page.getByRole('button', { name: 'Set up a date check-in' }).click();
    await shot('date-check-in');
    await page.goBack();
    await page.waitForTimeout(400);
    await page.goBack();
    await page.getByRole('tab', { name: /^You/ }).click();
    await page.getByRole('button', { name: 'Photo privacy' }).click();
    await shot('photo-privacy');
    console.log(`✓ ${d.name}: ${n} screenshots`);
  }
  await browser.close();
  server.kill();
})();
