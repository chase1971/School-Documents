"""Build exam2-exam-harvest.json from editor PlayerAddAndRemove Next-loop harvest."""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HARVEST = Path(__file__).resolve().parent
ROOT = HARVEST.parent
RAW = HARVEST / "exam2-editor-preview-raw.json"
OUT_HARVEST = ROOT / "exam2-exam-harvest.json"
EXAM_DATA = ROOT / "exam2-exam-data.js"

sys.path.insert(0, str(HARVEST))
from write_exam3_editor_harvest import (  # noqa: E402
    build_problem,
    pool_by_id_from_raw,
)


def build_exam2_pools_js(
    pool_rows: list[dict], objectives: dict[str, str]
) -> str:
    pools: dict[str, list[str]] = {}
    for row in pool_rows:
        pools.setdefault(str(row["poolOrder"]), []).append(row["questionId"])
    lines = [
        "// Exam 2 live pools - from My Selections # column (Pearson editor copy harvest).",
        "// Source: editor PlayerAddAndRemove harvest; one random draw per pool at test time.",
        "",
        "const EXAM2_POOLS = [",
    ]
    for pool_num in sorted(pools, key=int):
        qs = json.dumps(pools[pool_num])
        lines.append(f"  {{ pool: {pool_num}, questions: {qs} }},")
    lines.append("];")
    lines.append("")
    lines.append("const EXAM2_EXAM_OBJECTIVES = {")
    for qid, obj in objectives.items():
        lines.append(f"  {json.dumps(qid)}: {json.dumps(obj)},")
    lines.append("};")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    raw = json.loads(RAW.read_text(encoding="utf-8"))
    pool_by_id = pool_by_id_from_raw(raw)
    # Duplicate IDs (e.g. 3.7.20 in two pools): keep last pool in dict; pools js uses all.
    all_ids = [r["questionId"] for r in (raw.get("poolList") or [])]
    results = raw["results"]
    problems = []
    for r in results:
        problem = build_problem(r, pool_by_id)
        # Prefer per-row poolOrder so duplicate IDs in two pools stay distinct.
        if r.get("poolOrder"):
            problem["poolOrder"] = str(r["poolOrder"])
        problems.append(problem)
    captured_ids = [p["questionId"] for p in problems]
    objectives = {
        r["questionId"]: (r.get("listObjective") or r.get("objective") or "")
        for r in results
        if r.get("questionId")
    }

    harvest = {
        "requested": "Exam 2",
        "captureMethod": (
            "Pearson editor copy (Exam 2 (Copy)): Add/Remove Content → "
            "question link → PlayerAddAndRemove Next loop (Work as student)"
        ),
        "capturedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "questionIds": all_ids,
        "capturedQuestionIds": captured_ids,
        "missingQuestionIds": [q for q in all_ids if q not in captured_ids],
        "unexpectedQuestionIds": [q for q in captured_ids if q not in set(all_ids)],
        "coverage": {"captured": len(captured_ids), "expected": len(all_ids)},
        "problems": problems,
    }

    OUT_HARVEST.write_text(
        json.dumps([harvest], indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    EXAM_DATA.write_text(
        build_exam2_pools_js(raw.get("poolList") or [], objectives), encoding="utf-8"
    )
    print(f"Wrote {OUT_HARVEST.name}: {len(problems)} problems")
    print(f"Wrote {EXAM_DATA.name}")
    if harvest["missingQuestionIds"]:
        print("MISSING:", harvest["missingQuestionIds"])


if __name__ == "__main__":
    main()
