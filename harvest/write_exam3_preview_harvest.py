"""Build exam3-exam-harvest.json from preview-player raw harvest and patch map PROBLEMS."""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

from pearson_a11y_math import clean_pearson_text, clean_summary, clean_problem_fields

ROOT = Path(__file__).resolve().parent.parent
RAW = Path(__file__).resolve().parent / "exam3-preview-raw.json"
OLD_HARVEST = ROOT / "exam3-exam-harvest.json"
OUT_HARVEST = ROOT / "exam3-exam-harvest.json"
MAP_DATA = ROOT / "exam3-homework-map-data.js"

EXPR_PATTERNS = [
    re.compile(r"^f\(x\)\s*=.*", re.I),
    re.compile(r"^f\(u\)\s*=.*", re.I),
    re.compile(r"^f\(t\)\s*=.*", re.I),
    re.compile(r"^∫.*", re.I),
    re.compile(r"^lim\s+.*", re.I),
    re.compile(r"^F\(u\)\s*=.*", re.I),
    re.compile(r"^dy\s*=.*", re.I),
]

SKIP_PART = re.compile(
    r"^(Select the correct|Type an exact|Use a comma|Simplify your|Round to|Do not round|"
    r"enter your response|\(Use a|\(Type an|\(Simplify|\(Round|\(Do not)",
    re.I,
)


def load_objectives(old_meta: dict[str, dict]) -> dict[str, str]:
    return {qid: p.get("objective", "") for qid, p in old_meta.items() if p.get("objective")}


def load_old_meta() -> dict[str, dict]:
    if not OLD_HARVEST.exists():
        return {}
    data = json.loads(OLD_HARVEST.read_text(encoding="utf-8"))
    entry = data[0] if isinstance(data, list) else data
    return {p["questionId"]: p for p in entry.get("problems", [])}


def strip_ui_noise(text: str) -> str:
    lines = []
    for line in text.split("\n"):
        t = line.strip()
        if not t:
            continue
        if t.lower() in ("equals", "=", "enter your response here", "nothing"):
            continue
        if re.fullmatch(r"[\u03c0π]", t):
            continue
        lines.append(t)
    return "\n".join(lines)


def extract_expr(cleaned: str) -> str:
    for line in cleaned.split("\n"):
        t = line.strip()
        for pat in EXPR_PATTERNS:
            if pat.match(t):
                return t
        if "=" in t and len(t) < 120 and any(
            k in t.lower() for k in ("f(x)", "f(u)", "f(t)", "∫", "lim", "dy", "f′")
        ):
            return t
    return ""


def split_parts(raw_stem: str) -> list[dict]:
    chunks = re.split(r"(?=Part \d+ of \d+)", raw_stem)
    if len(chunks) == 1:
        chunks = re.split(r"(?=Part \d+\n)", raw_stem)
    parts: list[dict] = []
    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk:
            continue
        m = re.match(r"^(Part \d+(?: of \d+)?)\n(.*)", chunk, re.S)
        if m:
            label = m.group(1)
            body = m.group(2).strip()
        else:
            label = "Part 1"
            body = chunk
        sub = re.split(r"\n(?=[A-D]\.\n)", body)
        if len(sub) == 1:
            text = polish_text(clean_pearson_text(strip_ui_noise(body)))
            if text and not SKIP_PART.match(text.split("\n")[0]):
                parts.append({"label": label, "text": text})
            continue
        head = polish_text(clean_pearson_text(strip_ui_noise(sub[0])))
        if head:
            parts.append({"label": label, "text": head})
        for choice in sub[1:]:
            cm = re.match(r"^([A-D]\.)\n(.*)", choice, re.S)
            if not cm:
                continue
            choice_text = polish_text(clean_pearson_text(strip_ui_noise(cm.group(2))))
            if choice_text:
                parts.append({"label": cm.group(1), "text": choice_text})
    return parts


def polish_text(text: str) -> str:
    text = text.replace("f prime", "f′").replace("f double prime", "f′′")
    text = re.sub(r"\(nothing\)", "", text)
    text = re.sub(r"lim x -> 0\s*\nlim\s*\nx→0\s*\n", "lim x→0 ", text)
    text = re.sub(r"\nlim\s*\nx→0\s*\n", "\nlim x→0 ", text)
    lines: list[str] = []
    for line in text.split("\n"):
        t = line.strip()
        if not t:
            continue
        if lines and t == lines[-1]:
            continue
        lines.append(t)
    # drop exact duplicate 3-line integral echo blocks
    out: list[str] = []
    i = 0
    while i < len(lines):
        if (
            i + 2 < len(lines)
            and lines[i].startswith("∫")
            and lines[i + 1] == lines[i + 2]
            and lines[i + 1] in lines[i]
        ):
            out.append(lines[i])
            i += 3
            while i < len(lines) and lines[i] in ("dx", "∫") or re.match(r"^[\d+x⁴⁸²\s]+$", lines[i]):
                if lines[i] not in out and lines[i] != "dx":
                    pass
                i += 1
            continue
        out.append(lines[i])
        i += 1
    return "\n".join(out).strip()


