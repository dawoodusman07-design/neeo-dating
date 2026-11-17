// Builds qa/index.html: a contact sheet of every screen the QA crawler captured, in every
// configuration, plus the before/after pairs for fixed issues. Static, no dependencies.
// Usage: node scripts/qa-report.mjs
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', 'qa');
const ORDER = ['390-light', '390-dark', '320-light', '320-dark', '430-light', '430-dark', 'zoom200', 'rtl'];
const LABEL = {
  '390-light': '390×844 light',
  '390-dark': '390×844 dark',
  '320-light': '320×568 light',
  '320-dark': '320×568 dark',
  '430-light': '430×932 light',
  '430-dark': '430×932 dark',
  zoom200: '200% text (zoom)',
  rtl: 'RTL (Urdu)',
};
const runs = ORDER.filter((c) => existsSync(join(root, 'results', `${c}.json`))).map((c) => JSON.parse(readFileSync(join(root, 'results', `${c}.json`), 'utf8')));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);

const pairs = existsSync(join(root, 'before-after'))
  ? [...new Set(readdirSync(join(root, 'before-after')).map((f) => f.replace(/-(before|after)\.(jpg|png)$/, '')))].sort()
  : [];
const ext = (base, tag) => (existsSync(join(root, 'before-after', `${base}-${tag}.png`)) ? 'png' : 'jpg');

const total = runs.reduce((a, r) => a + r.results.length, 0);
const open = runs.reduce((a, r) => a + r.results.reduce((b, s) => b + s.issues.length, 0), 0);

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Neeo QA contact sheet</title>
<style>
:root{--bg:#FBF7F2;--surface:#FFFFFF;--tint:#F4ECE4;--text:#2A211C;--muted:#6A5A50;--border:#EADDD2;--action:#A8432A;--onAction:#FFFFFF;--accent:#2F6B5E;--danger:#B91C1C}
@media (prefers-color-scheme:dark){:root{--bg:#1A1411;--surface:#241C18;--tint:#2C221D;--text:#F5EDE7;--muted:#BFAEA3;--border:#3A2E28;--action:#E8896C;--onAction:#1A1411;--accent:#6FBFAE;--danger:#F87171}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 Inter,system-ui,-apple-system,sans-serif}
header{position:sticky;top:0;z-index:2;background:var(--bg);border-bottom:1px solid var(--border);padding:12px 16px}
h1{font-size:20px;margin:0 0 4px}p{margin:0;color:var(--muted)}
nav{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
nav button{font:inherit;min-height:44px;padding:0 14px;border-radius:999px;border:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer}
nav button[aria-pressed=true]{background:var(--action);border-color:var(--action);color:var(--onAction)}
input[type=search]{font:inherit;min-height:44px;width:min(100%,320px);margin-top:10px;padding:0 12px;border-radius:12px;border:1px solid var(--muted);background:var(--surface);color:var(--text)}
main{padding:16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px}
figure{margin:0;background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden}
figure a{display:block;background:var(--tint)}figure img{display:block;width:100%;height:auto;aspect-ratio:var(--ar);object-fit:contain}
figcaption{padding:8px 10px;font-size:13px}figcaption b{display:block;font-weight:600;word-break:break-word}
figcaption code{color:var(--muted);font-size:12px;word-break:break-all}
.ok{color:var(--accent)}.bad{color:var(--danger)}
.ba{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px}
.ba figure div{display:grid;grid-template-columns:1fr 1fr;gap:2px;background:var(--border)}
.ba img{width:100%;display:block}
section[hidden]{display:none}
:focus-visible{outline:3px solid var(--action);outline-offset:2px}
</style></head>
<body>
<header>
  <h1>Neeo QA contact sheet</h1>
  <p>${total} screenshots across ${runs.length} configurations · ${open} automated findings still open · generated ${new Date().toISOString().slice(0, 10)} from the web build (mock data). Full findings: <a href="https://github.com/dawoodusman07-design/neeo-dating/blob/claude/neeo-dating-app-store-fa49mt/qa/QA_REPORT.md">QA_REPORT.md</a></p>
  <nav aria-label="Configuration">
    ${runs.map((r, i) => `<button type="button" data-cfg="${r.config}" aria-pressed="${i === 0}">${esc(LABEL[r.config] ?? r.config)}</button>`).join('')}
    <button type="button" data-cfg="before-after" aria-pressed="false">Before / after (${pairs.length})</button>
  </nav>
  <label><span class="sr" style="position:absolute;left:-9999px">Filter screens</span><input type="search" id="q" placeholder="Filter by screen or route"></label>
</header>
<main>
${runs
  .map(
    (r, i) => `<section data-cfg="${r.config}" ${i === 0 ? '' : 'hidden'} aria-label="${esc(LABEL[r.config])}">
  <div class="grid" style="--ar:${r.w}/${r.h}">
  ${r.results
    .filter((s) => s.file)
    .map(
      (s) => `<figure data-k="${esc(`${s.slug} ${s.route}`.toLowerCase())}"><a href="${esc(s.file)}" target="_blank" rel="noopener"><img loading="lazy" src="${esc(s.file)}" alt="${esc(`${s.slug}, ${LABEL[r.config]}`)}" width="${r.w}" height="${r.h}"></a>
    <figcaption><b>${esc(s.slug)}</b><code>${esc(s.route)}</code><br>${s.issues.length ? `<span class="bad">⚠ ${s.issues.length} finding${s.issues.length > 1 ? 's' : ''}: ${esc(s.issues.map((x) => x.msg).join(' · ').slice(0, 180))}</span>` : '<span class="ok">✓ no automated findings</span>'}</figcaption></figure>`,
    )
    .join('\n  ')}
  </div></section>`,
  )
  .join('\n')}
<section data-cfg="before-after" hidden aria-label="Before and after">
  <div class="ba">
  ${pairs
    .map(
      (b) => `<figure><div><a href="before-after/${b}-before.${ext(b, 'before')}" target="_blank" rel="noopener"><img loading="lazy" src="before-after/${b}-before.${ext(b, 'before')}" alt="${esc(b)} before"></a><a href="before-after/${b}-after.${ext(b, 'after')}" target="_blank" rel="noopener"><img loading="lazy" src="before-after/${b}-after.${ext(b, 'after')}" alt="${esc(b)} after"></a></div><figcaption><b>${esc(b)}</b>left: before · right: after</figcaption></figure>`,
    )
    .join('\n  ')}
  </div>
</section>
</main>
<script>
const buttons=[...document.querySelectorAll('nav button')];
const show=(cfg)=>{buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cfg===cfg)));document.querySelectorAll('main section').forEach(s=>s.hidden=s.dataset.cfg!==cfg);};
buttons.forEach(b=>b.addEventListener('click',()=>show(b.dataset.cfg)));
document.getElementById('q').addEventListener('input',(e)=>{const q=e.target.value.toLowerCase();document.querySelectorAll('figure[data-k]').forEach(f=>f.hidden=!f.dataset.k.includes(q));});
</script>
</body></html>`;
writeFileSync(join(root, 'index.html'), html);
console.log(`qa/index.html: ${total} screenshots, ${runs.length} configurations, ${pairs.length} before/after pairs`);
