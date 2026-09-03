/*
 * Generates factoring-trinomials-page1.html — setting up the double bubble.
 *
 *   node "School Scrips/School documents/scripts/build-factoring-page1.js"
 */

const fs = require('fs');
const path = require('path');
const { m, box, emptyBox, group, header, renderPage } = require('./factoring-shared');

const OUT = path.resolve(__dirname, '../factoring-trinomials-page1.html');

/** Root node over two leaves; the right leaf is circled and checked. */
const tree = (root, leftLeaf, rightLeaf, key) => `
  <div class="tree" id="tree-${key}">
    <div class="tree-root">${box(m(root), `tree-${key}-root`)}</div>
    <div class="tree-leaves">
      <div class="tree-leaf">${box(m(leftLeaf), `tree-${key}-a`)}</div>
      <div class="tree-leaf">
        ${box(m(rightLeaf), `tree-${key}-b`, 'bx-circle')}
        <div class="check">&#10003;</div>
      </div>
    </div>
  </div>`;

const body = `
<div class="page">
${header('Solve the following by factoring.', '12x^2 - 22x - 20 = 0')}

  <section>
    <h2><span class="n">1.</span>Start by looking for a GCF.</h2>
    <div class="row row-gcf">
      <span class="arrow"><span class="arrow-label">divide by 2</span><span class="arrow-line"></span></span>
      ${m('6x^2 - 11x - 10 = 0')}
    </div>
    <p class="note">Every term divides by 2, and the equation equals zero, so divide both sides. The 2 is gone for good.</p>
  </section>

  <section class="sec-diagram">
    <h2><span class="n">2.</span>A trinomial factors into two sets of parentheses.</h2>
    <div class="diagram" id="diagram">
      <svg id="wires" aria-hidden="true">
        <defs>
          <marker id="head" viewBox="0 0 10 10" refX="8.5" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#111"/>
          </marker>
        </defs>
      </svg>

      <div class="row trinomial">
        ${box(m('6x^2'), 'term-first')}
        <span class="op">${m('-')}</span>
        ${m('11x')}
        <span class="op">${m('-')}</span>
        ${box(m('10'), 'term-last')}
      </div>

      <div class="wire-labels">
        <span class="wire-label wl-left">these two multiply to<br>make the FIRST term</span>
        <span class="wire-label wl-right">these two multiply to<br>make the LAST term</span>
      </div>

      <div class="row slots">
        ${group(
          `${emptyBox('slot-1')}<span class="var">${m('x')}</span>`,
          emptyBox('slot-2')
        )}${group(
          `${emptyBox('slot-3')}<span class="var">${m('x')}</span>`,
          emptyBox('slot-4')
        )}
      </div>
    </div>
  </section>

  <section>
    <div class="split">
      <div class="half">
        <h2><span class="n">3.</span>How can we make ${m('6x^2')}?</h2>
        ${tree('6x^2', '6x \\cdot x', '3x \\cdot 2x', 'a')}
      </div>
      <div class="half">
        <h2><span class="n">4.</span>How can we make ${m('10')}?</h2>
        ${tree('10', '10 \\cdot 1', '5 \\cdot 2', 'b')}
      </div>
    </div>
    <p class="note centered">Always try the closest pair first.</p>
  </section>

  <section>
    <h2><span class="n">5.</span>Put the ${m('3x')} and the ${m('2x')} in the first spots.</h2>
    <p class="note">It does not matter which order you put these two in.</p>
    <div class="row">
      ${group(m('3x'), emptyBox())}${group(m('2x'), emptyBox())}
    </div>
  </section>

  <section>
    <h2><span class="n">6.</span>Now place the 5 and the 2.</h2>
    <p class="note">Here the order does matter.</p>
    <div class="options">
      <div class="option">
        <span class="option-label">Option A</span>
        <div class="row">${group(m('3x'), box(m('5')))}${group(m('2x'), box(m('2')))}</div>
      </div>
      <div class="option">
        <span class="option-label">Option B</span>
        <div class="row">${group(m('3x'), box(m('2')))}${group(m('2x'), box(m('5')))}</div>
      </div>
    </div>
  </section>

</div>`;

