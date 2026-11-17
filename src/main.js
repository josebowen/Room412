// Room 412: state machine, bedside monitor, panels, camera and test hook.
import { EF } from './effort.js';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { buildRoom } from './scene.js';
import { clamp, lerp, mulberry } from './fx.js';
import { SRC, cite, PATIENTS, SKIN, ROUNDS, ACTIONS, ACTION_NAME, PARAMS, CHART, CRIT_NAME, SBAR, SBAR_NAME, SBAR_DEF, cap, fill, OI, OI_NAME, PLANS, WHYS, CONF, ACTION_SHORT, FAQ, GRID } from './content.js';
import { mews, assess, judge, cToF, AVPU } from './model.js';

const qs = new URLSearchParams(location.search);
const DTCAP = parseFloat(qs.get('dtcap')) || 0.05;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s) => document.querySelector(s);
const body = document.body, panelBody = $('#panelBody');
const TIMES = ROUNDS.map((r) => +r.time.slice(0, 2));
const A = ROUNDS.map((r) => assess(r.v)); // computed once from the scripted vitals

// ---------- state ----------
const S = { step: 'title', r: 0, sub: 'look', p: 0, log: [], called: null, calledBy: null, sbar: null, sbarDone: false, sound: false, seed: 412, view: 'room', clock: 7, clockT: 7 };
const newLog = () => ({ flags: [], scores: {}, shown: false, action: null, why: null, conf: 0, note: '', verdict: null });
const P = () => PATIENTS[S.p];
Object.assign(S, { oi: [null, null, null, null], oiDone: false, plan: null });

// ---------- monitor ----------
const mon = document.createElement('canvas'); mon.width = 960; mon.height = 540; mon.setAttribute('aria-hidden', 'true'); $('#monslot').appendChild(mon);
const mg = mon.getContext('2d');
const disp = { hr: 86, sbp: 126, dbp: 74, rr: 16, temp: 37.1, spo2: 97 }; let dispT = { ...ROUNDS[0].v }, nibpTime = '07:00';
const WX = 16, WW = 470, waves = { ecg: new Float32Array(WW), pleth: new Float32Array(WW), resp: new Float32Array(WW) }; let wcur = 0, wacc = 0, hrPh = 0, rrPh = 0, lastBeat = 0;
const g2 = (p, c, w) => Math.exp(-(((p - c) / w) ** 2));
const ecgF = (p) => 0.12 * g2(p, 0.18, 0.025) - 0.12 * g2(p, 0.265, 0.008) + g2(p, 0.28, 0.009) - 0.22 * g2(p, 0.297, 0.009) + 0.28 * g2(p, 0.48, 0.045);
const plethF = (p) => g2(p, 0.36, 0.09) + 0.42 * g2(p, 0.62, 0.13);
function stepWaves(dt) {
  wacc += dt * 150; let n = Math.min(WW, Math.floor(wacc)); wacc -= Math.floor(wacc);
  const dts = 1 / 150;
  while (n-- > 0) {
    hrPh += dts * disp.hr / 60; rrPh += dts * disp.rr / 60;
    if (Math.floor(hrPh) > lastBeat) { lastBeat = Math.floor(hrPh); beep(); }
    waves.ecg[wcur] = ecgF(hrPh % 1); waves.pleth[wcur] = plethF(hrPh % 1) * (0.55 + 0.45 * clamp((disp.spo2 - 86) / 11, 0, 1));
    waves.resp[wcur] = 0.5 - 0.5 * Math.cos((rrPh % 1) * Math.PI * 2); wcur = (wcur + 1) % WW;
  }
}
function trace(arr, y0, h, color) {
  mg.strokeStyle = color; mg.lineWidth = 3; mg.lineJoin = 'round'; mg.beginPath(); let pen = false;
  for (let i = 0; i < WW; i++) { const gap = (i - wcur + WW) % WW; if (gap < 16) { pen = false; continue; } const y = y0 + h - arr[i] * h; if (!pen) { mg.moveTo(WX + i, y); pen = true; } else mg.lineTo(WX + i, y); }
  mg.stroke();
}
const F = (px, w = 700) => `${w} ${px}px Inter, Arial, sans-serif`;
function drawMonitor() {
  const g = mg; g.fillStyle = '#04090a'; g.fillRect(0, 0, 960, 540);
  g.fillStyle = '#0d1c1f'; g.fillRect(0, 0, 960, 40); g.fillStyle = '#9fc4c1'; g.font = F(20, 600); g.textBaseline = 'middle'; g.textAlign = 'left';
  const p = P(); g.fillText(`412  ${p.name.split(' ')[1].toUpperCase()}, ${p.name[0]}   ${p.age} y`, 16, 21); g.textAlign = 'right'; g.fillText(hhmm(S.clock) + '   ADULT', 944, 21);
  g.strokeStyle = 'rgba(160,200,200,.16)'; g.lineWidth = 1; for (const y of [140, 240, 340, 440]) { g.beginPath(); g.moveTo(502, y); g.lineTo(960, y); g.stroke(); } for (const y of [207, 373]) { g.beginPath(); g.moveTo(0, y); g.lineTo(502, y); g.stroke(); } g.beginPath(); g.moveTo(502, 40); g.lineTo(502, 540); g.stroke();
  const GRN = '#3dff7c', CYN = '#52d9ff', YEL = '#ffe24a', WHT = '#f4f7f7', ORG = '#ffb057';
  trace(waves.ecg, 70, 110, GRN); trace(waves.pleth, 240, 100, CYN); trace(waves.resp, 406, 100, YEL);
  g.textAlign = 'left'; g.font = F(17, 600); g.fillStyle = GRN; g.fillText('ECG II', 16, 58); g.fillStyle = CYN; g.fillText('PLETH', 16, 224); g.fillStyle = YEL; g.fillText('RESP', 16, 390);
  // all five vitals in one column, same size, in the order the nurse scores them
  const row = (i, label, unit, val, color, size = 84) => { const y = 90 + i * 100; g.fillStyle = color; g.textAlign = 'left'; g.font = F(27, 700); g.fillText(label, 520, y - 18); g.font = F(17, 500); g.fillText(unit, 520, y + 14); g.textAlign = 'right'; g.font = F(size, 700); g.fillText(val, 944, y + 4); };
  row(0, 'HR', 'bpm', String(Math.round(disp.hr)), GRN);
  row(1, 'BP', 'mmHg at ' + nibpTime, `${Math.round(disp.sbp)}/${Math.round(disp.dbp)}`, WHT);
  row(2, 'RR', 'per min', String(Math.round(disp.rr)), YEL);
  row(3, 'TEMP', disp.temp.toFixed(1) + '°C', cToF(disp.temp).toFixed(1) + '°F', ORG, 74);
  row(4, 'SpO2', '% room air', String(Math.round(disp.spo2)), CYN);
}
const hhmm = (h) => { const m = Math.round((h % 1) * 60); const H = Math.floor(h) + (m === 60 ? 1 : 0); return String(H).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };

