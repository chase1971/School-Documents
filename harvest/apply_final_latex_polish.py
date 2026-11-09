"""Apply LaTeX-polished stems into exam1–3 harvest JSONs and regenerate final map data."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RESULTS = Path(__file__).resolve().parent / "final-latex-polish-results.json"
SOURCES = [
    ROOT / "exam1-exam-harvest.json",
    ROOT / "exam2-exam-harvest.json",
    ROOT / "exam3-exam-harvest.json",
]

sys.path.insert(0, str(Path(__file__).resolve().parent))
from write_final_exam_review_data import main as write_final  # noqa: E402


def main() -> None:
    results = json.loads(RESULTS.read_text(encoding="utf-8"))
    missing_all = []
    for path in SOURCES:
        data = json.loads(path.read_text(encoding="utf-8"))
        entry = data[0]
        missing = []
        for p in entry["problems"]:
            qid = p["questionId"]
            row = results.get(qid)
            if not row:
                missing.append(qid)
                continue
            stem = row["stem"]
            summary = row.get("summary") or stem.split("\n", 1)[0]
            p["summary"] = summary
            p["prompt"] = summary
            p["fullText"] = stem
            p["parts"] = [{"label": "Problem", "text": stem}]
            p["expr"] = ""
            p["latex"] = True
        if missing:
            missing_all.extend(missing)
        else:
            path.write_text(
                json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
            )
            print(f"Updated {path.name}: {len(entry['problems'])} LaTeX stems")
    if missing_all:
        raise SystemExit(f"Missing polish for: {', '.join(missing_all)}")
    write_final()


if __name__ == "__main__":
    main()
