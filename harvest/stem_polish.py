"""Second-pass stem cleanup after pearson_a11y_math — layout, echoes, Newton subscripts."""

from __future__ import annotations



import re



SUP_TO_SUB = str.maketrans("⁰¹²³⁴⁵⁶⁷⁸⁹", "₀₁₂₃₄₅₆₇₈₉")

SUB_TO_SUP = str.maketrans("₀₁₂₃₄₅₆₇₈₉", "⁰¹²³⁴⁵⁶⁷⁸⁹")





def fix_newton_subscripts(text: str) -> str:

    """Pearson uses superscript digits for Newton iterates x₁, x₂, x₀ — not for x² powers."""

    if not re.search(r"Newton|approximations", text, re.I):

        return text



    def _to_sub(m: re.Match[str]) -> str:

        return "x" + m.group(1).translate(SUP_TO_SUB)



    text = re.sub(r"x([⁰¹²³⁴⁵⁶⁷⁸⁹])\s*=", _to_sub, text)

    text = re.sub(

        r"(approximations[^\n]*?)x([⁰¹²³⁴⁵⁶⁷⁸⁹])",

        lambda m: m.group(1) + "x" + m.group(2).translate(SUP_TO_SUB),

        text,

    )

    text = re.sub(

        r"(?<=\band\s)x([⁰¹²³⁴⁵⁶⁷⁸⁹])",

        _to_sub,

        text,

    )

    text = re.sub(

        r"^x([⁰¹²³⁴⁵⁶⁷⁸⁹])$",

        _to_sub,

        text,

        flags=re.M,

    )

    return text





def fix_polynomial_powers(text: str) -> str:

    """Restore x²/x³ in math lines where Pearson emitted subscript digits."""

    lines: list[str] = []

    for line in text.split("\n"):

        if re.search(r"f\(x\)|f\(u\)|f\(t\)|∫|lim |/\(|^−?\s*\d+\s*x", line):

            line = re.sub(

                r"x([₂₃₄₅₆])(?![₀₁₂₃₄₅₆₇₈₉])",

                lambda m: "x" + m.group(1).translate(SUB_TO_SUP),

                line,

            )

            line = re.sub(

                r"(\d)\s+x([₂₃₄₅])(?=\s|[+−-]|$|\)|,)",

                lambda m: f"{m.group(1)} x{m.group(2).translate(SUB_TO_SUP)}",

                line,

            )

        lines.append(line)

    return "\n".join(lines)





def trim_duplicate_fx_echo(text: str) -> str:

    """Drop corrupted compact echo after a good f(x)= line (e.g. −3x²e − 2x + 2)."""

    lines: list[str] = []

    for line in text.split("\n"):

        if "f(x)" in line and "=" in line:

            m = re.match(

                r"^(f\(x\)\s*=\s*.+?e\s*\^\([^)]+\)\s*[+−-]\s*\d+)",

                line,

            )

            if m and re.search(r"[−-]\s*3\s*x²?\s*e\s*[−-]\s*2\s*x", line[m.end() :]):

                line = m.group(1).strip()

            elif re.search(r"e\s*\^\([^)]+\)", line):

                good = re.match(r"^(f\(x\)\s*=\s*.+?e\s*\^\([^)]+\)\s*[+−-]\s*\d+)", line)

                if good:

                    tail = line[good.end() :].replace(" ", "")

                    if re.search(r"3x[²2]?e-2x", tail) or re.search(r"-3x[²2]?e", tail):

                        line = good.group(1).strip()

        lines.append(line)

    return "\n".join(lines)





def dedupe_iterate_echo(text: str) -> str:

    """Drop Pearson echo lines: x₁ on one line, x₁ again on the next."""

    text = re.sub(

        r"(x[₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹])\s*\n\s*\1\b",

        r"\1",

        text,

    )

    return text





def reflow_stem_lines(text: str) -> str:

    """Join broken mid-sentence lines (approximations / x₁ and / x₂)."""

    text = re.sub(

        r"(approximations)\s*\n\s*(x[₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹])\s*\n\s*\2?\s*and\s*\n\s*(x[₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹]\.?)",

        r"\1 \2 and \3",

        text,

    )

    text = re.sub(

        r"(approximations)\s*\n\s*(x[₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹])\s+and\s*\n\s*(x[₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹]\.?)",

        r"\1 \2 and \3",

        text,

    )

    text = re.sub(r",\s*\n\s*(x[₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹]\s*=)", r", \1", text)

    text = re.sub(r";\s*\n\s*(f\()", r"; \1", text)

    text = re.sub(r";\s*\n\s*(x[₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹]\s*=)", r"; \1", text)

    text = re.sub(r"at a\s*\n\s*=", "at a =", text)

    text = re.sub(r",\s*\n\s*(x₀\s+(\d+))", r", x₀ = \2", text)
    text = re.sub(r"x₀\s*\n\s*(\d+)\s*$", r"x₀ = \1", text, flags=re.M)
    text = re.sub(r"x₀\s+(\d+)\s*$", r"x₀ = \1", text, flags=re.M)
    text = re.sub(r"\nPart 1\s*$", "", text)

    return text





def drop_orphan_fragments(text: str) -> str:

    """Remove lines that are only −, |, ., or one character junk."""

    lines = []

    for line in text.split("\n"):

        t = line.strip()

        if re.fullmatch(r"[\-|\.·…]{1,3}", t):

            continue

        if t in ("−", "|", ".", ".."):

            continue

        lines.append(line)

    return "\n".join(lines)





def dedupe_ln_echo(text: str) -> str:

    return re.sub(r"\bln x\s*\n\s*lnx\b", "ln x", text)





def dedupe_compact_fx_echo(text: str) -> str:

    """Drop compact echo glued on same line: 5cos²x 5cos²x."""

    return re.sub(

        r"(\b\d*\s*cos²\s*x)\s+\1\b",

        r"\1",

        text,

        flags=re.I,

    )





def fix_limit_header(text: str) -> str:

    text = re.sub(r"lim x -> 0\s*\nx→0\s*\n", "lim x→0 ", text)

    text = re.sub(r"lim x -> e\s*\nx→e\s*\n", "lim x→e ", text)

    text = re.sub(r"\nlim\s*\nx→0\s*\n", "\nlim x→0 ", text)

    text = re.sub(r"\nlim\s*\nx→e\s*\n", "\nlim x→e ", text)

    return text





def polish_stem(text: str) -> str:

    if not text:

        return ""

    text = drop_orphan_fragments(text)

    text = dedupe_iterate_echo(text)

    text = trim_duplicate_fx_echo(text)

    text = fix_polynomial_powers(text)

    text = fix_newton_subscripts(text)

    text = reflow_stem_lines(text)

    text = dedupe_ln_echo(text)

    text = dedupe_compact_fx_echo(text)

    text = fix_limit_header(text)

    text = re.sub(r"(\d+\.\d+)\s*\n\s*\1", r"\1", text)

    text = re.sub(r"= x\^\(2atx\)", "= x² at x", text)

    text = re.sub(r"(\d+)\s*,\s*(\d{2})\b", r"\1.\2", text)

    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


