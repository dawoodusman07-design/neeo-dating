/**
 * UX/UI QA crawler: walks every route of the web build (mock data) in one browser session per
 * configuration, screenshots each screen and runs automated checks on it:
 *   axe-core (WCAG 2.2 A/AA), console errors/warnings, horizontal overflow, controls smaller than
 *   44x44, clipped text, copy rules (please / successfully / ! / lorem / Vera / hard-coded prices),
 *   tab bar visible where it must not be.
 *
 * Usage: node scripts/qa-crawl.cjs <webDir> <config> [port]
 *   config: 320-light | 320-dark | 390-light | 390-dark | 430-light | 430-dark | zoom200 | rtl
 * Writes qa/screens/<config>/NN-slug.jpg and qa/results/<config>.json
 */
const { chromium } = require('playwright');
const { default: AxeBuilder } = require('@axe-core/playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const [dir = 'dist-web', config = '390-light', portArg] = process.argv.slice(2);
const PORT = Number(portArg ?? 8100 + Math.floor(Math.random() * 800));
const BASE = `http://localhost:${PORT}`;
const ROOT = path.join(__dirname, '..', 'qa');
const OUT = path.join(ROOT, 'screens', config);
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(ROOT, 'results'), { recursive: true });

const CONFIGS = {
  '320-light': { w: 320, h: 568, scheme: 'light' },
  '320-dark': { w: 320, h: 568, scheme: 'dark' },
  '390-light': { w: 390, h: 844, scheme: 'light', axe: true },
  '390-dark': { w: 390, h: 844, scheme: 'dark', axe: true },
  '430-light': { w: 430, h: 932, scheme: 'light' },
  '430-dark': { w: 430, h: 932, scheme: 'dark' },
  // 200% browser zoom on a 390pt phone = a 195 CSS-px viewport rendered at 2x (WCAG 1.4.4 / 1.4.10).
  zoom200: { w: 195, h: 422, dsf: 2, scheme: 'light' },
  // Urdu, switched in Region & language (sets dir=rtl on web).
  rtl: { w: 390, h: 844, scheme: 'light', rtl: true },
};
const C = CONFIGS[config];
if (!C) throw new Error(`unknown config ${config}`);

// ---------------------------------------------------------------- routes
const STATES = ['purchase-pending', 'purchase-failed', 'purchase-cancelled', 'purchase-success', 'restored', 'restore-none', 'billing-issue', 'session-expired', 'export-ready', 'export-expired', 'offline', 'upload-failed', 'account-review', 'suspended', 'paused', 'deleted', 'not-found', 'reauth-failed', 'appeal-sent', 'support-received', 'report-sent', 'connection-ended', 'blocked'];
const INFO = ['whats-new', 'about', 'matching', 'photo-privacy', 'plus-faq', 'safety', 'community', 'privacy-summary', 'subscription-terms', 'refunds'];
const ONBOARDING = ['dob', 'not-eligible', 'name', 'intention', 'photos', 'prompts', 'date-ideas', 'preferences', 'location', 'agreement', 'notifications', 'verify', 'review'];
const SETTINGS = ['chaperone', 'friends-take', 'account', 'edit-profile', 'photos', 'photo-privacy', 'preferences', 'notifications', 'quiet-hours', 'region', 'appearance', 'readability', 'safety', 'block-contacts', 'blocked', 'help', 'export', 'pause', 'appeal', 'logout', 'delete-account'];
const MEMBERSHIP = ['free', 'pending', 'active', 'renewal_off', 'billing_issue', 'expired'];
/** Screens on which the tab bar must NOT be visible (HIG: focused tasks hide the tab bar). */
const NO_TABBAR = /^\/(chat\/|profile|plus|match|report|block|unblock|unmatch|check-in|share-photos|photo-request|membership\/cancel|reauth)/;

