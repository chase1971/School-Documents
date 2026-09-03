# School documents — session log

Teaching HTML, exam maps, Pearson harvest artifacts under `School Scrips/School documents/`.

## 2026-09-03 — Self-contained KaTeX for work-machine pull

**Files changed:** `package.json` (new), `package-lock.json` (new), `.gitignore`, `scripts/factoring-shared.js`, `README.md` (+ pull-at-work section).

**What worked:** Factoring handout was already on GitHub (`74731f8`) but rebuild depended on sibling `canvas-kit/node_modules/katex`. Added local `katex` dependency and `npm run build:factoring` so a fresh clone + `npm install` + pull is enough to continue at work without canvas-kit.

**Current state:** Green — `npm run build:factoring` verified after local `npm install`.

**File size flag:** None

**Next session:** Merge pages into one printable PDF if Chase wants a class set.

## 2026-09-02 — Factoring handout rebuilt as KaTeX HTML (two pages)

**Files changed:** `scripts/factoring-shared.js` (new, 152), `scripts/build-factoring-page1.js` (new, 228), `scripts/build-factoring-page2.js` (new, 205), `factoring-trinomials-page1.html` / `-page2.html` + matching PDFs (generated), `README.md` (+26). Superseded image drafts left in place: `factoring-page1-setup.png`, `factoring-page2-testing.png`, `factoring-journey-map.png`, `factoring-poster.png`, `factoring-worked-example.png`, `factoring-handout.pdf`.

**What worked:** Started the session still iterating the handout through image generation and burned several rounds on spacing notes — box padding, parenthesis gaps, gray text that would not photocopy. Chase spotted that the design had stopped changing shape and asked for it in code instead. Rebuilt both pages as self-contained HTML with KaTeX pre-rendered at build time and its woff2 fonts base64-inlined, so the pages make no external requests per `agent docs/rules/html-delivery.md` — KaTeX was already vendored in `canvas-kit/node_modules`, so no new dependency. Section 2's connector arrows and the factor-tree branches are drawn by measuring the rendered DOM and generating SVG paths, which makes the crossover exact rather than eyeballed; colour was dropped for print, so the two connector families are distinguished by solid vs dashed strokes. Page 2 covers inner/outer testing of both arrangements, the vertical `−15x + 4x = −11x` sign decision, and the zero-product solve to `x = −2/3` and `x = 5/2` — the step the app never did. Page 1's generator hit 317 lines, so the masthead, KaTeX helpers, and box/parenthesis styling were extracted to `factoring-shared.js` before page 2 was added.

**Also this session:** Chase floated an interactive page where a student types a quadratic and watches it work. Checked `School Scrips/factoring-app` first per the grep-before-adding-a-mechanism rule — it already does this as a deployed Netlify site (coefficient inputs, GCF warning, unfactorable warning, factor-pair buttons, double bubble, product arrows, sum verification). He dropped the idea. Two gaps noted if it comes back: it never works a problem for the student, and `QuadraticEquation.tsx` restricts each coefficient input to a **single digit**, so `12x² − 22x − 20` cannot be entered.

**Current state:** Green — both pages verified by headless screenshot at 816×1056 and printed to PDF; all four URLs return 200 on the docs server.

**File size flag:** None in this repo. Pre-existing in `factoring-app` (not touched): `QuadraticEquation.tsx` 1233 lines, over the 800 cap; `App.tsx` 367 lines against the ~100-line orchestrator rule.

**Next session:** Merge the two pages into one printable PDF if Chase wants a class set. Page 2's arc labels sit on white chips that mask the apex of each arc — check whether he likes that. Sections II+ (difference of squares, GCF-only, etc.) would slot in as more `build-factoring-page*.js` files against the same shared module.

## 2026-08-25 — Exam maps index + Exam 4 skeleton

**Files changed:** `index.html` (new), `exam4-homework-map.html` (new), `README.md`

**What worked:** Added dwell-friendly hub at docs-server root linking Exam 2, Exam 3, and Exam 4 maps. Exam 4 skeleton mirrors Exam 3 tab layout (Homework, Exam 4 Review, Exam 4, Exam changes) with empty placeholders until harvest. Verified 200 on index and exam4 pages with docs server running.

