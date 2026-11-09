"""Fix Exam 3 editor raw poolOrder from My Selections text dump."""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

HARVEST = Path(__file__).resolve().parent
RAW = HARVEST / "exam3-editor-preview-raw.json"
CHUNK = HARVEST / "_exam3-myselections.txt"

PAT = re.compile(r"(?m)^(\d+)\n([^\n]+)\n\n([^\n]+)\n")


def main() -> None:
    text = CHUNK.read_text(encoding="utf-8").replace("\r\n", "\n")
    rows = []
    for m in PAT.finditer(text):
        qid = m.group(2).strip()
        if qid in ("Question ID", "#") or qid.startswith("Points"):
            continue
        if not (
            re.match(r"^\d", qid)
            or qid.startswith("+")
            or "Setup" in qid
            or "Copy" in qid
        ):
            continue
        rows.append(
            {
                "poolOrder": m.group(1),
                "questionId": qid,
                "objective": m.group(3).strip(),
                "estimatedTime": "",
            }
        )
    print(f"parsed {len(rows)} rows from My Selections")
    pools: dict[str, list[str]] = defaultdict(list)
    for r in rows:
        pools[r["poolOrder"]].append(r["questionId"])
    print(f"pools {len(pools)}")
    for k in sorted(pools, key=int):
        print(k, ", ".join(pools[k]))

    raw = json.loads(RAW.read_text(encoding="utf-8"))
    if len(raw["results"]) != len(rows):
        raise SystemExit(
            f"Count mismatch: results={len(raw['results'])} rows={len(rows)}"
        )
    raw["poolList"] = rows
    for res, meta in zip(raw["results"], rows):
        res["poolOrder"] = meta["poolOrder"]
        res["listObjective"] = meta["objective"]
        if res.get("questionId") != meta["questionId"]:
            print(
                "MISMATCH preview=%s list=%s idx=%s"
                % (res.get("questionId"), meta["questionId"], res.get("previewIndex"))
            )
    RAW.write_text(json.dumps(raw, indent=2) + "\n", encoding="utf-8")
    print(f"Updated {RAW.name}")


if __name__ == "__main__":
    main()
