"""Merge one MCP print-harvest section result into exam3-homework-harvest.json."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HARVEST_PATH = ROOT / "exam3-homework-harvest.json"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("result_json", help="Path to MCP result JSON file, or '-' for stdin")
    args = parser.parse_args()

    if args.result_json == "-":
        entry = json.loads(__import__("sys").stdin.read())
    else:
        entry = json.loads(Path(args.result_json).read_text(encoding="utf-8"))

    if entry.get("error"):
        print(f"ERROR: {entry.get('assignment')}: {entry['error']}", flush=True)
        return 1

    name = entry["assignment"]
    stored = {"requested": name, "problems": entry["problems"]}

    results: list = []
    if HARVEST_PATH.exists():
        results = json.loads(HARVEST_PATH.read_text(encoding="utf-8"))

    idx = next((i for i, e in enumerate(results) if e.get("requested") == name), None)
    if idx is not None:
        results[idx] = stored
    else:
        results.append(stored)

    HARVEST_PATH.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
    print(f"Merged {name}: {len(stored['problems'])} problems → {HARVEST_PATH.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
