/*
 * Generates factoring-trinomials-page2.html — testing the arrangements, choosing
 * the signs, and solving. Continues the step numbering from page 1.
 *
 *   node "School Scrips/School documents/scripts/build-factoring-page2.js"
 */

const fs = require('fs');
const path = require('path');
const { m, box, header, renderPage } = require('./factoring-shared');

const OUT = path.resolve(__dirname, '../factoring-trinomials-page2.html');

/** A parenthesised pair whose two atoms can be reached by the arc drawer. */
const testGroup = (termLatex, termId, numLatex, numId) =>
  `<span class="grp"><span class="paren">(</span>` +
  `<span class="slot-l" id="${termId}">${m(termLatex)}</span>` +
  `<span class="grp-gap"></span>` +
  `<span class="slot-r">${box(m(numLatex), numId)}</span>` +
  `<span class="paren">)</span></span>`;

/**
 * One arrangement under test. The outer pair is the first term and the last
 * number; the inner pair is the two atoms that sit next to each other.
 */
const testBlock = (key, firstNum, secondNum, outerLabel, innerLabel) => `
    <div class="prod" id="prod-${key}">
      <div class="row">
        ${testGroup('3x', `${key}-outer-a`, firstNum, `${key}-inner-a`)}${testGroup(
          '2x',
          `${key}-inner-b`,
          secondNum,
          `${key}-outer-b`
        )}
      </div>
      <span class="arc-label" id="${key}-label-outer">${m(outerLabel)}</span>
      <span class="arc-label" id="${key}-label-inner">${m(innerLabel)}</span>
    </div>`;

const body = `
<div class="page">
${header('Continued from page 1.', '6x^2 - 11x - 10 = 0')}

  <section>
    <h2><span class="n">7.</span>Test Option A. Multiply the outer pair and the inner pair.</h2>
    <p class="note">Those two products have to combine to make the middle term, ${m('-11x')}. Leave the signs out for now.</p>
    ${testBlock('a', '5', '2', '3x \\cdot 2 = 6x', '5 \\cdot 2x = 10x')}
    <p class="verdict">
      <span class="cross">&#10007;</span>
      6 and 10 make 16 or 4. Neither one is 11, so this arrangement is wrong &mdash; swap the 5 and the 2.
    </p>
  </section>

  <section>
    <h2><span class="n">8.</span>Test Option B the same way.</h2>
    ${testBlock('b', '2', '5', '3x \\cdot 5 = 15x', '2 \\cdot 2x = 4x')}
    <p class="verdict">
      <span class="check">&#10003;</span>
      15 and 4 make 19 or 11. That 11 is exactly what we need, so the numbers are in the right spots.
    </p>
  </section>

  <section>
    <h2><span class="n">9.</span>Now decide the signs.</h2>
    <p class="note">We need ${m('-11x')}, so the bigger product has to be the negative one.</p>
    <div class="sign-row">
      <div class="vadd">
        <div class="vline">${m('-15x')}</div>
        <div class="vline"><span class="vplus">+</span>${m('4x')}</div>
        <div class="vrule"></div>
        <div class="vline">${m('-11x')}</div>
      </div>
      <div class="sign-why">
        <p>The 15 came from ${m('3x \\cdot 5')}, so the <strong>5</strong> is the one that turns negative.</p>
        <div class="answer-line">${m('(3x + 2)(2x - 5)')}</div>
        <p>Check the last term: ${m('2 \\cdot (-5) = -10')} <span class="check">&#10003;</span></p>
      </div>
    </div>
  </section>

  <section>
    <h2><span class="n">10.</span>Set each factor equal to zero and solve.</h2>
    <p class="note">If two things multiply to zero, one of them has to be zero.</p>
    <div class="row solve-top">${m('(3x + 2)(2x - 5) = 0')}</div>
    <div class="split solve">
      <div class="half">
        <div class="sline">${m('3x + 2 = 0')}</div>
        <div class="sline">${m('3x = -2')}</div>
        <div class="sline final">${box(m('x = -\\dfrac{2}{3}'))}</div>
      </div>
      <div class="half">
        <div class="sline">${m('2x - 5 = 0')}</div>
        <div class="sline">${m('2x = 5')}</div>
        <div class="sline final">${box(m('x = \\dfrac{5}{2}'))}</div>
      </div>
    </div>
    <p class="note centered">Dividing by 2 back in step 1 did not change these answers.</p>
  </section>

</div>`;

