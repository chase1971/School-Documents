"""Build exam3-exam-harvest.json from editor PlayerAddAndRemove Next-loop harvest."""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

from pearson_a11y_math import clean_pearson_text, clean_summary, clean_problem_fields
from stem_polish import polish_stem

ROOT = Path(__file__).resolve().parent.parent
RAW = Path(__file__).resolve().parent / "exam3-editor-preview-raw.json"
OUT_HARVEST = ROOT / "exam3-exam-harvest.json"
EXAM_DATA = ROOT / "exam3-exam-data.js"

# Pool # from My Selections (# column) — same order as Pearson editor list.
POOL_BY_ID_FALLBACK = {
    "4.1.23": "1",
    "4.1.27": "1",
    "4.1.49": "2",
    "4.1.57": "2",
    "4.2.21": "3",
    "4.2.25": "3",
    "4.3.39-Setup & Solve": "4",
    "4.3.40": "4",
    "4.3.63": "5",
    "4.3.65": "5",
    "4.3.83": "6",
    "4.3.85": "6",
    "4.4.55": "7",
    "4.6.30": "8",
    "4.6.53": "8",
    "4.6.64": "9",
    "4.6.67": "9",
    "4.7.22-Setup & Solve": "10",
    "4.7.25-Setup & Solve": "10",
    "4.8.9": "11",
    "4.8.10": "11",
    "4.9.25": "12",
    "4.9.35": "12",
    "4.9.45": "13",
    "4.9.47": "13",
    "4.9.74": "14",
    "4.9.91": "14",
}

ALL_IDS = list(POOL_BY_ID_FALLBACK.keys())


def pool_by_id_from_raw(raw: dict) -> dict[str, str]:
    """Prefer poolList scraped from My Selections; fall back to hardcoded Exam 3 map."""
    pool_list = raw.get("poolList") or []
    if pool_list:
        return {row["questionId"]: str(row["poolOrder"]) for row in pool_list}
    return dict(POOL_BY_ID_FALLBACK)

EXPR_PATTERNS = [
    re.compile(r"^f\(x\)\s*=.*", re.I),
    re.compile(r"^f\(u\)\s*=.*", re.I),
    re.compile(r"^f\(t\)\s*=.*", re.I),
    re.compile(r"^∫.*", re.I),
    re.compile(r"^lim\s+.*", re.I),
    re.compile(r"^v\(t\)\s*=.*", re.I),
    re.compile(r"^dy\s*=.*", re.I),
]

NOISE_LINES = re.compile(
    r"^(Question content area|enter your response|input field|Choose the correct|"
    r"Select the correct|Type an exact|Show completed|equals|=|nothing)$",
    re.I,
)


def make_summary(stem: str) -> str:
    cleaned = clean_pearson_text(strip_ui_noise(stem))
    for line in cleaned.split("\n"):
        t = line.strip()
        if re.match(
            r"^(Find|Determine|Evaluate|Locate|Write|Consider|For the|Given|a\.|Determine whether)",
            t,
            re.I,
        ):
            return clean_summary(t)
    return clean_summary(stem)


def strip_ui_noise(text: str) -> str:
    lines = []
    for line in text.split("\n"):
        t = line.strip()
        if not t or NOISE_LINES.search(t):
            continue
        if "Question content area" in t:
            continue
        if t.lower() in ("equals", "=", "enter your response here"):
            continue
        lines.append(t)
    return "\n".join(lines)


def polish_text(text: str) -> str:
    text = text.replace("f prime", "f′").replace("f double prime", "f′′")
    text = re.sub(r"\(nothing\)", "", text)
    text = re.sub(
        r"100[•·]\s*\n\s*approximation[^\n]*\n\s*exact\s*\n?",
        "",
        text,
        flags=re.I,
    )
    text = re.sub(r"(\d+\.\d+)\s*\n\s*\1", r"\1", text)
    text = re.sub(r";\s*f\(\s*\n(\d+\.\d+)\s*\n\1\s*\)", r"; f(\1)", text)
    text = re.sub(r"f\(\s*0\s*,\s*04\s*\)", "f(0.04)", text)
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
    return polish_stem("\n".join(lines))


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


