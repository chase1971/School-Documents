// Exam 3 homework map — browse harvested Pearson problem text by section

let selectedId = null;
let selectedQid = null;

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderLeft() {
  const root = document.getElementById("homework-sections");
  root.innerHTML = "";
  for (const hw of HOMEWORK) {
    const isActive = hw.id === selectedId;
    const wrap = document.createElement("div");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "section-btn" + (isActive ? " active" : "");
    btn.innerHTML =
      '<span class="chev">' + (isActive ? "▼" : "▶") + "</span>" +
      '<span class="label">' + esc(hw.label) + "</span>" +
      '<span class="counts">' + hw.ids.length + " Q</span>";
    btn.addEventListener("click", () => {
      selectedId = isActive ? null : hw.id;
      selectedQid = null;
      renderAll();
    });
    wrap.appendChild(btn);

    if (isActive) {
      const body = document.createElement("div");
      body.className = "section-body open";
      for (const id of hw.ids) {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "q-row" + (id === selectedQid ? " selected" : "");
        const p = PROBLEMS[id];
        row.innerHTML =
          '<span class="qid">' + esc(id) + "</span>" +
          '<span class="q-note">' +
          esc(p ? (p.expr || p.prompt || "—") : "not harvested yet") +
          "</span>";
        row.addEventListener("click", (e) => {
          e.stopPropagation();
          selectedQid = id === selectedQid ? null : id;
          renderAll();
        });
        body.appendChild(row);
      }
      wrap.appendChild(body);
    }
    root.appendChild(wrap);
  }
}

function renderRight() {
  const summary = document.getElementById("detail-summary");
  const panel = document.getElementById("detail-panel");
  if (!selectedQid || !PROBLEMS[selectedQid]) {
    summary.textContent = selectedId
      ? "Click a question ID on the left to see full prompt."
      : "Click a homework section on the left.";
    panel.innerHTML = "";
    return;
  }
  const p = PROBLEMS[selectedQid];
  summary.innerHTML = "<strong>" + esc(selectedQid) + "</strong>";
  panel.innerHTML =
    (p.expr
      ? '<div class="detail-expr">' + esc(p.expr) + "</div>"
      : "") +
    (p.prompt
      ? '<div class="detail-prompt">' + esc(p.prompt) + "</div>"
      : "");
}

function renderAll() {
  renderLeft();
  renderRight();
}

renderAll();
