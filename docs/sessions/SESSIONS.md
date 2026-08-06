# School documents — session log

Teaching HTML, exam maps, Pearson harvest artifacts under `School Scrips/School documents/`.

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