// ---------- sound: monitor tone, pitch follows SpO2 as on a real pulse oximeter ----------
let actx = null;
function beep() { if (!S.sound || !actx || body.dataset.state === 'title') return; const o = actx.createOscillator(), ga = actx.createGain(); o.type = 'sine'; o.frequency.value = 420 + (disp.spo2 - 80) * 22; ga.gain.setValueAtTime(0.0001, actx.currentTime); ga.gain.exponentialRampToValueAtTime(0.05, actx.currentTime + 0.01); ga.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.09); o.connect(ga).connect(actx.destination); o.start(); o.stop(actx.currentTime + 0.1); }

// ---------- three ----------
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.9;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#0a1a1d');
const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 60);
const room = buildRoom(scene, mon);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera)); const bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), 0.12, 0.5, 0.97); composer.addPass(bloom); composer.addPass(new OutputPass());
let W = 1, H = 1, phone = false;
const VIEWS = {
  room: { t: [0.15, 1.12, -0.55], yaw: 0.6, pitch: 0.2, d: 5.4, dp: 6.4 },
  bed: { t: [0.12, 1.16, -0.72], tp: [0.05, 1.3, -0.85], yaw: 0.46, pitch: 0.25, d: 3.25, dp: 3.1 },
  face: { t: [0, 1.3, -0.9], yaw: 0.3, pitch: 0.5, d: 1.05, dp: 1.25 },
};
const rig = { t: new THREE.Vector3(0.15, 1.12, -0.55), yaw: 0.6, pitch: 0.2, d: 5.4, uy: 0, up: 0, ox: 0, oy: 0 };
const tmp = new THREE.Vector3();
function layout() {
  if (body.dataset.state === 'title') return phone ? { ox: 0, oy: H * 0.16 } : { ox: -W * 0.18, oy: 0 };
  if (phone) { const top = 40 + (W - 16) * 0.5625 + 10, bot = H * 0.55; return { ox: 0, oy: H / 2 - (top + bot) / 2 }; }
  const pw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pw')) || 452, free = W - pw - 40;
  return { ox: (pw + 40) / 2 - free * (S.view === 'face' ? 0.12 : 0.1), oy: -H * (S.view === 'face' ? 0.1 : 0.08) };
}
function setView(n, snap) { S.view = n; rig.uy = rig.up = 0; document.querySelectorAll('#views .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === n))); if (snap || reduce) updateRig(1, true); }
function updateRig(dt, snap) {
  const v = VIEWS[S.view], L = layout(), k = snap ? 1 : 1 - Math.exp(-2.6 * dt);
  if (S.view === 'face') { room.headWorld(tmp); tmp.y += 0.0; } else tmp.fromArray(phone && v.tp ? v.tp : v.t);
  rig.t.lerp(tmp, k); rig.yaw = lerp(rig.yaw, v.yaw, k); rig.pitch = lerp(rig.pitch, v.pitch, k); rig.d = lerp(rig.d, phone ? v.dp : v.d, k);
  rig.ox = lerp(rig.ox, L.ox, k); rig.oy = lerp(rig.oy, L.oy, k);
  const yaw = rig.yaw + rig.uy, pitch = clamp(rig.pitch + rig.up, 0.04, 1.1);
  camera.position.set(rig.t.x + rig.d * Math.sin(yaw) * Math.cos(pitch), rig.t.y + rig.d * Math.sin(pitch), rig.t.z + rig.d * Math.cos(yaw) * Math.cos(pitch));
  camera.lookAt(rig.t); camera.setViewOffset(W, H, rig.ox, rig.oy, W, H); camera.updateMatrixWorld();
}
function resize() { W = innerWidth; H = innerHeight; phone = W < 820; renderer.setSize(W, H, false); composer.setSize(W, H); camera.aspect = W / H; camera.fov = phone ? 46 : 38; camera.updateProjectionMatrix(); updateRig(1, true); }
addEventListener('resize', resize);
let drag = null;
canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; rig.uy = clamp(rig.uy - (e.clientX - drag.x) / W * 1.6, -0.75, 0.6); rig.up = clamp(rig.up + (e.clientY - drag.y) / H * 1.0, -0.2, 0.4); drag = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('keydown', (e) => { const d = { ArrowLeft: [-0.08, 0], ArrowRight: [0.08, 0], ArrowUp: [0, 0.05], ArrowDown: [0, -0.05] }[e.key]; if (d) { rig.uy = clamp(rig.uy + d[0], -0.75, 0.6); rig.up = clamp(rig.up + d[1], -0.2, 0.4); e.preventDefault(); } });

// ---------- helpers ----------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function shuffled(n, seed) { const r = mulberry(seed), a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const tempStr = (c) => `${cToF(c).toFixed(1)}°F (${c.toFixed(1)}°C)`;
const valStr = (k, v) => k === 'hr' ? `${v.hr}` : k === 'sbp' ? `${v.sbp}/${v.dbp}` : k === 'rr' ? `${v.rr}` : k === 'temp' ? tempStr(v.temp) : { A: 'Alert', V: 'Voice', P: 'Pain', U: 'Unresponsive' }[v.avpu];
const sumScores = (o) => PARAMS.reduce((n, p) => n + (o[p.k] ?? 0), 0);
const allScored = (o) => PARAMS.every((p) => o[p.k] != null);
function say(t) { const el = $('#say'); if (t && t !== '...') { el.textContent = '“' + t + '”'; el.classList.add('on'); } else el.classList.remove('on'); }

function go(step, r, sub) {
  S.step = step; if (r != null) S.r = r; if (sub) S.sub = sub;
  body.dataset.state = step; const R = ROUNDS[S.r];
  if (step === 'title') { setView('room'); say(''); }
  if (step === 'choose' || step === 'report' || step === 'prep') { S.clockT = 7; dispT = { ...ROUNDS[0].v }; nibpTime = '07:00'; room.setLook(ROUNDS[0].look, ROUNDS[0].v.rr); if (S.view === 'room' && step === 'report') setView('bed'); if (step === 'choose') setView('bed'); say(''); }
  if (step === 'round') { if (!S.log[S.r]) S.log[S.r] = newLog(); S.clockT = TIMES[S.r]; dispT = { ...R.v }; nibpTime = R.time; room.setLook(R.look, R.v.rr); say(S.sub === 'look' ? R.says : ''); if (S.view === 'room') setView('bed'); }
  if (step === 'sbar' || step === 'debrief') say('');
  const order = ['report', 'round', 'sbar', 'debrief'], ci = step === 'choose' || step === 'prep' ? 0 : order.indexOf(step);
  renderTrail();
  document.querySelectorAll('#steps li').forEach((li, i) => { li.className = i === ci ? 'cur' : i < ci ? 'done' : ''; });
  render(); const h = panelBody.querySelector('h2'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } $('#panel').scrollTop = 0;
  $('#monsr').textContent = step === 'round' ? `Monitor at ${R.time}. Heart rate ${R.v.hr}. Blood pressure ${R.v.sbp} over ${R.v.dbp}. Respiratory rate ${R.v.rr}. Oxygen saturation ${R.v.spo2} percent on room air. Temperature ${tempStr(R.v.temp)}.` : '';
}

// ---------- panels ----------
function render() { panelBody.innerHTML = ({ choose: vChoose, report: vReport, prep: vPrep, round: vRound, sbar: vSbar, debrief: vDebrief }[S.step] || (() => ''))(); }
function vChoose() {
  return `<p class="kick">Before report</p><h2>Who is in 412?</h2>
  <p>Same surgery, same vitals, same script. Skin signs read differently on different skin, so the bedside notes change with the patient.</p>
  <fieldset class="q"><legend>Pick a patient</legend><div class="pts">${PATIENTS.map((p, i) => `<label><input type="radio" name="pt" value="${i}" ${i === S.p ? 'checked' : ''}><span><i style="background:${p.skin}"></i><span><b>${p.name}</b><small>${p.age} · ${p.toneLabel}</small></span></span></label>`).join('')}</div></fieldset>
  <p class="hint">Pallor may look ashen or gray on darker skin and paler and less pink on lighter skin. ${cite('skin')}</p>
  <div class="row"><button class="btn pri" data-act="report">Take report</button></div>`;
}
function vReport() {
  const p = P();
  return `<p class="kick">07:00 · Shift report</p><h2>${p.N}, ${p.age}</h2>
  <p class="quote"><b>Night nurse:</b> ${p.N} is two days out from an open colon resection. Pain is controlled. ${cap(p.he)} walked the hall twice yesterday. The urinary catheter is still in. Vitals were stable all night.</p>
  <h3>Each round you will</h3>
  <ol><li><b>Recognize cues.</b> Read the monitor, look at the patient, flag what concerns you.</li><li><b>Analyze cues.</b> Score the vitals with MEWS.</li><li><b>Take action.</b> Decide who to call.</li></ol>
  <h3>Unit policy in this demo</h3>
  <ul class="pol"><li><b>MEWS 0 to 2</b><span>Routine checks.</span></li><li><b>MEWS 3 or 4</b><span>Tell the charge nurse. Recheck within the hour.</span></li><li><b>MEWS 5 or more</b><span>Call the rapid response team.</span></li><li><b>Any time</b><span>Call if you are worried about the patient.</span></li></ul>
  <p class="src">Recognize cues, analyze cues and take action are three of the six skills in the NCSBN Clinical Judgment Measurement Model. ${cite('ncsbn')} The threshold of 5 is from ${cite('subbe')}. Staff concern is a typical calling criterion in ${cite('ahrq')}. Hospitals set their own policies.</p>
  <div class="row"><button class="btn pri" data-act="prep">Next</button><button class="btn sm" data-act="faq">Can a nurse really call?</button><button class="btn ghost sm" data-act="choose">Change patient</button></div>`;
}
function oiOrder() { return shuffled(4, S.seed + 31); }
function vPrep() {
  const done = S.oiDone, full = S.oi.every(Boolean);
  const items = oiOrder().map((i) => { const it = OI[i], mine = S.oi[i], ok = mine === it.k; return `<div class="sb ${done ? (ok ? 'ok' : 'no') : ''}"><p>${it.t}</p><fieldset class="q" style="margin:0"><legend class="sr">Observation or inference?</legend><div class="seg two">${['O', 'I'].map((k) => `<label><input type="radio" name="oi_${i}" value="${k}" ${mine === k ? 'checked' : ''} ${done ? 'disabled' : ''}><span>${OI_NAME[k]}</span></label>`).join('')}</div></fieldset>${done ? `<small>${OI_NAME[it.k]}.${ok ? '' : ` You chose ${OI_NAME[mine] ? OI_NAME[mine].toLowerCase() : 'nothing'}.`}</small>` : ''}</div>`; }).join('');
  return `<p class="kick">07:10 · Before you go in</p><h2>How will you think?</h2>
  <p>An observation is what you see, hear or measure. An inference is what you conclude from it. Sort these four.</p>
  ${items}
  ${done ? `<p class="fb">Recognizing cues is collecting observations. Analyzing cues is linking them to a possible problem. ${cite('openstax')} In an SBAR call the Assessment is your inference. The rest is observation.</p>
  <fieldset class="q"><legend>What is your plan for deciding when to call?</legend><div class="opt">${PLANS.map((x) => `<label><input type="radio" name="plan" value="${x.k}" ${S.plan === x.k ? 'checked' : ''}><span>${x.t}</span></label>`).join('')}</div></fieldset>
  <p class="hint">Not scored. The debrief sets your plan beside the reasons you give each round.</p>
  <div class="row"><button class="btn pri" data-act="startRounds" ${S.plan ? '' : 'disabled'}>Start the 08:00 round</button></div>` : `<div class="row"><button class="btn pri" data-act="oiCheck" ${full ? '' : 'disabled'}>Check</button><button class="btn ghost sm" data-act="oiShow">Show me</button></div>`}`;
}
function cueOrder(r) { return shuffled(ROUNDS[r].cues.length, S.seed + r * 7); }
function vRound() {
  const R = ROUNDS[S.r], p = P(), L = S.log[S.r], a = A[S.r], head = `${R.time} · Hour ${R.hour} of 12`;
  if (S.sub === 'look') return `<p class="kick">${head} · Recognize cues</p><h2>${R.title}</h2>
    <ul class="obs"><li><b>Says</b> ${R.says === '...' ? 'Nothing unless you speak first.' : '“' + esc(R.says) + '”'}</li><li><b>Mind</b> ${fill(R.mind, p)}</li><li><b>Skin</b> ${SKIN[p.tone][S.r]}</li><li><b>Urine</b> ${R.v.urine4h} mL over the last 4 hours.</li></ul>
    <fieldset class="q"><legend>Flag every finding that concerns you. Flag none if none do.</legend><div class="opt">${cueOrder(S.r).map((i) => `<label><input type="checkbox" name="cue" value="${i}" ${L.flags.includes(i) ? 'checked' : ''}><span>${fill(R.cues[i].t, p)}</span></label>`).join('')}</div></fieldset>
    <div class="row"><button class="btn pri" data-act="toScore">Done. Score the vitals</button></div>`;
  if (S.sub === 'score') return `<p class="kick">${head} · Analyze cues</p><h2>Score the vitals</h2>
    <p class="hint">Give each vital 0 to 3 points. Read the numbers off the monitor: heart rate, blood pressure, respiratory rate, temperature. Alertness comes from your bedside check: ${fill(R.mind, p).split('.')[0].toLowerCase()}.</p>
    <div class="row" style="margin:0 0 14px"><button class="btn sm" data-act="mews">Review how MEWS works</button></div>
    ${PARAMS.map((q) => `<fieldset class="q"><legend>${q.label}</legend><div class="seg">${[0, 1, 2, 3].map((n) => `<label><input type="radio" name="s_${q.k}" value="${n}" ${L.scores[q.k] === n ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div></fieldset>`).join('')}
    <div class="tot"><span>Your MEWS</span><b id="tot">${allScored(L.scores) ? sumScores(L.scores) : '·'}</b></div>
    <div class="row"><button class="btn pri" data-act="toAct" ${allScored(L.scores) ? '' : 'disabled'}>Lock the score</button><button class="btn ghost sm" data-act="showScore">Show me</button></div>`;
  if (S.sub === 'act') return `<p class="kick">${head} · Take action</p><h2>You scored ${sumScores(L.scores)}. What now?</h2>
    <fieldset class="q"><legend>Choose one</legend><div class="opt">${ACTIONS.map((x) => `<label><input type="radio" name="act" value="${x.k}" ${L.action === x.k ? 'checked' : ''}><span>${x.t}</span></label>`).join('')}</div></fieldset>
    <fieldset class="q"><legend>What is driving your decision most?</legend><div class="opt tight">${WHYS.map((x) => `<label><input type="radio" name="why" value="${x.k}" ${L.why === x.k ? 'checked' : ''}><span>${x.t}</span></label>`).join('')}</div></fieldset>
    <fieldset class="q"><legend>How sure are you?</legend><div class="seg three">${[1, 2, 3].map((n) => `<label><input type="radio" name="conf" value="${n}" ${L.conf === n ? 'checked' : ''}><span>${CONF[n]}</span></label>`).join('')}</div></fieldset>
    <label class="note"><span>Your note in the chart, one sentence. Optional and not graded.</span><input type="text" name="note" maxlength="160" value="${esc(L.note).replace(/"/g, '&quot;')}" placeholder="What did you see and what did you do?"></label>
    <div class="row"><button class="btn pri" data-act="toFb" ${L.action && L.why && L.conf ? '' : 'disabled'}>Commit</button></div>`;
  // feedback
  const rows = PARAMS.map((q) => { const mine = L.scores[q.k], ok = mine === a.parts[q.k]; return `<tr><td>${q.label}</td><td>${valStr(q.k, R.v)}</td><td>${a.parts[q.k]}</td><td class="${ok ? 'y' : 'x'}">${L.shown ? 'shown' : mine}</td></tr>`; }).join('');
  const cues = R.cues.map((c, i) => { const mine = L.flags.includes(i), ok = mine === c.flag; return `<li class="${ok ? 'ok' : 'no'}"><span class="mark">${ok ? '✓' : '!'}</span><div>${fill(c.t, p)}<small>${c.flag ? 'A cue.' : 'Not a cue.'} ${mine ? 'You flagged it.' : 'You did not flag it.'} ${fill(c.why, p)} ${c.src ? cite(c.src) : ''}</small></div></li>`; }).join('');
  const last = S.r === ROUNDS.length - 1, ends = L.action === 'rrt' && L.verdict !== 'unsupported';
  const nextLabel = ends ? 'Make the call' : last ? 'Continue' : `Go to ${ROUNDS[S.r + 1].time}`;
  return `<p class="kick">${head} · Feedback</p><h2>MEWS is ${a.total}</h2>
    <div class="tw"><table><thead><tr><th>Vital</th><th>Value</th><th>Score</th><th>Yours</th></tr></thead><tbody>${rows}<tr><td><b>Total</b></td><td></td><td><b>${a.total}</b></td><td class="${sumScores(L.scores) === a.total ? 'y' : 'x'}">${L.shown ? 'shown' : sumScores(L.scores)}</td></tr></tbody></table></div>
    <p>${R.note(cite)}</p>
    <h3>Your thinking</h3><p class="fb">${thinkText(S.r)}</p>
    <h3>Your call</h3><p class="fb ${L.verdict === 'below' || L.verdict === 'unsupported' ? 'bad' : 'good'}">${verdictText(S.r)}</p>
    <h3>Cues</h3><ul class="verdict">${cues}</ul>
    <div class="row"><button class="btn pri" data-act="next">${nextLabel}</button></div>`;
}
function grounds(r) {
  const a = A[r], g = [];
  if (a.need > 0) g.push(`the MEWS total of ${a.total}`);
  if (a.crit.length) g.push(`a calling criterion (${a.crit.map((k) => CRIT_NAME[k]).join('; ')})`);
  if (ROUNDS[r].v.concern) g.push('changes since the last round', 'what the patient says and how the patient looks');
  return g;
}
function thinkText(r) {
  const L = S.log[r], g = grounds(r), w = WHYS.find((x) => x.k === L.why);
  return `You were ${CONF[L.conf].toLowerCase()}. You said your decision rested most on: ${w.t.toLowerCase()}. ${g.length ? `Grounds to act that were present this round: ${g.join('; ')}.` : 'No grounds to act were present this round.'}${L.note ? ` Your note: \u201c${esc(L.note)}\u201d` : ''}`;
}
function renderTrail() {
  const el = $('#trail'); if (!el) return;
  const rows = S.log.map((L, r) => L && L.verdict ? `<li><b>${ROUNDS[r].time}</b><span>MEWS ${L.shown ? A[r].total : sumScores(L.scores)}</span><span>${ACTION_SHORT[L.action]}</span><em>${WHYS.find((x) => x.k === L.why).short} · ${CONF[L.conf].toLowerCase()}</em></li>` : '').join('');
  el.innerHTML = rows ? `<p>Your reasoning so far</p><ol>${rows}</ol>` : ''; el.hidden = !rows || S.step === 'title' || S.step === 'choose';
}
EF.watch(() => { const s = S.step; if (s === 'choose' || s === 'prep') return 'Planning before the first round'; if (s === 'round' && S.sub !== 'fb') return ROUNDS[S.r].time + ': ' + ({ look: 'reading the room', score: 'scoring the vitals', act: 'choosing what to do' }[S.sub] || S.sub); if (s === 'sbar' && !S.sbarDone) return 'Writing the handoff'; return null; });
function logText() {
  const p = P(), plan = PLANS.find((x) => x.k === S.plan);
  const lines = [`Room 412 reasoning log. Patient: ${p.N}, ${p.age}.`, `Plan before the first round: ${plan ? plan.t : 'none recorded'}`];
  S.log.forEach((L, r) => { if (!L || !L.verdict) return; const R = ROUNDS[r]; lines.push(`${R.time}. Flagged: ${L.flags.length ? L.flags.map((i) => fill(R.cues[i].t, p)).join('; ') : 'nothing'}. My MEWS: ${L.shown ? 'shown to me' : sumScores(L.scores)} (table gives ${A[r].total}). Action: ${ACTION_SHORT[L.action]}. Main reason: ${WHYS.find((x) => x.k === L.why).t}. Confidence: ${CONF[L.conf]}.${L.note ? ' Note: ' + L.note : ''}`); });
  lines.push(S.calledBy === 'charge' ? 'Rapid response was called by the charge nurse at 14:00.' : `I called rapid response at ${ROUNDS[S.called].time}.`);
  { const t = EF.text(); if (t) lines.push(t); }
  return lines.join('\n');
}
function vThinking() {
  const plan = PLANS.find((x) => x.k === S.plan), count = {};
  const rows = S.log.map((L, r) => { if (!L || !L.verdict) return ''; count[L.why] = (count[L.why] || 0) + 1; return `<tr><td><b>${ROUNDS[r].time}</b></td><td>${L.shown ? 'shown' : sumScores(L.scores)} / ${A[r].total}</td><td>${WHYS.find((x) => x.k === L.why).short}</td><td>${CONF[L.conf]}</td><td>${ACTION_SHORT[L.action]}</td></tr>`; }).join('');
  const notes = S.log.map((L, r) => L && L.note ? `<li><b>${ROUNDS[r].time}</b> \u201c${esc(L.note)}\u201d</li>` : '').join('');
  const used = WHYS.filter((x) => count[x.k]).map((x) => `${x.short} (${count[x.k]})`).join(', ');
  return `<h3>Your thinking, round by round</h3>
    <div class="tw"><table class="think"><thead><tr><th>Time</th><th>Your MEWS / table</th><th>Main reason</th><th>Sure?</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p>Your plan at 07:10: ${plan ? plan.t.toLowerCase().replace(/\.$/, '') : 'none recorded'}. Reasons you gave: ${used}.</p>
    ${notes ? `<ul class="notes">${notes}</ul>` : ''}
    <div class="row" style="margin:0 0 6px"><button class="btn sm" data-act="copyLog">Copy my reasoning log</button><span id="copied" class="hint" role="status"></span></div>
    <p class="hint">The log is text you can paste into an assignment. Notes are not graded by this page.</p>${EF.html()}`;
}
function verdictText(r) {
  const L = S.log[r], a = A[r], v = L.verdict, R = ROUNDS[r], nCue = R.cues.filter((c) => c.flag).length;
  const crit = a.crit.length ? `The findings meet ${a.crit.length === 1 ? 'one' : a.crit.length} of the typical calling criteria AHRQ lists: ${a.crit.map((k) => CRIT_NAME[k]).join('; ')}. ${cite('ahrq')}` : `A staff member's significant concern is one of the typical calling criteria AHRQ lists. ${cite('ahrq')}`;
  const needName = ['routine checks', 'telling the charge nurse', 'the rapid response team'][a.need];
  if (v === 'match') return `You ${ACTION_NAME[L.action]}. That matches unit policy for a MEWS of ${a.total}.${a.need === 0 ? ' No finding has changed since report.' : ''}`;
  if (v === 'score') return `You ${ACTION_NAME[L.action]}. That matches unit policy for a MEWS of ${a.total}. ${nCue} findings outside the score had changed. ${crit}`;
  if (v === 'early') return `You ${ACTION_NAME[L.action]}. That is earlier than a MEWS of ${a.total} requires. ${crit}`;
  if (v === 'unsupported') return `You ${ACTION_NAME[L.action]}. No finding has changed since report and no calling criterion is met. ${L.action === 'rrt' ? 'The team came, found a stable patient and left.' : 'The charge nurse looked in and found a stable patient.'}`;
  return `You ${ACTION_NAME[L.action]}. That is below unit policy. A MEWS of ${a.total} calls for ${needName}.${last(r) ? ' The charge nurse saw the monitor from the hall and called rapid response.' : ''}`;
}
const last = (r) => r === ROUNDS.length - 1;
function sbarOrder() { return shuffled(4, S.seed + 99); }
function vSbar() {
  const R = ROUNDS[S.called], items = SBAR(P(), R, A[S.called].total), done = S.sbarDone;
  const blocks = sbarOrder().map((i) => { const it = items[i], mine = S.sbar[i], ok = mine === it.k; return `<div class="sb ${done ? (ok ? 'ok' : 'no') : ''}"><p>${it.t}</p><fieldset class="q" style="margin:0"><legend class="sr">Which part of SBAR is this?</legend><div class="seg">${['S', 'B', 'A', 'R'].map((k) => `<label><input type="radio" name="sb_${i}" value="${k}" ${mine === k ? 'checked' : ''} ${done ? 'disabled' : ''}><span>${k}</span></label>`).join('')}</div></fieldset>${done ? `<small>${SBAR_NAME[it.k]}: ${SBAR_DEF[it.k]}.${ok ? '' : ` You chose ${mine || 'nothing'}.`}</small>` : ''}</div>`; }).join('');
  const full = S.sbar.every(Boolean);
  return `<p class="kick">${R.time} · Take action</p><h2>Make the call</h2>
    <p>${S.calledBy === 'charge' ? 'The charge nurse hands you the phone.' : 'The rapid response nurse picks up.'} You have four things to say. Label each one: Situation, Background, Assessment or Recommendation.</p>
    ${blocks}
    ${done ? `<p class="src">SBAR definitions: ${cite('sbar')}. The lactate request follows ${cite('ssc')}, which suggests measuring blood lactate in adults suspected of sepsis.</p><div class="row"><button class="btn pri" data-act="debrief">The team is on the way. Debrief</button></div>` : `<div class="row"><button class="btn pri" data-act="sbarCheck" ${full ? '' : 'disabled'}>Check</button><button class="btn ghost sm" data-act="sbarShow">Show me</button></div>`}`;
}
function tally() {
  let cueHit = 0, cueAll = 0, falseFlag = 0, par = 0, parAll = 0;
  S.log.forEach((L, r) => { if (!L || !L.action) return; ROUNDS[r].cues.forEach((c, i) => { if (c.flag) { cueAll++; if (L.flags.includes(i)) cueHit++; } else if (L.flags.includes(i)) falseFlag++; }); if (!L.shown) PARAMS.forEach((q) => { parAll++; if (L.scores[q.k] === A[r].parts[q.k]) par++; }); });
  const sb = S.sbar ? SBAR(P(), ROUNDS[S.called], 0).filter((it, i) => S.sbar[i] === it.k).length : 0;
  return { cueHit, cueAll, falseFlag, par, parAll, sb };
}
function chartSvg() {
  const w = 400, h = 190, x0 = 34, x1 = 376, y0 = 158, y1 = 14, X = (hr) => x0 + (hr - 8) / 6 * (x1 - x0), Y = (m) => y0 - m / 9 * (y0 - y1);
  const pts = ROUNDS.map((r, i) => [X(TIMES[i]), Y(A[i].total)]), c = S.called;
  const seg = (a, b, dash) => `<polyline points="${pts.slice(a, b + 1).map((p) => p.join(',')).join(' ')}" fill="none" stroke="#7fe3d4" stroke-width="2.5" ${dash ? 'stroke-dasharray="5 5" opacity=".6"' : ''}/>`;
  return `<svg id="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="MEWS at each round: ${ROUNDS.map((r, i) => r.time + ' ' + A[i].total).join(', ')}. You called at ${ROUNDS[c].time}.">
    ${[0, 3, 5, 8].map((m) => `<line x1="${x0}" x2="${x1}" y1="${Y(m)}" y2="${Y(m)}" stroke="${m === 5 ? '#ff7b6b' : m === 3 ? '#ffd27a' : 'rgba(150,225,215,.2)'}" stroke-width="1" ${m === 3 || m === 5 ? 'stroke-dasharray="3 4"' : ''}/><text x="${x0 - 8}" y="${Y(m) + 4}" text-anchor="end" font-size="11" fill="#a8c5c4">${m}</text>`).join('')}
    <text x="${x0 + 4}" y="${Y(5) - 5}" font-size="10.5" fill="#ff7b6b">5 or more: call rapid response</text><text x="${x0 + 4}" y="${Y(3) - 5}" font-size="10.5" fill="#ffd27a">3 or 4: tell the charge nurse</text>
    ${seg(0, c)}${c < 4 ? seg(c, 4, true) : ''}
    ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${i === c ? 7 : 4}" fill="${i === c ? '#fff' : '#7fe3d4'}" ${i > c ? 'opacity=".6"' : ''}/><text x="${p[0]}" y="${y0 + 18}" text-anchor="middle" font-size="11" fill="#a8c5c4">${ROUNDS[i].time}</text><text x="${p[0]}" y="${p[1] - 11}" text-anchor="middle" font-size="12" font-weight="700" fill="#eef8f7">${A[i].total}</text>`).join('')}
  </svg>`;
}
function vDebrief() {
  const c = S.called, R = ROUNDS[c], p = P(), t = tally(), firstCrit = A.findIndex((a) => a.crit.length), firstFive = A.findIndex((a) => a.total >= 5), firstConcern = ROUNDS.findIndex((r) => r.v.concern);
  const headline = S.calledBy === 'charge' ? 'The charge nurse called at 14:00' : c < firstCrit ? `You called at ${R.time}, on concern` : c < firstFive ? `You called at ${R.time}, on one criterion` : c === firstFive ? `You called at ${R.time}, when MEWS passed 5` : `You called at ${R.time}, an hour after MEWS passed 5`;
  const acts = S.log.map((L, r) => L && L.action ? `${ROUNDS[r].time} ${ACTION_NAME[L.action]}` : null).filter(Boolean).join('. ');
  return `<p class="kick">Debrief · ${p.N}</p><h2>${headline}</h2>
    ${chartSvg()}
    <p class="hint">${c < 4 ? 'Dashed line: what the script had next. ' : ''}First patient concern at ${ROUNDS[firstConcern].time}. First AHRQ calling criterion at ${ROUNDS[firstCrit].time}. MEWS reached 5 or more at ${ROUNDS[firstFive].time}.</p>
    <ul class="obj">
      <li class="${t.cueHit === t.cueAll && !t.falseFlag ? 'ok' : ''}"><span class="mark">1</span><div><b>Recognize cues</b><small>You flagged ${t.cueHit} of ${t.cueAll} cues and ${t.falseFlag} finding${t.falseFlag === 1 ? '' : 's'} that had not changed.</small></div></li>
      <li class="${t.parAll && t.par === t.parAll ? 'ok' : ''}"><span class="mark">2</span><div><b>Analyze cues</b><small>${t.parAll ? `${t.par} of ${t.parAll} MEWS parameter scores matched the published table.` : 'Scores were shown, not entered.'}</small></div></li>
      <li><span class="mark">3</span><div><b>Take action</b><small>${acts}. SBAR: ${t.sb} of 4 parts labeled as AHRQ defines them.</small></div></li>
    </ul>
    ${vThinking()}
    <h3>What MEWS did not count</h3>
    <ul>
      <li>Oxygen saturation went from 97% to ${R.v.spo2}%. Urine went from 220 mL to ${R.v.urine4h} mL over 4 hours. Neither is in MEWS. ${cite('subbe')}</li>
      ${c >= 2 ? `<li>New confusion scored 0 while the patient was still Alert on AVPU. A temperature of 101.1°F scored 0.</li>` : `<li>What the patient said at 10:00 has no row in MEWS. A temperature of 100.4°F scored 0.</li>`}
      <li>Skin on this patient at ${R.time}: ${SKIN[p.tone][c]} Pallor may look ashen or gray on darker skin and paler and less pink on lighter skin. ${cite('skin')}</li>
      <li>In two cohorts, when the pulse oximeter read 92 to 96%, arterial saturation was under 88% in 11.7% and 17.0% of measurements in Black patients and 3.6% and 6.2% in White patients. ${cite('sjoding')}</li>
    </ul>
    <h3>What the sources say about the tools</h3>
    <ul>
      <li>The Surviving Sepsis Campaign names MEWS among the tools used for sepsis screening. It says neither SIRS nor qSOFA is an ideal screening tool and the bedside clinician needs to understand the limits of each. ${cite('ssc')}</li>
      <li>AHRQ's primer says rapid response systems slightly reduce unexpected cardiac arrests on wards and do not change overall hospital mortality. ${cite('ahrq')}</li>
      <li>Hospitals use different versions of MEWS and different trigger scores. The 5 here is from one UK hospital in 2000. ${cite('subbe')}</li>
    </ul>
    <p class="src">The vitals are written for this demo and model early sepsis after abdominal surgery. What the team does next is outside the demo. No nurse educator has reviewed this script.</p>
    <div class="row"><button class="btn pri" data-act="again">Play again with another patient</button><button class="btn" data-act="faq">Questions students ask</button><button class="btn" data-act="about">Sources and method</button></div>`;
}
function vMews() {
  const ex = { hr: 118, sbp: 96, dbp: 60, rr: 22, temp: 38.3, avpu: 'A' }, m = mews(ex);
  const cols = [3, 2, 1, 0, 1, 2, 3];
  return `<h2 id="aboutH">How MEWS works</h2>
  <ol class="steps3"><li><b>Find the box.</b> For each of the five vitals, find the box that holds your patient's value.</li><li><b>Read the points.</b> The column heading is the points for that vital. The middle column is 0.</li><li><b>Add the five.</b> The total is the MEWS. Check it against the unit policy.</li></ol>
  <div class="tw"><table class="grid"><thead><tr><th>Points</th>${cols.map((c, i) => `<th class="c${c}${i === 3 ? ' mid' : ''}">${c}</th>`).join('')}</tr></thead>
  <tbody>${GRID.map((row) => `<tr><th>${row[0]}</th>${row.slice(1).map((v, i) => `<td class="${v ? 'c' + cols[i] : 'nil'}${i === 3 ? ' mid' : ''}">${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
  <p class="hint">Low values are on the left and high values on the right. An empty box means no value earns that score.</p>
  <h3>Worked example (not this patient)</h3>
  <div class="tw"><table class="ex"><tbody>
    <tr><td>Heart rate 118</td><td>${m.parts.hr}</td></tr><tr><td>Blood pressure 96/60 (use the top number)</td><td>${m.parts.sbp}</td></tr><tr><td>Respiratory rate 22</td><td>${m.parts.rr}</td></tr><tr><td>Temperature ${tempStr(ex.temp)}</td><td>${m.parts.temp}</td></tr><tr><td>Alert</td><td>${m.parts.avpu}</td></tr>
    <tr class="sum"><td>MEWS</td><td>${m.total}</td></tr></tbody></table></div>
  <h3>Unit policy in this demo</h3>
  <ul class="pol"><li><b>0 to 2</b><span>Routine checks.</span></li><li><b>3 or 4</b><span>Tell the charge nurse. Recheck within the hour.</span></li><li><b>5 or more</b><span>Call the rapid response team.</span></li><li><b>Any time</b><span>Call if you are worried about the patient.</span></li></ul>
  <p class="src">Table: ${cite('subbe')}. Oxygen saturation and urine output are not in this version of MEWS. Hospitals use different versions and trigger scores.</p>`;
}
function vFaq() {
  return `<h2 id="aboutH">Questions students ask</h2>
  <p class="hint">Each answer states what a source says. Your hospital's policy decides what applies on your unit.</p>
  ${FAQ(cite).map(([q, a], i) => `<details ${i === 0 ? 'open' : ''}><summary>${q}</summary><p>${a}</p></details>`).join('')}`;
}
function vAbout() {
  return `<h2 id="aboutH">About Room 412</h2>
  <p>A 7 minute demo of how a simulation can let nursing students practice clinical judgment on a deteriorating patient. It was built with AI for faculty workshops. It is not clinical guidance, and no nurse educator has reviewed the script.</p>
  <h3>What is real</h3><ul>
    <li>The scoring table is the Modified Early Warning Score as published in ${cite('subbe')}. The page computes every score from the vitals on the monitor.</li>
    <li>The single calling criteria are the typical criteria in the AHRQ PSNet primer on rapid response systems. ${cite('ahrq')}</li>
    <li>The three scored skills are named in the NCSBN Clinical Judgment Measurement Model. ${cite('ncsbn')} ${cite('openstax')}</li>
    <li>SBAR definitions are from AHRQ TeamSTEPPS. ${cite('sbar')} Sepsis signs are from CDC. ${cite('cdc')}</li></ul>
  <h3>What is written for the demo</h3><ul>
    <li>The patients, the vitals and the bedside notes. They are not from a patient record. All four patients share one script.</li>
    <li>The unit policy. Only the threshold of 5 comes from the MEWS study. Hospitals set their own.</li>
    <li>Which findings count as cues. Each one is tied to a source in the feedback.</li>
    <li>Telling the charge nurse does not change the script. A real provider might act and change the course.</li></ul>
  <h3>What is modeled and what is not</h3><ul>
    <li>Breathing on the patient runs at the respiratory rate on the monitor. Skin color, sheen and eye opening follow the script and are illustrative.</li>
    <li>Skin descriptions by tone follow ${cite('skin')}. The 3D color change is an approximation.</li>
    <li>MEWS in this version has no oxygen saturation or urine output row. Other versions do.</li>
    <li>The published table prints its lowest bands as under 70 and under 40. The page puts exactly 70 and 40 in those bands. No vital in the script sits on an edge.</li></ul>
  <h3>Sources</h3><ul>${Object.values(SRC).map((s) => `<li>${s.t} <a href="${s.u}" target="_blank" rel="noopener">Link</a></li>`).join('')}</ul>
  <h3>Privacy</h3><p>No tracking. Nothing you enter leaves this page. Fonts load from Google Fonts.</p>
  <p class="src">Built by José Antonio Bowen with Claude. <a href="https://weteachwithai.com/vibe-coding/" target="_blank" rel="noopener">More demos at weteachwithai.com</a></p>`;
}

// ---------- actions ----------
function commitAction() { const L = S.log[S.r]; L.verdict = judge(L.action, A[S.r]); EF.resolved(); { const ok = L.verdict !== 'below' && L.verdict !== 'unsupported'; EF.mark({ ok, conf: L.conf ? L.conf - 1 : undefined }); if (!ok) EF.wrong(); } S.sub = 'fb'; go('round'); }
function nextFromFb() {
  const L = S.log[S.r];
  if (L.action === 'rrt' && L.verdict !== 'unsupported') return startSbar(S.r, 'you');
  if (last(S.r)) return startSbar(S.r, 'charge');
  go('round', S.r + 1, 'look');
}
function startSbar(r, by) { S.called = r; S.calledBy = by; S.sbar = [null, null, null, null]; S.sbarDone = false; go('sbar'); }
const ACT = {
  begin: () => go('choose'), choose: () => go('choose'), report: () => go('report'),
  prep: () => go('prep'), oiCheck: () => { S.oiDone = true; render(); }, oiShow: () => { S.oi = OI.map((x) => x.k); S.oiDone = true; render(); },
  faq: () => { $('#aboutBody').innerHTML = vFaq(); $('#modal').hidden = false; $('#modalClose').focus(); },
  copyLog: () => { const t = logText(), el = $('#copied'); const fail = () => { el.textContent = ''; const ta = document.createElement('textarea'); ta.className = 'logta'; ta.value = t; ta.readOnly = true; ta.rows = 8; el.parentNode.after(ta); ta.select(); }; try { navigator.clipboard.writeText(t).then(() => { el.textContent = 'Copied.'; }, fail); } catch (e) { fail(); } },
  startRounds: () => { S.log = []; S.called = null; go('round', 0, 'look'); },
  toScore: () => { S.sub = 'score'; go('round'); }, toAct: () => { S.sub = 'act'; go('round'); }, toFb: commitAction,
  showScore: () => { const L = S.log[S.r]; L.scores = { ...A[S.r].parts }; L.shown = true; render(); },
  next: nextFromFb,
  sbarCheck: () => { S.sbarDone = true; render(); }, sbarShow: () => { S.sbar = SBAR(P(), ROUNDS[S.called], 0).map((x) => x.k); S.sbarDone = true; S.sbarShown = true; render(); },
  debrief: () => go('debrief'),
  again: () => { S.oi = [null, null, null, null]; S.oiDone = false; S.plan = null; S.p = (S.p + 1) % PATIENTS.length; room.setPatient(P()); S.seed += 1; S.log = []; S.called = null; go('choose'); },
  about: () => { $('#aboutBody').innerHTML = vAbout(); $('#modal').hidden = false; $('#modalClose').focus(); },
  mews: () => { $('#aboutBody').innerHTML = vMews(); $('#modal').hidden = false; $('#modalClose').focus(); },
  closeAbout: () => { $('#modal').hidden = true; },
  sound: () => { S.sound = !S.sound; if (S.sound && !actx) actx = new (window.AudioContext || window.webkitAudioContext)(); const b = $('#soundBtn'); b.textContent = S.sound ? 'Sound on' : 'Sound off'; b.setAttribute('aria-pressed', String(S.sound)); },
};
document.addEventListener('click', (e) => { const v = e.target.closest('[data-view]'); if (v) return setView(v.dataset.view); const b = e.target.closest('[data-act]'); if (b && !b.disabled && ACT[b.dataset.act]) ACT[b.dataset.act](); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) ACT.closeAbout(); });
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') ACT.closeAbout(); });
panelBody.addEventListener('change', (e) => {
  const t = e.target, L = S.log[S.r];
  if (t.name === 'pt') { S.p = +t.value; room.setPatient(P()); return; }
  if (t.name === 'cue') { const i = +t.value; L.flags = t.checked ? [...new Set([...L.flags, i])] : L.flags.filter((x) => x !== i); return; }
  if (t.name.startsWith('s_')) { L.scores[t.name.slice(2)] = +t.value; L.shown = false; $('#tot').textContent = allScored(L.scores) ? sumScores(L.scores) : '·'; panelBody.querySelector('[data-act=toAct]').disabled = !allScored(L.scores); return; }
  if (t.name === 'act' || t.name === 'why' || t.name === 'conf') { if (t.name === 'act') L.action = t.value; if (t.name === 'why') L.why = t.value; if (t.name === 'conf') L.conf = +t.value; panelBody.querySelector('[data-act=toFb]').disabled = !(L.action && L.why && L.conf); return; }
  if (t.name === 'note') { L.note = t.value.trim(); return; }
  if (t.name === 'plan') { S.plan = t.value; panelBody.querySelector('[data-act=startRounds]').disabled = false; return; }
  if (t.name.startsWith('oi_')) { S.oi[+t.name.slice(3)] = t.value; panelBody.querySelector('[data-act=oiCheck]').disabled = !S.oi.every(Boolean); return; }
  if (t.name.startsWith('sb_')) { S.sbar[+t.name.slice(3)] = t.value; panelBody.querySelector('[data-act=sbarCheck]').disabled = !S.sbar.every(Boolean); }
});

// ---------- loop ----------
let prev = performance.now();
function frame(now) {
  const dt = Math.min(DTCAP, (now - prev) / 1000); prev = now; tick(dt); requestAnimationFrame(frame);
}
function tick(dt) {
  const k = 1 - Math.exp(-2.2 * dt);
  S.clock = Math.abs(S.clockT - S.clock) < 0.01 ? S.clockT : lerp(S.clock, S.clockT, k);
  for (const key in disp) disp[key] = Math.abs(dispT[key] - disp[key]) < (key === 'temp' ? 0.04 : 0.45) ? dispT[key] : lerp(disp[key], dispT[key], k);
  room.setClock(S.clock); stepWaves(dt); drawMonitor(); room.update(dt, reduce); updateRig(dt);
  const R = ROUNDS[S.r]; $('#clock').innerHTML = body.dataset.state === 'round' || body.dataset.state === 'sbar' ? `${hhmm(S.clock)}<small>Hour ${Math.max(1, Math.round(S.clock - 7))} of 12</small>` : body.dataset.state === 'debrief' ? `${ROUNDS[S.called].time}<small>Rapid response called</small>` : `07:00<small>Shift start</small>`;
  composer.render();
}

// ---------- test hook ----------
window.__demo = {
  state: () => ({ step: S.step, r: S.r, sub: S.sub, p: P().id, view: S.view, called: S.called, calledBy: S.calledBy, clock: +S.clock.toFixed(2), disp: { ...disp }, log: S.log.map((L) => L && ({ ...L })), plan: S.plan, oi: S.oi, logText: S.called != null ? logText() : null, tally: S.called != null ? tally() : null }),
  model: () => ROUNDS.map((r, i) => ({ time: r.time, ...r.v, f: cToF(r.v.temp), parts: A[i].parts, total: A[i].total, need: A[i].need, support: A[i].support, crit: A[i].crit, verdicts: ACTIONS.map((x) => judge(x.k, A[i])) })),
  go, act: (k) => ACT[k](), view: (n) => setView(n, true), patient: (i) => { S.p = i; room.setPatient(P()); render(); },
  flag: (arr) => { S.log[S.r].flags = arr; }, flagKey: () => { S.log[S.r].flags = ROUNDS[S.r].cues.map((c, i) => c.flag ? i : -1).filter((i) => i >= 0); },
  score: (o) => { S.log[S.r].scores = o === 'key' ? { ...A[S.r].parts } : o; }, choose: (k) => { S.log[S.r].action = k; },
  sbar: (arr) => { S.sbar = arr; },
  warm: (sec) => { for (let i = 0; i < sec * 20; i++) { const k = 0.1; S.clock = lerp(S.clock, S.clockT, k); for (const key in disp) disp[key] = lerp(disp[key], dispT[key], 0.3); room.update(0.05, reduce); stepWaves(0.05); } S.clock = S.clockT; Object.assign(disp, { hr: dispT.hr, sbp: dispT.sbp, dbp: dispT.dbp, rr: dispT.rr, temp: dispT.temp, spo2: dispT.spo2 }); updateRig(1, true); },
  optionLengths: () => ACTIONS.map((x) => x.t.length),
};

room.setPatient(P()); room.setLook(ROUNDS[0].look, ROUNDS[0].v.rr, true); room.setClock(7);
resize(); go('title'); requestAnimationFrame(frame);