def extract_expr(cleaned: str) -> str:
    for line in cleaned.split("\n"):
        t = line.strip()
        for pat in EXPR_PATTERNS:
            if pat.match(t):
                return t
        if "=" in t and len(t) < 140 and any(
            k in t.lower() for k in ("f(x)", "f(u)", "f(t)", "∫", "lim", "dy", "v(t)", "f′")
        ):
            return t
    return ""


def filter_display_parts(parts: list[dict]) -> list[dict]:
    """Drop Pearson answer-field fragments; keep problem statement parts."""
    kept: list[dict] = []
    for p in parts:
        t = (p.get("text") or "").strip()
        label = (p.get("label") or "").strip()
        if not t:
            continue
        if re.match(r"^[a-d]\.\s*L\(x\)\s*$", t):
            continue
        if re.search(r"enter your response|input field|Type an integer|Round to \w+ decimal", t, re.I):
            continue
        if label in ("Part 1", "Part 2", "Part 3", "Part 4") and len(t) < 60:
            if re.match(r"^[a-d]\.", t) and "?" not in t and "=" not in t:
                continue
        if kept and label == kept[-1].get("label") and len(t) < len(kept[-1].get("text", "")):
            continue
        kept.append(p)
    if len(kept) > 1 and all(x in kept[0].get("text", "") for x in ("a.", "b.", "c.")):
        return [kept[0]]
    return kept or parts


def extract_conceptual_statements(stem: str) -> str:
    """Keep a–d statement text for true/false conceptual problems; drop MC answers."""
    if "Determine whether the following statements" not in stem:
        return stem
    m = re.search(r"(Determine whether the following statements[^\n]*\.)", stem, re.I)
    if not m:
        return stem
    head = m.group(1)
    lines = [head]
    body = stem[m.end() :]
    stop = re.search(
        r"\n(?:Question content area|\nPart 1\n(?:a\. Is statement|Choose the correct answer))",
        body,
        re.I,
    )
    intro = body[: stop.start()] if stop else body
    for sm in re.finditer(r"([a-d]\.\s.+?)(?=\s*[b-d]\.\s|\Z)", intro, re.S):
        stmt = re.sub(r"\s+", " ", sm.group(1).strip())
        if stmt and stmt not in lines:
            lines.append(stmt)
    if len(lines) == 1:
        for pm in re.finditer(
            r"Part \d+\n([a-d]\.\s.+?)(?=\.?\s*Choose the correct answer|\nPart \d+\n|\Z)",
            stem,
            re.S | re.I,
        ):
            stmt = re.sub(r"\s+", " ", pm.group(1).strip())
            if re.match(r"[a-d]\.\s*Is statement", stmt, re.I):
                continue
            if stmt and stmt not in lines:
                lines.append(stmt)
    return "\n".join(lines) if len(lines) > 1 else stem


def trim_answer_templates(stem: str) -> str:
    for marker in (
        r"\nChoose the correct answer",
        r"\nWrite the formula for[^\n]*Choose the correct answer",
    ):
        m = re.search(marker, stem, re.I)
        if m:
            stem = stem[: m.start()]
            break
    first = stem.find("Part 1")
    if first >= 0:
        second = stem.find("Part 1", first + 5)
        if second > 0:
            after = stem[second : second + 160]
            if re.search(
                r"Part 1\n(?:a\.\s*L\(x\)|Select the correct|What.?is\(are\) the critical)",
                after,
                re.I,
            ):
                stem = stem[:second]
    m = re.search(r"\nL\(x\)Using the linear", stem)
    if m:
        stem = stem[: m.start()]
    stem = extract_conceptual_statements(stem)
    return stem.strip()


def split_parts(stem: str) -> list[dict]:
    stem = trim_answer_templates(stem)
    chunks = re.split(r"(?=Part \d+(?: of \d+)?\n)", stem)
    parts: list[dict] = []
    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk:
            continue
        m = re.match(r"^(Part \d+(?: of \d+)?)\n(.*)", chunk, re.S)
        if m:
            label, body = m.group(1), m.group(2).strip()
        else:
            label, body = "Part 1", chunk
        sub = re.split(r"\n(?=[A-D]\.\n)", body)
        if len(sub) == 1:
            text = collapse_stem_duplicates(polish_text(clean_pearson_text(strip_ui_noise(body))))
            if text:
                parts.append({"label": label, "text": text})
            continue
        head = collapse_stem_duplicates(polish_text(clean_pearson_text(strip_ui_noise(sub[0]))))
        if head:
            parts.append({"label": label, "text": head})
        for choice in sub[1:]:
            cm = re.match(r"^([A-D]\.)\n(.*)", choice, re.S)
            if not cm:
                continue
            choice_text = collapse_stem_duplicates(
                polish_text(clean_pearson_text(strip_ui_noise(cm.group(2))))
            )
            if choice_text:
                parts.append({"label": cm.group(1), "text": choice_text})
    return parts


