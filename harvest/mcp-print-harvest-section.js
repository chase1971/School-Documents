async (page) => {
  const sections = [
  {
    "name": "3.8 Implicit Differentiation",
    "sectionId": "3.8",
    "questionIds": [
      "3.8.15",
      "3.8.17",
      "3.8.18",
      "3.8.19",
      "3.8.24",
      "3.8.31",
      "3.8.32",
      "3.8.33",
      "3.8.34",
      "3.8.37",
      "3.8.52",
      "3.8.53",
      "3.8.55"
    ]
  },
  {
    "name": "3.11 Related Rates",
    "sectionId": "3.11",
    "questionIds": [
      "3.11.3",
      "3.11.11",
      "3.11.15-Setup & Solve",
      "3.11.16-Setup & Solve",
      "3.11.17",
      "3.11.19",
      "3.11.20-Setup & Solve",
      "3.11.23",
      "3.11.27",
      "3.11.29",
      "3.11.33",
      "3.11.35",
      "3.11.36",
      "3.11.41",
      "3.11.43"
    ]
  },
  {
    "name": "4.1 Maxima and Minima",
    "sectionId": "4.1",
    "questionIds": [
      "4.1.11",
      "4.1.13",
      "4.1.15",
      "4.1.19",
      "4.1.21",
      "4.1.23",
      "4.1.25",
      "4.1.27",
      "4.1.31",
      "4.1.35",
      "4.1.37",
      "4.1.43",
      "4.1.49",
      "4.1.51",
      "4.1.57",
      "4.1.59",
      "4.1.65",
      "4.1.73"
    ]
  },
  {
    "name": "4.2 Mean Value Theorem",
    "sectionId": "4.2",
    "questionIds": [
      "4.2.3",
      "4.2.11",
      "4.2.13",
      "4.2.15",
      "4.2.17",
      "4.2.21",
      "4.2.25",
      "4.2.26",
      "4.2.30",
      "4.2.31"
    ]
  },
  {
    "name": "4.3 What Derivatives Tell Us",
    "sectionId": "4.3",
    "questionIds": [
      "4.3.21",
      "4.3.22",
      "4.3.34",
      "4.3.40",
      "4.3.46",
      "4.3.47",
      "4.3.48",
      "4.3.59",
      "4.3.63",
      "4.3.65",
      "4.3.67",
      "4.3.71",
      "4.3.77",
      "4.3.81",
      "4.3.83"
    ]
  },
  {
    "name": "4.4 Graphing Functions",
    "sectionId": "4.4",
    "questionIds": [
      "4.4.15",
      "4.4.17",
      "4.4.29",
      "4.4.31",
      "4.4.33",
      "4.4.42",
      "4.4.49-T",
      "4.4.53-T",
      "4.7.106",
      "4.4.43",
      "4.4.99",
      "4.4.100",
      "24.5.39",
      "24.6.1",
      "24.6.3",
      "24.6.7",
      "24.6.9",
      "24.6.15",
      "24.6.17",
      "5.4.2",
      "5.4.3-Setup & Solve",
      "5.4.4-Setup & Solve",
      "5.4.5-Setup & Solve",
      "5.4.8-Setup & Solve",
      "5.4.10",
      "5.4.19",
      "5.4.20",
      "5.4.21"
    ]
  },
  {
    "name": "4.5 Optimization Problems",
    "sectionId": "4.5",
    "questionIds": [
      "4.5.16",
      "4.5.20",
      "4.5.21",
      "4.8.12",
      "4.8.13",
      "4.6.19-BE",
      "4.6.21-BE",
      "4.6.25-BE",
      "4.6.27-BE",
      "4.6.37-BE",
      "4.6.38-LS",
      "4.6.39-BE",
      "4.6.41-BE"
    ]
  },
  {
    "name": "4.6 Linear Approximation and Differentials",
    "sectionId": "4.6",
    "questionIds": [
      "4.6.7",
      "4.6.25",
      "4.6.28",
      "4.6.30",
      "4.6.39",
      "4.6.40",
      "4.6.41",
      "4.6.55",
      "4.6.57",
      "4.6.61",
      "4.6.63",
      "4.6.64",
      "4.6.65",
      "4.6.67",
      "4.6.69"
    ]
  },
  {
    "name": "4.7 L'Hopital's Rule",
    "sectionId": "4.7",
    "questionIds": [
      "4.7.17",
      "4.7.18",
      "4.7.21",
      "4.7.22",
      "4.7.25",
      "4.7.29",
      "4.7.33",
      "4.7.35",
      "4.7.39",
      "4.7.43",
      "4.7.23",
      "4.7.51",
      "4.7.53"
    ]
  },
  {
    "name": "4.8 Newton's Method",
    "sectionId": "4.8",
    "questionIds": [
      "4.8.10",
      "4.8.11",
      "4.8.12",
      "4.8.13-T",
      "4.8.15-T"
    ]
  }
];
  const SECTION_INDEX = 0;
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
