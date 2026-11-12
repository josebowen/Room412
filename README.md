# Room 412

A 7 minute nursing demo for faculty workshops. A patient two days out from surgery gets sicker over a shift. The player reads the bedside monitor, looks at the patient, scores each set of vitals with MEWS and decides when to call the rapid response team.

Live: https://josebowen.github.io/Room412/

## What the player does
| Skill (NCSBN Clinical Judgment Measurement Model) | Player action | Where |
|---|---|---|
| Recognize cues | Reads the monitor and the bedside notes, flags the findings that changed | Each round, step 1 |
| Analyze cues | Scores heart rate, systolic pressure, respiratory rate, temperature and AVPU with the MEWS table | Each round, step 2 |
| Take action | Keeps routine checks, tells the charge nurse or calls rapid response, then labels an SBAR call | Each round, step 3, and the call |

## What is real
- The MEWS table: Subbe et al., QJM 2001. The page computes every score from the vitals (`src/model.js`).
- Single calling criteria: AHRQ PSNet primer on rapid response systems.
- SBAR definitions: AHRQ TeamSTEPPS. Sepsis signs: CDC. Skin findings by tone: Nursing Physical Assessment (College of DuPage).
- Full list with what was read: `data/sources-verified.md`.

## What is written for the demo
The four patients, the vitals, the bedside notes and the unit policy. All four patients share one script. No nurse educator has reviewed it. It is not clinical guidance.

## Build and test
```
npm install
node build.mjs            # bundles src/ into one index.html
node test/model.mjs       # checks the script against the model, band edges, option lengths, dashes
node test/walk.mjs 1600 900 desk
node test/walk.mjs 390 844 phone
```
Three.js r0.187, bundled with esbuild. The only outside request is Google Fonts. No tracking.

More demos: https://weteachwithai.com/vibe-coding/