const styles = `
  .sec-diagram { flex-grow: 2.1; }
  .row-gcf { gap: 20px; margin-top: 6px; font-size: 21px; }

  .arrow { display: inline-flex; flex-direction: column; align-items: center; }
  .arrow-label { font-size: 12px; margin-bottom: 3px; }
  .arrow-line { width: 88px; height: 1.5px; background: #111; position: relative; }
  .arrow-line::after {
    content: ''; position: absolute; right: -1px; top: -3.5px;
    border-left: 9px solid #111;
    border-top: 5px solid transparent; border-bottom: 5px solid transparent;
  }

  .diagram { position: relative; padding-top: 6px; }
  #wires { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  #wires path { fill: none; stroke: #111; stroke-width: 1.6; marker-end: url(#head); }
  #wires path.dash { stroke-dasharray: 5 4; }
  .trinomial { gap: 11px; font-size: 22px; }
  .trinomial .op { font-size: 22px; }
  .slots { margin-top: 104px; }
  .wire-labels {
    position: absolute; top: 56px; left: 0; right: 0;
    display: flex; justify-content: space-between; pointer-events: none;
  }
  .wire-label { font-size: 12px; line-height: 1.3; width: 142px; }
  .wl-left { text-align: left; }
  .wl-right { text-align: right; }

  .tree { position: relative; margin-top: 10px; }
  .tree-root { display: flex; justify-content: center; }
  .tree-leaves { display: flex; justify-content: space-around; margin-top: 42px; }
  .tree-leaf { position: relative; text-align: center; }
  .tree-leaf .check { margin-top: 3px; }
  .tree-leaf:first-child .check { visibility: hidden; }

  .options { display: flex; margin-top: 8px; }
  .option { flex: 1; text-align: center; padding: 0 6px; }
  .option + .option { border-left: 1.5px solid #111; }
  .option-label { display: block; font-size: 13.5px; margin-bottom: 5px; }
  .options .grp-gap { width: 26px; }
  .options .paren { font-size: 38px; }
`;

const script = `
(function () {
  var svg = document.getElementById('wires');
  var host = document.getElementById('diagram');

  function rel(el) {
    var a = el.getBoundingClientRect(), b = host.getBoundingClientRect();
    return { l: a.left - b.left, t: a.top - b.top, w: a.width, h: a.height };
  }

  // Curve upward from the bottom slot to the term it helps build. Each pair lands
  // at a different point along the target box so the two arrowheads stay apart.
  function wire(fromId, toId, landAt, dashed) {
    var f = rel(document.getElementById(fromId));
    var t = rel(document.getElementById(toId));
    var x1 = f.l + f.w / 2, y1 = f.t - 4;
    var x2 = t.l + t.w * landAt, y2 = t.t + t.h + 4;
    var lift = (y1 - y2) * 0.55;
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', 'M ' + x1 + ' ' + y1 +
      ' C ' + x1 + ' ' + (y1 - lift) + ', ' + x2 + ' ' + (y2 + lift) +
      ', ' + x2 + ' ' + y2);
    if (dashed) p.setAttribute('class', 'dash');
    svg.appendChild(p);
  }

  wire('slot-1', 'term-first', 0.26, false);
  wire('slot-3', 'term-first', 0.74, false);
  wire('slot-2', 'term-last', 0.26, true);
  wire('slot-4', 'term-last', 0.74, true);

  // Straight branches from each factor tree's root down to its two leaves.
  ['a', 'b'].forEach(function (key) {
    var root = document.getElementById('tree-' + key + '-root');
    var wrap = document.getElementById('tree-' + key);
    var box = wrap.getBoundingClientRect();
    var r = root.getBoundingClientRect();
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none');
    ['a', 'b'].forEach(function (side) {
      var leaf = document.getElementById('tree-' + key + '-' + side).getBoundingClientRect();
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', r.left + r.width / 2 - box.left);
      line.setAttribute('y1', r.bottom - box.top);
      line.setAttribute('x2', leaf.left + leaf.width / 2 - box.left);
      line.setAttribute('y2', leaf.top - box.top);
      line.setAttribute('stroke', '#111');
      line.setAttribute('stroke-width', '1.4');
      s.appendChild(line);
    });
    wrap.insertBefore(s, wrap.firstChild);
  });
})();
`;

const html = renderPage({
  title: 'Solving Quadratics by Factoring — I. Trinomials (page 1)',
  styles,
  body,
  script,
});

fs.writeFileSync(OUT, html, 'utf8');
console.log('wrote ' + OUT + ' (' + Math.round(html.length / 1024) + ' KB)');
