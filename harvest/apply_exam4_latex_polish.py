"""Apply LaTeX-polished stems into exam4-review-harvest.json and regenerate map data."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HARVEST = ROOT / "exam4-review-harvest.json"
RESULTS = Path(__file__).resolve().parent / "exam4-latex-polish-results.json"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from write_exam4_map_data import main as write_map  # noqa: E402


def main() -> None:
    results = json.loads(RESULTS.read_text(encoding="utf-8"))
    data = json.loads(HARVEST.read_text(encoding="utf-8"))
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
        raise SystemExit(f"Missing polish for: {', '.join(missing)}")
    HARVEST.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Updated {HARVEST.name}: {len(entry['problems'])} LaTeX stems")
    write_map()


if __name__ == "__main__":
    main()
