"""Write final-exam-review-map-data.js from per-exam harvest JSONs."""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "final-exam-review-map-data.js"
EXAM4_SKILLS = ROOT / "exam4-skill-groups.json"

SOURCES = [
    ("exam1", "Exam 1", ROOT / "exam1-exam-harvest.json"),
    ("exam2", "Exam 2", ROOT / "exam2-exam-harvest.json"),
    ("exam3", "Exam 3", ROOT / "exam3-exam-harvest.json"),
    ("exam4", "Exam 4", ROOT / "exam4-exam-harvest.json"),
]


def problem_entry(p: dict) -> dict:
    return {
        "summary": p.get("summary") or "",
        "fullText": p.get("fullText") or "",
        "objective": p.get("objective") or "",
        "parts": p.get("parts") or [],
        "poolOrder": p.get("poolOrder") or "",
        "difficulty": p.get("difficulty") or "",
        "estimatedTime": p.get("estimatedTime") or "",
        "latex": bool(p.get("latex")),
    }


def skills_from_objectives(problems: list[dict]) -> list[dict]:
    buckets: dict[str, list[str]] = defaultdict(list)
    for p in problems:
        label = (p.get("objective") or "").strip() or "Uncategorized"
        buckets[label].append(p["questionId"])
    return [
        {"id": f"obj-{i}", "label": label, "hint": "", "ids": ids}
        for i, (label, ids) in enumerate(sorted(buckets.items()), start=1)
    ]


def skills_from_exam4(exam_ids: set[str]) -> list[dict]:
    if not EXAM4_SKILLS.exists():
        return []
    raw = json.loads(EXAM4_SKILLS.read_text(encoding="utf-8"))
    groups: list[dict] = []
    used: set[str] = set()
    for block in raw.get("blocks") or []:
        for g in block.get("groups") or []:
            ids = [qid for qid in g.get("ids") or [] if qid in exam_ids]
            if not ids:
                continue
            used.update(ids)
            title = block.get("title") or block.get("id") or ""
            label = g.get("label") or g.get("id") or "Skill"
            if title:
                label = f"{label} — {title}"
            groups.append(
                {
                    "id": f"{block.get('id', 'b')}-{g.get('id', 'g')}",
                    "label": label,
                    "hint": g.get("hint") or "",
                    "ids": ids,
                }
            )
    orphan = sorted(exam_ids - used)
    if orphan:
        groups.append(
            {
                "id": "other",
                "label": "Other / not in skill map",
                "hint": "",
                "ids": orphan,
            }
        )
    return groups


def main() -> None:
    exams = []
    problems: dict[str, dict] = {}
    skills: dict[str, list[dict]] = {}

    for exam_id, label, path in SOURCES:
        if not path.exists():
            exams.append(
                {
                    "id": exam_id,
                    "label": label,
                    "pools": [],
                    "ready": False,
                    "count": 0,
                    "poolCount": 0,
                }
            )
            skills[exam_id] = []
            continue
        harvest = json.loads(path.read_text(encoding="utf-8"))[0]
        pools: dict[str, list[str]] = {}
        exam_problems = harvest.get("problems") or []
        for p in exam_problems:
            qid = p["questionId"]
            problems[qid] = problem_entry(p)
            pool = str(p.get("poolOrder") or "?")
            pools.setdefault(pool, []).append(qid)
        pool_list = [
            {"pool": int(n) if str(n).isdigit() else n, "ids": pools[n]}
            for n in sorted(pools, key=lambda x: int(x) if str(x).isdigit() else 999)
        ]
        exams.append(
            {
                "id": exam_id,
                "label": label,
                "ready": True,
                "count": len(exam_problems),
                "poolCount": len(pool_list),
                "pools": pool_list,
            }
        )
        if exam_id == "exam4":
            skills[exam_id] = skills_from_exam4({p["questionId"] for p in exam_problems})
        else:
            skills[exam_id] = skills_from_objectives(exam_problems)

    OUT.write_text(
        "const FINAL_EXAMS = "
        + json.dumps(exams, indent=2, ensure_ascii=False)
        + ";\n\nconst FINAL_PROBLEMS = "
        + json.dumps(problems, indent=2, ensure_ascii=False)
        + ";\n\nconst FINAL_SKILLS = "
        + json.dumps(skills, indent=2, ensure_ascii=False)
        + ";\n",
        encoding="utf-8",
    )
    ready = [e for e in exams if e.get("ready")]
    print(f"Wrote {OUT.name}: {len(ready)} exam(s), {len(problems)} problems")


if __name__ == "__main__":
    main()
