/* How much work a problem is, read from its text: lettered parts, plus a sketch
   when the problem is not already split into lettered parts. Used for badges on
   every problem row and for the "uneven" flag on exam pools. */

const EXAM4_UNEVEN_GAP = 2;
const EXAM4_HEAVY_SCORE = 4;

function exam4ProblemLoad(id) {
  const p = (typeof REVIEW_PROBLEMS !== "undefined" && REVIEW_PROBLEMS[id]) || {};
  const text = p.fullText || p.summary || "";
  const lettered = (text.match(/^[a-h]\.\s/gm) || []).length;
  const hasSketch = /\b(sketch|shade|illustrate)\b/i.test(text);
  const parts = Math.max(1, lettered);
  const extraSketch = lettered === 0 && hasSketch;
  const score = parts + (extraSketch ? 1 : 0);
  let label = parts + (parts === 1 ? " part" : " parts");
  if (extraSketch) label += " + sketch";
  return { parts: parts, score: score, label: label, heavy: score >= EXAM4_HEAVY_SCORE };
}

function exam4PoolLoadSummary(ids) {
  const scores = ids.map((id) => exam4ProblemLoad(id).score);
  const min = Math.min.apply(null, scores);
  const max = Math.max.apply(null, scores);
  const uneven = ids.length > 1 && max - min >= EXAM4_UNEVEN_GAP;
  let text = "";
  if (ids.length > 1) {
    text = min === max ? "work " + min : "work " + min + " to " + max;
    if (uneven) text += " UNEVEN";
  }
  return { min: min, max: max, uneven: uneven, text: text };
}

function makeProblemLoadBadge(id) {
  const load = exam4ProblemLoad(id);
  const el = document.createElement("div");
  el.className = "q-load" + (load.heavy ? " is-heavy" : "");
  el.textContent = load.label;
  return el;
}