// ---------------------------------------------------------------- checks in the page
async function pageChecks(page) {
  return page.evaluate(() => {
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
      // inside a hidden stack screen?
      for (let p = el; p; p = p.parentElement) {
        const ps = getComputedStyle(p);
        if (ps.display === 'none' || ps.visibility === 'hidden') return false;
        if (p.getAttribute && p.getAttribute('aria-hidden') === 'true') return false;
      }
      return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    };
    const label = (el) => (el.getAttribute('aria-label') || el.innerText || el.getAttribute('placeholder') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 60);
    const out = { overflowX: document.documentElement.scrollWidth > innerWidth + 1, small: [], clipped: [], offscreen: [], text: '', tabbar: false };
    const ctrls = document.querySelectorAll('[role=button],[role=link],[role=switch],[role=tab],[role=checkbox],[role=radio],a,button,input,textarea');
    for (const el of ctrls) {
      if (!vis(el)) continue;
      const r = el.getBoundingClientRect();
      // WCAG 2.5.8 exempts links inside a sentence; record them separately.
      const inline = el.tagName === 'SPAN' || (el.parentElement && getComputedStyle(el).display === 'inline');
      if ((r.width < 43.5 || r.height < 43.5) && !inline) out.small.push(`${label(el)} (${Math.round(r.width)}x${Math.round(r.height)})`);
      if (r.right > innerWidth + 1 || r.left < -1) {
        let scroller = false;
        for (let p = el.parentElement; p; p = p.parentElement) if (/(auto|scroll)/.test(getComputedStyle(p).overflowX)) scroller = true;
        if (!scroller) out.offscreen.push(label(el));
      }
    }
    for (const el of document.querySelectorAll('div[dir],span[dir]')) {
      if (!el.childNodes.length || el.children.length) continue; // leaf text nodes only
      if (!vis(el)) continue;
      const s = getComputedStyle(el);
      const clamped = s.webkitLineClamp && s.webkitLineClamp !== 'none';
      if (!clamped && s.textOverflow !== 'ellipsis' && (el.scrollWidth > el.clientWidth + 2) && s.overflowX === 'hidden') out.clipped.push(label(el));
    }
    out.text = document.body.innerText;
    out.tabbar = [...document.querySelectorAll('[role=tab]')].some((el) => vis(el) && /^(Discover|Likes|Chats|You)/.test(el.getAttribute('aria-label') || el.innerText));
    out.lang = document.documentElement.lang;
    out.dir = document.documentElement.dir || getComputedStyle(document.body).direction;
    return out;
  });
}

const COPY_RULES = [
  [/\bplease\b/i, 'says "please"'],
  [/successfully/i, 'says "successfully"'],
  [/[A-Za-z)]!(\s|$)/, 'uses "!"'],
  [/lorem|ipsum/i, 'placeholder text'],
  [/\bVera\b/, 'old brand name "Vera"'],
  [/[$£€]\s?\d|\d\s?(USD|CAD|GBP|PKR|AED)\b/, 'hard-coded price'],
];

