/**
 * Pearson print view — full .singleQuestion extract (keep all parts).
 * Used inside printPage.evaluate() during MCP print harvest.
 * See HARVEST.md and mcp-print-harvest-section.js
 */
() => {
  const DROP_LINE =
    /^(Question content area( top| bottom)?|StartFraction|EndFraction|Over|Under|Left|Right|Blank|Multiline|Singleline|enter your response here)$/i;

  function cleanLines(block) {
    return (block.innerText || "")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !DROP_LINE.test(l));
  }

  function parseParts(lines) {
    const parts = [];
    let label = null;
    let buf = [];
    const flush = () => {
      const text = buf.join("\n").trim();
      if (label || text) parts.push({ label: label || "Problem", text });
      label = null;
      buf = [];
    };
    for (const line of lines) {
      if (/^Part \d+/i.test(line) || /^[a-z]\.\s/i.test(line) || /^[a-z]\.$/i.test(line)) {
        flush();
        label = line;
      } else {
        buf.push(line);
      }
    }
    flush();
    return parts.filter((p) => p.text || (p.label && p.label !== "Problem"));
  }

  function makeSummary(lines) {
    const pick =
      lines.find((l) => l.length > 30 && !/^Part \d/i.test(l) && !/^[a-z]\.$/i.test(l)) ||
      lines.find((l) => l.length > 12 && !/^Part \d/i.test(l)) ||
      lines[0] ||
      "";
    return pick.length > 95 ? pick.slice(0, 92) + "…" : pick;
  }

  return Array.from(document.querySelectorAll(".singleQuestion")).map((block) => {
    const lines = cleanLines(block);
    const fullText = lines.join("\n");
    const parts = parseParts(lines);
    const multiPart = parts.length > 1 || (parts[0] && parts[0].label !== "Problem");
    return {
      summary: makeSummary(lines),
      fullText,
      parts: multiPart ? parts : undefined,
      prompt: makeSummary(lines),
      expr: lines.find((l) => /[=]/.test(l) && /[a-zA-Z0-9]\s*[=(]/.test(l)) || "",
    };
  });
};
