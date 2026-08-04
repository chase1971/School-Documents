"""Apply pearson_a11y_math cleaner to homework + review harvest JSON."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HARVEST = Path(__file__).resolve().parent

HOMEWORK_JSON = ROOT / "exam3-homework-harvest.json"
REVIEW_JSON = ROOT / "exam3-review-harvest.json"
HOMEWORK_BACKUP = ROOT / "exam3-homework-harvest.a11y.json"
REVIEW_BACKUP = ROOT / "exam3-review-harvest.a11y.json"

sys.path.insert(0, str(HARVEST))
from pearson_a11y_math import clean_problem_fields  # noqa: E402
from write_exam3_map_data import main as write_map  # noqa: E402


def _has_problems(sections: list) -> bool:
    return any(entry.get("problems") for entry in sections)


def _clean_file(path: Path, backup: Path) -> bool:
    if not path.exists():
        return False
    sections = json.loads(path.read_text(encoding="utf-8"))
    if not _has_problems(sections):
        print(f"No problems in {path.name} — skip")
        return False
    if not backup.exists():
        backup.write_text(json.dumps(sections, indent=2) + "\n", encoding="utf-8")
        print(f"Backed up raw a11y text to {backup.name}")
    for entry in sections:
        if not entry.get("problems"):
            continue
        entry["problems"] = [clean_problem_fields(p) for p in entry["problems"]]
    path.write_text(json.dumps(sections, indent=2) + "\n", encoding="utf-8")
    print(f"Cleaned math in {path.name}")
    return True


def main() -> None:
    ok = _clean_file(HOMEWORK_JSON, HOMEWORK_BACKUP)
    _clean_file(REVIEW_JSON, REVIEW_BACKUP)
    if not ok:
        raise SystemExit(1)
    write_map()


if __name__ == "__main__":
    main()
