"""Build exam3-sections.json from exam3-harvest-ids.json + prior harvest fallbacks."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IDS_PATH = ROOT / "exam3-harvest-ids.json"
HARVEST_PATH = ROOT / "exam3-homework-harvest.json"
OUT_PATH = Path(__file__).resolve().parent / "exam3-sections.json"

# IDs missing from exam3-harvest-ids (failed script run) — from MCP Question details 2026-08-04
FALLBACK_IDS: dict[str, list[str]] = {
    "4.5 Optimization Problems": [
        "4.5.16", "4.5.20", "4.5.21", "4.8.12", "4.8.13",
        "4.6.19-BE", "4.6.21-BE", "4.6.25-BE", "4.6.27-BE", "4.6.37-BE",
        "4.6.38-LS", "4.6.39-BE", "4.6.41-BE",
    ],
    "4.6 Linear Approximation and Differentials": [
        "4.6.7", "4.6.25", "4.6.28", "4.6.30", "4.6.39", "4.6.40", "4.6.41",
        "4.6.55", "4.6.57", "4.6.61", "4.6.63", "4.6.64", "4.6.65", "4.6.67", "4.6.69",
    ],
    "4.7 L'Hopital's Rule": [
        "4.7.17", "4.7.18", "4.7.21", "4.7.22", "4.7.25", "4.7.29", "4.7.33",
        "4.7.35", "4.7.39", "4.7.43", "4.7.23", "4.7.51", "4.7.53",
    ],
    "4.8 Newton's Method": [
        "4.8.10", "4.8.11", "4.8.12", "4.8.13-T", "4.8.15-T",
    ],
}

EXAM3_SECTIONS = [
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


def section_id(name: str) -> str:
    m = re.match(r"^(\d+\.\d+)", name)
    return m.group(1) if m else name.split()[0]


def main() -> None:
    ids_data = json.loads(IDS_PATH.read_text(encoding="utf-8"))
    by_name: dict[str, list[str]] = {}
    for item in ids_data:
        name = item.get("requested") or item.get("header", {}).get("name", "")
        rows = item.get("rows") or []
        if rows:
            by_name[name] = [r["questionId"] for r in rows]

    if HARVEST_PATH.exists():
        for item in json.loads(HARVEST_PATH.read_text(encoding="utf-8")):
            name = item.get("requested", "")
            if name and item.get("problems") and name not in by_name:
                by_name[name] = [p["questionId"] for p in item["problems"]]

    for name, ids in FALLBACK_IDS.items():
        if not by_name.get(name):
            by_name[name] = ids

    sections = []
    for name in EXAM3_SECTIONS:
        qids = by_name.get(name, [])
        if not qids:
            raise SystemExit(f"No question IDs for {name!r} — update FALLBACK_IDS or re-run ID harvest")
        sections.append({"name": name, "sectionId": section_id(name), "questionIds": qids})

    OUT_PATH.write_text(json.dumps(sections, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_PATH.name}: {len(sections)} sections, {sum(len(s['questionIds']) for s in sections)} questions")

    from patch_mcp_runner import write_runner
    write_runner(0)
    print(f"Regenerated mcp-print-harvest-section.js (SECTION_INDEX=0)")


if __name__ == "__main__":
    main()
