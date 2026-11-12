// The room: bed, patient, monitor, headwall, window, clock. Units are meters.
import * as THREE from 'three';
import { clamp, lerp, mulberry } from './fx.js';

const std = (color, rough = 0.8, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
function at(mesh, x, y, z, parent) { mesh.position.set(x, y, z); if (parent) parent.add(mesh); return mesh; }
function limb(a, b, r, m) { // capsule from a to b
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
  const g = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 14), m);
  g.position.copy(A).lerp(B, 0.5); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return g;
}
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

export function buildRoom(scene, monitorCanvas) {
  const R = { groups: {}, t: 0 };
  const shadow = (m, cast = true, recv = true) => { m.castShadow = cast; m.receiveShadow = recv; return m; };

  // ---------- shell ----------
  const floorTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#b9c1c2'; g.fillRect(0, 0, w, h); const r = mulberry(7);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '70,90,95'},${0.05 + r() * 0.09})`; g.fillRect(r() * w, r() * h, 1.5 + r() * 2, 1.5 + r() * 2); }
    g.strokeStyle = 'rgba(60,80,85,.22)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h);
  });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(10, 10);
  const floor = shadow(new THREE.Mesh(new THREE.PlaneGeometry(12, 12), std('#ffffff', 0.42, 0, { map: floorTex })), false, true);
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const wallM = std('#c9cdc4', 0.95), wallAccent = std('#8fb3ad', 0.95), trim = std('#f1f1ec', 0.7), wood = std('#b28a62', 0.6);
  const back = shadow(box(8.4, 3.0, 0.12, wallM), false); at(back, 0.4, 1.5, -1.86, scene);
  const left = shadow(box(0.12, 3.0, 7, wallAccent), false); at(left, -2.86, 1.5, 1.6, scene);
  const ceil = box(8.4, 0.1, 7, std('#e9ebe6', 1)); at(ceil, 0.4, 3.02, 1.6, scene);
  at(box(8.4, 0.12, 0.03, trim), 0.4, 0.06, -1.79, scene); at(box(0.03, 0.12, 7, trim), -2.79, 0.06, 1.6, scene);
  // ceiling light panels
  const panelM = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff6e6', emissiveIntensity: 0.9 });
  at(box(1.2, 0.02, 0.6, panelM), 0, 2.96, 0.2, scene); at(box(1.2, 0.02, 0.6, panelM), 1.9, 2.96, 1.6, scene);

  // window on the left wall
  const win = new THREE.Group(); win.position.set(-2.79, 1.55, 0.5); win.rotation.y = Math.PI / 2; scene.add(win);
  R.skyMat = new THREE.MeshBasicMaterial({ color: '#cfe6ff' });
  win.add(new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.3), R.skyMat));
  const skyline = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.42), new THREE.MeshBasicMaterial({ map: canvasTex(256, 64, (g, w, h) => { const r = mulberry(3); g.clearRect(0, 0, w, h); for (let x = 0; x < w;) { const bw = 10 + r() * 22, bh = 12 + r() * 46; g.fillStyle = `rgba(${90 + r() * 40},${110 + r() * 40},${130 + r() * 40},.85)`; g.fillRect(x, h - bh, bw, bh); x += bw + 1; } }), transparent: true }));
  skyline.position.set(0, -0.44, 0.005); win.add(skyline);
  for (const [x, y, w, h] of [[0, 0.68, 2.06, 0.08], [0, -0.68, 2.06, 0.1], [-0.99, 0, 0.08, 1.44], [0.99, 0, 0.08, 1.44], [0, 0, 0.05, 1.3]]) at(box(w, h, 0.06, trim), x, y, 0.03, win);
  const blindM = std('#eeeee6', 0.8); for (let i = 0; i < 5; i++) at(box(1.9, 0.035, 0.015, blindM), 0, 0.6 - i * 0.07, 0.05, win);
  // curtain by the window
  const cg = new THREE.PlaneGeometry(0.9, 2.5, 40, 1); const cp = cg.attributes.position;
  for (let i = 0; i < cp.count; i++) cp.setZ(i, Math.sin(cp.getX(i) * 34) * 0.045); cg.computeVertexNormals();
  const curtain = shadow(new THREE.Mesh(cg, std('#7fa7a6', 0.95, 0, { side: THREE.DoubleSide }))); curtain.position.set(-2.66, 1.4, 1.95); curtain.rotation.y = Math.PI / 2; scene.add(curtain);

  // ---------- headwall ----------
  const hw = new THREE.Group(); hw.position.set(0, 0, -1.8); scene.add(hw);
  at(shadow(box(2.5, 1.25, 0.05, wood), false), 0, 1.45, 0.03, hw);
  at(box(2.5, 0.07, 0.09, std('#dfe2e0', 0.5, 0.3)), 0, 1.0, 0.06, hw);
  R.overbed = new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#ffe9c4', emissiveIntensity: 0.85 });
  at(box(1.1, 0.09, 0.1, std('#f4f4f0', 0.5)), 0, 2.18, 0.08, hw); at(box(1.0, 0.03, 0.07, R.overbed), 0, 2.13, 0.09, hw);
  const plate = std('#f3f3ef', 0.5), red = std('#c2392f', 0.5), green = std('#2f9a5a', 0.5), yellow = std('#d9b23a', 0.5);
  for (const [x, m] of [[-1.05, plate], [-0.86, red], [0.86, red], [1.05, plate]]) { at(box(0.11, 0.16, 0.02, m), x, 1.25, 0.065, hw); at(box(0.03, 0.05, 0.005, std('#333')), x, 1.25, 0.078, hw); }
  // oxygen flowmeter and suction
  at(box(0.1, 0.1, 0.03, plate), 0.62, 1.55, 0.07, hw); at(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.16, 12), std('#dff3e6', 0.2, 0, { transparent: true, opacity: 0.75 })), 0.62, 1.62, 0.12, hw);
  at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 12), green), 0.62, 1.52, 0.12, hw);
  at(box(0.1, 0.1, 0.03, plate), -0.62, 1.55, 0.07, hw); at(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.2, 16), std('#f2f6f6', 0.15, 0, { transparent: true, opacity: 0.55 })), -0.62, 1.38, 0.13, hw);
  at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 12), yellow), -0.62, 1.52, 0.12, hw);
  // room sign and whiteboard
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.8), new THREE.MeshStandardMaterial({ roughness: 0.4, map: canvasTex(575, 400, (g, w, h) => {
    g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#9aa3a3'; g.lineWidth = 10; g.strokeRect(0, 0, w, h);
    g.fillStyle = '#1f6f69'; g.font = '700 54px Inter, Arial'; g.fillText('ROOM 412', 30, 74);
    g.fillStyle = '#2a3b3d'; g.font = '500 30px Inter, Arial'; const L = ['Nurse today:  YOU', 'Day 2 after surgery', 'Goal:  walk the hall x3', 'Diet:  as tolerated', 'Call light within reach']; L.forEach((s, i) => g.fillText(s, 30, 140 + i * 52));
  }) }));
  board.position.set(2.25, 1.6, -1.79); scene.add(board);
  // wall clock (hands set from the shift time)
  const clock = new THREE.Group(); clock.position.set(1.5, 2.42, -1.79); scene.add(clock);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.19, 40), new THREE.MeshStandardMaterial({ roughness: 0.5, map: canvasTex(256, 256, (g, w) => { g.fillStyle = '#fdfdfb'; g.beginPath(); g.arc(128, 128, 128, 0, 7); g.fill(); g.fillStyle = '#222'; g.font = '700 26px Inter, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; g.fillText(String(i), 128 + Math.sin(a) * 100, 128 - Math.cos(a) * 100); } }) }));
  clock.add(face); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.195, 0.014, 8, 40), std('#2c3436', 0.4, 0.4)); clock.add(rim);
  const handM = std('#161616', 0.5); R.hourHand = new THREE.Group(); R.minHand = new THREE.Group(); clock.add(R.hourHand, R.minHand);
  at(box(0.018, 0.1, 0.004, handM), 0, 0.05, 0.006, R.hourHand); at(box(0.012, 0.155, 0.004, handM), 0, 0.077, 0.009, R.minHand);

  // ---------- bed ----------
  const bed = new THREE.Group(); scene.add(bed); const TOP = 0.74, HINGE = -0.22;
  const frameM = std('#dcdfdc', 0.5, 0.2), darkM = std('#3a4244', 0.6, 0.3), sheet = std('#d3d7d6', 0.95), blanketM = std('#7fb1bf', 0.95), railM = std('#e8e9e5', 0.4, 0.3);
  at(shadow(box(0.94, 0.12, 2.12, frameM)), 0, 0.5, -0.1, bed); at(shadow(box(0.6, 0.18, 1.5, darkM)), 0, 0.32, -0.1, bed);
  for (const [x, z] of [[-0.4, -1.05], [0.4, -1.05], [-0.4, 0.85], [0.4, 0.85]]) { at(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.2, 10), darkM), x, 0.18, z, bed); const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 16), darkM); wh.rotation.z = Math.PI / 2; at(wh, x, 0.07, z, bed); }
  at(shadow(box(1.0, 0.62, 0.06, std('#c9b08f', 0.6))), 0, 0.84, -1.2, bed); at(shadow(box(1.0, 0.45, 0.06, std('#c9b08f', 0.6))), 0, 0.72, 0.99, bed);
  at(shadow(box(0.9, 0.16, 1.2, sheet)), 0, TOP - 0.08, HINGE + 0.6, bed); // flat mattress
  const backrest = new THREE.Group(); backrest.position.set(0, TOP - 0.02, HINGE); backrest.rotation.x = 0.62; bed.add(backrest); R.groups.backrest = backrest;
  at(shadow(box(0.9, 0.16, 0.98, sheet)), 0, -0.06, -0.49, backrest);
  // side rails
  for (const s of [-1, 1]) { const rail = new THREE.Group(); rail.position.set(s * 0.49, 0.0, -0.52); backrest.add(rail); for (const y of [0.2, 0.1]) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.5, 8), railM); bar.rotation.x = Math.PI / 2; bar.position.y = y; rail.add(bar); } for (const z of [-0.25, 0, 0.25]) at(new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.22, 8), railM), 0, 0.1, z, rail); }
  // pillow
  const pillow = shadow(new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), std('#dcdcd8', 0.95))); pillow.scale.set(0.36, 0.09, 0.21); at(pillow, 0, 0.1, -0.79, backrest);
  // legs under the blanket
  const legs = new THREE.Group(); bed.add(legs);
  for (const s of [-1, 1]) { const l = shadow(new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), blanketM)); l.scale.set(0.105, 0.085, 0.55); at(l, s * 0.13, TOP + 0.05, 0.36, legs); const f = shadow(new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), blanketM)); f.scale.set(0.07, 0.11, 0.07); at(f, s * 0.14, TOP + 0.1, 0.84, legs); }
  const bl = shadow(new THREE.Mesh(new THREE.SphereGeometry(1, 28, 16), blanketM)); bl.scale.set(0.47, 0.075, 0.66); at(bl, 0, TOP + 0.02, 0.38, legs);
  const hip = shadow(new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), blanketM)); hip.scale.set(0.3, 0.13, 0.26); at(hip, 0, TOP + 0.06, -0.12, legs);

  // ---------- patient ----------
  const P = { skin: std('#7a5034', 0.62), lip: std('#7a463c', 0.5), hair: std('#8d8d8f', 0.9), brow: std('#55514f', 0.9), gown: std('#b9d2dc', 0.9), eyeW: std('#f3efe9', 0.35), iris: std('#2a1c14', 0.3) };
  P.skin.envMapIntensity = 0.6; R.P = P;
  const body = new THREE.Group(); backrest.add(body); R.groups.body = body;
  const chest = shadow(new THREE.Mesh(new THREE.SphereGeometry(1, 32, 22), P.gown)); chest.scale.set(0.215, 0.115, 0.3); at(chest, 0, 0.17, -0.3, body); R.chest = chest;
  const belly = shadow(new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), blanketM)); belly.scale.set(0.235, 0.12, 0.22); at(belly, 0, 0.15, -0.08, body); R.belly = belly;
  const sh = new THREE.Group(); body.add(sh); R.shoulders = sh;
  for (const s of [-1, 1]) { const d = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.082, 20, 14), P.gown)); at(d, s * 0.2, 0.175, -0.5, sh); }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.013, 8, 24), std('#9dbccb', 0.9)); collar.rotation.x = Math.PI / 2 - 0.5; at(collar, 0, 0.215, -0.575, body);
  at(shadow(limb([0, 0.2, -0.56], [0, 0.245, -0.66], 0.047, P.skin)), 0, 0, 0, body).position.set(0, 0.2225, -0.61);
  // arms: sleeves then skin, hands on the blanket
  R.arms = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Group(); body.add(arm); R.arms.push(arm);
    arm.add(shadow(limb([s * 0.235, 0.17, -0.48], [s * 0.3, 0.15, -0.3], 0.05, P.gown)));
    arm.add(shadow(limb([s * 0.3, 0.15, -0.28], [s * 0.315, 0.14, -0.18], 0.043, P.skin)));
    const fore = new THREE.Group(); fore.position.set(s * 0.315, 0.14, -0.16); arm.add(fore); arm.userData.fore = fore;
    fore.add(shadow(limb([0, 0, 0], [-s * 0.075, 0.075, 0.2], 0.038, P.skin)));
    const hand = shadow(new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), P.skin)); hand.scale.set(0.045, 0.024, 0.062); at(hand, -s * 0.09, 0.098, 0.26, fore);
    for (let i = 0; i < 4; i++) fore.add(shadow(limb([-s * 0.09 + (i - 1.5) * 0.02, 0.098, 0.3], [-s * 0.09 + (i - 1.5) * 0.022, 0.085, 0.355], 0.009, P.skin)));
    if (s === 1) { // pulse oximeter clip with its red light
      const clip = box(0.026, 0.022, 0.045, std('#e9ecec', 0.4)); at(clip, -s * 0.09 - 0.011, 0.09, 0.345, fore);
      R.oxLed = new THREE.MeshStandardMaterial({ color: '#300', emissive: '#ff2a1a', emissiveIntensity: 2.4 }); at(box(0.012, 0.004, 0.012, R.oxLed), -s * 0.09 - 0.011, 0.103, 0.345, fore);
    }
  }
  // head
  const head = new THREE.Group(); head.position.set(0, 0.275, -0.775); head.rotation.x = 0.25; body.add(head); R.head = head;
  const skull = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.104, 40, 30), P.skin)); skull.scale.set(0.9, 0.98, 1.1); head.add(skull);
  const jaw = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.075, 28, 20), P.skin)); jaw.scale.set(0.95, 0.9, 1.0); at(jaw, 0, 0.022, 0.05, head);
  for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.024, 14, 10), P.skin); ear.scale.set(0.4, 0.8, 1.05); at(ear, s * 0.093, 0.005, 0.0, head); }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.017, 16, 12), P.skin); nose.scale.set(0.85, 1.0, 1.25); at(nose, 0, 0.098, 0.014, head);
  const bridge = limb([0, 0.092, -0.03], [0, 0.103, 0.012], 0.0095, P.skin); head.add(bridge);
  R.lipU = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), P.lip); R.lipU.scale.set(0.026, 0.006, 0.0068); at(R.lipU, 0, 0.089, 0.049, head);
  R.lipL = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), P.lip); R.lipL.scale.set(0.022, 0.0075, 0.008); at(R.lipL, 0, 0.083, 0.061, head);
  R.eyes = []; R.lids = []; R.brows = [];
  for (const s of [-1, 1]) {
    const eye = new THREE.Group(); eye.position.set(s * 0.037, 0.087, -0.022); eye.rotation.z = -s * 0.25; head.add(eye);
    const w = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), P.eyeW); w.scale.set(0.0155, 0.006, 0.0082); eye.add(w);
    const ir = new THREE.Mesh(new THREE.SphereGeometry(0.0062, 14, 10), P.iris); ir.position.set(0, 0.0035, 0.001); ir.scale.y = 0.6; eye.add(ir);
    const lid = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), P.skin); lid.scale.set(0.0175, 0.0075, 0.0096); lid.position.set(0, 0.0012, -0.012); eye.add(lid);
    R.eyes.push(eye); R.lids.push(lid);
    const brow = limb([s * 0.018, 0.0925, -0.046], [s * 0.058, 0.084, -0.042], 0.0038, P.brow); head.add(brow); R.brows.push(brow);
  }
  // hair, rebuilt per patient
  R.hairG = new THREE.Group(); head.add(R.hairG);
  // sweat beads on the forehead
  R.sweat = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0022, 8, 6), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.05, metalness: 0, transparent: true, opacity: 0 }), 26);
  const rr = mulberry(11), dm = new THREE.Object3D();
  for (let i = 0; i < 26; i++) { const a = (rr() - 0.5) * 1.5, b = -0.25 - rr() * 0.75; const n = new THREE.Vector3(Math.sin(a) * Math.cos(b), Math.cos(a) * Math.cos(b), Math.sin(b)).normalize(); dm.position.set(n.x * 0.0945, n.y * 0.103, n.z * 0.115); dm.scale.setScalar(0.7 + rr() * 0.9); dm.updateMatrix(); R.sweat.setMatrixAt(i, dm.matrix); }
  head.add(R.sweat);
  // ID band
  at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.018, 16, 1, true), std('#fafafa', 0.6, 0, { side: THREE.DoubleSide })), 0, 0, 0, R.arms[0].userData.fore).position.set(0.045, 0.045, 0.12);
  R.arms[0].userData.fore.children.at(-1).rotation.set(1.2, 0, 0.35);

  // ---------- IV pole, pump, line ----------
  const iv = new THREE.Group(); iv.position.set(-0.82, 0, -1.2); scene.add(iv); const chrome = std('#cfd4d6', 0.25, 0.8);
  at(shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 2.0, 10), chrome)), 0, 1.0, 0, iv);
  for (let i = 0; i < 5; i++) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8), chrome); leg.rotation.z = Math.PI / 2; leg.rotation.y = i * Math.PI * 2 / 5; leg.position.set(Math.cos(i * 1.2566) * 0.15, 0.06, -Math.sin(i * 1.2566) * 0.15); iv.add(leg); }
  at(box(0.3, 0.012, 0.012, chrome), 0, 1.98, 0, iv);
  const bag = shadow(new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), std('#e8f4fa', 0.15, 0, { transparent: true, opacity: 0.6 }))); bag.scale.set(0.07, 0.12, 0.03); at(bag, 0.12, 1.8, 0, iv);
  const pump = shadow(box(0.17, 0.22, 0.12, std('#e6e9ea', 0.5))); at(pump, 0, 1.25, 0.07, iv);
  at(box(0.1, 0.06, 0.004, new THREE.MeshStandardMaterial({ color: '#052', emissive: '#39e08a', emissiveIntensity: 1.2 })), 0, 1.3, 0.132, iv);
  const line = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.7, 1.68, -1.2), new THREE.Vector3(-0.72, 1.4, -1.14), new THREE.Vector3(-0.8, 1.2, -1.1), new THREE.Vector3(-0.66, 0.92, -0.75), new THREE.Vector3(-0.46, 0.98, -0.42), new THREE.Vector3(-0.33, 0.98, -0.3)]), 40, 0.004, 6), std('#eef6fa', 0.2, 0, { transparent: true, opacity: 0.8 }));
  scene.add(line);

  // ---------- bedside monitor on a wall arm ----------
  const mon = new THREE.Group(); mon.position.set(0.98, 1.72, -1.42); mon.rotation.y = -0.42; mon.rotation.x = -0.06; scene.add(mon);
  at(shadow(box(0.74, 0.47, 0.07, std('#23292b', 0.5))), 0, 0, -0.04, mon);
  R.monTex = new THREE.CanvasTexture(monitorCanvas); R.monTex.colorSpace = THREE.SRGBColorSpace; R.monTex.anisotropy = 8;
  at(new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.3825), new THREE.MeshBasicMaterial({ map: R.monTex, toneMapped: false })), 0, 0.015, 0, mon);
  const armM = std('#aeb4b6', 0.4, 0.6); const a1 = box(0.05, 0.05, 0.42, armM); a1.position.set(0.985, 1.72, -1.63); a1.rotation.y = -0.2; scene.add(a1);
  // overbed table with a cup, and a chair
  const tbl = new THREE.Group(); tbl.position.set(1.42, 0, 0.75); tbl.rotation.y = -0.5; scene.add(tbl);
  at(shadow(box(0.42, 0.03, 0.8, std('#caa77d', 0.5))), -0.1, 0.98, 0, tbl); at(shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.95, 10), chrome)), 0.08, 0.5, 0.3, tbl); at(shadow(box(0.5, 0.04, 0.08, darkM)), -0.08, 0.04, 0.3, tbl);
  at(shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.028, 0.1, 16), std('#f7f7f5', 0.4))), -0.12, 1.045, 0.1, tbl);
  at(shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.16, 16), std('#d7ecf2', 0.1, 0, { transparent: true, opacity: 0.6 }))), -0.2, 1.075, -0.14, tbl);
  const chair = new THREE.Group(); chair.position.set(-1.95, 0, 1.25); chair.rotation.y = 1.1; scene.add(chair); const chM = std('#59788a', 0.8);
  at(shadow(box(0.55, 0.1, 0.52, chM)), 0, 0.44, 0, chair); at(shadow(box(0.55, 0.6, 0.1, chM)), 0, 0.78, -0.24, chair); for (const [x, z] of [[-0.24, -0.22], [0.24, -0.22], [-0.24, 0.22], [0.24, 0.22]]) at(box(0.04, 0.42, 0.04, wood), x, 0.21, z, chair);
  // sanitizer dispenser and sharps box on the back wall
  at(box(0.12, 0.22, 0.09, std('#f4f4f1', 0.4)), 1.5, 1.35, -1.76, scene); at(box(0.2, 0.26, 0.1, std('#c93a32', 0.6)), -1.55, 1.3, -1.75, scene);

  // ---------- lights ----------
  scene.add(new THREE.HemisphereLight('#f4f8ff', '#8a8f86', 0.8));
  R.sun = new THREE.DirectionalLight('#fff3da', 1.5); R.sun.position.set(-5.5, 3.6, 1.6); R.sun.target.position.set(0, 0.8, -0.4); scene.add(R.sun, R.sun.target);
  R.sun.castShadow = true; R.sun.shadow.mapSize.set(2048, 2048); const sc = R.sun.shadow.camera; sc.left = -2.6; sc.right = 2.6; sc.top = 2.6; sc.bottom = -2.2; sc.near = 1; sc.far = 12; R.sun.shadow.bias = -0.0004; R.sun.shadow.normalBias = 0.02; R.sun.shadow.radius = 5;
  const over = new THREE.PointLight('#ffe7c2', 2.2, 5, 1.6); over.position.set(0, 2.05, -1.45); scene.add(over); R.over = over;
  const fill = new THREE.PointLight('#dfeaff', 5, 9, 1.4); fill.position.set(1.8, 2.5, 2.2); scene.add(fill);
  R.monGlow = new THREE.PointLight('#6fffc0', 0.2, 2.2, 2); R.monGlow.position.set(0.85, 1.7, -1.2); scene.add(R.monGlow);

  // ---------- state ----------
  const cur = { ill: 0, flush: 0, sweat: 0, eye: 1 }, tgt = { ill: 0, flush: 0, sweat: 0, eye: 1 };
  const cSkin = new THREE.Color(), cIll = new THREE.Color(), cFlush = new THREE.Color(), cLip = new THREE.Color(), cLipIll = new THREE.Color(), tmp = new THREE.Color();
  let breath = 0, rrNow = 16, blink = 3, blinkT = 0, restless = 0;

  R.setPatient = (p) => {
    cSkin.set(p.skin); cIll.set(p.ill); cFlush.set(p.flush); cLip.set(p.lip); cLipIll.set(p.lipIll); P.hair.color.set(p.hair); P.brow.color.set(p.brow);
    P.iris.color.set(p.tone === 'light' ? '#4a5f6e' : '#2a1c14');
    R.hairG.clear();
    const cap = (r, th, rx, sc) => { const wrap = new THREE.Group(); wrap.scale.set(...sc); const m = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 24, 0, Math.PI * 2, 0, th), P.hair); m.rotation.x = rx; m.castShadow = true; wrap.add(m); R.hairG.add(wrap); };
    if (p.hairStyle === 'short') cap(0.1075, 1.08, -1.85, [0.92, 1.0, 1.1]);
    else if (p.hairStyle === 'crop') cap(0.1085, 1.12, -1.85, [0.93, 1.0, 1.1]);
    else { cap(0.112, 1.3, -1.9, [0.96, 1.0, 1.1]); const backHair = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), P.hair); backHair.scale.set(0.104, 0.07, 0.112); backHair.position.set(0, -0.045, 0.012); R.hairG.add(backHair); for (const s of [-1, 1]) { const side = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 14), P.hair); side.scale.set(0.02, 0.05, 0.085); side.position.set(s * 0.09, -0.02, 0.005); side.castShadow = true; R.hairG.add(side); } }
    R.patient = p; apply(true);
  };
  R.setLook = (look, rr, snap) => { Object.assign(tgt, look); R.rrTarget = rr; if (snap) { Object.assign(cur, look); rrNow = rr; apply(true); } };
  function apply() {
    tmp.copy(cSkin).lerp(cIll, cur.ill).lerp(cFlush, cur.flush * 0.55 * (1 - cur.ill)); P.skin.color.copy(tmp);
    P.skin.roughness = lerp(0.62, 0.4, cur.sweat); P.lip.color.copy(cLip).lerp(cLipIll, cur.ill);
    R.sweat.material.opacity = clamp(cur.sweat * 1.1, 0, 0.9); R.sweat.visible = cur.sweat > 0.02;
  }
  R.setClock = (hours) => { R.hourHand.rotation.z = -(hours % 12) / 12 * Math.PI * 2; R.minHand.rotation.z = -(hours % 1) * Math.PI * 2;
    const k = clamp((hours - 7) / 8, 0, 1); R.skyMat.color.setRGB(lerp(0.80, 0.62, k), lerp(0.89, 0.80, k), lerp(1.0, 0.98, k)); R.sun.position.set(lerp(-5.5, -4.2, k), lerp(3.2, 5.2, k), lerp(2.4, 0.4, k)); R.sun.color.setRGB(1, lerp(0.93, 0.98, k), lerp(0.82, 0.94, k)); };
  R.breathPhase = () => breath;
  R.update = (dt, reduce) => {
    R.t += dt; const k = 1 - Math.exp(-1.6 * dt);
    for (const key in cur) cur[key] = lerp(cur[key], tgt[key], k); rrNow = lerp(rrNow, R.rrTarget || 16, k); apply();
    // breathing at the true respiratory rate
    breath += dt * rrNow / 60; const ph = breath % 1, insp = ph < 0.4 ? 0.5 - 0.5 * Math.cos(ph / 0.4 * Math.PI) : 0.5 + 0.5 * Math.cos((ph - 0.4) / 0.6 * Math.PI);
    const depth = reduce ? 0.3 : 1, effort = clamp((rrNow - 16) / 12, 0, 1);
    chest.scale.set(0.215 * (1 + 0.025 * insp * depth), 0.115 * (1 + (0.11 + 0.05 * effort) * insp * depth), 0.3); chest.position.y = 0.17 + 0.006 * insp * depth;
    belly.scale.y = 0.12 * (1 + 0.07 * insp * depth); sh.position.y = (0.004 + 0.012 * effort) * insp * depth; sh.position.z = -0.006 * effort * insp * depth;
    head.position.y = 0.275 + 0.003 * effort * insp * depth;
    // eyes: openness and blinking
    blink -= dt; if (blink < 0) { blink = 2.5 + Math.random() * 3.5; blinkT = 0.16; } blinkT = Math.max(0, blinkT - dt);
    const open = blinkT > 0 ? 0 : cur.eye; for (const lid of R.lids) lid.position.z = lerp(0.0005, -0.0135, open);
    // slow head movement, restless arm when confused
    restless = lerp(restless, cur.ill > 0.7 && cur.eye > 0.4 ? 1 : 0, k);
    if (!reduce) { head.rotation.z = Math.sin(R.t * 0.31) * 0.05 + Math.sin(R.t * 1.3) * 0.05 * restless; head.rotation.y = Math.sin(R.t * 0.23 + 1) * 0.07 + Math.sin(R.t * 0.9) * 0.1 * restless;
      R.arms[1].userData.fore.rotation.x = -Math.max(0, Math.sin(R.t * 1.1)) * 0.22 * restless; R.arms[1].userData.fore.rotation.y = Math.sin(R.t * 1.7) * 0.12 * restless; }
    head.rotation.x = 0.25 + (1 - cur.eye) * 0.14;
    R.oxLed.emissiveIntensity = 1.6 + 1.2 * Math.max(0, Math.sin(R.t * 6));
    R.monTex.needsUpdate = true;
  };
  R.headWorld = (v) => head.getWorldPosition(v);
  return R;
}