def build_problem(row: dict, pool_by_id: dict[str, str]) -> dict:
    stem = trim_answer_templates(row["stem"])
    full_text = collapse_stem_duplicates(
        polish_text(clean_pearson_text(strip_ui_noise(stem)))
    )
    summary = make_summary(stem)
    expr = extract_expr(full_text)
    parts = filter_display_parts(split_parts(stem))
    if not parts:
        parts = [{"label": "Part 1", "text": full_text}]

    qid = row["questionId"]
    out = {
        "printOrder": int(row.get("previewIndex") or 0),
        "questionId": qid,
        "summary": summary,
        "fullText": full_text,
        "parts": parts,
        "prompt": summary,
        "expr": expr,
        "objective": row.get("objective") or "",
        "poolOrder": pool_by_id.get(qid, row.get("poolOrder") or ""),
        "difficulty": row.get("difficulty") or "",
        "estimatedTime": row.get("estimatedTime") or "",
    }
    return _polish_problem(out)


def _polish_problem(out: dict) -> dict:
    polished = clean_problem_fields(out)
    if polished.get("fullText"):
        polished["fullText"] = polish_text(polished["fullText"])
    for part in polished.get("parts") or []:
        if part.get("text"):
            part["text"] = polish_text(part["text"])
    if polished.get("expr"):
        polished["expr"] = polish_text(polished["expr"])
    return polished


def build_exam3_pools_js(pool_by_id: dict[str, str]) -> str:
    pools: dict[str, list[str]] = {}
    for qid, pool in pool_by_id.items():
        pools.setdefault(pool, []).append(qid)
    lines = [
        "// Exam 3 live pools - from My Selections # column (Pearson editor, 2026-08-06).",
        "// Source: editor PlayerAddAndRemove harvest; one random draw per pool at test time.",
        "",
        "const EXAM3_POOLS = [",
    ]
    for pool_num in sorted(pools, key=int):
        qs = json.dumps(pools[pool_num])
        lines.append(f"  {{ pool: {pool_num}, questions: {qs} }},")
    lines.append("];")
    return "\n".join(lines) + "\n"


def main() -> None:
    raw = json.loads(RAW.read_text(encoding="utf-8"))
    pool_by_id = pool_by_id_from_raw(raw)
    all_ids = list(pool_by_id.keys()) if raw.get("poolList") else ALL_IDS
    results = raw["results"]
    problems = [build_problem(r, pool_by_id) for r in results]
    captured_ids = [p["questionId"] for p in problems]

    harvest = {
        "requested": "Exam 3",
        "captureMethod": "Pearson editor: Add/Remove Content → question link → PlayerAddAndRemove Next loop (Work as student)",
        "capturedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "questionIds": all_ids,
        "capturedQuestionIds": captured_ids,
        "missingQuestionIds": [q for q in all_ids if q not in captured_ids],
        "unexpectedQuestionIds": [q for q in captured_ids if q not in all_ids],
        "coverage": {"captured": len(captured_ids), "expected": len(all_ids)},
        "problems": problems,
    }

    OUT_HARVEST.write_text(json.dumps([harvest], indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # Refresh pool header comment in exam3-exam-data.js (keep EXAM3_OBJECTIVES block).
    exam_text = EXAM_DATA.read_text(encoding="utf-8")
    obj_m = re.search(r"(const EXAM3_OBJECTIVES = \{[\s\S]*)", exam_text)
    if obj_m:
        EXAM_DATA.write_text(build_exam3_pools_js(pool_by_id) + "\n" + obj_m.group(1), encoding="utf-8")

    print(f"Wrote {OUT_HARVEST.name}: {len(problems)} problems")
    print(f"Updated pool header in {EXAM_DATA.name}")
    if harvest["missingQuestionIds"]:
        print("MISSING:", harvest["missingQuestionIds"])


if __name__ == "__main__":
    main()
