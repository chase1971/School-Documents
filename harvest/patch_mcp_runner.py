"""Regenerate mcp-print-harvest-section.js with embedded exam3-sections.json (no Node require)."""
from __future__ import annotations

import json
from pathlib import Path

HARVEST = Path(__file__).resolve().parent
SECTIONS_PATH = HARVEST / "exam3-sections.json"
RUNNER_PATH = HARVEST / "mcp-print-harvest-section.js"

BODY = r'''
async (page) => {
  const sections = __SECTIONS_JSON__;
  const SECTION_INDEX = __SECTION_INDEX__;
  const ALL_SECTIONS = false;
  const targets = ALL_SECTIONS ? sections : [sections[SECTION_INDEX]];

  const EXTRACT_FULL = () => {
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

  async function printHarvestOne(ASSIGN, QUESTION_IDS) {
    const EXPECT = QUESTION_IDS.length;
    const ctx = page.context();
    const wait = (ms) => page.waitForTimeout(ms);
    let shell = page;
    for (const p of ctx.pages()) {
      if (p.url().includes("mylabmastering.pearson.com") && p.url().includes("/courses/")) {
        shell = p;
        break;
      }
    }
    await shell.bringToFront();
    const findAM = () => {
      const frames = shell.frames().filter(
        (f) => f.url().includes("mfeViewType=assignment-manager") && !f.url().includes("mfeView=")
      );
      return frames.length ? frames[frames.length - 1] : null;
    };
    let grid = null;
    for (let i = 0; i < 40; i++) {
      grid = findAM();
      if (grid) break;
      await wait(500);
    }
    if (!grid) return { error: "AM grid not found", assignment: ASSIGN };
    const sel = `button[aria-label="More options for ${ASSIGN}"]`;
    await grid.evaluate((s) => {
      const b = document.querySelector(s);
      if (b) b.scrollIntoView({ block: "center", behavior: "instant" });
    }, sel);
    await wait(600);
    await grid.click(sel);
    await wait(1000);
    const known = new Set(ctx.pages().map((p) => p.url()));
    const [dialog] = await Promise.all([
      ctx.waitForEvent("page", { timeout: 45000 }),
      grid.getByRole("menuitem", { name: "Print" }).click(),
    ]);
    await dialog.waitForLoadState("domcontentloaded");
    await wait(2000);
    await dialog.bringToFront();
    await dialog.locator("#btnPrint").click({ force: true, timeout: 10000 });
    let printPage = null;
    for (let i = 0; i < 80; i++) {
      for (const p of ctx.pages()) {
        const u = p.url().toLowerCase();
        if (u.includes("tdx.acs.pearson.com") && u.includes("print")) {
          printPage = p;
          break;
        }
      }
      if (printPage) break;
      await wait(500);
    }
    if (!printPage) return { error: "TDX print tab never opened", assignment: ASSIGN };
    await printPage.bringToFront();
    await wait(2000);
    for (let s = 0; s < 6; s++) {
      await printPage.evaluate((y) => window.scrollTo(0, y), s * 2500);
      await wait(600);
    }
    await printPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await wait(1200);
    let blocks = [];
    for (let i = 0; i < 40; i++) {
      blocks = await printPage.evaluate(EXTRACT_FULL);
      if (blocks.length >= EXPECT) break;
      await printPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await wait(800);
    }
    for (const p of ctx.pages()) {
      if (p !== shell && (p.url().includes("PlayerPrintSaveAs") || p.url().includes("tdx.acs.pearson.com"))) {
        try { await p.close(); } catch (e) {}
      }
    }
    await wait(800);
    if (blocks.length !== EXPECT) {
      return { error: `count ${blocks.length} != expected ${EXPECT}`, assignment: ASSIGN, count: blocks.length };
    }
    const problems = blocks.map((b, i) => ({ questionId: QUESTION_IDS[i], ...b }));
    return { ok: true, assignment: ASSIGN, count: problems.length, problems };
  }

  const results = [];
  for (const sec of targets) {
    results.push(await printHarvestOne(sec.name, sec.questionIds));
  }
  return ALL_SECTIONS ? results : results[0];
}
'''.strip()


def write_runner(section_index: int = 0) -> None:
    sections = json.loads(SECTIONS_PATH.read_text(encoding="utf-8"))
    text = BODY.replace("__SECTIONS_JSON__", json.dumps(sections, indent=2))
    text = text.replace("__SECTION_INDEX__", str(section_index))
    RUNNER_PATH.write_text(text + "\n", encoding="utf-8")


if __name__ == "__main__":
    import sys
    idx = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    write_runner(idx)
    print(f"Wrote {RUNNER_PATH.name} SECTION_INDEX={idx}")