// ---------------------------------------------------------------- run
(async () => {
  const server = spawn(process.execPath, [path.join(__dirname, 'serve-web.mjs'), dir, String(PORT)], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 700));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: C.w, height: C.h }, deviceScaleFactor: C.dsf ?? 1, colorScheme: C.scheme, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  let consoleBuf = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') consoleBuf.push(`${m.type()}: ${m.text().slice(0, 300)}`);
  });
  page.on('pageerror', (e) => consoleBuf.push(`pageerror: ${String(e).slice(0, 300)}`));

  const tid = (id) => page.locator(`[data-testid="${id}"]`).filter({ visible: true }).first();
  const see = (t) => page.getByText(t).filter({ visible: true }).first().waitFor({ timeout: 10000 });
  const nav = async (p) => {
    await page.evaluate((u) => {
      history.pushState({}, '', u);
      dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
    }, p);
    await page.waitForTimeout(700);
  };
  const results = [];
  let n = 0;
  const shot = async (slug, route, note) => {
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(350);
    n += 1;
    const file = `${String(n).padStart(3, '0')}-${slug.replace(/[^a-z0-9-]+/gi, '_')}.jpg`;
    await page.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 62 });
    const chk = await pageChecks(page);
    const issues = [];
    for (const [re, msg] of COPY_RULES) {
      const m = chk.text.match(re);
      if (m) issues.push({ kind: 'copy', msg: `${msg}: “…${chk.text.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\s+/g, ' ')}…”` });
    }
    if (chk.overflowX) issues.push({ kind: 'layout', msg: 'page scrolls horizontally' });
    for (const s of chk.small) issues.push({ kind: 'target', msg: `touch target < 44: ${s}` });
    for (const s of chk.clipped) issues.push({ kind: 'clipped', msg: `text clipped: ${s}` });
    for (const s of chk.offscreen) issues.push({ kind: 'layout', msg: `control off screen: ${s}` });
    if (chk.tabbar && NO_TABBAR.test(route)) issues.push({ kind: 'hierarchy', msg: 'tab bar visible in a focused flow' });
    for (const c of consoleBuf) issues.push({ kind: 'console', msg: c });
    consoleBuf = [];
    if (C.axe) {
      try {
        const ax = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        for (const v of ax.violations) issues.push({ kind: 'axe', rule: v.id, impact: v.impact, msg: `${v.id} (${v.impact}): ${v.help} — ${v.nodes.slice(0, 3).map((x) => x.target.join(' ')).join(' | ')}`, nodes: v.nodes.length });
      } catch (e) {
        issues.push({ kind: 'axe', msg: `axe failed: ${e.message.slice(0, 120)}` });
      }
    }
    results.push({ n, slug, route, note, file: `screens/${config}/${file}`, issues });
    process.stdout.write(`${issues.length ? '•' : '.'}`);
  };
  const visit = async (route, slug = route) => {
    try {
      await nav(route);
      await shot(slug.replace(/^\//, '') || 'root', route.split('?')[0]);
    } catch (e) {
      results.push({ slug, route, error: String(e).slice(0, 200), issues: [{ kind: 'crawl', msg: String(e).slice(0, 200) }] });
    }
  };
  const step = async (slug, route, fn) => {
    try {
      await fn();
      await shot(slug, route);
    } catch (e) {
      results.push({ slug, route, error: String(e).slice(0, 200), issues: [{ kind: 'crawl', msg: `${slug}: ${String(e).slice(0, 200)}` }] });
    }
  };

  try {
    // ---------------- signed out
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await see('Make room for something real.');
    await shot('welcome', '/welcome');
    await step('sign-in-phone', '/sign-in/phone', () => tid('create-account').click());
    await step('sign-in-phone-invalid', '/sign-in/phone', async () => {
      await tid('phone-input').fill('12');
      await tid('phone-input').blur();
    });
    await step('sign-in-otp', '/sign-in/otp', async () => {
      await tid('phone-input').fill('+15555550123');
      await tid('send-code').click();
      await tid('otp-input').waitFor();
    });
    await step('sign-in-otp-wrong', '/sign-in/otp', async () => {
      await tid('otp-input').fill('000000');
      await page.waitForTimeout(600);
    });
    await visit('/sign-in/locked?sec=900', 'sign-in-locked');
    for (const i of INFO) await visit(`/info/${i}`, `info-${i}`);
    for (const s of STATES) await visit(`/state/${s}?name=Maya&ref=NE-000000`, `state-${s}`);

    // ---------------- onboarding (new account)
    await nav('/sign-in/otp?phone=%2B15555550123');
    await tid('otp-input').fill('123456');
    await page.waitForTimeout(1200);
    for (const o of ONBOARDING) await visit(`/onboarding/${o}`, `onboarding-${o}`);
    await step('onboarding-notifications-denied', '/onboarding/notifications', async () => {
      await nav('/onboarding/notifications');
      await tid('notif-allow').click();
      await tid('notifications-off').waitFor({ timeout: 5000 });
    });
    await step('onboarding-dob-under18', '/onboarding/dob', async () => {
      await nav('/onboarding/dob');
      await tid('dob-input').fill('2012-01-01');
      await tid('dob-input').blur();
    });

    // ---------------- signed in (demo account): fresh page, sign in
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await tid('create-account').click();
    await tid('phone-input').fill('+15555550199');
    await tid('send-code').click();
    await tid('otp-input').fill('123456');
    await see('Maya, 28');
    if (C.rtl) {
      await nav('/settings/region');
      await page.getByText(/Urdu/).first().click();
      await page.waitForTimeout(800);
      await page.keyboard.press('Escape').catch(() => {});
      await shot('region-urdu-selected', '/settings/region');
    }
    for (const tab of ['discover', 'likes', 'chats', 'you']) await visit(`/${tab}`, `tab-${tab}`);
    for (const p of ['p_maya', 'p_lena', 'p_omar', 'p_ayesha']) await visit(`/profile/${p}`, `profile-${p}`);
    await visit('/chat/m_ayesha', 'chat');
    await step('chat-draft', '/chat/m_ayesha', async () => {
      await tid('composer').fill('Coffee on Saturday? I know a quiet place near the lake.');
    });
    await step('chat-safety-sheet', '/chat/m_ayesha', async () => {
      await tid('composer').fill('');
      await tid('chat-safety').click();
      await page.waitForTimeout(500);
    });
    await page.keyboard.press('Escape').catch(() => {});
    await visit('/match/m_ayesha', 'match');
    for (const r of ['/plus', '/plus/compare', '/plus/checkout', '/plus/review']) await visit(r, r.slice(1).replace('/', '-'));
    for (const s of MEMBERSHIP) {
      await step(`membership-${s}`, '/membership', async () => {
        await nav('/dev');
        await tid(`dev-membership-${s}`).click();
        await page.waitForTimeout(500);
        await nav('/membership');
      });
    }
    await visit('/membership/cancel', 'membership-cancel');
    await visit('/membership/restore', 'membership-restore');
    await step('membership-reset-free', '/dev', async () => {
      await nav('/dev');
      await tid('dev-membership-free').click();
    });
    for (const s of SETTINGS) await visit(`/settings/${s}`, `settings-${s}`);
    // ---- edge states (mock toggles in the dev menu) ----
    const dev = async (id) => {
      await nav('/dev');
      await tid(id).click();
      await page.waitForTimeout(300);
    };
    await dev('dev-slow');
    for (const r of ['/discover', '/chats', '/likes']) {
      await step(`loading${r.replace('/', '-')}`, r, async () => {
        await page.evaluate((u) => { history.pushState({}, '', u); dispatchEvent(new PopStateEvent('popstate', { state: history.state })); }, r);
        await page.waitForTimeout(250);
      });
    }
    await page.waitForTimeout(3500);
    await dev('dev-slow');
    await dev('dev-offline');
    for (const r of ['/discover', '/chats', '/likes']) await visit(r, `offline${r.replace('/', '-')}`);
    await dev('dev-offline');
    await dev('dev-scenario-empty');
    for (const r of ['/discover', '/chats', '/likes', '/notifications']) await visit(r, `empty${r.replace('/', '-')}`);
    await dev('dev-scenario-daily_limit');
    await visit('/discover', 'daily-limit-reached');
    await dev('dev-scenario-demo');
    await visit('/check-in-prompt/none', 'check-in-prompt-none');
    for (const r of ['/notifications', '/saved', '/appeals', '/account-review', '/reauth', '/verify', '/support', '/support/inbox']) await visit(r, r.slice(1).replace('/', '-'));
    await visit('/report/p_maya?name=Maya&matchId=m_ayesha', 'report');
    await visit('/photo-request/p_omar', 'photo-request');
    await visit('/share-photos/m_ayesha', 'share-photos');
    await visit('/check-in/m_ayesha', 'check-in');
    await visit('/block/p_lena', 'block');
    await visit('/unblock/p_lena?name=Lena', 'unblock');
    await visit('/unmatch/m_ayesha', 'unmatch');
    await visit('/dev', 'dev-menu');
    await visit('/dev/components', 'dev-components');
  } catch (e) {
    results.push({ slug: 'fatal', issues: [{ kind: 'crawl', msg: String(e).slice(0, 300) }] });
  } finally {
    fs.writeFileSync(path.join(ROOT, 'results', `${config}.json`), JSON.stringify({ config, ...C, results }, null, 1));
    console.log(`\n${config}: ${results.length} screens, ${results.reduce((a, r) => a + r.issues.length, 0)} automated findings`);
    await browser.close();
    server.kill();
  }
})();
