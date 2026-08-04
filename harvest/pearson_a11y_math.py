"""Convert Pearson print-view accessibility math text to readable notation."""
from __future__ import annotations

import re

ZW = re.compile(r"[\u200b-\u200f\u2060\ufeff]")
SUPERS = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")

A11Y_MARKERS = re.compile(
    r"StartFraction|EndFraction|Superscript|Baseline|StartRoot|EndRoot|"
    r"left parenthesis|right parenthesis|left bracket|right bracket|"
    r"\bequals\b|\bsquared\b|\bcubed\b|\bcosine\b|\bsine\b|\btangent\b",
    re.I,
)

SKIP_LINE = re.compile(
    r"^(equals|plus|minus|times|negative|=|\+|\−|\-|\.)$",
    re.I,
)

FX_SKIP = re.compile(r"^(equals|=)$", re.I)
INTERVAL = re.compile(r"^\[[\−\-0-9,.\s]+\]$")
POINT_FRAGMENT = re.compile(r"^[\dπΠ,\s]+$")


def _normalize_chars(text: str) -> str:
    text = ZW.sub("", text)
    text = text.replace("\u2212", "−").replace("–", "−")
    return text


def _word_replace(text: str) -> str:
    reps = [
        (r"\bf left parenthesis x right parenthesis\b", "f(x)"),
        (r"\bleft parenthesis\b", "("),
        (r"\bright parenthesis\b", ")"),
        (r"\bleft bracket\b", "["),
        (r"\bright bracket\b", "]"),
        (r"\bStartRoot\s+(.+?)\s+EndRoot\b", r"√(\1)"),
        (r"\bnegative\b", "−"),
        (r"\bminus\b", "−"),
        (r"\bplus\b", "+"),
        (r"\btimes\b", "·"),
        (r"\bdivided by\b", "/"),
        (r"\bequals\b", "="),
        (r"\bsquared\b", "²"),
        (r"\bcubed\b", "³"),
        (r"\bpi\b", "π"),
        (r"\bcosine\b", "cos"),
        (r"\bsine\b", "sin"),
        (r"\btangent\b", "tan"),
        (r"\bnatural log\b", "ln"),
        (r"\bln\b", "ln"),
    ]
    out = text
    for pat, repl in reps:
        out = re.sub(pat, repl, out, flags=re.I)
    return out


def _convert_fractions(text: str) -> str:
    while "StartFraction" in text:
        m = re.search(
            r"StartFraction\s+(.+?)\s+Over\s+(.+?)\s+EndFraction",
            text,
            flags=re.I,
        )
        if not m:
            break
        num = _convert_inline(m.group(1).strip(), final=False)
        den = _convert_inline(m.group(2).strip(), final=False)
        repl = f"({num})/({den})"
        text = text[: m.start()] + repl + text[m.end() :]
    return text


def _convert_superscripts(text: str) -> str:
    text = re.sub(
        r"Superscript\s+(.+?)\s+Baseline",
        lambda m: _to_superscript(m.group(1).strip()),
        text,
        flags=re.I,
    )
    return text


def _to_superscript(chunk: str) -> str:
    chunk = chunk.strip()
    if re.fullmatch(r"[\d]+", chunk):
        return chunk.translate(SUPERS)
    if " divided by " in chunk.lower():
        a, b = re.split(r"\s+divided by\s+", chunk, flags=re.I)
        return f"{_to_superscript(a)}/{_to_superscript(b)}"
    return f"^{chunk}"


def _convert_inline(text: str, *, final: bool = True) -> str:
    text = _normalize_chars(text)
    text = _convert_fractions(text)
    text = _convert_superscripts(text)
    text = _word_replace(text)
    text = re.sub(r"\s+", " ", text).strip()
    if final:
        text = _format_equation(text)
    return text


def _format_equation(text: str) -> str:
    text = re.sub(r"\(\s*([^()/]+?)\s*\)\/\(\s*([^()/]+?)\s*\)", r"\1/\2", text)
    text = re.sub(r"\bx\s+(\d)\b", lambda m: "x" + m.group(1).translate(SUPERS), text)
    text = re.sub(r"\b(cos|sin|tan|ln)([a-z])\b", r"\1 \2", text)
    text = re.sub(r"(?<=[a-zA-Z])(\d)(?![0-9])", lambda m: m.group(1).translate(SUPERS), text)
    text = re.sub(r"([a-zA-Z])\s+([⁰¹²³⁴⁵⁶⁷⁸⁹])", r"\1\2", text)
    text = re.sub(r"\s*([=+\−;,])\s*", r" \1 ", text)
    text = re.sub(r"\(\s+", "(", text)
    text = re.sub(r"\s+\)", ")", text)
    text = re.sub(r"\[\s+", "[", text)
    text = re.sub(r"\s+\]", "]", text)
    text = re.sub(r"  +", " ", text).strip()
    return text


