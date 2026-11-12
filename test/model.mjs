// Model check: scripted vitals against the expected-outcomes table, option lengths, no dashes in copy.
import { readFileSync } from 'node:fs';
import { ROUNDS, ACTIONS } from '../src/content.js';
import { assess, judge, cToF, mews } from '../src/model.js';
const expect = [[1, 0, 0, 98.8], [2, 0, 2, 100.4], [3, 1, 2, 101.1], [6, 2, 2, 101.5], [8, 2, 2, 102.2]]; let bad = 0;
ROUNDS.forEach((r, i) => { const a = assess(r.v), e = expect[i]; const ok = a.total === e[0] && a.need === e[1] && a.support === e[2] && cToF(r.v.temp) === e[3]; if (!ok) bad++; console.log(r.time, 'MEWS', a.total, JSON.stringify(a.parts), 'need', a.need, 'support', a.support, 'crit', a.crit.join('+') || 'none', cToF(r.v.temp) + 'F', ACTIONS.map((x) => judge(x.k, a)).join('/'), ok ? 'OK' : 'MISMATCH'); });
// band edges from the published table
const edge = [[{ sbp: 70 }, 'sbp', 3], [{ sbp: 71 }, 'sbp', 2], [{ sbp: 100 }, 'sbp', 1], [{ sbp: 101 }, 'sbp', 0], [{ sbp: 200 }, 'sbp', 2], [{ hr: 50 }, 'hr', 1], [{ hr: 100 }, 'hr', 0], [{ hr: 101 }, 'hr', 1], [{ hr: 111 }, 'hr', 2], [{ hr: 130 }, 'hr', 3], [{ rr: 8 }, 'rr', 2], [{ rr: 9 }, 'rr', 0], [{ rr: 14 }, 'rr', 0], [{ rr: 15 }, 'rr', 1], [{ rr: 21 }, 'rr', 2], [{ rr: 30 }, 'rr', 3], [{ temp: 34.9 }, 'temp', 2], [{ temp: 38.4 }, 'temp', 0], [{ temp: 38.5 }, 'temp', 2]];
for (const [v, k, s] of edge) { const got = mews({ sbp: 120, hr: 80, rr: 12, temp: 37, avpu: 'A', ...v }).parts[k]; if (got !== s) { bad++; console.log('EDGE MISMATCH', v, got, s); } }
const L = ACTIONS.map((x) => x.t.length), spread = (Math.max(...L) - Math.min(...L)) / Math.max(...L); console.log('option lengths', L, 'spread', (spread * 100).toFixed(0) + '%'); if (spread > 0.15) bad++;
const copy = readFileSync('src/content.js', 'utf8') + readFileSync('src/template.html', 'utf8').replace(/<!--|-->/g, '');
const strings = copy.match(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g) || []; const dash = strings.filter((s) => /[—–]|\w -- \w| - /.test(s) && !/^['"`]\s*$/.test(s)); console.log('strings with dashes', dash.length, dash.slice(0, 5)); if (dash.length) bad++;
console.log(bad ? 'FAIL ' + bad : 'MODEL OK'); process.exit(bad ? 1 : 0);
