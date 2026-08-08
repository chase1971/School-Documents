> **You might say:** "build the homework/review/exam HTML map", "school HTML exam map",
> "homework tab builds the review", "review tab builds the exam"
> **What it is:** A local static HTML tool for turning Pearson homework problems into a
> review, then turning the review into an exam with pools.

**Exemplar files**

- `School Scrips/School documents/exam3-homework-map.html`
- `School Scrips/School documents/exam3-homework-map-app.js`
- `School Scrips/School documents/exam3-map-state.js`
- `School Scrips/School documents/exam3-homework-map-data.js`
- `School Scrips/School documents/exam3-exam-data.js`
- `School Scrips/School documents/exam3-exam-harvest.json`
- `School Scrips/School documents/exam2-review-map-app.js`
- `School Scrips/School documents/exam2-review-map-exam.js`

## Mental Model

This is a static teaching tool served from the Programs docs server. It should open at:

`http://127.0.0.1:8765/<page-name>.html`

The page is not a landing page. The first viewport is the working interface.

Build it as four linked work surfaces:

1. Homework builds the review.
2. Review builds the exam.
3. Exam summarizes the final pools.
4. Exam changes shows what you added or removed since the Pearson harvest baseline.

The important thing is direction. Do not make Chase bounce between Pearson assignments in
order to remember problem choices. Each tab should show the source list and the current
target state beside it (except **Exam changes**, which is a diff-only audit view).

## File Split

Keep generated data, saved user decisions, and rendering code separate.

| File kind | Owns |
|---|---|
| `*-map.html` | Shell, CSS, tab panels, script includes |
| `*-map-data.js` | Generated homework/review IDs and problem text |
| `*-exam-data.js` | Current exam pools/objectives from Pearson Question Details |
| `*-exam-harvest.json` | Written exam problem text captured from Pearson |
| `*-map-state.js` | localStorage keys, saved JSON shape, derived lists |
| `*-map-app.js` | Rendering, buttons, expansion behavior |
| `*-map-state.json` | Portable saved user choices committed to Git |

Do not hand-edit large generated data files. If a data file is over the local line cap,
regenerate or split data instead of adding logic to it.

## Tab Contract

### Homework Tab

Purpose: review all homework problems and decide what enters the review.

Left side:

- Sections are expandable.
- Each question row expands inline to show the written problem.
- Each homework row has `Add to Review` unless it is already native to the review.
- Each homework row has `Remove HW` to hide it from the homework source list.

Right side:

- Shows the current review state for the selected section.
- Includes native review problems, planned additions, and review-only problems.
- Removing here removes from the review, not from homework.

State names should stay explicit:

- `added` means homework IDs planned for review.
- `removed` means review IDs removed from review.
- `homeworkRemoved` means homework IDs hidden from the homework source list.

### Review Tab

Purpose: turn the review into the exam.

Left side:

- Shows effective review sections.
- Each row expands inline to show the review/homework problem text.
- `Add to Exam` adds the review question as a new one-question pool.
- `Add to Pool` selects the review question for pooling.

Right side:

- Shows current Exam pools.
- If a review question is selected, each pool header offers `Add here`.
- If a selected problem is already in a multi-question pool, offer `Split out`.
- Pool insertion order is numeric/section order, not append-to-bottom.

### Exam Tab

Purpose: final ordered exam summary for copying into Pearson.

- Show every pool in order.
- Show every possible question in a pool.
- Make rows expandable when written problem text is available.
- **Problem text:** load from `*-exam-harvest.json` only — do not fall back to `PROBLEMS`
  (print harvest has MC junk and stale stems).
- Do not put edit-only controls here unless Chase asks; this tab is for review/copying.

### Exam changes Tab

Purpose: audit trail vs the initial Pearson editor harvest.

- **Baseline:** `EXAM3_POOLS` in `*-exam-data.js` (same IDs as the editor harvest).
- **Current:** `examGroups` in saved state (`*-review-map-state.json` / localStorage).
- Three sections: **removed** (strikethrough), **added** (highlighted; badge **review** if from
  review), **unchanged from harvest**.
- Updates when Chase uses **Add to Exam** / **Remove from Exam** on the Review tab.

## Exam problem text pipeline

Homework/review text: print harvest → `pearson_a11y_math.py` → `*-homework-map-data.js`.

**Pooled exam text:** editor harvest only — full recipe:
`School Scrips/Macro App/docs/Automations/PEARSON_EXAM_POOL_HARVEST.md`

1. MCP harvest → `harvest/exam3-editor-preview-raw.json`
2. Phase E: `write_exam3_editor_harvest.py` (+ `stem_polish.py`)
3. Phase F (optional): `ai_polish_exam_stems.py --prepare` → agent → `--apply`
4. Output: `exam3-exam-harvest.json` + `EXAM3_POOLS` header in `exam3-exam-data.js`

Do **not** use AM ⋮ Preview for pooled exams (~14 live draws vs all pool alternates).

## State Rules

Use one state module. Do not create a second localStorage system in the app renderer.

State should be:

```json
{
  "added": [],
  "removed": [],
  "homeworkRemoved": [],
  "examGroups": [["4.1.23", "4.1.27"]]
}
```

The browser may have local edits and the repo may have a committed JSON file. On load:

- If there is no browser state, use the repo file.
- If browser state exists, merge additive/removal sets.
- For `examGroups`, preserve browser groups when they exist because pool edits are ordered.

When Chase clicks `Download state for GitHub`, write the same shape back to the JSON file
and commit it.

## Problem Text

Prefer structured problem data over screenshots.

Good sources, in order:

1. Rendered Pearson problem DOM with MathML/MathJax/equation nodes.
2. Pearson print text cleaned through `harvest/pearson_a11y_math.py`.
3. Screenshots only as a targeted fallback for problems where source text is broken.

Keep raw accessibility print text in a `.a11y.json` backup before cleaning. The cleaned JSON is
what the HTML loads.

## Implementation Order

1. Confirm the page belongs in `School Scrips/School documents/`.
2. Read the current map files and `harvest/HARVEST.md`.
3. Build or update generated data first.
4. Update `*-map-state.js` for any new saved decisions.
5. Update `*-map-app.js` to render those decisions.
6. Keep `*-map.html` focused on layout and CSS.
7. Verify with `node --check`, JSON parsing, and a headless browser render.
8. Give Chase only the docs-server link, never a file path.

## Gotchas

- Pearson Print can destroy formulas. Do not trust spoken math text without cleaning or visual
  verification.
- The app renderer tends to grow quickly. Check line counts before edits; extract before adding
  more behavior to a near-threshold file.
- Do not nest buttons inside clickable question rows. Use a row container and stop propagation on
  action buttons.
- Do not remove from homework and review with the same button. Those are different decisions.
- Multi-question exam groups are pools; each pool assigns one question.