def _prettify_compact(line: str) -> str:
    line = _normalize_chars(line.strip())
    line = line.replace("pi", "π")
    line = re.sub(
        r"([a-zA-Z])(\d)(?![0-9])",
        lambda m: m.group(1) + m.group(2).translate(SUPERS),
        line,
    )
    return _format_equation(line)


def _is_compact_math(line: str) -> bool:
    line = _normalize_chars(line.strip())
    if not line or SKIP_LINE.match(line):
        return False
    if A11Y_MARKERS.search(line):
        return False
    if "=" in line and len(line) <= 160:
        return True
    if INTERVAL.match(line):
        return True
    if POINT_FRAGMENT.match(line) and len(line) <= 4:
        return False
    if re.match(r"^[\dπ+\-−*/^a-zA-Z().,\s]+$", line) and any(
        c.isdigit() or c in "=+−-" for c in line
    ):
        return len(line) <= 80
    return False


def _is_a11y_math(line: str) -> bool:
    return bool(A11Y_MARKERS.search(line))


def _is_split_compact_fragment(line: str) -> bool:
    line = _normalize_chars(line.strip())
    if not line or _is_a11y_math(line):
        return False
    if SKIP_LINE.match(line):
        return True
    return len(line) <= 8 and bool(re.fullmatch(r"[\d+\-−*/^a-zA-Z²³]+", line))


def _is_derivative_echo(line: str, prev: str) -> bool:
    if line in (".", "dy", "dx", "d2y", "dx2"):
        if "dy/dx" in prev or prev.endswith("dx") or prev.endswith("dx."):
            return True
    return False


def _skip_split_echo(lines: list[str], i: int) -> int:
    j = i
    while j < len(lines) and _is_split_compact_fragment(lines[j]):
        j += 1
    return j


def _skip_point_echo(lines: list[str], i: int) -> int:
    j = i
    while j < len(lines):
        t = lines[j].strip()
        if POINT_FRAGMENT.match(t) and len(t) <= 8:
            j += 1
            continue
        break
    return j


def _dedupe_lines(lines: list[str]) -> list[str]:
    out: list[str] = []
    for line in lines:
        t = line.strip()
        if not t:
            continue
        if out and out[-1] == t:
            continue
        if out and INTERVAL.match(t) and INTERVAL.match(out[-1]):
            if t.replace(" ", "") == out[-1].replace(" ", ""):
                continue
        out.append(t)
    return out


def _join_split_fraction(lines: list[str], i: int) -> tuple[str, int]:
    parts = [lines[i].strip()]
    j = i + 1
    while j < len(lines):
        nxt = lines[j].strip()
        if not nxt or SKIP_LINE.match(nxt):
            j += 1
            continue
        if _is_a11y_math(nxt) or nxt.startswith("Part "):
            break
        if len(nxt) <= 8 and re.fullmatch(r"[\d+\-−*/^a-zA-Z²³]+", nxt):
            parts.append(nxt)
            j += 1
            continue
        break

    if len(parts) >= 4 and parts[1].isdigit() and parts[2].isdigit():
        head = parts[0].rstrip("+")
        num, den = parts[1], parts[2]
        tail = "".join(parts[3:])
        tail = tail.replace("x2", "x²").replace("x3", "x³")
        merged = f"{head} + ({num}/{den}){tail}"
        return _format_equation(_prettify_compact(merged)), j

    merged = "".join(parts)
    merged = merged.replace("x2", "x²").replace("x3", "x³")
    return _prettify_compact(merged), j


def _try_merge_open_point(lines: list[str], i: int) -> tuple[str, int] | None:
    line = lines[i].strip()
    if line == "(":
        prefix = ""
    elif line.endswith("; ("):
        prefix = line[:-2].rstrip()
    elif "=" in line and line.endswith("("):
        prefix = line.rstrip("(").rstrip()
    else:
        return None

    chunks: list[str] = []
    j = i + 1
    while j < len(lines):
        t = lines[j].strip()
        if not t or SKIP_LINE.match(t):
            j += 1
            continue
        if t.startswith("Part ") or _is_a11y_math(t):
            break
        if t.endswith(")") or "," in t or t.isdigit():
            chunks.append(t.replace(")", ""))
            j += 1
            if t.endswith(")"):
                break
            continue
        break

    if not chunks:
        return None

    nums: list[str] = []
    for chunk in chunks:
        for n in re.findall(r"\d+", chunk):
            if not nums or nums[-1] != n:
                nums.append(n)
    if len(nums) >= 2:
        point = f"({nums[0]}, {nums[1]})"
        return (f"{prefix}{point}" if prefix else point, j)
    return None


