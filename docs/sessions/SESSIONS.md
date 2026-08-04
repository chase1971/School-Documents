# School documents — session log

Teaching HTML, exam maps, Pearson harvest artifacts under `School Scrips/School documents/`.

## 2026-08-04 — Exam 3 homework/review map + harvest pipeline

**Files changed:** `exam3-homework-map.html` (413), `exam3-homework-map-app.js` (374), `exam3-map-state.js` (264), `exam3-homework-map-data.js`, `exam3-homework-harvest.json`, `exam3-review-harvest.json`, `exam3-review-map-state.json`, `harvest/` (HARVEST.md, batch harvest/clean/map scripts, `pearson_a11y_math.py` (568)), `README.md`; exam2 map files touched for comparison pattern.

**What worked:** Full Exam 3 homework harvest (~145 problems) and Exam 3 Review harvest (16 questions, 4.1–4.8). Pearson print-view a11y math converted to readable notation without re-harvesting. Homework tab: hw left / review right per section, inline expand, color-coded match/hw-only/planned/review-only, Add/Remove with `effectiveReviewSections()`. Review tab unchanged browse + summary. State sync via localStorage + Download/Load/Import JSON. View at `http://127.0.0.1:8765/exam3-homework-map.html`.

**Current state:** Green — map and harvest tooling in place; one homework problem may be thin in map data (144 vs 145, non-blocking).

**File size flag:** `pearson_a11y_math.py` at 568 lines — extract before adding more math rules.

**Next session:** Optional `DOC_TRACKER.md` at Programs root (keyword router Chase asked about); or copy exam 3 pattern for unit 4 via doc tracker + exemplar files.
