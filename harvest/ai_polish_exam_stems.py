"""AI polish pass for exam stems — after code cleanup, agent interprets and rewrites.

Usage:
  python ai_polish_exam_stems.py --prepare
      → writes harvest/exam3-ai-polish-queue.json (agent reads this)

  python ai_polish_exam_stems.py --apply harvest/exam3-ai-polish-results.json
      → merges polished stems into exam3-exam-harvest.json

Agent: read queue, write results JSON shaped as:
  { "4.8.10": { "stem": "...", "notes": "optional" }, ... }
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from pearson_a11y_math import clean_summary

ROOT = Path(__file__).resolve().parent.parent
HARVEST = ROOT / "exam3-exam-harvest.json"
QUEUE = Path(__file__).resolve().parent / "exam3-ai-polish-queue.json"
RESULTS_DEFAULT = Path(__file__).resolve().parent / "exam3-ai-polish-results.json"

PROMPT = """You clean Pearson exam problem stems for a teaching map.

Input: code-polished but still awkward text from Pearson's accessibility dump.

Output: ONE readable stem block — what the problem asks, given function/data, sub-parts a/b/c if present.
Rules:
- Plain text only (Unicode ² ³ ₀ ₁ ′ − OK). No LaTeX.
- Newton iterates: x₀, x₁, x₂ (subscripts), not superscripts.
- One f(x)= line — no duplicated corrupted echo after it.
- Merge broken line breaks mid-sentence ("approximations x₁ and x₂" on one line).
- For "Determine whether" problems: keep statements a–d only; omit MC answer choices A/B/C/D.
- Do NOT include answer boxes, "enter your response", or "Choose the correct answer".
- Keep it short — map preview, not full exam paper.

Return ONLY the cleaned stem text."""


def load_harvest() -> dict:
    data = json.loads(HARVEST.read_text(encoding="utf-8"))
    return data[0] if isinstance(data, list) else data


def save_harvest(entry: dict) -> None:
    HARVEST.write_text(json.dumps([entry], indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def prepare() -> None:
    entry = load_harvest()
    queue = {
        "prompt": PROMPT,
        "capturedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "problems": [],
    }
    for p in entry.get("problems", []):
        qid = p["questionId"]
        text = (p.get("parts") or [{}])[0].get("text") or p.get("fullText") or ""
        queue["problems"].append(
            {
                "questionId": qid,
                "objective": p.get("objective") or "",
                "codePolishedStem": text,
            }
        )
    QUEUE.write_text(json.dumps(queue, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {QUEUE.name}: {len(queue['problems'])} problems for AI polish")


def apply(results_path: Path) -> None:
    results = json.loads(results_path.read_text(encoding="utf-8"))
    entry = load_harvest()
    updated = 0
    for p in entry.get("problems", []):
        qid = p["questionId"]
        row = results.get(qid)
        if not row or not row.get("stem"):
            continue
        stem = row["stem"].strip()
        p["fullText"] = stem
        p["prompt"] = clean_summary(stem)
        p["summary"] = clean_summary(stem)
        p["parts"] = [{"label": "Problem", "text": stem}]
        updated += 1
    save_harvest(entry)
    print(f"Applied AI polish to {updated} problems -> {HARVEST.name}")


def main() -> None:
    parser = argparse.ArgumentParser(description="AI polish pass for exam3-exam-harvest.json")
    parser.add_argument("--prepare", action="store_true", help="Write AI polish queue JSON")
    parser.add_argument("--apply", metavar="RESULTS.json", help="Merge AI results into harvest")
    args = parser.parse_args()
    if args.prepare:
        prepare()
    elif args.apply:
        apply(Path(args.apply))
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