def _try_merge_point_fragments(lines: list[str], i: int) -> tuple[str, int] | None:
    if not lines[i].strip().isdigit():
        return None
    chunks: list[str] = []
    j = i
    while j < len(lines):
        t = lines[j].strip()
        if not t:
            j += 1
            continue
        if t.startswith("Part ") or _is_a11y_math(t):
            break
        if t.endswith(")") or "," in t or t.isdigit():
            chunks.append(t)
            j += 1
            if t.endswith(")"):
                break
            continue
        break
    if len(chunks) < 2:
        return None
    nums: list[str] = []
    for chunk in chunks:
        for n in re.findall(r"\d+", chunk):
            if not nums or nums[-1] != n:
                nums.append(n)
    if len(nums) < 2:
        return None
    point = f"({nums[0]}, {nums[1]})"
    rest = chunks[-1]
    if ")" in rest:
        tail = rest.split(")", 1)[-1].strip()
        if tail:
            return f"{point}{tail}", j
    return point, j


def _try_merge_fx_block(lines: list[str], i: int) -> tuple[list[str], int] | None:
    if lines[i].strip() != "f(x)":
        return None

    j = i + 1
    while j < len(lines) and FX_SKIP.match(lines[j]):
        j += 1
    if j >= len(lines):
        return None

    if _is_a11y_math(lines[j]) and any(
        k in lines[j].lower() for k in ("cubed", "squared", "startfraction", "superscript")
    ):
        eq = _convert_inline(lines[j]).lstrip("= ").strip()
        j = _skip_split_echo(lines, j + 1)
        return [f"f(x) = {eq}"], j

    tokens: list[str] = []
    bracket_a11y: str | None = None
    compact_interval: str | None = None

    while j < len(lines):
        t = lines[j].strip()
        if not t:
            j += 1
            continue
        if t.startswith("Part "):
            break
        if INTERVAL.match(t):
            compact_interval = _format_equation(t)
            j += 1
            break
        if "left bracket" in t.lower():
            bracket_a11y = t
            j += 1
            continue
        if SKIP_LINE.match(t) and t.lower() not in ("minus", "plus"):
            j += 1
            continue
        if len(t) > 40 and t[0].isupper() and "x" not in t.lower():
            break
        if " on" in t:
            tokens.append(t.split(" on", 1)[0].strip())
            j += 1
            continue
        tokens.append(t)
        j += 1

    if not tokens:
        return None

    while j < len(lines):
        t = lines[j].strip()
        if not t:
            j += 1
            continue
        if t.startswith("Part "):
            break
        if INTERVAL.match(t):
            compact_interval = _format_equation(t)
            j += 1
            break
        if "left bracket" in t.lower():
            bracket_a11y = t
            j += 1
            continue
        if t.lower() == "on":
            j += 1
            continue
        break

    expr_parts: list[str] = []
    for t in tokens:
        low = t.lower()
        if low in ("on",):
            continue
        if low == "squared" and expr_parts and expr_parts[-1].endswith("x"):
            expr_parts[-1] += "²"
            continue
        if low == "cubed" and expr_parts and expr_parts[-1].endswith("x"):
            expr_parts[-1] += "³"
            continue
        if low in ("minus", "negative", "−", "-"):
            if not expr_parts or expr_parts[-1] != "−":
                expr_parts.append("−")
            continue
        if expr_parts and expr_parts[-1] == t:
            continue
        if t == "2" and expr_parts and expr_parts[-1].endswith("²"):
            continue
        expr_parts.append(t)

    expr = _format_equation(" ".join(expr_parts).replace("=x", "= x"))
    interval = compact_interval or (bracket_a11y and _convert_inline(bracket_a11y))
    row = f"f(x) {expr}"
    if interval:
        row = f"{row} on {interval}"
    return [row], j


