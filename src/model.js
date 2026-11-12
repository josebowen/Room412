// MEWS (Subbe et al., QJM 2001, Table 1) and AHRQ PSNet typical calling criteria.
// Every score and verdict shown in the demo is computed here from the scripted vitals.
export const BANDS = {
  sbp: [[70, 3, '70 or less'], [80, 2, '71 to 80'], [100, 1, '81 to 100'], [199, 0, '101 to 199'], [Infinity, 2, '200 or more']],
  hr: [[40, 2, '40 or less'], [50, 1, '41 to 50'], [100, 0, '51 to 100'], [110, 1, '101 to 110'], [129, 2, '111 to 129'], [Infinity, 3, '130 or more']],
  rr: [[8, 2, 'under 9'], [14, 0, '9 to 14'], [20, 1, '15 to 20'], [29, 2, '21 to 29'], [Infinity, 3, '30 or more']],
};
export const AVPU = { A: 0, V: 1, P: 2, U: 3 };
export const cToF = (c) => Math.round((c * 9 / 5 + 32) * 10) / 10;
const band = (rows, v) => rows.find((r) => v <= r[0])[1];
export function scoreTemp(c) { const t = Math.round(c * 10); return t < 350 ? 2 : t < 385 ? 0 : 2; }
export function mews(v) {
  const parts = { sbp: band(BANDS.sbp, v.sbp), hr: band(BANDS.hr, v.hr), rr: band(BANDS.rr, v.rr), temp: scoreTemp(v.temp), avpu: AVPU[v.avpu] };
  return { parts, total: parts.sbp + parts.hr + parts.rr + parts.temp + parts.avpu };
}
// AHRQ PSNet primer, Table 2. Returns the criteria this set of findings meets.
export function criteria(v) {
  const out = [];
  if (v.hr > 140 || v.hr < 40) out.push('hr');
  if (v.rr > 28 || v.rr < 8) out.push('rr');
  if (v.sbp > 180 || v.sbp < 90) out.push('sbp');
  if (v.spo2 < 90 && v.o2) out.push('spo2');
  if (v.mental) out.push('mental');
  if (v.urine4h < 50) out.push('urine');
  return out;
}
export const LEVEL = { routine: 0, charge: 1, rrt: 2 };
// need: what the unit policy requires for this MEWS. support: the highest step the findings support.
export function assess(v, critical = 5, watch = 3) {
  const m = mews(v), crit = criteria(v);
  const need = m.total >= critical ? 2 : m.total >= watch ? 1 : 0;
  const support = Math.max(need, crit.length ? 2 : 0, v.concern ? 2 : 0);
  return { ...m, crit, need, support };
}
// verdict on one choice
export function judge(choice, a) {
  const c = LEVEL[choice];
  if (c < a.need) return 'below';
  if (c === a.need) return a.support > a.need ? 'score' : 'match';
  return c <= a.support ? 'early' : 'unsupported';
}
