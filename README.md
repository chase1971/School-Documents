# School documents

Miscellaneous teaching documents that are not part of any app repo — HTML comparisons, review maps, one-off infographics, and similar files.

**Path:** `C:\Users\chase\Documents\Programs\School Scrips\School documents\`

**GitHub:** [chase1971/School-Documents](https://github.com/chase1971/School-Documents)

## Pull at work (or any second machine)

This folder is its **own git repo**. To continue exactly where you left off:

```powershell
cd "C:\Users\chase\Documents\Programs\School Scrips\School documents"
git pull --ff-only
```

If the folder does not exist yet:

```powershell
cd "C:\Users\chase\Documents\Programs\School Scrips"
git clone https://github.com/chase1971/School-Documents.git "School documents"
cd "School documents"
npm install
```

**Viewing** the factoring handout needs only the pulled HTML/PDF files. **Rebuilding** pages after editing the generators requires `npm install` once (KaTeX is listed in this repo's `package.json`). Then:

```powershell
npm run build:factoring
```

Serve locally from Programs root: `node scripts/serve-programs-docs.js` →
[page 1](http://127.0.0.1:8765/factoring-trinomials-page1.html) ·
[page 2](http://127.0.0.1:8765/factoring-trinomials-page2.html)

Tell Cursor: *"pull School documents"* or *"we're in School documents — continue the factoring handout."*

## Exam maps index

| File | Role |
|---|---|
| `index.html` | Hub — pick Exam 2, 3, or 4 map |

**Local link:** [http://127.0.0.1:8765/](http://127.0.0.1:8765/) (School documents is the first serve root, so `/` opens this index when the docs server is running)

Requires `node scripts/serve-programs-docs.js` from Programs if links fail.

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

## Exam 4 map (skeleton)

| File | Role |
|---|---|
| `exam4-homework-map.html` | Empty shell — same four tabs as Exam 3, no harvest data yet |

**Local link:** [http://127.0.0.1:8765/exam4-homework-map.html](http://127.0.0.1:8765/exam4-homework-map.html)

When Exam 4 homework exists in Pearson, copy the Exam 3 file set and harvest scripts per `docs/school-exam-map-html.md`.

## Factoring handout (guess-and-check double bubble)

Two-page printable walkthrough of `12x² − 22x − 20 = 0` in Chase's guess-and-check
method — GCF first, then the double bubble, inner/outer testing, signs, and solving.

| File | Role |
|---|---|
| `scripts/factoring-shared.js` | KaTeX render + font embedding, masthead, box/parenthesis styles |
| `scripts/build-factoring-page1.js` | Page 1 — setup through Option A / Option B |
| `scripts/build-factoring-page2.js` | Page 2 — testing, signs, zero product solve |
| `factoring-trinomials-page1.html` · `-page2.html` | Generated; do not hand-edit |

**Rebuild:** `node "School Scrips/School documents/scripts/build-factoring-page1.js"`
(same for page 2), then headless Edge `--print-to-pdf` for the PDFs.

**Local links:** [page 1](http://127.0.0.1:8765/factoring-trinomials-page1.html) ·
[page 2](http://127.0.0.1:8765/factoring-trinomials-page2.html)

Math is pre-rendered with KaTeX at build time (`npm install` in this folder, then
`npm run build:factoring`). Fonts are base64-inlined, so the generated pages make
**no external requests** — required by `agent docs/rules/html-delivery.md`. The
build scripts also fall back to `School Scrips/canvas-kit/node_modules/katex` if
present on the same machine. Spacing complaints ("move the parentheses closer", "less padding in the boxes") are CSS values in the generators,
not a reason to regenerate an image. Earlier `factoring-*.png` files in this folder are
the superseded image-generated drafts.

## What does *not* go here

- App source code (those live in their own repos under `School Scrips\`)
- Programs instruction-layer HTML (`agent docs\`, served on port 8765)
- Macro App infographics (`School Scrips\Macro App\docs\infographics\`)

When creating new school HTML, tell the AI to save it in this folder.

Construction recipe for exam maps: `docs/school-exam-map-html.md` (moved here from the
shared `agent docs/recipes/` folder 2026-08-08 — this is its only consumer).
