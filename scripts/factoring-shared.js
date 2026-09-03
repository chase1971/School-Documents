/*
 * Shared pieces for the factoring handout pages.
 *
 * KaTeX is pre-rendered at build time and its fonts are base64-embedded, so the
 * generated pages make no external requests (agent docs/rules/html-delivery.md).
 */

const fs = require('fs');
const path = require('path');

function katexDir() {
  const local = path.resolve(__dirname, '../node_modules/katex/dist');
  if (fs.existsSync(path.join(local, 'katex.js'))) return local;
  const canvasKit = path.resolve(__dirname, '../../canvas-kit/node_modules/katex/dist');
  if (fs.existsSync(path.join(canvasKit, 'katex.js'))) return canvasKit;
  throw new Error(
    'KaTeX not found. Run npm install in School documents, or npm install in canvas-kit.');
}

const KATEX_DIR = katexDir();
const katex = require(path.join(KATEX_DIR, 'katex.js'));

/** Inline math. */
const m = (latex) =>
  katex.renderToString(latex, { throwOnError: false, displayMode: false });

/** katex.min.css with every woff2 inlined and the woff/ttf fallbacks dropped. */
function buildKatexCss() {
  let css = fs.readFileSync(path.join(KATEX_DIR, 'katex.min.css'), 'utf8');
  css = css.replace(
    /,url\(fonts\/[\w-]+\.woff\) format\("woff"\),url\(fonts\/[\w-]+\.ttf\) format\("truetype"\)/g,
    ''
  );
  css = css.replace(/url\(fonts\/([\w-]+)\.woff2\)/g, (whole, name) => {
    const file = path.join(KATEX_DIR, 'fonts', `${name}.woff2`);
    if (!fs.existsSync(file)) return whole;
    return `url(data:font/woff2;base64,${fs.readFileSync(file).toString('base64')})`;
  });
  return css;
}

const box = (inner, id, extra = '') =>
  `<span class="bx ${extra}"${id ? ` id="${id}"` : ''}>${inner}</span>`;

const emptyBox = (id) => box('', id, 'bx-empty');

/** A parenthesised group: the term hugs the left paren, the box hugs the right. */
const group = (left, right) =>
  `<span class="grp"><span class="paren">(</span>` +
  `<span class="slot-l">${left}</span>` +
  `<span class="grp-gap"></span>` +
  `<span class="slot-r">${right}</span>` +
  `<span class="paren">)</span></span>`;

/** Masthead shared by both pages. */
const header = (promptText, promptLatex) => `
  <header>
    <h1>Solving Quadratics by Factoring</h1>
    <div class="unit-row">
      <span class="unit">I. Trinomials</span>
      <span class="genform">${m('ax^2 + bx + c = 0')}</span>
    </div>
  </header>

  <div class="prompt">
    <span class="prompt-text">${promptText}</span>
    <span class="prompt-eq">${m(promptLatex)}</span>
  </div>`;

/** Everything both pages depend on. Page-specific rules are passed in separately. */
const baseStyles = `
  @page { size: 8.5in 11in; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #f3f4f6; }
  body {
    font-family: 'Segoe UI Variable Text','Segoe UI',system-ui,-apple-system,
                 'Helvetica Neue',Arial,sans-serif;
    color: #000;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .katex { color: #000; }

  .page {
    width: 8.5in; height: 11in;
    margin: 0 auto; padding: 0.28in 0.3in 0.2in;
    background: #fff; border: 1.5px solid #111;
    display: flex; flex-direction: column;
  }
  @media print { html, body { background: #fff; } .page { margin: 0; } }

  header { padding-bottom: 7px; border-bottom: 1.5px solid #111; }
  h1 { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: -0.1px; text-align: center; }
  .unit-row { display: flex; align-items: baseline; justify-content: space-between; margin-top: 5px; }
  .unit { font-size: 24px; font-weight: 600; letter-spacing: -0.2px; }
  .genform .katex { font-size: 21px; }

  .prompt {
    display: flex; align-items: center; gap: 18px;
    padding: 8px 2px; border-bottom: 1.5px solid #111;
  }
  .prompt-text { font-size: 13.5px; }
  .prompt-eq .katex { font-size: 21px; }

  /* Sections share the leftover height so the sheet fills to the bottom. */
  section {
    padding: 12px 2px; border-bottom: 1.5px solid #111;
    display: flex; flex-direction: column; justify-content: center;
    flex: 1 1 auto;
  }
  section:last-child { border-bottom: none; }
  h2 { margin: 0 0 6px; font-size: 17px; font-weight: 600; letter-spacing: -0.1px; }
  h2 .n { display: inline-block; min-width: 27px; }
  h2 .katex { font-size: 1em; }

  .note { margin: 4px 0 0 22px; font-size: 12.5px; color: #000; }
  .note.centered { margin: 8px 0 0; text-align: center; }

  .row { display: flex; align-items: center; justify-content: center; gap: 0; }

  .bx {
    display: inline-flex; align-items: center; justify-content: center;
    border: 1.5px solid #111; border-radius: 3px; background: #fff;
    padding: 2px 7px; min-width: 30px; min-height: 30px; line-height: 1;
  }
  .bx-empty { min-width: 38px; min-height: 31px; padding: 0; }
  .bx-circle { border-radius: 50%; padding: 5px 14px; }

  .grp { display: inline-flex; align-items: center; font-size: 21px; }
  .grp + .grp { margin-left: 2px; }
  .paren { font-family: 'KaTeX_Main', serif; font-size: 42px; line-height: 1; }
  .slot-l { display: inline-flex; align-items: center; margin-left: 4px; }
  .slot-r { display: inline-flex; align-items: center; margin-right: 4px; }
  .grp-gap { width: 48px; }
  .var { margin-left: 2px; }

  .split { display: flex; }
  .half { flex: 1; padding: 0 8px; }
  .half + .half { border-left: 1.5px solid #111; }

  .check { color: #15803d; font-size: 17px; line-height: 1; }
  .cross { color: #b91c1c; font-size: 17px; line-height: 1; }
`;

/** Assemble a complete self-contained page. */
function renderPage({ title, styles, body, script }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>${buildKatexCss()}</style>
<style>${baseStyles}${styles || ''}</style>
</head>
<body>
${body}
${script ? `<script>${script}</script>` : ''}
</body>
</html>
`;
}

module.exports = { m, box, emptyBox, group, header, renderPage };
