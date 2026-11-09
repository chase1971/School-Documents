"""Merge MCP print extract + question-details IDs into exam4-review-harvest.json."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HARVEST = Path(__file__).resolve().parent
IDS_PATH = HARVEST / "_exam4-review-ids.json"
EXTRACT_PATH = Path(
    r"C:\Users\chase\.cursor\projects\c-Users-chase-Documents-Programs"
    r"\agent-tools\dd828015-079b-49d7-98ee-f00732b29a2a.txt"
)
OUT_PATH = ROOT / "exam4-review-harvest.json"
OUT_A11Y = ROOT / "exam4-review-harvest.a11y.json"

sys.path.insert(0, str(HARVEST))
from pearson_a11y_math import clean_problem_fields  # noqa: E402


def load_extract(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf-8")
    # MCP wraps JSON with trailing prose; decode the first object only.
    start = text.find("{")
    if start < 0:
        raise SystemExit(f"No JSON object in {path}")
    payload, _ = json.JSONDecoder().raw_decode(text[start:])
    problems = payload.get("problems")
    if not isinstance(problems, list):
        raise SystemExit("Extract JSON missing problems array")
    return problems


def main() -> None:
    raw_problems = load_extract(EXTRACT_PATH)
    ids_doc = json.loads(IDS_PATH.read_text(encoding="utf-8"))
    rows = ids_doc[0]["rows"]
    if len(raw_problems) != len(rows):
        raise SystemExit(
            f"Count mismatch: print={len(raw_problems)} ids={len(rows)}"
        )

    problems = []
    for row, raw in zip(rows, raw_problems):
        item = {
            "questionId": row["questionId"],
            "objective": row.get("objective", ""),
            "summary": raw.get("summary", ""),
            "fullText": raw.get("fullText", ""),
            "parts": raw.get("parts"),
            "prompt": raw.get("prompt", ""),
            "expr": raw.get("expr", ""),
        }
        problems.append(item)

    sections = [{"requested": "Exam IV Review", "problems": problems}]
    # Keep raw a11y backup, then clean in place for map use
    OUT_A11Y.write_text(json.dumps(sections, indent=2) + "\n", encoding="utf-8")
    cleaned = [
        {
            "requested": "Exam IV Review",
            "problems": [clean_problem_fields(p) for p in problems],
        }
    ]
    OUT_PATH.write_text(json.dumps(cleaned, indent=2) + "\n", encoding="utf-8")
    ids = [p["questionId"] for p in problems]
    print(f"Wrote {OUT_PATH.name} and {OUT_A11Y.name} ({len(problems)} problems)")
    print("IDs:", ", ".join(ids))


if __name__ == "__main__":
    main()
