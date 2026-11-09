// Exam 4 — section count summary for the Exam tab
function exam4SectionOfId(id) {
  const m = String(id).match(/^(\d+\.\d+)/);
  return m ? m[1] : "other";
}

function exam4SectionCounts(ids) {
  const order = ["4.9", "5.1", "5.2", "5.3", "5.4", "5.5"];
  const counts = Object.fromEntries(order.map((s) => [s, 0]));
  let other = 0;
  for (const id of ids) {
    const sec = exam4SectionOfId(id);
    if (Object.prototype.hasOwnProperty.call(counts, sec)) counts[sec] += 1;
    else other += 1;
  }
  return { order, counts, other };
}

function renderExam4SectionSummary(parent, ids) {
  const { order, counts, other } = exam4SectionCounts(ids);
  const wrap = document.createElement("div");
  wrap.className = "exam-section-summary";
  const title = document.createElement("div");
  title.className = "exam-section-summary-title";
  title.textContent = "Questions by section";
  wrap.appendChild(title);
  const grid = document.createElement("div");
  grid.className = "exam-section-grid";
  for (const sec of order) {
    const cell = document.createElement("div");
    const n = counts[sec];
    cell.className = "exam-section-cell" + (n === 0 ? " is-zero" : "");
    const idEl = document.createElement("span");
    idEl.className = "exam-section-id";
    idEl.textContent = sec;
    const nEl = document.createElement("span");
    nEl.className = "exam-section-n";
    nEl.textContent = String(n);
    cell.append(idEl, nEl);
    grid.appendChild(cell);
  }
  if (other) {
    const cell = document.createElement("div");
    cell.className = "exam-section-cell";
    const idEl = document.createElement("span");
    idEl.className = "exam-section-id";
    idEl.textContent = "other";
    const nEl = document.createElement("span");
    nEl.className = "exam-section-n";
    nEl.textContent = String(other);
    cell.append(idEl, nEl);
    grid.appendChild(cell);
  }
  wrap.appendChild(grid);
  parent.appendChild(wrap);
}
