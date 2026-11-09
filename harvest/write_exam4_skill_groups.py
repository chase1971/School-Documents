"""Emit exam4-skill-groups.js from exam4-skill-groups.json."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "exam4-skill-groups.json"
OUT = ROOT / "exam4-skill-groups.js"


def main() -> None:
    data = json.loads(SRC.read_text(encoding="utf-8"))
    included = sum(len(g["ids"]) for b in data["blocks"] for g in b["groups"])
    lines = [
        "// Exam 4 skill groups — edit exam4-skill-groups.json, then run",
        "// python harvest/write_exam4_skill_groups.py",
        "const SKILL_GROUPS = " + json.dumps(data, indent=2) + ";",
    ]
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(
        f"Wrote {OUT.name}: {included} antiderivative problems, "
        f"{len(data['excludedIds'])} excluded"
    )


if __name__ == "__main__":
    main()
