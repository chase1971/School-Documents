"""Batch harvest Exam 3 Review — full problem text via print harvest.

Requires: Macro App running, Pearson Assignment Manager visible (CDP 9224).
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MACRO = Path(__file__).resolve().parents[2] / "Macro App"

ASSIGNMENT = "Exam 3 Review"


def main() -> int:
    out_json = ROOT / "exam3-review-harvest.json"
    script = MACRO / "scripts" / "pearson_print_harvest.py"
    cmd = [
        sys.executable,
        str(script),
        "--with-ids",
        "--full-text",
        "--json",
        str(out_json),
        ASSIGNMENT,
    ]
    print("Running review harvest…")
    return subprocess.call(cmd)


if __name__ == "__main__":
    raise SystemExit(main())
