"""Build exam1-exam-harvest.json from editor PlayerAddAndRemove Next-loop harvest."""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

HARVEST = Path(__file__).resolve().parent
ROOT = HARVEST.parent
RAW = HARVEST / "exam1-editor-preview-raw.json"
OUT_HARVEST = ROOT / "exam1-exam-harvest.json"
EXAM_DATA = ROOT / "exam1-exam-data.js"

sys.path.insert(0, str(HARVEST))
from write_exam3_editor_harvest import (  # noqa: E402
    build_problem,
    pool_by_id_from_raw,
)


def build_exam1_pools_js(pool_by_id: dict[str, str], objectives: dict[str, str]) -> str:
    pools: dict[str, list[str]] = {}
    for qid, pool in pool_by_id.items():
        pools.setdefault(pool, []).append(qid)
    lines = [
        "// Exam 1 live pools - from My Selections # column (Pearson editor copy harvest).",
        "// Source: editor PlayerAddAndRemove harvest; one random draw per pool at test time.",
        "",
        "const EXAM1_POOLS = [",
    ]
    for pool_num in sorted(pools, key=int):
        qs = json.dumps(pools[pool_num])
        lines.append(f"  {{ pool: {pool_num}, questions: {qs} }},")
    lines.append("];")
    lines.append("")
    lines.append("const EXAM1_OBJECTIVES = {")
    for qid, obj in objectives.items():
        lines.append(f"  {json.dumps(qid)}: {json.dumps(obj)},")
    lines.append("};")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    raw = json.loads(RAW.read_text(encoding="utf-8"))
    pool_by_id = pool_by_id_from_raw(raw)
    all_ids = list(pool_by_id.keys())
    results = raw["results"]
    problems = [build_problem(r, pool_by_id) for r in results]
    captured_ids = [p["questionId"] for p in problems]
    objectives = {
        r["questionId"]: (r.get("listObjective") or r.get("objective") or "")
        for r in results
        if r.get("questionId")
    }

    harvest = {
        "requested": "Exam 1",
        "captureMethod": (
            "Pearson editor copy (Exam 1 (Copy)): Add/Remove Content → "
            "question link → PlayerAddAndRemove Next loop (Work as student)"
        ),
        "capturedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "questionIds": all_ids,
        "capturedQuestionIds": captured_ids,
        "missingQuestionIds": [q for q in all_ids if q not in captured_ids],
        "unexpectedQuestionIds": [q for q in captured_ids if q not in all_ids],
        "coverage": {"captured": len(captured_ids), "expected": len(all_ids)},
        "problems": problems,
    }

    OUT_HARVEST.write_text(
        json.dumps([harvest], indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    EXAM_DATA.write_text(build_exam1_pools_js(pool_by_id, objectives), encoding="utf-8")
    print(f"Wrote {OUT_HARVEST.name}: {len(problems)} problems")
    print(f"Wrote {EXAM_DATA.name}")
    if harvest["missingQuestionIds"]:
        print("MISSING:", harvest["missingQuestionIds"])


if __name__ == "__main__":
    main()
