"""Dump Exam IV Review stems for LaTeX polish."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "exam4-review-harvest.a11y.json"
OUT = Path(__file__).resolve().parent / "exam4-latex-polish-queue.json"

data = json.loads(SRC.read_text(encoding="utf-8"))
problems = []
for p in data[0]["problems"]:
    problems.append(
        {
            "questionId": p["questionId"],
            "objective": p.get("objective") or "",
            "raw": p.get("fullText") or "",
        }
    )
OUT.write_text(
    json.dumps({"count": len(problems), "problems": problems}, indent=2, ensure_ascii=False)
    + "\n",
    encoding="utf-8",
)
print(f"Wrote {OUT.name}: {len(problems)}")