const styles = `
  /* arrangement under test --------------------------------------------- */
  section { padding: 9px 2px; }
  .prod { position: relative; padding: 46px 0 50px; }
  .prod svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .prod path { fill: none; stroke: #111; stroke-width: 1.6; }
  .prod .grp-gap { width: 30px; }
  .arc-label {
    position: absolute; white-space: nowrap; background: #fff; padding: 0 6px;
    transform: translate(-50%, -50%);
  }
  .arc-label .katex { font-size: 17px; }

  .verdict { margin: 2px 0 0 22px; font-size: 12.5px; }
  .verdict .check, .verdict .cross { font-size: 15px; margin-right: 5px; }

  /* signs ---------------------------------------------------------------- */
  .sign-row { display: flex; align-items: center; justify-content: center; gap: 46px; margin-top: 6px; }
  .vadd { display: flex; flex-direction: column; align-items: flex-end; }
  .vline { position: relative; width: 132px; text-align: right; padding: 3px 10px 3px 0; }
  .vline .katex { font-size: 20px; }
  .vplus { position: absolute; left: 6px; font-size: 18px; }
  .vrule { width: 132px; border-top: 1.5px solid #111; }
  .sign-why { max-width: 350px; font-size: 12.5px; }
  .sign-why p { margin: 0 0 6px; }
  .answer-line { margin: 8px 0; }
  .answer-line .katex { font-size: 22px; }

  /* solving -------------------------------------------------------------- */
  .solve-top { margin-top: 4px; }
  .solve-top .katex { font-size: 22px; }
  .solve { margin-top: 8px; }
  .solve .half { text-align: center; }
  .sline { padding: 2px 0; }
  .sline .katex { font-size: 19px; }
  .sline.final { margin-top: 4px; }
  .sline.final .katex { font-size: 20px; }
  .sline.final .bx { padding: 5px 12px; }
`;

const script = `
(function () {
  var NS = 'http://www.w3.org/2000/svg';

  function rel(host, el) {
    var a = el.getBoundingClientRect(), b = host.getBoundingClientRect();
    return { l: a.left - b.left, t: a.top - b.top, w: a.width, h: a.height };
  }

  // One arc per pair. Outer pairs bow below the expression, inner pairs above,
  // so the two never collide. The label sits at the apex on a white chip.
  function arcs(key) {
    var host = document.getElementById('prod-' + key);
    var svg = document.createElementNS(NS, 'svg');
    host.insertBefore(svg, host.firstChild);

    [['outer', true], ['inner', false]].forEach(function (spec) {
      var name = spec[0], below = spec[1];
      var f = rel(host, document.getElementById(key + '-' + name + '-a'));
      var t = rel(host, document.getElementById(key + '-' + name + '-b'));
      var x1 = f.l + f.w / 2, x2 = t.l + t.w / 2;
      var edge = below
        ? Math.max(f.t + f.h, t.t + t.h) + 5
        : Math.min(f.t, t.t) - 5;
      var depth = below ? 34 : -34;
      var cx = (x1 + x2) / 2, cy = edge + depth * 1.6;

      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', 'M ' + x1 + ' ' + edge + ' Q ' + cx + ' ' + cy + ' ' + x2 + ' ' + edge);
      svg.appendChild(p);

      var label = document.getElementById(key + '-label-' + name);
      label.style.left = cx + 'px';
      label.style.top = (edge + depth * 0.8) + 'px';
    });
  }

  arcs('a');
  arcs('b');
})();
`;

const html = renderPage({
  title: 'Solving Quadratics by Factoring — I. Trinomials (page 2)',
  styles,
  body,
  script,
});

fs.writeFileSync(OUT, html, 'utf8');
console.log('wrote ' + OUT + ' (' + Math.round(html.length / 1024) + ' KB)');
