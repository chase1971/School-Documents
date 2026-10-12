/**
 * Builds the Conics hub from one template.
 *   index.html   -> upload to D2L Manage Files > animations (sources = viewFile.d2lfile links)
 *   preview.html -> regular-browser preview at http://127.0.0.1:8765/conics-d2l/preview.html
 *                   (sources = animations/<file>.mp4 beside it)
 *
 * Data sources (one owner each):
 *   clips.json       labels, groups, hold seconds, parts. hold + parts mirror
 *                    student-portal/src/features/video-examples/conicsGuide.ts.
 *   step timestamps  read from student-portal/src/assets/video-examples/conics-intro/*-steps.json
 *   d2l-links.json   Brightspace file links. Refresh after any MP4 re-upload:
 *                    python "School Scrips/Macro App/scripts/probe_manage_files_paths.py" --mp4-links
 * Usage: node build-hub.js
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const STEPS_DIR = path.join(
  dir, '..', '..', 'student-portal', 'src', 'assets', 'video-examples', 'conics-intro',
);
const SEGMENT_END_EPSILON = 0.08;

const strip = (s) => s.replace(/^\uFEFF/, '');
const readLocal = (f) => strip(fs.readFileSync(path.join(dir, f), 'utf8'));
const template = readLocal('hub.template.html');
const clips = JSON.parse(readLocal('clips.json'));
const d2lLinks = JSON.parse(readLocal('d2l-links.json'));

/** Same rules as the portal's normalizeStepPauses: clamp inside the segment, round, dedupe, sort. */
function normalizePauses(start, end, raw) {
  const maxTime = Math.max(start, end - SEGMENT_END_EPSILON);
  const seen = new Set();
  const out = [];
  for (const t of raw) {
    const r = Math.round(Math.min(maxTime, Math.max(start, t)) * 100) / 100;
    if (!seen.has(r)) { seen.add(r); out.push(r); }
  }
  return out.sort((a, b) => a - b);
}

function stepTimesFor(clip) {
  const file = path.join(STEPS_DIR, clip.steps);
  if (!fs.existsSync(file)) throw new Error(`Missing steps file: ${file}`);
  const raw = JSON.parse(strip(fs.readFileSync(file, 'utf8')));
  return [0, ...normalizePauses(0, clip.hold, raw)];
}

function build(outName, srcFor) {
  const data = clips.map((c) => ({
    group: c.group,
    label: c.label,
    src: srcFor(c),
    end: c.hold,
    steps: stepTimesFor(c),
    parts: c.parts || [],
  }));
  const html = template.replace('/*__CLIPS__*/[]', JSON.stringify(data));
  fs.writeFileSync(path.join(dir, outName), html, 'utf8');
  console.log(`wrote ${outName} (${Buffer.byteLength(html)} bytes)`);
}

build('index.html', (c) => {
  const href = d2lLinks[c.file];
  if (!href) throw new Error(`No D2L link for ${c.file} in d2l-links.json`);
  return href;
});
build('preview.html', (c) => `animations/${c.file}`);
