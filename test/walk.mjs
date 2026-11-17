// Full play-through with real clicks. node test/walk.mjs 1600 900 desk
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
const [w, h, tag] = [+process.argv[2] || 1600, +process.argv[3] || 900, process.argv[4] || 'desk'];
mkdirSync('test/out', { recursive: true });
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: w < 820, hasTouch: w < 820 });
const errs = []; p.on('console', (m) => { if (m.type() === 'error' && !/fonts|ERR_/.test(m.text())) errs.push(m.text()); }); p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await p.goto('file://' + process.cwd() + '/index.html?dtcap=0.3');
const wait = (ms) => new Promise((r) => setTimeout(r, ms)); let n = 0; const texts = [];
const shot = async (name) => { await p.evaluate(() => __demo.warm(2)); await wait(900); texts.push(await p.evaluate(() => document.body.innerText)); await p.screenshot({ path: `test/out/${tag}-${String(++n).padStart(2, '0')}-${name}.png` }); };
const D = (f, ...a) => p.evaluate(f, ...a);
const act = (k) => D((k) => { const el = document.querySelector(`[data-act=${k}]:not([disabled])`); if (!el) throw new Error('no button ' + k); el.click(); }, k);
const pick0 = (name, value) => D((name, value) => { const el = document.querySelector(`input[name="${name}"][value="${value}"]`); if (!el) throw new Error('no input ' + name + '=' + value); el.click(); }, name, value);
const pick = async (name, value) => { await pick0(name, value); if (name === 'act') { await pick0('why', value === 'routine' ? 'none' : 'score'); await pick0('conf', 2); } };
const startRounds = async (show) => { await act('prep'); await shot0('prep'); if (show) await act('oiShow'); else { await pick0('oi_0', 'O'); await pick0('oi_1', 'I'); await pick0('oi_2', 'I'); await pick0('oi_3', 'I'); await act('oiCheck'); } await pick0('plan', 'score'); await shot0('prep-checked'); await act('startRounds'); };
let shot0 = async () => {};
const scoreKey = async (override = {}) => { const m = (await D(() => __demo.model()))[(await D(() => __demo.state())).r]; for (const k of ['hr', 'sbp', 'rr', 'temp', 'avpu']) await pick('s_' + k, override[k] ?? m.parts[k]); };
const flagKey = async () => { const idx = await D(() => { const s = __demo.state(); __demo.flagKey(); const f = __demo.state().log[s.r].flags; __demo.flag([]); return f; }); for (const i of idx) await pick('cue', i); };
await wait(2500); await shot('title');
await act('begin'); await pick('pt', w < 820 ? 3 : 1); await shot('choose');
await act('report'); await shot('report'); shot0 = shot;
await startRounds(false); shot0 = async () => {}; await shot('r1-look');
await act('toScore'); await scoreKey({ hr: 1 }); await shot('r1-score');   // one deliberate wrong score
await act('toAct'); await pick('act', 'routine'); await shot('r1-act'); await act('toFb'); await shot('r1-fb');
await act('next'); await flagKey(); await shot('r2-look'); await act('toScore'); await scoreKey(); await act('toAct'); await pick('act', 'routine'); await act('toFb'); await shot('r2-fb');
await act('next'); await pick('cue', 0); await D(() => __demo.view('face')); await shot('r3-look-face'); await act('toScore'); await act('showScore'); await shot('r3-score-shown'); await act('toAct'); await pick('act', 'charge'); await act('toFb'); await shot('r3-fb');
await act('next'); await D(() => __demo.view('bed')); await flagKey(); await shot('r4-look'); await act('toScore'); await scoreKey(); await act('toAct'); await pick('act', 'rrt'); await act('toFb'); await shot('r4-fb');
await act('next'); await pick('sb_0', 'S'); await pick('sb_1', 'B'); await pick('sb_2', 'R'); await pick('sb_3', 'A'); await shot('sbar'); await act('sbarCheck'); await shot('sbar-checked');
await act('debrief'); await shot('debrief'); await D(() => { const e = [...document.querySelectorAll('h3,h4')].find((x) => x.textContent.trim() === 'Effort'); if (!e) throw new Error('no effort heading'); e.scrollIntoView({ block: 'center' }); }); await wait(500); await p.screenshot({ path: `test/out/${tag}-effort.png` }); const s1 = await D(() => __demo.state());
await D(() => { document.querySelector('#panel').scrollTop = 99999; }); await shot('debrief-bottom');
await act('about'); await shot('about'); await act('closeAbout');
// second path through the hook: unsupported early call, then never call
await D(() => __demo.act('mews')); await shot('mews'); await act('closeAbout'); await act('faq'); await shot('faq'); await act('closeAbout');
await act('again'); await act('report'); await startRounds(true);
const path2 = [];
for (let r = 0; r < 5; r++) { await act('toScore'); await act('showScore'); await act('toAct'); await pick('act', r === 0 ? 'rrt' : 'routine'); await act('toFb'); path2.push((await D(() => __demo.state())).log[r].verdict); if (r === 4) await shot('r5-fb'); await act('next'); }
const s2 = await D(() => __demo.state()); await act('sbarShow'); await act('debrief'); await shot('debrief-charge');
const all = texts.join('\n'); const dashes = all.match(/.{0,30}[—–].{0,30}|.{0,30}\s--?\s.{0,30}/g) || [];
console.log(JSON.stringify({ tag, called1: s1.called, by1: s1.calledBy, tally1: s1.tally, r1scores: s1.log[0].scores, verdicts1: s1.log.map((L) => L && L.verdict), path2, logText: s1.logText, called2: s2.called, by2: s2.calledBy, model: await D(() => __demo.model().map((m) => [m.time, m.total])), dashes: dashes.slice(0, 6) }));
console.log('ERRORS', errs.length, errs.slice(0, 6)); await b.close();
