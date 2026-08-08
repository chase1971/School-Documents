# School documents

Miscellaneous teaching documents that are not part of any app repo — HTML comparisons, review maps, one-off infographics, and similar files.

**Path:** `C:\Users\chase\Documents\Programs\School Scrips\School documents\`

**GitHub:** [chase1971/School-Documents](https://github.com/chase1971/School-Documents)

## What goes here

- Pearson / homework vs review maps (e.g. exam comparison HTML)
- Other school HTML or markdown you want synced between home PC and school laptop

## Exam 3 Homework & Review map

| File | Role |
|---|---|
| `exam3-homework-map.html` | Page (open via docs server) |
| `exam3-homework-map-data.js` | Homework + review harvest data |
| `exam3-map-state.js` | Add/remove review state logic |
| `exam3-homework-map-app.js` | UI (homework vs review side-by-side) |
| `exam3-review-map-state.json` | Added + removed question IDs (commit to sync machines) |

**Local link:** [http://127.0.0.1:8765/exam3-homework-map.html](http://127.0.0.1:8765/exam3-homework-map.html)

**Sync flow:** edit on one PC → **Download state for GitHub** → replace `exam3-review-map-state.json` → commit & push → on the other PC pull → **Load from GitHub file**.

## Exam 2 Review map

| File | Role |
|---|---|
| `exam2-review-map.html` | Page (open via docs server) |
| `exam2-review-map-data.js` | Review / homework / problem text |
| `exam2-review-map-app.js` | UI logic |
| `exam2-review-map-state.json` | Added + removed question IDs (commit this to sync machines) |

**Local link:** [http://127.0.0.1:8765/exam2-review-map.html](http://127.0.0.1:8765/exam2-review-map.html) (requires `node scripts/serve-programs-docs.js` from Programs)

**Sync flow:** edit on one PC → **Download state for GitHub** → replace `exam2-review-map-state.json` in this folder → commit & push → on the other PC pull → **Load from GitHub file** (or first visit auto-loads when the browser has no local state).

## What does *not* go here

- App source code (those live in their own repos under `School Scrips\`)
- Programs instruction-layer HTML (`agent docs\`, served on port 8765)
- Macro App infographics (`School Scrips\Macro App\docs\infographics\`)

When creating new school HTML, tell the AI to save it in this folder.

Construction recipe for exam maps: `docs/school-exam-map-html.md` (moved here from the
shared `agent docs/recipes/` folder 2026-08-08 — this is its only consumer).
