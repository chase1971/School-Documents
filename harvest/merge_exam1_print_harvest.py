"""Merge Exam 1 print extract with Question Details pool rows."""
from __future__ import annotations

import json
import sys
from pathlib import Path

HARVEST = Path(__file__).resolve().parent
ROOT = HARVEST.parent
EXTRACT_PATH = HARVEST / "_exam1-print-extract.json"
IDS_PATH = HARVEST / "_exam1-ids.json"
OUT_PATH = ROOT / "exam1-exam-print-harvest.json"
OUT_A11Y = ROOT / "exam1-exam-print-harvest.a11y.json"

sys.path.insert(0, str(HARVEST))
from pearson_a11y_math import clean_problem_fields  # noqa: E402


def main() -> None:
    extract = json.loads(EXTRACT_PATH.read_text(encoding="utf-8"))
    ids_doc = json.loads(IDS_PATH.read_text(encoding="utf-8"))
    rows = ids_doc[0]["rows"]
    by_order: dict[str, list[dict]] = {}
    for row in rows:
        by_order.setdefault(str(row["order"]), []).append(row)

    printed = extract["problems"]
    orders = sorted(by_order.keys(), key=lambda x: int(x))
    if len(printed) != len(orders):
        raise SystemExit(
            f"Count mismatch: print={len(printed)} pools={len(orders)}"
        )

    problems = []
    for raw, order in zip(printed, orders):
        pool_rows = by_order[order]
        first = pool_rows[0]
        item = {
            "poolOrder": int(order),
            "questionId": first["questionId"],
            "poolIds": [r["questionId"] for r in pool_rows],
            "objective": first.get("objective", ""),
            "summary": raw.get("summary", ""),
            "fullText": raw.get("fullText", ""),
            "parts": raw.get("parts"),
            "note": (
                "Print harvest: one drawn alternate per pool. "
                "poolIds lists every ID in the pool; questionId is the first."
            ),
        }
        problems.append(item)

    sections = [
        {
            "requested": "Exam 1",
            "captureMethod": "AM Print → TDX .singleQuestion (one draw per pool)",
            "problems": problems,
        }
    ]
    OUT_A11Y.write_text(json.dumps(sections, indent=2) + "\n", encoding="utf-8")
    cleaned = [
        {
            **sections[0],
            "problems": [clean_problem_fields(p) for p in problems],
        }
    ]
    OUT_PATH.write_text(json.dumps(cleaned, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_PATH.name} ({len(problems)} pools, {sum(len(p['poolIds']) for p in problems)} IDs in pools)")


if __name__ == "__main__":
    main()
