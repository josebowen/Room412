// quick screenshots: node test/shot.mjs W H tag "js to eval" ...
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
const [w, h, tag, ...steps] = process.argv.slice(2);
mkdirSync('test/out', { recursive: true });
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: +w, height: +h });
const errs = []; p.on('console', (m) => { if (m.type() === 'error' && !/fonts|ERR_/.test(m.text())) errs.push(m.text()); }); p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await p.goto('file://' + process.cwd() + '/index.html?dtcap=0.3');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await wait(3000); let i = 0;
for (const s of steps.length ? steps : ['']) { if (s) await p.evaluate(s); await wait(2500); await p.screenshot({ path: `test/out/${tag}-${i++}.png` }); }
console.log('ERRORS', errs.length, errs.slice(0, 5)); await b.close();