def collapse_stem_duplicates(text: str) -> str:
    m = re.search(
        r"(Determine the following indefinite integral\.)\s*\n(∫[^\n]+)",
        text,
    )
    if m:
        return f"{m.group(1)}\n{m.group(2)}"
    m = re.search(
        r"(Evaluate the following limit\. Use l'Hôpital's Rule when it is convenient and applicable\.)\s*\n(lim x→0 [^\n]+)",
        text,
    )
    if m:
        return f"{m.group(1)}\n{m.group(2)}"
    return text


def build_problem(row: dict, old: dict, objective: str) -> dict:
    stem = row["stem"]
    full_text = collapse_stem_duplicates(polish_text(clean_pearson_text(strip_ui_noise(stem))))
    summary = clean_summary(stem)
    expr = extract_expr(full_text)
    parts = split_parts(stem)
    if not parts:
        parts = [{"label": "Part 1", "text": full_text}]

    out = {
        "printOrder": row["previewOrder"],
        "questionId": row["questionId"],
        "summary": summary,
        "fullText": full_text,
        "parts": parts,
        "prompt": summary,
        "expr": expr,
        "objective": objective or old.get("objective", ""),
        "poolOrder": str(row["previewOrder"]),
    }
    for key in ("difficulty", "estimatedTime"):
        if old.get(key):
            out[key] = old[key]
    out = clean_problem_fields(out)
    out["fullText"] = collapse_stem_duplicates(out["fullText"])
    if out.get("parts"):
        for part in out["parts"]:
            if part.get("text"):
                part["text"] = collapse_stem_duplicates(part["text"])
    return out


def patch_map_problems(updates: dict[str, dict]) -> None:
    text = MAP_DATA.read_text(encoding="utf-8")
    m = re.search(r"const PROBLEMS = (\{[\s\S]*?\});\s*\n\s*const REVIEW_PROBLEMS", text)
    if not m:
        raise SystemExit("Could not locate PROBLEMS in exam3-homework-map-data.js")
    problems = json.loads(m.group(1))
    for qid, prob in updates.items():
        entry = {
            "summary": prob["summary"],
            "fullText": prob["fullText"],
        }
        if prob.get("parts"):
            entry["parts"] = prob["parts"]
        if prob.get("expr"):
            entry["expr"] = prob["expr"]
        if prob.get("prompt"):
            entry["prompt"] = prob["prompt"]
        problems[qid] = entry
    new_block = "const PROBLEMS = " + json.dumps(problems, indent=2, ensure_ascii=False) + ";\n\nconst REVIEW_PROBLEMS"
    text = text[: m.start()] + new_block + text[m.end() :]
    MAP_DATA.write_text(text, encoding="utf-8")


def main() -> None:
    raw = json.loads(RAW.read_text(encoding="utf-8"))
    old_meta = load_old_meta()
    old_entry = json.loads(OLD_HARVEST.read_text(encoding="utf-8"))[0]
    objectives = load_objectives(old_meta)

    problems = []
    for row in raw:
        qid = row["questionId"]
        problems.append(
            build_problem(row, old_meta.get(qid, {}), objectives.get(qid, ""))
        )

    captured_ids = [p["questionId"] for p in problems]
    all_pool_ids = old_entry.get("questionIds", [])

    harvest = {
        "requested": "Exam 3",
        "captureMethod": "Pearson preview player (assignmentplayer.aspx) + Ask the publisher ID",
        "capturedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "questionIds": all_pool_ids,
        "capturedQuestionIds": captured_ids,
        "missingQuestionIds": [q for q in all_pool_ids if q not in captured_ids],
        "unexpectedQuestionIds": [],
        "coverage": {"captured": len(captured_ids), "expected": len(all_pool_ids)},
        "problems": problems,
    }

    OUT_HARVEST.write_text(json.dumps([harvest], indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    patch_map_problems({p["questionId"]: p for p in problems})

    print(f"Wrote {OUT_HARVEST.name}: {len(problems)} preview problems")
    print(f"Patched {len(problems)} IDs in {MAP_DATA.name}")


if __name__ == "__main__":
    main()
