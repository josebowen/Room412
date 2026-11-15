// All teaching text, the scripted findings and the source list.
export const SRC = {
  subbe: { s: 'Subbe et al. 2001', t: 'Subbe CP, Kruger M, Rutherford P, Gemmel L. Validation of a modified Early Warning Score in medical admissions. QJM 2001;94(10):521-526.', u: 'https://doi.org/10.1093/qjmed/94.10.521' },
  ahrq: { s: 'AHRQ PSNet', t: 'Rapid Response Systems. PSNet primer. Agency for Healthcare Research and Quality. Reviewed September 2024.', u: 'https://psnet.ahrq.gov/primer/rapid-response-systems' },
  ncsbn: { s: 'NCSBN 2019', t: 'NCSBN. Clinical Judgment Measurement Model and Action Model. Next Generation NCLEX News, Spring 2019.', u: 'https://www.ncsbn.org/public-files/NGN_Spring19_ENG_29Aug2019.pdf' },
  openstax: { s: 'OpenStax Med-Surg 4.2', t: 'Bowen C, Carey B, Palozie J, Reinholdt M. Medical-Surgical Nursing, section 4.2. OpenStax, 2024. CC BY-NC-SA. Access for free at https://openstax.org/books/medical-surgical-nursing/pages/1-introduction', u: 'https://openstax.org/books/medical-surgical-nursing/pages/4-2-clinical-judgment-measurement-model-overview' },
  cdc: { s: 'CDC', t: 'Centers for Disease Control and Prevention. About Sepsis.', u: 'https://www.cdc.gov/sepsis/about/index.html' },
  ssc: { s: 'Surviving Sepsis 2021', t: 'Evans L, et al. Surviving Sepsis Campaign: international guidelines for management of sepsis and septic shock 2021. Crit Care Med 2021;49(11):e1063-e1143.', u: 'https://sccm.org/sepsisguidelines' },
  douw: { s: 'Douw et al. 2015', t: "Douw G, et al. Nurses' worry or concern and early recognition of deteriorating patients on general wards in acute care hospitals: a systematic review. Critical Care 2015;19:230.", u: 'https://doi.org/10.1186/s13054-015-0950-5' },
  sbar: { s: 'AHRQ TeamSTEPPS', t: 'Agency for Healthcare Research and Quality. TeamSTEPPS Tool: SBAR.', u: 'https://www.ahrq.gov/teamstepps-program/curriculum/communication/tools/sbar.html' },
  skin: { s: 'Nursing Physical Assessment 6.7', t: 'Nursing Physical Assessment, section 6.7 Skin: Inspection. College of DuPage, Pressbooks.', u: 'https://cod.pressbooks.pub/nursingphysicalassessment/chapter/skin-inspection/' },
  sccm: { s: 'SCCM 2024', t: 'Honarmand K, Wax RS, Penoyer D, et al. Society of Critical Care Medicine guidelines on recognizing and responding to clinical deterioration outside the ICU: 2023. Crit Care Med 2024;52(2):314-330.', u: 'https://sccm.org/Clinical-Resources/Guidelines/Guidelines/Recognizing-Clinical-Deterioration-Outside-ICU' },
  jc: { s: 'Joint Commission', t: 'The Joint Commission. Hospital standard NPG.01.05.02: the hospital recognizes and responds to changes in a patient\'s condition.', u: 'https://digitalassets.jointcommission.org/api/public/content/9ca80055182b4274842a5780a94f2c82' },
  chua: { s: 'Chua et al. 2017', t: 'Chua WL, et al. Factors influencing the activation of the rapid response system for clinically deteriorating patients by frontline ward clinicians: a systematic review. Int J Qual Health Care 2017;29(8):981-998.', u: 'https://doi.org/10.1093/intqhc/mzx149' },
  hecht: { s: 'Hecht et al. 2024', t: 'Hecht JD, Yoder LH, Danesh V, Heitkemper EM. A systematic review of the facilitators and barriers to rapid response team activation. Worldviews Evid Based Nurs 2024.', u: 'https://doi.org/10.1111/wvn.12700' },
  sjoding: { s: 'Sjoding et al. 2020', t: 'Sjoding MW, et al. Racial bias in pulse oximetry measurement. N Engl J Med 2020;383:2477-2478.', u: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7808260/' },
};
export const cite = (k) => `<a class="cite" href="${SRC[k].u}" target="_blank" rel="noopener">${SRC[k].s}</a>`;

export const PATIENTS = [
  { id: 'carter', name: 'James Carter', N: 'Mr. Carter', age: 64, he: 'he', his: 'his', him: 'him', tone: 'brown', toneLabel: 'Brown skin',
    skin: '#7a5034', ill: '#75604f', flush: '#7a5034', lip: '#7a463c', lipIll: '#7f655c', hair: '#8d8d8f', hairStyle: 'short', brow: '#55514f' },
  { id: 'novak', name: 'Linda Novak', N: 'Ms. Novak', age: 61, he: 'she', his: 'her', him: 'her', tone: 'light', toneLabel: 'Light skin',
    skin: '#e3b99c', ill: '#e2d2c6', flush: '#e8a590', lip: '#c47f76', lipIll: '#cbaaa2', hair: '#b9aa94', hairStyle: 'bob', brow: '#8c7b68' },
  { id: 'ortiz', name: 'Rafael Ortiz', N: 'Mr. Ortiz', age: 58, he: 'he', his: 'his', him: 'him', tone: 'medium', toneLabel: 'Medium skin',
    skin: '#c08e62', ill: '#c2aa82', flush: '#c4835e', lip: '#a66658', lipIll: '#b0907f', hair: '#2f2b2a', hairStyle: 'short', brow: '#2a2523' },
  { id: 'okafor', name: 'Grace Okafor', N: 'Mrs. Okafor', age: 67, he: 'she', his: 'her', him: 'her', tone: 'deep', toneLabel: 'Deep brown skin',
    skin: '#4a3024', ill: '#52463f', flush: '#4a3024', lip: '#5a302c', lipIll: '#62504b', hair: '#a9a9ab', hairStyle: 'crop', brow: '#3a3533' },
];

// What the nurse sees on the skin, by tone. Wording follows the skin inspection source.
export const SKIN = {
  light: ['Skin warm, dry and pink.', 'Cheeks flushed. Skin feels hot.', 'Face paler than this morning. Skin clammy, forehead damp.', 'Pale and sweaty. Hands cool.', 'Pale and sweaty. Hands cold.'],
  medium: ['Skin warm and dry. Color as at admission.', 'Face a little flushed. Skin feels hot.', 'Face has a yellowish, washed out look. Skin clammy, forehead damp.', 'Washed out and sweaty. Palms pale. Hands cool.', 'Washed out and sweaty. Palms pale. Hands cold.'],
  brown: ['Skin warm and dry. Color as at admission.', 'No color change you can see. Skin feels hot.', 'Face looks dull and grayish. Inner lips paler than this morning. Skin clammy, forehead damp.', 'Ashen and sweaty. Palms and nail beds pale. Hands cool.', 'Ashen and sweaty. Palms and nail beds pale. Hands cold.'],
  deep: ['Skin warm and dry. Color as at admission.', 'No color change you can see. Skin feels hot.', 'Skin has a gray, ashen cast. Inner lips paler than this morning. Skin clammy, forehead damp.', 'Ashen and sweaty. Palms and nail beds pale. Hands cool.', 'Ashen and sweaty. Palms and nail beds pale. Hands cold.'],
};

// Scripted findings. ill, flush, sweat and eye drive the 3D patient.
export const ROUNDS = [
  { time: '08:00', hour: 1, title: 'First round',
    v: { hr: 86, sbp: 126, dbp: 74, rr: 16, temp: 37.1, spo2: 97, avpu: 'A', urine4h: 220, o2: false, mental: false, concern: false },
    look: { ill: 0, flush: 0, sweat: 0, eye: 1 }, says: 'Morning. Did the game go to extra innings?',
    mind: 'Alert. Knows the date and where {he} is. Chatting.',
    cues: [
      { t: 'Pain 4 of 10 at the incision', flag: false, why: 'Day 2 after open abdominal surgery. Pain is at the level reported overnight.' },
      { t: 'Ate half of breakfast', flag: false, why: 'No change from yesterday.' },
      { t: 'Respiratory rate 16', flag: false, why: 'Unchanged overnight. MEWS gives it 1 point. The 0 band is 9 to 14.' },
      { t: 'Urine 220 mL over 4 hours', flag: false, why: 'About 55 mL an hour.' },
    ],
    note: (c) => `MEWS gives 1 point to any respiratory rate from 15 to 20. A score of 1 is the starting point for this patient today. ${c('subbe')}` },
  { time: '10:00', hour: 3, title: 'Second round',
    v: { hr: 102, sbp: 118, dbp: 70, rr: 19, temp: 38.0, spo2: 96, avpu: 'A', urine4h: 160, o2: false, mental: false, concern: true },
    look: { ill: 0.22, flush: 1, sweat: 0, eye: 0.9 }, says: "I just don't feel right.",
    mind: 'Alert. Knows the date and where {he} is. Quiet. Did not want to walk.',
    cues: [
      { t: 'Says "I just don\'t feel right"', flag: true, why: 'A change from this morning. In a review of 18 studies, nurse worry was present with or without a change in vital signs.', src: 'douw' },
      { t: 'Heart rate 102, was 86', flag: true, why: 'Up 16 beats in two hours. CDC lists a high heart rate among the signs of sepsis.', src: 'cdc' },
      { t: 'Temperature 100.4°F (38.0°C), was 98.8°F', flag: true, why: 'CDC lists fever among the signs of sepsis. MEWS gives this temperature 0 points.', src: 'cdc' },
      { t: 'Incision dressing dry and intact', flag: false, why: 'No change.' },
    ],
    note: (c) => `MEWS is 2, in the routine band. MEWS has no row for what the patient says. A staff member's significant concern is one of the typical calling criteria AHRQ lists. ${c('ahrq')} In a review of 18 studies, nurse worry was present with or without a change in vital signs. ${c('douw')}` },
  { time: '12:00', hour: 5, title: 'Third round',
    v: { hr: 108, sbp: 108, dbp: 64, rr: 21, temp: 38.4, spo2: 94, avpu: 'A', urine4h: 110, o2: false, mental: true, concern: true },
    look: { ill: 0.55, flush: 0.3, sweat: 0.6, eye: 0.75 }, says: 'What day is it? ... What day did you say?',
    mind: 'Eyes open, answers you. Asks twice what day it is. Slow to answer.',
    cues: [
      { t: 'Asks twice what day it is', flag: true, why: 'New since 10:00. An acute change in mental status is one of the typical calling criteria AHRQ lists. On AVPU the patient is still Alert, so MEWS gives 0 points.', src: 'ahrq' },
      { t: 'Skin clammy, forehead damp', flag: true, why: 'CDC lists clammy or sweaty skin among the signs of sepsis.', src: 'cdc' },
      { t: 'SpO2 94% on room air, was 97%', flag: true, why: 'Down 3 points in four hours. Oxygen saturation is not in MEWS.', src: 'subbe' },
      { t: 'IV site clean, no redness', flag: false, why: 'No change.' },
    ],
    note: (c) => `MEWS is 3. A temperature of 101.1°F (38.4°C) scores 0. The 2 point band starts at 101.3°F (38.5°C). Oxygen saturation and urine output are not in MEWS. ${c('subbe')}` },
  { time: '13:00', hour: 6, title: 'Fourth round',
    v: { hr: 114, sbp: 102, dbp: 58, rr: 23, temp: 38.6, spo2: 91, avpu: 'A', urine4h: 70, o2: false, mental: true, concern: true },
    look: { ill: 0.8, flush: 0, sweat: 1, eye: 0.6 }, says: 'Where is this? I need to get home.',
    mind: 'Eyes open, answers you. Does not know where {he} is. Pulls at the IV line.',
    cues: [
      { t: 'Does not know where {he} is', flag: true, why: 'An acute change in mental status. The patient is still Alert on AVPU, so MEWS gives 0 points.', src: 'ahrq' },
      { t: 'SpO2 91% on room air', flag: true, why: 'Down 6 points since 08:00. Oxygen saturation is not in MEWS.', src: 'subbe' },
      { t: 'Urine 70 mL over 4 hours', flag: true, why: 'Down from 220 mL. Under 50 mL over 4 hours is one of the typical calling criteria AHRQ lists.', src: 'ahrq' },
      { t: 'Blood pressure 102/58, was 126/74', flag: true, why: 'Systolic is down 24 points since 08:00. MEWS gives 102 a score of 0. The 1 point band is 81 to 100.', src: 'subbe' },
    ],
    note: (c) => `MEWS is 6. Subbe and colleagues set 5 or more as the critical score. In their study of 709 admissions, scores of 5 or more went with higher odds of death (odds ratio 5.4) and ICU admission (odds ratio 10.9). ${c('subbe')}` },
  { time: '14:00', hour: 7, title: 'Fifth round',
    v: { hr: 126, sbp: 88, dbp: 50, rr: 27, temp: 39.0, spo2: 89, avpu: 'V', urine4h: 45, o2: false, mental: true, concern: true },
    look: { ill: 1, flush: 0, sweat: 1, eye: 0.25 }, says: '...',
    mind: 'Eyes closed. Opens them when you say {his} name, then drifts off.',
    cues: [
      { t: 'Opens eyes only to your voice', flag: true, why: 'V on the AVPU scale. MEWS gives 1 point.', src: 'subbe' },
      { t: 'Systolic pressure 88', flag: true, why: 'Under 90 is one of the typical calling criteria AHRQ lists.', src: 'ahrq' },
      { t: 'Urine 45 mL over 4 hours', flag: true, why: 'Under 50 mL over 4 hours is one of the typical calling criteria AHRQ lists.', src: 'ahrq' },
      { t: 'SpO2 89% on room air', flag: true, why: 'Down 8 points since 08:00. Oxygen saturation is not in MEWS.', src: 'subbe' },
    ],
    note: (c) => `MEWS is 8. The score crossed the unit threshold of 5 an hour ago. ${c('subbe')}` },
];

export const ACTIONS = [
  { k: 'routine', t: 'Keep routine checks. Next full set at the usual time.' },
  { k: 'charge', t: 'Tell the charge nurse now. Recheck within the hour.' },
  { k: 'rrt', t: 'Call the rapid response team to the bedside now.' },
];
export const ACTION_NAME = { routine: 'kept routine checks', charge: 'told the charge nurse', rrt: 'called rapid response' };

export const PARAMS = [
  { k: 'hr', label: 'Heart rate', unit: 'bpm' },
  { k: 'sbp', label: 'Systolic BP', unit: 'mmHg' },
  { k: 'rr', label: 'Respiratory rate', unit: 'per min' },
  { k: 'temp', label: 'Temperature', unit: '' },
  { k: 'avpu', label: 'Alertness (AVPU)', unit: '' },
];
export const CHART = {
  hr: '40 or less: 2 · 41 to 50: 1 · 51 to 100: 0 · 101 to 110: 1 · 111 to 129: 2 · 130 or more: 3',
  sbp: '70 or less: 3 · 71 to 80: 2 · 81 to 100: 1 · 101 to 199: 0 · 200 or more: 2',
  rr: 'Under 9: 2 · 9 to 14: 0 · 15 to 20: 1 · 21 to 29: 2 · 30 or more: 3',
  temp: 'Under 95.0°F (35°C): 2 · 95.0 to 101.1°F (35 to 38.4°C): 0 · 101.3°F (38.5°C) or more: 2',
  avpu: 'Alert: 0 · responds to Voice: 1 · responds to Pain: 2 · Unresponsive: 3',
};
export const CRIT_NAME = { hr: 'heart rate over 140 or under 40', rr: 'respiratory rate over 28 or under 8', sbp: 'systolic pressure over 180 or under 90', spo2: 'oxygen saturation under 90% despite supplementation', mental: 'acute change in mental status', urine: 'urine output under 50 mL over 4 hours' };

// SBAR sorting task. The correct part is the key; main.js shuffles the order.
export const SBAR = (p, r, total) => [
  { k: 'S', t: `This is the nurse in 412. ${p.N} has a MEWS of ${total} and is ${r.v.mental ? 'newly confused' : 'not feeling right'}.` },
  { k: 'B', t: `${cap(p.he)} is ${p.age}, two days out from an open colon resection. ${cap(p.he)} was stable overnight.` },
  { k: 'A', t: `I am worried about sepsis. ${cap(p.his)} heart rate and temperature are up since this morning.` },
  { k: 'R', t: 'I need the team at the bedside now. I would like a lactate and blood cultures.' },
];
export const SBAR_NAME = { S: 'Situation', B: 'Background', A: 'Assessment', R: 'Recommendation' };
export const SBAR_DEF = { S: 'what is happening with the patient now', B: 'the clinical background', A: 'what the caller thinks the problem is', R: 'what the caller recommends or requests' };
export const cap = (s) => s[0].toUpperCase() + s.slice(1);
export const fill = (s, p) => s.replace(/\{he\}/g, p.he).replace(/\{his\}/g, p.his).replace(/\{him\}/g, p.him).replace(/\{N\}/g, p.N);

// ---------- thinking made visible ----------
export const OI = [
  { k: 'O', t: 'Heart rate is 102.' },
  { k: 'I', t: 'The patient is anxious about going home.' },
  { k: 'O', t: 'The patient asked twice what day it is.' },
  { k: 'I', t: 'The patient is becoming septic.' },
];
export const OI_NAME = { O: 'Observation', I: 'Inference' };
export const PLANS = [
  { k: 'score', t: 'Follow the MEWS total and the unit policy.', short: 'the MEWS total' },
  { k: 'trend', t: 'Compare each set with this patient\'s earlier ones.', short: 'change over time' },
  { k: 'patient', t: 'Go by how the patient looks and what they say.', short: 'the patient at the bedside' },
  { k: 'all', t: 'Weigh the score, the trend and the patient together.', short: 'score, trend and patient together' },
];
export const WHYS = [
  { k: 'score', t: 'The MEWS total', short: 'MEWS total' },
  { k: 'trend', t: 'A change since the last round', short: 'a change' },
  { k: 'patient', t: 'What the patient says or how they look', short: 'the patient' },
  { k: 'criterion', t: 'One finding that is a calling criterion', short: 'one criterion' },
  { k: 'none', t: 'Nothing has changed', short: 'no change' },
];
export const CONF = ['', 'Not sure', 'Fairly sure', 'Sure'];
export const ACTION_SHORT = { routine: 'Routine checks', charge: 'Told charge nurse', rrt: 'Called rapid response' };
export const FAQ = (c) => [
  ['Can a nurse call rapid response without a physician order?', `Yes, where the hospital has a rapid response system. AHRQ's primer says any staff member may call the team if a calling criterion is met. ${c('ahrq')} A 2008 Joint Commission patient safety goal required hospitals to let staff directly request help from a specially trained individual when a patient appears to be worsening. ${c('ahrq')} The current Joint Commission hospital standard requires written criteria for early warning signs and the action to take. It notes that hospitals are not required to create a rapid response team to meet it. ${c('jc')} A 2024 Society of Critical Care Medicine guideline recommends hospital wide rapid response systems with explicit activation criteria (strong recommendation, moderate certainty). ${c('sccm')} Each hospital writes its own policy.`],
  ['Do I have to call the physician first?', `Policies differ. AHRQ's primer says any staff member may call the team when a criterion is met. ${c('ahrq')} In one survey of 293 nurses at a Canadian teaching hospital, 75.9% said they would call the attending physician before activating the team. ${c('chua')}`],
  ['What if I call and the patient turns out to be fine?', `Fear of criticism is a documented barrier. In the same Canadian survey, 15.4% of nurses reported reluctance to call for that reason, and 48% said they would call for a patient they were worried about who had normal vital signs. ${c('chua')} A 2024 review of US studies reports that support from hospital leaders and physicians helped nurses call and became a barrier when absent. ${c('hecht')} A staff member's significant concern is one of the typical calling criteria AHRQ lists. ${c('ahrq')}`],
  ['Who comes when I call?', `It varies by hospital. In AHRQ's table of models, the rapid response team lists a critical care nurse and a respiratory therapist, and the medical emergency team lists physicians and nurses. ${c('ahrq')} The 2024 SCCM guideline makes no recommendation on who should lead the team. ${c('sccm')}`],
  ['Can the patient or the family call?', `In some hospitals. The 2024 SCCM guideline says patients, families and care partners can recognize subtle changes and should be empowered to alert staff, including the rapid response system. ${c('sccm')}`],
  ['Why did a temperature of 101.1°F score 0?', `MEWS gives 0 points from 95.0 to 101.1°F (35 to 38.4°C). The 2 point band starts at 101.3°F (38.5°C). ${c('subbe')} CDC lists fever among the signs of sepsis. ${c('cdc')}`],
  ['Why did new confusion score 0?', `AVPU has four levels: Alert, responds to Voice, responds to Pain, Unresponsive. A patient who is awake and confused is Alert, so MEWS gives 0. ${c('subbe')} An acute change in mental status is a separate calling criterion on AHRQ's list. ${c('ahrq')}`],
  ['Is MEWS a sepsis test?', `No. It is a general early warning score. The Surviving Sepsis Campaign names MEWS among the tools used for sepsis screening. It says neither SIRS nor qSOFA is an ideal screening tool and the bedside clinician needs to understand the limits of each. ${c('ssc')}`],
  ['What happens after I call?', `The team assesses the patient at the bedside. For suspected sepsis, the Surviving Sepsis Campaign says treatment should begin immediately and suggests measuring blood lactate. ${c('ssc')} What the team does next is outside this demo.`],
  ['Is my hospital\'s score the same as this one?', `Maybe not. Hospitals use different versions of MEWS and different trigger scores. This version has no oxygen saturation or urine output row. The threshold of 5 comes from one UK hospital in 2000. ${c('subbe')}`],
  ['Do rapid response teams save lives?', `The evidence is mixed. AHRQ's primer says rapid response systems slightly reduce unexpected cardiac arrests on wards and do not change overall hospital mortality. ${c('ahrq')} The 2024 SCCM guideline still recommends them, with moderate certainty. ${c('sccm')}`],
  ['Can I trust the pulse oximeter?', `Not equally for every patient. In two cohorts, when the pulse oximeter read 92 to 96%, arterial saturation was under 88% in 11.7% and 17.0% of measurements in Black patients and 3.6% and 6.2% in White patients. ${c('sjoding')}`],
];
// published layout: one row per vital, columns score 3 2 1 0 1 2 3
export const GRID = [
  ['Systolic BP (mmHg)', '70 or less', '71 to 80', '81 to 100', '101 to 199', '', '200 or more', ''],
  ['Heart rate (bpm)', '', '40 or less', '41 to 50', '51 to 100', '101 to 110', '111 to 129', '130 or more'],
  ['Respiratory rate (per min)', '', 'Under 9', '', '9 to 14', '15 to 20', '21 to 29', '30 or more'],
  ['Temperature', '', 'Under 95.0°F (35°C)', '', '95.0 to 101.1°F (35 to 38.4°C)', '', '101.3°F (38.5°C) or more', ''],
  ['Alertness (AVPU)', '', '', '', 'Alert', 'Responds to Voice', 'Responds to Pain', 'Unresponsive'],
];