def clean_lines_to_readable(lines: list[str]) -> list[str]:
    lines = [_normalize_chars(l) for l in lines]
    lines = [l.strip() for l in lines if l.strip()]
    out: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]

        if SKIP_LINE.match(line) and out:
            i += 1
            continue

        if out and _is_derivative_echo(line, out[-1]):
            i += 1
            continue

        fx = _try_merge_fx_block(lines, i)
        if fx:
            out.extend(fx[0])
            i = fx[1]
            continue

        point = _try_merge_open_point(lines, i)
        if point:
            out.append(_format_equation(point[0]))
            i = point[1]
            continue

        if (
            line.endswith("(")
            and i + 1 < len(lines)
            and lines[i + 1].strip().isdigit()
        ):
            prose = line.rstrip("(").rstrip()
            point_frag = _try_merge_point_fragments(lines, i + 1)
            if point_frag:
                out.append(_format_equation(f"{prose}{point_frag[0]}"))
                i = point_frag[1]
                continue

        point_frag = _try_merge_point_fragments(lines, i)
        if point_frag:
            out.append(_format_equation(point_frag[0]))
            i = point_frag[1]
            continue

        if (
            i + 1 < len(lines)
            and _is_a11y_math(line)
            and "=" in lines[i + 1]
            and _is_compact_math(lines[i + 1])
        ):
            merged = _prettify_compact(lines[i + 1])
            if merged.endswith("("):
                point2 = _try_merge_open_point(lines, i + 1)
                if point2:
                    out.append(_format_equation(point2[0]))
                    i = point2[1]
                    if i < len(lines) and _is_a11y_math(lines[i]) and "parenthesis" in lines[i].lower():
                        out.append(_convert_inline(lines[i]))
                        i = _skip_point_echo(lines, i + 1)
                    continue
            out.append(merged)
            i += 2
            if i < len(lines) and _is_a11y_math(lines[i]) and "parenthesis" in lines[i].lower():
                converted = _convert_inline(lines[i])
                if converted:
                    out.append(converted)
                i = _skip_point_echo(lines, i + 1)
            continue

        if _is_a11y_math(line) and (
            "startfraction" in line.lower()
            or "left parenthesis" in line.lower()
            or "left bracket" in line.lower()
            or "cubed" in line.lower()
            or "squared" in line.lower()
        ):
            if "left parenthesis" in line.lower() or "left bracket" in line.lower():
                converted = _convert_inline(line)
                if converted and (not out or converted != out[-1]):
                    out.append(converted)
                i = _skip_point_echo(lines, i + 1)
                continue
            converted = _format_equation(_convert_inline(line))
            if converted:
                out.append(converted)
            i = _skip_split_echo(lines, i + 1)
            continue

        if "\n" in line:
            sub = [s.strip() for s in line.split("\n") if s.strip()]
            out.extend(clean_lines_to_readable(sub))
            i += 1
            continue

        if _is_compact_math(line):
            if line.endswith("+") and i + 1 < len(lines):
                merged, j = _join_split_fraction(lines, i)
                out.append(merged)
                i = j
                continue
            out.append(_prettify_compact(line))
            i += 1
            continue

        if _is_a11y_math(line):
            converted = _convert_inline(line)
            if converted and (not out or converted != out[-1]):
                out.append(converted)
            i += 1
            continue

        out.append(line)
        i += 1

    return _dedupe_lines(out)


def clean_pearson_text(text: str) -> str:
    if not text:
        return ""
    text = _normalize_chars(text)
    lines = text.split("\n")
    readable = clean_lines_to_readable(lines)
    return "\n".join(readable).strip()


def clean_summary(text: str, max_len: int = 95) -> str:
    cleaned = clean_pearson_text(text)
    first = cleaned.split("\n")[0] if cleaned else ""
    if len(first) > max_len:
        return first[: max_len - 1] + "…"
    return first


def clean_problem_fields(problem: dict) -> dict:
    out = dict(problem)
    if out.get("fullText"):
        out["fullText"] = clean_pearson_text(out["fullText"])
    if out.get("summary"):
        out["summary"] = clean_summary(out.get("summary") or out["fullText"])
    if out.get("parts"):
        cleaned_parts = []
        for part in out["parts"]:
            cp = dict(part)
            if cp.get("text"):
                cp["text"] = clean_pearson_text(cp["text"])
            cleaned_parts.append(cp)
        out["parts"] = cleaned_parts
    if out.get("expr"):
        out["expr"] = clean_pearson_text(out["expr"])
    if out.get("prompt"):
        out["prompt"] = clean_summary(out["prompt"])
    return out
