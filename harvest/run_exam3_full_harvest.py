"""Batch recapture Exam 3 homework — full problem text via print harvest.

Requires: Macro App running, Pearson Assignment Manager visible (CDP 9224).

Uses scripts/pearson_print_harvest.py --full-text (same recipe as MCP).
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HARVEST = Path(__file__).resolve().parent
MACRO = Path(__file__).resolve().parents[2] / "Macro App"

SECTIONS = [
    "3.8 Implicit Differentiation",
    "3.11 Related Rates",
    "4.1 Maxima and Minima",
    "4.2 Mean Value Theorem",
    "4.3 What Derivatives Tell Us",
    "4.4 Graphing Functions",
    "4.5 Optimization Problems",
    "4.6 Linear Approximation and Differentials",
    "4.7 L'Hopital's Rule",
    "4.8 Newton's Method",
]


def main() -> int:
    sections_json = HARVEST / "exam3-sections.json"
    if not sections_json.exists():
        subprocess.check_call([sys.executable, str(HARVEST / "build_exam3_sections.py")])

    out_json = ROOT / "exam3-homework-harvest.json"
    out_js = ROOT / "exam3-homework-map-data.js"
    script = MACRO / "scripts" / "pearson_print_harvest.py"

    cmd = [
        sys.executable,
        str(script),
        "--full-text",
        "--sections-json",
        str(sections_json),
        "--ids-json",
        str(ROOT / "exam3-harvest-ids.json"),
        "--json",
        str(out_json),
        "--emit-js",
        str(out_js),
        *SECTIONS,
    ]
    print("Running:", " ".join(f'"{c}"' if " " in c else c for c in cmd[:8]), "...")
    return subprocess.call(cmd)


if __name__ == "__main__":
    raise SystemExit(main())