**Current state:** Green — [http://127.0.0.1:8765/](http://127.0.0.1:8765/) opens index when `serve-programs-docs.js` is running.

**File size flag:** None

**Next session:** When Exam 4 assignments exist in Pearson, copy Exam 3 harvest pipeline per `docs/school-exam-map-html.md`.

## 2026-08-06 — Exam 3 editor harvest, stem polish, Exam changes tab

**Files changed:** `harvest/write_exam3_editor_harvest.py` (new), `harvest/stem_polish.py` (new), `harvest/ai_polish_exam_stems.py` (new), `harvest/exam3-editor-preview-raw.json`, `harvest/exam3-ai-polish-queue.json`, `harvest/exam3-ai-polish-results.json`, `harvest/pearson_a11y_math.py`, `harvest/HARVEST.md`; `exam3-exam-harvest.json`, `exam3-exam-data.js`, `exam3-homework-map.html`, `exam3-homework-map-app.js` (781), `exam3-map-state.js` (498). Macro App: `docs/Automations/PEARSON_EXAM_POOL_HARVEST.md` (new), `PEARSON_BROWSER_AUTOMATION.md`, `README.md`, `AGENTS.md`. Programs: `agent docs/recipes/school-exam-map-html.md`.

**What worked:** Harvested all 27 Exam 3 pool alternates via editor `PlayerAddAndRemove` Next loop; post-process writes clean stems to `exam3-exam-harvest.json` (Phase E: `pearson_a11y_math` + `stem_polish`; Phase F: AI polish queue/apply). Exam tab uses harvest JSON only (no stale `PROBLEMS` fallback). Added **Exam changes** fourth tab — diffs current `examGroups` vs `EXAM3_POOLS` harvest baseline (added / removed / unchanged). Documented full pipeline Phases A–F and map tabs in harvest recipe, `HARVEST.md`, and `school-exam-map-html.md`.

**Current state:** Green for harvest JSON and map UI — not live-GUI verified this wrap. View: `http://127.0.0.1:8765/exam3-homework-map.html` (hard refresh after pull).

**File size flag:** `exam3-homework-map-app.js` is 781 lines — extract before adding more behavior; `exam3-map-state.js` 498.

**Next session:** Hard-refresh map; confirm Exam changes tab after any Add/Remove from Exam on Review tab; extract `renderExamChanges` / exam pool UI from app.js if more tabs land.

## 2026-08-06 - Exam 3 map workflow, problem capture, and school HTML recipe

**Files changed:** `exam3-homework-map.html`, `exam3-homework-map-app.js` (near cap at 698), `exam3-map-state.js` (424), `exam3-review-map-state.json`, `exam3-exam-data.js` (new), `exam3-exam-harvest.json` (new cleaned exam print text), `exam3-exam-harvest.a11y.json` (new raw backup), `harvest/pearson_a11y_math.py` (640), `harvest/clean_exam3_math.py`, `README.md`; `../../agent docs/recipes/school-exam-map-html.md` (new, 161) and `../../agent docs/recipes/INDEX.md`.

**What worked:** Expanded the Exam 3 HTML map into the intended three-tab workflow: Homework builds Review, Review builds Exam pools, and Exam summarizes all pools. Captured Exam 3 question details and printed problem text, made exam rows expandable, cleaned Pearson accessibility math enough to remove screen-reader artifacts, fixed mojibake separators, and added Homework-tab `Remove HW` state so homework can be pruned while still adding selected problems to review. Documented the construction pattern as a reusable recipe keyed to Chase's wording.

**Current state:** Green - `http://127.0.0.1:8765/exam3-homework-map.html` has the three tabs, Add to Review / Remove HW on homework rows, review-to-exam pool controls, and expandable exam rows.

**File size flag:** `exam3-homework-map-app.js` is 698 lines, right below the extract threshold; `pearson_a11y_math.py` is 640 lines and should be extracted before adding more math rules; generated data/harvest JSON files are large and should not be hand-edited.

**Next session:** Investigate a rendered Pearson problem capture path that preserves equation markup better than the print accessibility page; screenshots should be a targeted fallback, not the primary source.

## 2026-08-06 - Exam 3 review expansion and homework section cleanup

**Files changed:** `exam3-homework-map.html` (413), `exam3-homework-map-app.js` (388), `exam3-map-state.js` (350)

**What worked:** Exam 3 Review now stays fully expanded instead of using collapsible section bodies. Browser state now merges with `exam3-review-map-state.json` so stale localStorage does not hide saved review additions like 3.8 and 3.11. Homework/review grouping now normalizes harvested IDs into the right sections, including the optimization problems that were captured with raw `4.6.*-BE` / `4.8.13` keys but belong under 4.5 for display and review planning.

**Current state:** Green - `http://127.0.0.1:8765/exam3-homework-map.html` should show all Exam 3 Review sections expanded and 4.5 Optimization containing the corrected optimization batch.

**File size flag:** `exam3-homework-map-data.js` is 5708 lines and generated/harvested; do not edit it directly. Keep future cleanup in smaller normalization/state files or split the data first.

**Next session:** Refresh the page and spot-check 4.5, 4.6, and 4.8 against MyLab; if the raw MyLab IDs are confirmed, consider adding a small visible note or export field that distinguishes raw harvested ID from displayed section ID.

## 2026-08-04 — Exam 2 pool ordering, Exam 2 pools tab, state sync

**Files changed:** `exam2-review-map-exam.js`, `exam2-review-map-app.js`, `exam2-review-map.html`, `exam2-review-map-state.json`, `exam3-review-map-state.json`

**What worked:** Vs Exam 2 tab now inserts split-out pool questions in numeric/section order (not at the bottom). New **Exam 2 pools** tab shows pool numbers and question IDs only, in order. Downloaded browser state synced to GitHub for both exam 2 (with `examGroups`) and exam 3 review map.

**Current state:** Green — map at `http://127.0.0.1:8765/exam2-review-map.html` (docs server must be running).

**File size flag:** None

**Next session:** Manual check pool split ordering on Vs Exam 2; pull state on school laptop via Load from GitHub file.

## 2026-08-04 — Exam 3 homework/review map + harvest pipeline

**Files changed:** `exam3-homework-map.html` (413), `exam3-homework-map-app.js` (374), `exam3-map-state.js` (264), `exam3-homework-map-data.js`, `exam3-homework-harvest.json`, `exam3-review-harvest.json`, `exam3-review-map-state.json`, `harvest/` (HARVEST.md, batch harvest/clean/map scripts, `pearson_a11y_math.py` (568)), `README.md`; exam2 map files touched for comparison pattern.

**What worked:** Full Exam 3 homework harvest (~145 problems) and Exam 3 Review harvest (16 questions, 4.1–4.8). Pearson print-view a11y math converted to readable notation without re-harvesting. Homework tab: hw left / review right per section, inline expand, color-coded match/hw-only/planned/review-only, Add/Remove with `effectiveReviewSections()`. Review tab unchanged browse + summary. State sync via localStorage + Download/Load/Import JSON. View at `http://127.0.0.1:8765/exam3-homework-map.html`.

**Current state:** Green — map and harvest tooling in place; one homework problem may be thin in map data (144 vs 145, non-blocking).

**File size flag:** `pearson_a11y_math.py` at 568 lines — extract before adding more math rules.

**Next session:** Optional `DOC_TRACKER.md` at Programs root (keyword router Chase asked about); or copy exam 3 pattern for unit 4 via doc tracker + exemplar files.

## 2026-08-02 — exam2-review-map: full homework harvest + Exam 2 Review

*Relocated 2026-08-07 from `agent docs/sessions/SESSIONS.md` — that log is for the instruction
layer itself, not School documents work; the entry only ended up there because the map's output
HTML was being served from `agent docs/` at the time.*

**Files changed:** `exam2-review-map.html` (~721 lines), `School Scrips/Macro App/docs/PEARSON_BROWSER_AUTOMATION.md`

**What worked:** Pearson print harvest (Macro App MCP, no snapshots) for homework 3.6–3.10 and Exam 2 Review. Trimmed map to homework 3.3–3.10 only; updated REVIEW to edited 18-question list; added six review-only PROBLEMS (3.3.63, 3.5.25, 3.5.59, 3.7.23, 3.9.36, 3.9.75); right-panel hover tooltips; tooltip wrap fix for long equations.

**Current state:** Green — map complete for that review/homework set.

**File size flag:** None

**Next session:** Serve at `http://127.0.0.1:8765/exam2-review-map.html`; optional fix for parameterized IDs showing homework vs review instance text.

## 2026-08-02 — exam2-review-map: 3.4/3.5 problem text + collapsible sections

*Relocated 2026-08-07 from `agent docs/sessions/SESSIONS.md`, same reason as above.*

**Files changed:** `exam2-review-map.html` (~660 lines)

**What worked:** Added 16 + 14 Pearson print-harvested `{ prompt, expr }` entries (3.4, 3.5). Fixed homework accordion — second click on open section collapses it and clears right panel.

**Current state:** Green

**File size flag:** None

**Next session:** Serve via docs server; continue PROBLEMS harvest for 3.6+
