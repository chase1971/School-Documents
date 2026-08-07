# Exam 3 Pearson print harvest (full text)

Reusable tooling for **`print-problem-text-harvest`** — Macro App MCP, no snapshots.

Recipe: `School Scrips/Macro App/docs/Automations/PEARSON_BROWSER_AUTOMATION.md`

## Prerequisites

- Macro App running, Pearson **Assignment Manager** grid visible
- MCP **`macro-app`** connected
- Question ID order in `exam3-sections.json` (run `build_exam3_sections.py` if IDs changed)

## Files

| File | Role |
|------|------|
| `exam3-sections.json` | Assignment names + question ID lists (order matters) |
| `run_exam3_full_harvest.py` | **Batch all 10 sections** — `--full-text` via `pearson_print_harvest.py` |
| `run_exam3_review_harvest.py` | **Exam 3 Review** assignment (16 Q) — same print recipe |
| `patch_mcp_runner.py` | Regenerate `mcp-print-harvest-section.js` (set `SECTION_INDEX` arg) |
| `build_exam3_sections.py` | Rebuild `exam3-sections.json` from ID sources |
| `extract-full-text.js` | Documented evaluate snippet (full `.singleQuestion` text + parts) |
| `mcp-print-harvest-section.js` | MCP runner — set `SECTION_INDEX`, call via `browser_run_code_unsafe` `filename` |
| `merge_harvest_result.py` | Append/replace one section in `exam3-homework-harvest.json` |
| `write_exam3_map_data.py` | Emit `exam3-homework-map-data.js` for the HTML map |
| `pearson_a11y_math.py` | Convert print-view a11y math (`StartFraction`, `Superscript`, …) to readable notation |
| `clean_exam3_math.py` | Apply cleaner to harvest JSON and regenerate map data |
| `exam3-homework-harvest.a11y.json` | Auto backup of raw print text (created on first clean) |

## Batch (all Exam 3 sections)

Macro App on Assignment Manager, then:

```powershell
python harvest/run_exam3_full_harvest.py
python harvest/clean_exam3_math.py
```

(`clean_exam3_math.py` runs the a11y→readable pass on **homework + review** and calls `write_exam3_map_data.py`. Use it after harvest **without** re-scanning Pearson.)

**Exam 3 Review only:**

```powershell
python harvest/run_exam3_review_harvest.py
python harvest/clean_exam3_math.py
```

Or map data only (already cleaned JSON):

```powershell
python harvest/write_exam3_map_data.py
```

Uses `Macro App/scripts/pearson_print_harvest.py --full-text` (same print recipe, CDP batch).

## One section (MCP)

1. Edit `SECTION_INDEX` in `mcp-print-harvest-section.js` (0–9).
2. MCP: `browser_tabs` select Pearson tab.
3. MCP: `browser_run_code_unsafe` with `filename` = this folder's `mcp-print-harvest-section.js`.
4. Save MCP JSON result to a temp file; merge:
   ```powershell
   python harvest/merge_harvest_result.py harvest/_last-result.json
   ```
5. After all sections:
   ```powershell
   python harvest/clean_exam3_math.py
   ```

## Data shape (PROBLEMS)

```json
{
  "4.1.23": {
    "summary": "Short line for left list (≤95 chars)",
    "fullText": "Entire problem including a. b. c. parts…",
    "parts": [{ "label": "a.", "text": "…" }],
    "expr": "optional formula line"
  }
}
```

Left list shows **summary** only; right panel shows **fullText** / **parts** on click.

## View

```powershell
node scripts/serve-programs-docs.js
```

http://127.0.0.1:8765/exam3-homework-map.html

**Review / exam edits sync:** `exam3-review-map-state.json` — same flow as Exam 2 (`Download state for GitHub` → commit → pull → `Load from GitHub file`). See `README.md` in this folder.

## Exam tab (pooled test — all pool alternates)

**Not** the print harvest above. For the **Exam 3** tab stems and `EXAM3_POOLS`:

→ `School Scrips/Macro App/docs/Automations/PEARSON_EXAM_POOL_HARVEST.md`

Phases: MCP editor Next-loop → `write_exam3_editor_harvest.py` → optional `ai_polish_exam_stems.py`.

Output: `exam3-exam-harvest.json`, `exam3-exam-data.js`. Map **Exam changes** tab diffs current
`examGroups` vs that harvest baseline.
